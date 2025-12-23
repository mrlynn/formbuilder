import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import { getFormById, getPublishedFormById, getFormVersions } from '@/lib/storage';
import { FormVersion } from '@/types/form';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// GET - Get version history for a form
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;

    if (!formId) {
      return NextResponse.json({
        success: true,
        versions: [],
        message: 'Form ID is required',
      });
    }

    // Get session for file storage lookup
    let sessionId: string;
    try {
      const session = await getIronSession(await cookies(), sessionOptions);
      sessionId = ensureSessionId(session);
      await session.save();
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      // Return empty versions if session fails - form may not be saved yet
      return NextResponse.json({
        success: true,
        versions: [],
      });
    }

    // Load form configuration from file storage
    let formConfig = await getFormById(sessionId, formId);

    // Try published forms if not found
    if (!formConfig) {
      formConfig = await getPublishedFormById(formId);
    }

    // If form not found, return empty versions (form may not be saved yet)
    if (!formConfig) {
      return NextResponse.json({
        success: true,
        versions: [],
        message: 'Form not saved yet - no versions available',
      });
    }

    // Get versions from file storage
    const allVersions = await getFormVersions(sessionId);
    const versions = allVersions
      .filter(v => v.formId === formId)
      .map(v => ({
        id: v.id,
        version: v.version,
        name: v.name,
        description: v.description,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        changeNotes: v.changeNotes,
        fieldCount: v.fieldConfigs?.length || 0,
        pageCount: v.pages?.length || 0,
        isPublished: v.isPublished,
      }))
      .sort((a, b) => b.version - a.version);

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    // Return empty versions on error instead of 500
    return NextResponse.json({
      success: true,
      versions: [],
      error: error.message || 'Failed to fetch versions',
    });
  }
}

// POST - Create a new version
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { changeNotes } = body;

    // Get session for file storage lookup
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Load form configuration from file storage
    const formConfig = await getFormById(sessionId, formId);

    if (!formConfig) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Create new version
    const currentVersion = formConfig.currentVersion || 1;
    const newVersionNumber = currentVersion + 1;

    const { randomBytes } = await import('crypto');
    const newVersionEntry: FormVersion = {
      id: randomBytes(8).toString('hex'),
      formId: formConfig.id || formId,
      version: newVersionNumber,
      name: formConfig.name,
      description: formConfig.description,
      fieldConfigs: formConfig.fieldConfigs,
      variables: formConfig.variables,
      createdAt: new Date().toISOString(),
      createdBy: 'user',
      changeNotes: changeNotes || 'No change notes provided',
      isPublished: formConfig.isPublished || false,
    };

    // Save new version to file storage
    const { addFormVersion, saveForm } = await import('@/lib/storage');
    await addFormVersion(sessionId, newVersionEntry);

    // Update form with new version number
    const updatedForm = {
      ...formConfig,
      currentVersion: newVersionNumber,
      updatedAt: new Date().toISOString(),
    };
    await saveForm(sessionId, updatedForm);

    return NextResponse.json({
      success: true,
      version: newVersionEntry,
    });
  } catch (error: any) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create version',
      },
      { status: 500 }
    );
  }
}
