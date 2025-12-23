/**
 * POST /api/billing/cancel
 *
 * Cancel subscription (at period end by default).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription, reactivateSubscription } from '@/lib/platform/billing';
import { getSession } from '@/lib/auth/session';
import { checkOrgPermission } from '@/lib/platform/organizations';

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, immediate = false } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    // Check permission
    const hasPermission = await checkOrgPermission(session.userId, orgId, 'manage_billing');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to manage billing for this organization' },
        { status: 403 }
      );
    }

    await cancelSubscription(orgId, session.userId, immediate);

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error) {
    console.error('[API] /api/billing/cancel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/cancel
 *
 * Reactivate a subscription that was scheduled for cancellation.
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    // Check permission
    const hasPermission = await checkOrgPermission(session.userId, orgId, 'manage_billing');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to manage billing for this organization' },
        { status: 403 }
      );
    }

    await reactivateSubscription(orgId, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated',
    });
  } catch (error) {
    console.error('[API] /api/billing/cancel DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
