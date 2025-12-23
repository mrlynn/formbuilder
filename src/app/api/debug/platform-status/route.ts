/**
 * Debug endpoint to check platform user and organization status
 * GET /api/debug/platform-status
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUsersCollection, getOrganizationsCollection } from '@/lib/platform/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        session: { hasUserId: false, hasEmail: !!session.email },
      });
    }

    // Get platform user
    const usersCollection = await getUsersCollection();
    const platformUser = await usersCollection.findOne({ userId: session.userId });

    // Also try to find by email
    const userByEmail = session.email
      ? await usersCollection.findOne({ email: session.email.toLowerCase() })
      : null;

    // Get all orgs
    const orgsCollection = await getOrganizationsCollection();
    const allOrgs = await orgsCollection.find({}).toArray();

    return NextResponse.json({
      session: {
        userId: session.userId,
        email: session.email,
      },
      platformUser: platformUser
        ? {
            found: true,
            userId: platformUser.userId,
            email: platformUser.email,
            organizations: platformUser.organizations,
            createdAt: platformUser.createdAt,
          }
        : {
            found: false,
            message: 'No platform user found with session.userId',
          },
      userByEmail: userByEmail
        ? {
            found: true,
            userId: userByEmail.userId,
            email: userByEmail.email,
            organizations: userByEmail.organizations,
            note: userByEmail.userId !== session.userId
              ? 'WARNING: userId mismatch - session has different userId than platform user!'
              : 'userId matches session',
          }
        : {
            found: false,
          },
      organizations: allOrgs.map(org => ({
        orgId: org.orgId,
        name: org.name,
        slug: org.slug,
        createdBy: org.createdBy,
      })),
      diagnosis: getDiagnosis(session, platformUser, userByEmail, allOrgs),
    });
  } catch (error: any) {
    console.error('[Debug] Platform status error:', error);
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

function getDiagnosis(
  session: any,
  platformUser: any,
  userByEmail: any,
  allOrgs: any[]
): string[] {
  const issues: string[] = [];

  if (!platformUser && !userByEmail) {
    issues.push('CRITICAL: No platform user exists. You need to log out and log back in to create one.');
  } else if (!platformUser && userByEmail) {
    issues.push(`MISMATCH: Platform user exists with userId "${userByEmail.userId}" but session has "${session.userId}". Log out and back in.`);
  } else if (platformUser && platformUser.organizations.length === 0) {
    issues.push('Platform user exists but has no organization memberships.');

    // Check if they created an org
    const createdOrg = allOrgs.find(o => o.createdBy === session.userId);
    if (createdOrg) {
      issues.push(`You created org "${createdOrg.name}" (${createdOrg.orgId}) but weren't added as a member. This is a bug.`);
      issues.push('FIX: The membership update failed silently. Need to manually add you as owner.');
    }
  } else if (platformUser && platformUser.organizations.length > 0) {
    issues.push('Platform user has organization memberships - permission should work.');
    issues.push(`Memberships: ${JSON.stringify(platformUser.organizations)}`);
  }

  if (issues.length === 0) {
    issues.push('No obvious issues detected.');
  }

  return issues;
}
