import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collection, limit = 10 } = await request.json();

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

    if (!collection || typeof collection !== 'string') {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const sampleLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));

    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      const db = client.db(databaseName);
      const coll = db.collection(collection);
      
      // Get sample documents
      const samples = await coll.find({}).limit(sampleLimit).toArray();
      
      // Get total count
      const totalCount = await coll.countDocuments();
      
      await client.close();

      return NextResponse.json({
        success: true,
        documents: samples,
        count: samples.length,
        totalCount
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Sample documents error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch sample documents'
      },
      { status: 500 }
    );
  }
}

