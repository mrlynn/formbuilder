/**
 * POST /api/billing/usage
 *
 * Increment usage counters for AI features.
 * Returns whether the operation was allowed based on limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { incrementAIUsage, checkAILimit } from '@/lib/platform/billing';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, metric, amount = 1, tokensUsed } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    if (!metric || !['generations', 'agentSessions', 'processingRuns'].includes(metric)) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    // TODO: Verify user has access to this org

    const result = await incrementAIUsage(orgId, metric, amount, tokensUsed);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] /api/billing/usage POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/usage
 *
 * Check current usage without incrementing.
 */
export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const metric = searchParams.get('metric') as 'generations' | 'agentSessions' | 'processingRuns';

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    if (!metric || !['generations', 'agentSessions', 'processingRuns'].includes(metric)) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    const result = await checkAILimit(orgId, metric);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] /api/billing/usage GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
