import { NextRequest, NextResponse } from 'next/server';
import {
  getResponse,
  deleteResponse,
  updateResponse,
} from '@/lib/formResponseService';
import { logAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
    responseId: string;
  }>;
}

// GET - Get single response
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { responseId } = await params;
    const { searchParams } = new URL(request.url);
    const connectionString = searchParams.get('connectionString') || undefined;

    const response = await getResponse(responseId, connectionString);

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent('response.read', response.formId, {
      responseId,
      connectionString,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Error fetching response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch response',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete response
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { responseId } = await params;
    const { searchParams } = new URL(request.url);
    const connectionString = searchParams.get('connectionString') || undefined;

    // Get response first to log audit
    const response = await getResponse(responseId, connectionString);
    
    const deleted = await deleteResponse(responseId, connectionString);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    // Log audit event
    if (response) {
      await logAuditEvent('response.delete', response.formId, {
        responseId,
        connectionString,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete response',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update response
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { responseId } = await params;
    const body = await request.json();
    const { updates, connectionString } = body;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Updates are required' },
        { status: 400 }
      );
    }

    const response = await updateResponse(
      responseId,
      updates,
      connectionString
    );

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent('response.update', response.formId, {
      responseId,
      metadata: { updates: Object.keys(updates) },
      connectionString,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Error updating response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update response',
      },
      { status: 500 }
    );
  }
}
