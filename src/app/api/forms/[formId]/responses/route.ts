import { NextRequest, NextResponse } from 'next/server';
import {
  saveResponse,
  getResponses,
  getResponseStats,
} from '@/lib/formResponseService';
import { logAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// POST - Save new response
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { data, metadata, connectionString } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Response data is required' },
        { status: 400 }
      );
    }

    // Extract metadata from request headers
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : undefined;
    const referrer = request.headers.get('referer') || undefined;

    // Detect device type from user agent
    let deviceType: 'mobile' | 'desktop' | 'tablet' | undefined;
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'tablet';
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = 'mobile';
      } else {
        deviceType = 'desktop';
      }
    }

    const response = await saveResponse(
      formId,
      data,
      {
        ...metadata,
        userAgent,
        ipAddress,
        referrer,
        deviceType,
      },
      connectionString
    );

    // Log audit event
    await logAuditEvent('response.create', formId, {
      responseId: response._id,
      metadata: {
        ipAddress,
        userAgent,
        deviceType,
      },
      connectionString,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save response',
      },
      { status: 500 }
    );
  }
}

// GET - List responses with filtering and pagination
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    
    const connectionString = searchParams.get('connectionString') || undefined;
    const statsOnly = searchParams.get('statsOnly') === 'true';

    // If only stats requested
    if (statsOnly) {
      const stats = await getResponseStats(formId, connectionString);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Parse filters
    const filters: any = {};
    const status = searchParams.get('status');
    if (status && ['submitted', 'draft', 'incomplete'].includes(status)) {
      filters.status = status;
    }

    const deviceType = searchParams.get('deviceType');
    if (deviceType && ['mobile', 'desktop', 'tablet'].includes(deviceType)) {
      filters.deviceType = deviceType;
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filters.dateRange = {
        start: startDate ? new Date(startDate) : new Date(0),
        end: endDate ? new Date(endDate) : new Date(),
      };
    }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await getResponses(
      formId,
      filters,
      { page, pageSize, sortBy, sortOrder },
      connectionString
    );

    // Log audit event
    await logAuditEvent('response.read', formId, {
      metadata: {
        page,
        pageSize,
        filters,
      },
      connectionString,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch responses',
      },
      { status: 500 }
    );
  }
}
