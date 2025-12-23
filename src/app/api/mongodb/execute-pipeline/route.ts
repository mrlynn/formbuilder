import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { SerializedStage } from '@/lib/pipelineSerializer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { 
      connectionString, 
      databaseName, 
      collection, 
      pipeline,
      page = 1,
      pageSize = 100,
      getCount = false
    } = await request.json();

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

    if (!Array.isArray(pipeline)) {
      return NextResponse.json(
        { error: 'Pipeline must be an array' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(String(pageSize), 10) || 100)); // Max 1000 per page
    const skip = (pageNum - 1) * limit;

    // Convert SerializedStage[] to MongoDB pipeline format
    const mongoPipeline = pipeline.map((stage: SerializedStage) => {
      const [operator, value] = Object.entries(stage)[0];
      return { [operator]: value };
    });

    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      const db = client.db(databaseName);
      const coll = db.collection(collection);
      
      // Get total count if requested (using a count pipeline)
      let totalCount: number | null = null;
      if (getCount) {
        const countPipeline = [
          ...mongoPipeline,
          { $count: 'total' }
        ];
        const countResult = await coll.aggregate(countPipeline).toArray();
        totalCount = countResult.length > 0 ? countResult[0].total : 0;
      }
      
      // Execute the aggregation pipeline with pagination
      const pipelineWithPagination = [
        ...mongoPipeline,
        { $skip: skip },
        { $limit: limit }
      ];
      
      const results = await coll.aggregate(pipelineWithPagination).toArray();
      
      await client.close();

      return NextResponse.json({
        success: true,
        results,
        count: results.length,
        page: pageNum,
        pageSize: limit,
        totalCount,
        hasMore: totalCount !== null ? skip + results.length < totalCount : undefined
      });
    } catch (error: any) {
      await client.close().catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('Pipeline execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute pipeline'
      },
      { status: 500 }
    );
  }
}

