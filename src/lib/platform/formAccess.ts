/**
 * Form Access Control
 *
 * Handles public form access based on form's accessControl settings:
 * - public: Anyone can access
 * - authenticated: Must be logged in
 * - restricted: Must be logged in AND match domain/user criteria
 */

import { FormAccessControl, AuthMethod, PlatformUser } from '@/types/platform';
import { findUserById, findUserByEmail } from './users';

// ============================================
// Access Check Result
// ============================================

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  requiresAuth?: boolean;
  allowedAuthMethods?: AuthMethod[];
}

// ============================================
// Form Access Checking
// ============================================

/**
 * Check if a user (or anonymous) can access a form
 */
export async function checkFormAccess(
  accessControl: FormAccessControl,
  userId?: string,
  userEmail?: string
): Promise<AccessCheckResult> {
  // Public forms - always allowed
  if (accessControl.type === 'public') {
    return { allowed: true };
  }

  // Authenticated forms - must be logged in
  if (accessControl.type === 'authenticated') {
    if (!userId) {
      return {
        allowed: false,
        reason: 'Authentication required',
        requiresAuth: true,
        allowedAuthMethods: accessControl.authMethods || ['magic-link', 'passkey', 'google', 'github'],
      };
    }
    return { allowed: true };
  }

  // Restricted forms - must be logged in AND match criteria
  if (accessControl.type === 'restricted') {
    if (!userId) {
      console.log('[FormAccess] Restricted form requires auth, no userId provided');
      return {
        allowed: false,
        reason: 'Authentication required',
        requiresAuth: true,
        allowedAuthMethods: accessControl.authMethods || ['magic-link', 'passkey', 'google', 'github'],
      };
    }

    // Get user details
    console.log('[FormAccess] Looking up user by ID:', userId);
    const user = await findUserById(userId);
    if (!user) {
      console.log('[FormAccess] User not found in platform users collection');
      return { allowed: false, reason: 'User not found' };
    }
    console.log('[FormAccess] Found user:', { email: user.email });

    const email = userEmail || user.email;

    // Check allowed users
    if (accessControl.allowedUsers?.length) {
      if (accessControl.allowedUsers.includes(userId)) {
        return { allowed: true };
      }
    }

    // Check allowed emails
    if (accessControl.allowedEmails?.length) {
      if (accessControl.allowedEmails.includes(email.toLowerCase())) {
        return { allowed: true };
      }
    }

    // Check allowed domains
    if (accessControl.allowedDomains?.length) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain && accessControl.allowedDomains.includes(emailDomain)) {
        return { allowed: true };
      }
    }

    // If no criteria matched, provide a helpful message about what IS allowed
    const requirements: string[] = [];
    if (accessControl.allowedDomains?.length) {
      requirements.push(`@${accessControl.allowedDomains.join(', @')} email addresses`);
    }
    if (accessControl.allowedEmails?.length) {
      requirements.push('specific invited email addresses');
    }

    const reason = requirements.length > 0
      ? `This form is restricted to ${requirements.join(' or ')}. Your email (${email}) does not have access.`
      : 'You do not have access to this form';

    return {
      allowed: false,
      reason,
    };
  }

  // Unknown type - deny by default
  return { allowed: false, reason: 'Invalid access control configuration' };
}

/**
 * Check access for a specific email (for invitation flows)
 */
export function checkEmailAccess(
  accessControl: FormAccessControl,
  email: string
): { allowed: boolean; reason?: string } {
  if (accessControl.type === 'public') {
    return { allowed: true };
  }

  if (accessControl.type === 'authenticated') {
    return { allowed: true };
  }

  if (accessControl.type === 'restricted') {
    const emailLower = email.toLowerCase();

    // Check allowed emails
    if (accessControl.allowedEmails?.includes(emailLower)) {
      return { allowed: true };
    }

    // Check allowed domains
    const domain = emailLower.split('@')[1];
    if (domain && accessControl.allowedDomains?.includes(domain)) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Email not authorized for this form' };
  }

  return { allowed: false, reason: 'Invalid access control type' };
}

// ============================================
// Access Control Helpers
// ============================================

