import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'form_builder';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

export type AuditAction =
  | 'response.create'
  | 'response.read'
  | 'response.update'
  | 'response.delete'
  | 'response.export'
  | 'form.view'
  | 'form.edit'
  | 'form.delete'
  | 'analytics.view';

export interface AuditLog {
  _id?: string;
  action: AuditAction;
  formId: string;
  responseId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    exportFormat?: string;
    filters?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  action: AuditAction,
  formId: string,
  options: {
    responseId?: string;
    userId?: string;
    metadata?: Record<string, any>;
    connectionString?: string;
  } = {}
): Promise<void> {
  const mongoUri = options.connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<AuditLog>('form_audit_logs');

    const logEntry: Omit<AuditLog, '_id'> = {
      action,
      formId,
      responseId: options.responseId,
      userId: options.userId,
      timestamp: new Date(),
      metadata: options.metadata,
    };

    await collection.insertOne(logEntry as any);
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the main flow
  } finally {
    await client.close();
  }
}

/**
 * Get audit logs for a form
 */
export async function getAuditLogs(
  formId: string,
  options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    connectionString?: string;
  } = {}
): Promise<AuditLog[]> {
  const mongoUri = options.connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const collection = db.collection<AuditLog>('form_audit_logs');

    const query: any = { formId };
    
    if (options.action) {
      query.action = options.action;
    }
    
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 100)
      .toArray();

    return logs.map(log => ({
      ...log,
      _id: log._id?.toString(),
    }));
  } finally {
    await client.close();
  }
}

