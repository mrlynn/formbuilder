import { MongoClient } from 'mongodb';
import { FormResponse } from '@/types/form';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'form_builder';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

export interface RetentionPolicy {
  formId: string;
  retentionDays: number; // 0 = never delete
  archiveBeforeDelete: boolean;
  enabled: boolean;
}

/**
 * Apply retention policy to a form's responses
 */
export async function applyRetentionPolicy(
  policy: RetentionPolicy,
  connectionString?: string
): Promise<{ deleted: number; archived: number }> {
  if (!policy.enabled || policy.retentionDays === 0) {
    return { deleted: 0, archived: 0 };
  }

  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const responsesCollection = db.collection<FormResponse>('form_responses');
    const archiveCollection = db.collection('form_responses_archive');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    const query = {
      formId: policy.formId,
      submittedAt: { $lt: cutoffDate },
    };

    let archived = 0;
    let deleted = 0;

    if (policy.archiveBeforeDelete) {
      // Move to archive collection
      const responsesToArchive = await responsesCollection.find(query).toArray();
      
      if (responsesToArchive.length > 0) {
        await archiveCollection.insertMany(responsesToArchive as any);
        archived = responsesToArchive.length;
      }
    }

    // Delete old responses
    const deleteResult = await responsesCollection.deleteMany(query);
    deleted = deleteResult.deletedCount;

    return { deleted, archived };
  } finally {
    await client.close();
  }
}

/**
 * Archive responses (move to archive collection without deleting)
 */
export async function archiveResponses(
  formId: string,
  beforeDate: Date,
  connectionString?: string
): Promise<number> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const responsesCollection = db.collection<FormResponse>('form_responses');
    const archiveCollection = db.collection('form_responses_archive');

    const query = {
      formId,
      submittedAt: { $lt: beforeDate },
    };

    const responsesToArchive = await responsesCollection.find(query).toArray();
    
    if (responsesToArchive.length > 0) {
      await archiveCollection.insertMany(responsesToArchive as any);
      await responsesCollection.deleteMany(query);
      return responsesToArchive.length;
    }

    return 0;
  } finally {
    await client.close();
  }
}

/**
 * Restore archived responses
 */
export async function restoreArchivedResponses(
  formId: string,
  responseIds: string[],
  connectionString?: string
): Promise<number> {
  const mongoUri = connectionString || MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DATABASE);
    const archiveCollection = db.collection('form_responses_archive');
    const responsesCollection = db.collection<FormResponse>('form_responses');

    const objectIds = responseIds.map(id => {
      try {
        return new (require('mongodb').ObjectId)(id);
      } catch {
        return null;
      }
    }).filter((id): id is any => id !== null);

    const archived = await archiveCollection.find({
      formId,
      _id: { $in: objectIds },
    }).toArray();

    if (archived.length > 0) {
      await responsesCollection.insertMany(archived as any);
      await archiveCollection.deleteMany({
        formId,
        _id: { $in: objectIds },
      });
      return archived.length;
    }

    return 0;
  } finally {
    await client.close();
  }
}

