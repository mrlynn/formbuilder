import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collection, documentId, updatedDocument } = await request.json();

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

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!updatedDocument || typeof updatedDocument !== 'object') {
      return NextResponse.json(
        { error: 'Updated document is required' },
        { status: 400 }
      );
    }

    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      const db = client.db(databaseName);
      const coll = db.collection(collection);
      
      // Convert documentId to ObjectId if it's a valid ObjectId string
      let queryId: any = documentId;
      if (ObjectId.isValid(documentId) && typeof documentId === 'string' && documentId.length === 24) {
        queryId = new ObjectId(documentId);
      }
      
      // Update the document
      const result = await coll.updateOne(
        { _id: queryId },
        { $set: updatedDocument }
      );
      
      await client.close();

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Document update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update document'
      },
      { status: 500 }
    );
  }
}

