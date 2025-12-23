/**
 * AI Request Guard
 *
 * Shared utilities for validating AI requests, checking authentication,
 * and enforcing usage limits across all AI endpoints.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/platform/users';
import { checkAILimit, incrementAIUsage, hasAIFeature } from '@/lib/platform/billing';
import { AIFeature } from '@/types/platform';

export interface AIRequestContext {
  userId: string;
  orgId: string;
}

export type AIGuardResult =
  | {
      success: true;
      context: AIRequestContext;
    }
  | {
      success: false;
      response: NextResponse;
    };

/**
 * Validates an AI request and checks feature access and usage limits.
 * Returns either a context object for valid requests or an error response.
 */
export async function validateAIRequest(
  feature: AIFeature,
  checkUsageLimit: boolean = true
): Promise<AIGuardResult> {
  // Check authentication
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Get user and their organization
  const user = await findUserById(session.userId);
  if (!user || user.organizations.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 403 }
      ),
    };
  }

  const orgId = user.organizations[0].orgId;

  // Check if user has access to the feature
  const hasFeatureAccess = await hasAIFeature(orgId, feature);
  if (!hasFeatureAccess) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `This AI feature is not available on your current plan. Please upgrade to access this feature.`,
          code: 'FEATURE_NOT_AVAILABLE',
        },
        { status: 403 }
      ),
    };
  }

  // Check AI usage limits if requested
  if (checkUsageLimit) {
    const limitCheck = await checkAILimit(orgId, 'generations');
    if (!limitCheck.allowed) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: `AI generation limit reached (${limitCheck.current}/${limitCheck.limit}). Please upgrade your plan for more generations.`,
            code: 'LIMIT_REACHED',
            usage: limitCheck,
          },
          { status: 429 }
        ),
      };
    }
  }

  return {
    success: true,
    context: {
      userId: session.userId,
      orgId,
    },
  };
}

/**
 * Increment AI usage after a successful operation.
 * Call this after the AI operation completes successfully.
 */
export async function recordAIUsage(orgId: string): Promise<void> {
  await incrementAIUsage(orgId, 'generations', 1);
}
