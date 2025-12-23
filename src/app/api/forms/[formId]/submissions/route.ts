import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import {
  getFormById,
  getSubmissionsForForm,
  getFormSubmissions,
  saveFormSubmissions,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET - List submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Find form
    const form = await getFormById(sessionId, formId);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Get submissions for this form
    const allSubmissions = await getSubmissionsForForm(sessionId, formId);
    const submissions = allSubmissions.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    // Pagination
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const paginatedSubmissions = submissions.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      submissions: paginatedSubmissions,
      total: submissions.length,
      page,
      limit,
      totalPages: Math.ceil(submissions.length / limit),
    });
  } catch (error: any) {
    console.error('Error listing submissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list submissions' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Get all submissions
    const submissions = await getFormSubmissions(sessionId);

    // Find and remove submission
    const submissionIndex = submissions.findIndex(
      (s) => s.id === submissionId && s.formId === formId
    );

    if (submissionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    submissions.splice(submissionIndex, 1);
    await saveFormSubmissions(sessionId, submissions);

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
