/**
 * Rate Limiting Service
 *
 * Implements sliding window rate limiting using MongoDB.
 * Limits are stored with TTL for automatic cleanup.
 */

import { getRateLimitsCollection } from './db';
import {
  RateLimitEntry,
  RateLimitResource,
  RateLimitConfig,
  DEFAULT_RATE_LIMITS,
} from '@/types/platform';

// ============================================
// Rate Limit Checking
// ============================================

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

/**
 * Check and increment rate limit for a key
 */
export async function checkRateLimit(
  key: string,
  resource: RateLimitResource,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const collection = await getRateLimitsCollection();
  const limits = config || DEFAULT_RATE_LIMITS[resource];

  const now = new Date();
  const windowStart = new Date(now.getTime() - limits.windowSeconds * 1000);
  const expiresAt = new Date(now.getTime() + limits.windowSeconds * 1000);

  // Try to find existing entry within the window
  const existing = await collection.findOne({
    key,
    resource,
    windowStart: { $gte: windowStart },
  });

  if (existing) {
    // Check if limit exceeded
    if (existing.count >= limits.limit) {
      const resetAt = new Date(existing.windowStart.getTime() + limits.windowSeconds * 1000);
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        current: existing.count,
        limit: limits.limit,
        remaining: 0,
        resetAt,
        retryAfter: retryAfter > 0 ? retryAfter : 1,
      };
    }

    // Increment counter
    await collection.updateOne(
      { _id: existing._id },
      {
        $inc: { count: 1 },
        $set: { expiresAt }, // Extend expiry
      }
    );

    const resetAt = new Date(existing.windowStart.getTime() + limits.windowSeconds * 1000);

    return {
      allowed: true,
      current: existing.count + 1,
      limit: limits.limit,
      remaining: limits.limit - existing.count - 1,
      resetAt,
    };
  }

  // Create new entry
  const entry: RateLimitEntry = {
    key,
    resource,
    count: 1,
    windowStart: now,
    expiresAt,
  };

  await collection.insertOne(entry);

  return {
    allowed: true,
    current: 1,
    limit: limits.limit,
    remaining: limits.limit - 1,
    resetAt: expiresAt,
  };
}

/**
 * Check rate limit without incrementing (peek)
 */
export async function peekRateLimit(
  key: string,
  resource: RateLimitResource,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const collection = await getRateLimitsCollection();
  const limits = config || DEFAULT_RATE_LIMITS[resource];

  const now = new Date();
  const windowStart = new Date(now.getTime() - limits.windowSeconds * 1000);

  const existing = await collection.findOne({
    key,
    resource,
    windowStart: { $gte: windowStart },
  });

  if (!existing) {
    return {
      allowed: true,
      current: 0,
      limit: limits.limit,
      remaining: limits.limit,
      resetAt: new Date(now.getTime() + limits.windowSeconds * 1000),
    };
  }

  const resetAt = new Date(existing.windowStart.getTime() + limits.windowSeconds * 1000);
  const remaining = Math.max(0, limits.limit - existing.count);
  const allowed = existing.count < limits.limit;

  return {
    allowed,
    current: existing.count,
    limit: limits.limit,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
  };
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string, resource: RateLimitResource): Promise<void> {
  const collection = await getRateLimitsCollection();
  await collection.deleteMany({ key, resource });
}

// ============================================
// Key Generators
// ============================================

/**
 * Generate rate limit key for IP address
 */
export function getIpKey(ip: string): string {
  // Normalize IP (handle IPv6 mapped IPv4)
  const normalizedIp = ip.replace(/^::ffff:/, '');
  return `ip:${normalizedIp}`;
}

/**
 * Generate rate limit key for user
 */
export function getUserKey(userId: string): string {
  return `user:${userId}`;
}

/**
 * Generate rate limit key for email
 */
export function getEmailKey(email: string): string {
  return `email:${email.toLowerCase()}`;
}

/**
 * Generate rate limit key for form + IP
 */
export function getFormIpKey(formId: string, ip: string): string {
  const normalizedIp = ip.replace(/^::ffff:/, '');
  return `form:${formId}:ip:${normalizedIp}`;
}

/**
 * Generate rate limit key for form + user
 */
export function getFormUserKey(formId: string, userId: string): string {
  return `form:${formId}:user:${userId}`;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Check form submission rate limit (public, IP-based)
 */
export async function checkPublicSubmissionLimit(
  formId: string,
  ip: string
): Promise<RateLimitResult> {
  const key = getFormIpKey(formId, ip);
  return checkRateLimit(key, 'form_submit_public');
}

/**
 * Check form submission rate limit (authenticated, user-based)
 */
export async function checkAuthSubmissionLimit(
  formId: string,
  userId: string
): Promise<RateLimitResult> {
  const key = getFormUserKey(formId, userId);
  return checkRateLimit(key, 'form_submit_auth');
}

/**
 * Check API rate limit
 */
export async function checkApiLimit(userId: string): Promise<RateLimitResult> {
  const key = getUserKey(userId);
  return checkRateLimit(key, 'api');
}

/**
 * Check magic link rate limit
 */
export async function checkMagicLinkLimit(email: string): Promise<RateLimitResult> {
  const key = getEmailKey(email);
  return checkRateLimit(key, 'magic_link');
}

// ============================================
// Response Headers
// ============================================

/**
 * Generate rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(result: RateLimitResult): {
  status: number;
  body: { error: string; retryAfter: number };
  headers: Record<string, string>;
} {
  return {
    status: 429,
    body: {
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter || 60,
    },
    headers: getRateLimitHeaders(result),
  };
}
