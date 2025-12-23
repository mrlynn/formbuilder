import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getPublishedFormBySlug, getPublishedFormById } from '@/lib/storage';
import { getDecryptedConnectionString } from '@/lib/platform/connectionVault';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Environment variable for MongoDB URI (fallback)
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Search documents in a form's collection
 * Used by the SearchFormRenderer for public form search functionality
 */
export async function POST(request: NextRequest) {
  try {
    const {
      formId,
      query = {},
      sort,
      limit = 25,
      skip = 0,
    } = await request.json();

    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'Form ID is required' },
        { status: 400 }
      );
    }

    // Load the form to get connection info
    let form = await getPublishedFormBySlug(formId);
    if (!form) {
      form = await getPublishedFormById(formId);
    }

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    if (!form.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Form is not published' },
        { status: 403 }
      );
    }

    // Check if form supports search
    const formType = form.formType || 'data-entry';
    if (formType !== 'search' && formType !== 'both') {
      return NextResponse.json(
        { success: false, error: 'This form does not support search' },
        { status: 403 }
      );
    }

    // Get connection info - support both dataSource (vault) and legacy direct connection
    let connectionString: string | undefined;
    let databaseName: string | undefined;
    let collection: string | undefined;

    // Check for modern dataSource configuration (vault-based)
    if (form.dataSource?.vaultId && form.organizationId) {
      const vaultCredentials = await getDecryptedConnectionString(
        form.organizationId,
        form.dataSource.vaultId
      );

      if (vaultCredentials) {
        connectionString = vaultCredentials.connectionString;
        databaseName = vaultCredentials.database;
        collection = form.dataSource.collection;
      }
    }

    // Fall back to legacy direct connection
    if (!connectionString) {
      connectionString = form.connectionString || MONGODB_URI;
      databaseName = form.database;
      collection = form.collection;
    }

    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: 'No database connection configured' },
        { status: 500 }
      );
    }

    if (!databaseName || !collection) {
      return NextResponse.json(
        { success: false, error: 'Form has no collection configured' },
        { status: 400 }
      );
    }

    // Sanitize limit and skip
    const maxLimit = form.searchConfig?.maxResults || 100;
    const queryLimit = Math.min(maxLimit, Math.max(1, parseInt(String(limit), 10) || 25));
    const querySkip = Math.max(0, parseInt(String(skip), 10) || 0);

    const client = new MongoClient(connectionString);

    try {
      await client.connect();
      const db = client.db(databaseName);
      const coll = db.collection(collection);

      // Build the MongoDB query from the provided filters
      const mongoQuery = buildMongoQuery(query, form.searchConfig?.fields);

      // Add default query from config if present
      if (form.searchConfig?.defaultQuery) {
        Object.assign(mongoQuery, form.searchConfig.defaultQuery);
      }

      // Execute query with pagination
      let cursor = coll.find(mongoQuery);

      // Apply sort if provided
      if (sort && typeof sort === 'object') {
        cursor = cursor.sort(sort);
      } else if (form.searchConfig?.results?.defaultSortField) {
        // Use default sort from config
        const dir = form.searchConfig.results.defaultSortDirection === 'asc' ? 1 : -1;
        cursor = cursor.sort({ [form.searchConfig.results.defaultSortField]: dir });
      } else {
        // Default sort by _id descending (newest first)
        cursor = cursor.sort({ _id: -1 });
      }

      // Apply pagination
      cursor = cursor.skip(querySkip).limit(queryLimit);

      const documents = await cursor.toArray();

      // Get total count for pagination
      const totalCount = await coll.countDocuments(mongoQuery);

      await client.close();

      return NextResponse.json({
        success: true,
        documents,
        count: documents.length,
        totalCount,
        page: Math.floor(querySkip / queryLimit) + 1,
        totalPages: Math.ceil(totalCount / queryLimit),
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Search failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Builds a MongoDB query from form field filters
 */
function buildMongoQuery(
  filters: Record<string, any>,
  fieldConfigs?: Record<string, any>
): Record<string, any> {
  const query: Record<string, any> = {};

  for (const [fieldPath, filter] of Object.entries(filters)) {
    // Skip empty values
    if (filter === null || filter === undefined) continue;

    // Handle simple value (direct equality)
    if (typeof filter !== 'object' || filter instanceof Date) {
      if (filter !== '' && filter !== null && filter !== undefined) {
        query[fieldPath] = filter;
      }
      continue;
    }

    const { value, operator = 'contains', type = 'string', value2 } = filter;

    // Skip empty values
    if (value === '' || value === null || value === undefined) continue;

    // Check if field is searchable
    const fieldConfig = fieldConfigs?.[fieldPath];
    if (fieldConfig && !fieldConfig.enabled) continue;

    // Check if operator is allowed for this field
    if (fieldConfig?.operators && !fieldConfig.operators.includes(operator)) {
      // Fall back to default operator
      const effectiveOperator = fieldConfig.defaultOperator || 'contains';
      applyOperator(query, fieldPath, value, effectiveOperator, type, value2);
      continue;
    }

    applyOperator(query, fieldPath, value, operator, type, value2);
  }

  return query;
}

function applyOperator(
  query: Record<string, any>,
  fieldPath: string,
  value: any,
  operator: string,
  type: string,
  value2?: any
) {
  switch (operator) {
    case 'equals':
    case 'eq':
      query[fieldPath] = parseValue(value, type);
      break;

    case 'notEquals':
    case 'ne':
      query[fieldPath] = { $ne: parseValue(value, type) };
      break;

    case 'contains':
      query[fieldPath] = { $regex: escapeRegex(String(value)), $options: 'i' };
      break;

    case 'startsWith':
      query[fieldPath] = { $regex: `^${escapeRegex(String(value))}`, $options: 'i' };
      break;

    case 'endsWith':
      query[fieldPath] = { $regex: `${escapeRegex(String(value))}$`, $options: 'i' };
      break;

    case 'greaterThan':
    case 'gt':
      query[fieldPath] = { $gt: parseValue(value, type) };
      break;

    case 'lessThan':
    case 'lt':
      query[fieldPath] = { $lt: parseValue(value, type) };
      break;

    case 'greaterOrEqual':
    case 'gte':
      query[fieldPath] = { $gte: parseValue(value, type) };
      break;

    case 'lessOrEqual':
    case 'lte':
      query[fieldPath] = { $lte: parseValue(value, type) };
      break;

    case 'between':
      query[fieldPath] = {};
      if (value !== '' && value !== null && value !== undefined) {
        query[fieldPath].$gte = parseValue(value, type);
      }
      if (value2 !== '' && value2 !== null && value2 !== undefined) {
        query[fieldPath].$lte = parseValue(value2, type);
      }
      if (Object.keys(query[fieldPath]).length === 0) {
        delete query[fieldPath];
      }
      break;

    case 'in':
      const inValues = Array.isArray(value) ? value : String(value).split(',').map(v => v.trim());
      query[fieldPath] = { $in: inValues.map(v => parseValue(v, type)) };
      break;

    case 'notIn':
      const notInValues = Array.isArray(value) ? value : String(value).split(',').map(v => v.trim());
      query[fieldPath] = { $nin: notInValues.map(v => parseValue(v, type)) };
      break;

    case 'exists':
      query[fieldPath] = { $exists: Boolean(value) };
      break;

    case 'regex':
      try {
        query[fieldPath] = { $regex: String(value), $options: 'i' };
      } catch {
        // Invalid regex, fall back to contains
        query[fieldPath] = { $regex: escapeRegex(String(value)), $options: 'i' };
      }
      break;

    default:
      // Default to contains for strings, equals for others
      if (type === 'string') {
        query[fieldPath] = { $regex: escapeRegex(String(value)), $options: 'i' };
      } else {
        query[fieldPath] = parseValue(value, type);
      }
  }
}

function parseValue(value: any, type: string): any {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? value : num;

    case 'date':
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;

    case 'boolean':
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === '1' || value === 1;

    default:
      return value;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
