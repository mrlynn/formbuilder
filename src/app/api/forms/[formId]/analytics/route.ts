import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import { calculateFormAnalytics } from '@/lib/formAnalytics';
import { getFormById, getPublishedFormById, getPublishedFormBySlug } from '@/lib/storage';
import { MongoClient } from 'mongodb';

const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'form_builder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// GET - Get form analytics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);

    const connectionString = searchParams.get('connectionString') || undefined;

    // Parse time range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timeRange = startDate || endDate
      ? {
          start: startDate ? new Date(startDate) : new Date(0),
          end: endDate ? new Date(endDate) : new Date(),
        }
      : undefined;

    // Load form configuration from file storage
    let formConfig = null;

    // Try session-based storage first
    try {
      const session = await getIronSession(await cookies(), sessionOptions);
      const sessionId = ensureSessionId(session);
      await session.save();
      formConfig = await getFormById(sessionId, formId);
    } catch (err) {
      console.error('Error loading form from session storage:', err);
    }

    // Try published forms if not found in session
    if (!formConfig) {
      formConfig = await getPublishedFormById(formId);
    }

    // Try by slug
    if (!formConfig) {
      formConfig = await getPublishedFormBySlug(formId);
    }

    // If still not found and we have a connection string, try MongoDB
    if (!formConfig && connectionString) {
      const client = new MongoClient(connectionString);
      try {
        await client.connect();
        const db = client.db(MONGODB_DATABASE);
        const collection = db.collection('form_configurations');
        const config = await collection.findOne({ id: formId });
        if (config) {
          formConfig = config as any;
        }
      } catch (err) {
        console.error('Error loading form from MongoDB:', err);
      } finally {
        await client.close();
      }
    }

    if (!formConfig) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Calculate analytics
    // Use the form's internal ID, not the URL slug, since submissions are stored by internal ID
    const analytics = await calculateFormAnalytics(
      formConfig.id || formId,
      formConfig.fieldConfigs,
      timeRange,
      connectionString,
      formConfig.organizationId
    );

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error('Error calculating analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate analytics',
      },
      { status: 500 }
    );
  }
}

