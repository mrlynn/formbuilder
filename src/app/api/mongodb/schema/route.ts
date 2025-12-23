import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CollectionInfo {
  name: string;
  fields: string[];
  sampleDoc?: any;
  count: number;
}

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName } = await request.json();

    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    if (!databaseName || typeof databaseName !== 'string') {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      const db = client.db(databaseName);
      const collections = await db.listCollections().toArray();
      
      const collectionInfos: CollectionInfo[] = [];

      // Sample documents from each collection to infer schema
      for (const collInfo of collections) {
        const coll = db.collection(collInfo.name);
        const count = await coll.countDocuments();
        
        // Get a sample document
        const sampleDoc = await coll.findOne({});
        
        // Extract field names from sample document
        const fields = sampleDoc ? Object.keys(sampleDoc) : [];
        
        collectionInfos.push({
          name: collInfo.name,
          fields,
          sampleDoc: sampleDoc || undefined,
          count
        });
      }
      
      await client.close();

      return NextResponse.json({
        collections: collectionInfos
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Schema fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch database schema'
      },
      { status: 500 }
    );
  }
}

