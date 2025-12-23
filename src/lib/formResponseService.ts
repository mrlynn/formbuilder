import { MongoClient, ObjectId } from 'mongodb';
import { FormResponse } from '@/types/form';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'form_builder';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

interface ResponseFilters {
  status?: 'submitted' | 'draft' | 'incomplete';
  dateRange?: { start: Date; end: Date };
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  fieldFilters?: Record<string, any>;
}

interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ResponseListResult {
  responses: FormResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Save a form response to MongoDB
 */
export async function saveResponse(
  formId: string,
  data: Record<string, any>,
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    browser?: string;
    os?: string;
    referrer?: string;
    geolocation?: { lat: number; lng: number };
    startedAt?: Date;
    completedAt?: Date;
    completionTime?: number;
  },
  connectionString?: string
): Promise<FormResponse> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<FormResponse>('form_responses');

    const response: Omit<FormResponse, '_id'> = {
      formId,
      formVersion: 1, // TODO: Get from form config
      data,
      status: 'submitted',
      submittedAt: new Date(),
      startedAt: metadata.startedAt || new Date(),
      completedAt: metadata.completedAt || new Date(),
      completionTime: metadata.completionTime,
      metadata: {
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        os: metadata.os,
        referrer: metadata.referrer,
        geolocation: metadata.geolocation,
      },
    };

    const result = await collection.insertOne(response as any);
    
    return {
      ...response,
      _id: result.insertedId.toString(),
    };
  } finally {
    await client.close();
  }
}

/**
 * Get responses for a form with filtering and pagination
 */
export async function getResponses(
  formId: string,
  filters: ResponseFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 50 },
  connectionString?: string
): Promise<ResponseListResult> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<FormResponse>('form_responses');

    // Build query
    const query: any = { formId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.dateRange) {
      query.submittedAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end,
      };
    }
    
    if (filters.deviceType) {
      query['metadata.deviceType'] = filters.deviceType;
    }
    
    // Field filters
    if (filters.fieldFilters) {
      Object.entries(filters.fieldFilters).forEach(([field, value]) => {
        query[`data.${field}`] = value;
      });
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Build sort
    const sort: any = {};
    if (pagination.sortBy) {
      sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.submittedAt = -1; // Default: newest first
    }

    // Get paginated results
    const skip = (pagination.page - 1) * pagination.pageSize;
    const responses = await collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(pagination.pageSize)
      .toArray();

    return {
      responses: responses.map(r => ({
        ...r,
        _id: r._id.toString(),
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  } finally {
    await client.close();
  }
}

/**
 * Get a single response by ID
 */
export async function getResponse(
  responseId: string,
  connectionString?: string
): Promise<FormResponse | null> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<FormResponse>('form_responses');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(responseId);
    } catch {
      return null;
    }
    const response = await collection.findOne({ _id: objectId } as any);
    
    if (!response) {
      return null;
    }

    return {
      ...response,
      _id: response._id.toString(),
    };
  } finally {
    await client.close();
  }
}

/**
 * Delete a response
 */
export async function deleteResponse(
  responseId: string,
  connectionString?: string
): Promise<boolean> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection('form_responses');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(responseId);
    } catch {
      return false;
    }
    const result = await collection.deleteOne({ _id: objectId } as any);
    
    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
}

/**
 * Update a response
 */
export async function updateResponse(
  responseId: string,
  updates: Partial<FormResponse>,
  connectionString?: string
): Promise<FormResponse | null> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<FormResponse>('form_responses');

    // Remove _id from updates if present
    const { _id, ...updateData } = updates as any;
    
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(responseId);
    } catch {
      return null;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId } as any,
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return null;
    }

    return {
      ...result,
      _id: result._id.toString(),
    };
  } finally {
    await client.close();
  }
}

/**
 * Get basic response statistics
 */
export async function getResponseStats(
  formId: string,
  connectionString?: string
): Promise<{
  total: number;
  submitted: number;
  draft: number;
  incomplete: number;
  averageCompletionTime: number;
}> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection('form_responses');

    const pipeline = [
      { $match: { formId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          incomplete: {
            $sum: { $cond: [{ $eq: ['$status', 'incomplete'] }, 1, 0] }
          },
          avgTime: { $avg: '$completionTime' },
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        total: 0,
        submitted: 0,
        draft: 0,
        incomplete: 0,
        averageCompletionTime: 0,
      };
    }

    return {
      total: result[0].total || 0,
      submitted: result[0].submitted || 0,
      draft: result[0].draft || 0,
      incomplete: result[0].incomplete || 0,
      averageCompletionTime: result[0].avgTime || 0,
    };
  } finally {
    await client.close();
  }
}
