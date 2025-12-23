/**
 * OAuth Initiation Route
 *
 * GET /api/auth/oauth/google
 * GET /api/auth/oauth/github
 *
 * Redirects to OAuth provider's authorization page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, isProviderAvailable } from '@/lib/platform/oauth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (provider !== 'google' && provider !== 'github') {
    return NextResponse.json(
      { error: 'Invalid OAuth provider' },
      { status: 400 }
    );
  }

  // Check if provider is configured
  if (!isProviderAvailable(provider)) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured` },
      { status: 503 }
    );
  }

  try {
    // Get optional redirect URL from query params
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || undefined;

    // Generate authorization URL
    const authUrl = await getAuthorizationUrl(provider, redirectTo);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error(`[OAuth ${provider}] Error initiating:`, error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
