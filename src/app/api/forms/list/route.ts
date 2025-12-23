import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import { getForms } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get session ID
    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Get forms from file storage
    const savedForms = await getForms(sessionId);

    // Return list of forms (without full field configs for performance)
    const forms = savedForms.map(form => ({
      id: form.id,
      name: form.name,
      description: form.description,
      collection: form.collection,
      database: form.database,
      slug: form.slug,
      isPublished: form.isPublished,
      publishedAt: form.publishedAt,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      fieldCount: form.fieldConfigs?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      forms: forms.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    });
  } catch (error: any) {
    console.error('Error listing forms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list forms' },
      { status: 500 }
    );
  }
}
