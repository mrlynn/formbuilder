import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collection, document } = await request.json();

    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Connection string is required' },
        { status: 400 }
      );
    }

    if (!databaseName || typeof databaseName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Database name is required' },
        { status: 400 }
      );
    }

    if (!collection || typeof collection !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    if (!document || typeof document !== 'object' || document === null) {
      return NextResponse.json(
        { success: false, error: 'Document is required' },
        { status: 400 }
      );
    }

    const client = new MongoClient(connectionString);

    try {
      await client.connect();
      const db = client.db(databaseName);
      const coll = db.collection(collection);

      // Remove empty strings and null values (optional - can be configured)
      const cleanedDocument = cleanDocument(document);

      const result = await coll.insertOne(cleanedDocument);

      await client.close();

      return NextResponse.json({
        success: true,
        insertedId: result.insertedId.toString(),
        document: { ...cleanedDocument, _id: result.insertedId }
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Document insert error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to insert document'
      },
      { status: 500 }
    );
  }
}

function cleanDocument(doc: any): any {
  if (Array.isArray(doc)) {
    return doc.map(cleanDocument);
  }

  if (doc !== null && typeof doc === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(doc)) {
      // Skip empty strings, but keep other falsy values like 0, false
      if (value === '') continue;
      if (value === null) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedValue = cleanDocument(value);
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else if (Array.isArray(value)) {
        const cleanedArray = cleanDocument(value);
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  return doc;
}

