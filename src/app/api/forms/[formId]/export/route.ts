import { NextRequest, NextResponse } from 'next/server';
import { getResponses } from '@/lib/formResponseService';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
} from '@/lib/formExportService';
import { logAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// GET - Export responses
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const { searchParams } = new URL(request.url);
    
    const connectionString = searchParams.get('connectionString') || undefined;
    const format = searchParams.get('format') || 'csv';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';
    
    // Parse field filters
    const fieldsParam = searchParams.get('fields');
    const fields = fieldsParam ? fieldsParam.split(',') : undefined;
    
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

    // Fetch all responses (for export, we might want to limit or paginate)
    const pageSize = parseInt(searchParams.get('pageSize') || '10000', 10);
    const result = await getResponses(
      formId,
      filters,
      { page: 1, pageSize },
      connectionString
    );

    const responses = result.responses;

    // Export based on format
    let content: string | Buffer;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'csv':
        content = await exportToCSV(responses, { fields, includeMetadata });
        contentType = 'text/csv';
        filename = `${formId}-responses.csv`;
        break;

      case 'excel':
      case 'xlsx':
        content = await exportToExcel(responses, { fields, includeMetadata });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${formId}-responses.xlsx`;
        break;

      case 'json':
        content = exportToJSON(responses, { fields, includeMetadata });
        contentType = 'application/json';
        filename = `${formId}-responses.json`;
        break;

      case 'pdf':
        content = await exportToPDF(responses, { fields, includeMetadata });
        contentType = 'application/pdf';
        filename = `${formId}-responses.pdf`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid format. Use: csv, excel, json, or pdf' },
          { status: 400 }
        );
    }

    // Log audit event
    await logAuditEvent('response.export', formId, {
      metadata: {
        format,
        responseCount: responses.length,
        includeMetadata,
        fields: fields?.length || 'all',
      },
      connectionString,
    });

    // Return file response
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // Convert Buffer to Uint8Array for NextResponse
    const body = Buffer.isBuffer(content) 
      ? new Uint8Array(content) 
      : content;

    return new NextResponse(body, { headers });
  } catch (error: any) {
    console.error('Error exporting responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export responses',
      },
      { status: 500 }
    );
  }
}

