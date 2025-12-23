import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import {
  getFormById,
  saveForm,
  getVersionById,
  getVersionsForForm,
  deleteVersion,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; versionId: string }> }
) {
  try {
    const { formId, versionId } = await params;
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Find version
    const version = await getVersionById(sessionId, formId, versionId);

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (error: any) {
    console.error('Error getting version:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get version' },
      { status: 500 }
    );
  }
}

// POST - Restore this version (make it the current form state)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; versionId: string }> }
) {
  try {
    const { formId, versionId } = await params;
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

    // Find version
    const version = await getVersionById(sessionId, formId, versionId);

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get current max version for incrementing
    const existingVersions = await getVersionsForForm(sessionId, formId);
    const maxVersion = existingVersions.reduce((max, v) => Math.max(max, v.version), 0);

    // Restore the version's state to the form
    const restoredForm = {
      ...form,
      name: version.name,
      description: version.description,
      fieldConfigs: JSON.parse(JSON.stringify(version.fieldConfigs)),
      variables: version.variables ? JSON.parse(JSON.stringify(version.variables)) : undefined,
      events: version.events ? JSON.parse(JSON.stringify(version.events)) : undefined,
      multiPage: version.pages
        ? {
            enabled: true,
            pages: JSON.parse(JSON.stringify(version.pages)),
            showStepIndicator: true,
            stepIndicatorStyle: 'numbers' as const,
            validateOnPageChange: true,
          }
        : undefined,
      updatedAt: new Date().toISOString(),
      currentVersion: maxVersion + 1, // Increment version after restore
    };

    await saveForm(sessionId, restoredForm);

    return NextResponse.json({
      success: true,
      message: `Restored to version ${version.version}`,
      restoredVersion: version.version,
      newCurrentVersion: maxVersion + 1,
    });
  } catch (error: any) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore version' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific version
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; versionId: string }> }
) {
  try {
    const { formId, versionId } = await params;
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    const deleted = await deleteVersion(sessionId, formId, versionId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Version deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting version:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete version' },
      { status: 500 }
    );
  }
}
