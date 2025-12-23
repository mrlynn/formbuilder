/**
 * Organizations API
 *
 * GET  /api/organizations - List user's organizations
 * POST /api/organizations - Create new organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createOrganization,
  getUserOrganizations,
} from '@/lib/platform/organizations';
import { findUserById } from '@/lib/platform/users';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user to find their userId (platform format)
    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const organizations = await getUserOrganizations(user.userId);

    return NextResponse.json({
      organizations: organizations.map(org => ({
        orgId: org.orgId,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        subscription: org.subscription,
        settings: org.settings,
        role: user.organizations.find(o => o.orgId === org.orgId)?.role,
        createdAt: org.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Organizations API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: 'Slug must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    const organization = await createOrganization({
      name,
      slug,
      createdBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      organization: {
        orgId: organization.orgId,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
    });
  } catch (error) {
    console.error('[Organizations API] Create error:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
