import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Test the connection
    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      // Test by listing databases
      const adminDb = client.db().admin();
      const { databases } = await adminDb.listDatabases();
      
      await client.close();

      return NextResponse.json({
        success: true,
        databases: databases.map((db) => ({
          name: db.name,
          sizeOnDisk: db.sizeOnDisk
        }))
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to MongoDB'
      },
      { status: 500 }
    );
  }
}