/**
 * Get human-readable description of access requirements
 */
export function describeAccessRequirements(accessControl: FormAccessControl): string {
  switch (accessControl.type) {
    case 'public':
      return 'Anyone with the link can access this form';

    case 'authenticated':
      const methods = accessControl.authMethods || ['magic-link', 'passkey', 'google', 'github'];
      const methodNames = methods.map((m) => {
        switch (m) {
          case 'magic-link':
            return 'Email';
          case 'passkey':
            return 'Passkey';
          case 'google':
            return 'Google';
          case 'github':
            return 'GitHub';
          default:
            return m;
        }
      });
      return `Sign in required via: ${methodNames.join(', ')}`;

    case 'restricted':
      const parts: string[] = [];

      if (accessControl.allowedDomains?.length) {
        // Show the actual domains for clarity
        const domains = accessControl.allowedDomains.map(d => `@${d}`).join(', ');
        parts.push(`${domains} email addresses`);
      }

      if (accessControl.allowedEmails?.length) {
        // Show count but not the actual emails for privacy
        parts.push(`${accessControl.allowedEmails.length} specific email address${accessControl.allowedEmails.length > 1 ? 'es' : ''}`);
      }

      if (accessControl.allowedUsers?.length) {
        parts.push(`${accessControl.allowedUsers.length} specific user${accessControl.allowedUsers.length > 1 ? 's' : ''}`);
      }

      if (parts.length === 0) {
        return 'This form has restricted access';
      }

      return `Restricted to: ${parts.join(' or ')}`;

    default:
      return 'Unknown access level';
  }
}

/**
 * Validate access control configuration
 */
export function validateAccessControl(accessControl: FormAccessControl): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!['public', 'authenticated', 'restricted'].includes(accessControl.type)) {
    errors.push('Invalid access control type');
  }

  if (accessControl.type === 'restricted') {
    const hasUsers = accessControl.allowedUsers?.length;
    const hasEmails = accessControl.allowedEmails?.length;
    const hasDomains = accessControl.allowedDomains?.length;

    if (!hasUsers && !hasEmails && !hasDomains) {
      errors.push('Restricted forms must specify at least one of: allowedUsers, allowedEmails, or allowedDomains');
    }

    // Validate email formats
    if (accessControl.allowedEmails) {
      for (const email of accessControl.allowedEmails) {
        if (!isValidEmail(email)) {
          errors.push(`Invalid email format: ${email}`);
        }
      }
    }

    // Validate domain formats
    if (accessControl.allowedDomains) {
      for (const domain of accessControl.allowedDomains) {
        if (!isValidDomain(domain)) {
          errors.push(`Invalid domain format: ${domain}`);
        }
      }
    }
  }

  if (accessControl.authMethods) {
    const validMethods: AuthMethod[] = ['google', 'github', 'magic-link', 'passkey'];
    for (const method of accessControl.authMethods) {
      if (!validMethods.includes(method)) {
        errors.push(`Invalid auth method: ${method}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Utility Functions
// ============================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDomain(domain: string): boolean {
  // Simple domain validation (alphanumeric, hyphens, dots)
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/.test(domain);
}

// ============================================
// Default Access Control
// ============================================

export const DEFAULT_ACCESS_CONTROL: FormAccessControl = {
  type: 'public',
};

export const AUTHENTICATED_ACCESS_CONTROL: FormAccessControl = {
  type: 'authenticated',
  authMethods: ['magic-link', 'passkey', 'google', 'github'],
};

/**
 * Create restricted access control for specific domains
 */
export function createDomainRestriction(domains: string[]): FormAccessControl {
  return {
    type: 'restricted',
    authMethods: ['magic-link', 'passkey', 'google', 'github'],
    allowedDomains: domains.map((d) => d.toLowerCase()),
  };
}

/**
 * Create restricted access control for specific emails
 */
export function createEmailRestriction(emails: string[]): FormAccessControl {
  return {
    type: 'restricted',
    authMethods: ['magic-link', 'passkey', 'google', 'github'],
    allowedEmails: emails.map((e) => e.toLowerCase()),
  };
}
