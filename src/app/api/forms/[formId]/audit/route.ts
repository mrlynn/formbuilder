import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// GET - Get audit logs for a form
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    
    const connectionString = searchParams.get('connectionString') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const action = searchParams.get('action') as any;
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const logs = await getAuditLogs(formId, {
      limit,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      connectionString,
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch audit logs',
      },
      { status: 500 }
    );
  }
}

