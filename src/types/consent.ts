/**
 * Cookie Consent Types
 * GDPR/CCPA compliant consent management
 */

// Cookie categories based on purpose
export type CookieCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

// Consent status for each category
export interface ConsentPreferences {
  essential: true; // Always required, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

// Full consent record stored in MongoDB
export interface ConsentRecord {
  _id?: string;

  // Identifier (anonymous or user-linked)
  visitorId: string; // Anonymous fingerprint for non-logged-in users
  userId?: string; // Platform userId if logged in

  // Consent details
  preferences: ConsentPreferences;
  consentVersion: string; // Track policy version for re-consent

  // Compliance metadata
  ipAddress?: string; // Hashed for privacy
  userAgent?: string;
  geoLocation?: {
    country?: string;
    region?: string;
  };

  // Legal basis
  legalBasis: 'consent' | 'legitimate_interest';
  doNotTrack: boolean; // Browser DNT signal

  // Timestamps
  consentedAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Consent expires after 12 months per GDPR

  // Audit trail
  history: ConsentHistoryEntry[];
}

export interface ConsentHistoryEntry {
  preferences: ConsentPreferences;
  action: 'initial' | 'update' | 'withdraw';
  timestamp: Date;
  source: 'banner' | 'settings' | 'api';
}

// Cookie definition for transparency
export interface CookieDefinition {
  name: string;
  category: CookieCategory;
  purpose: string;
  duration: string;
  provider: 'first-party' | string; // Third-party provider name
}

// All cookies used by the application
export const COOKIE_DEFINITIONS: CookieDefinition[] = [
  // Essential cookies
  {
    name: 'mdb_tools_session',
    category: 'essential',
    purpose: 'Maintains your login session and authentication state',
    duration: '7 days',
    provider: 'first-party',
  },
  {
    name: 'mdb_device_trust',
    category: 'essential',
    purpose: 'Remembers trusted devices for secure passwordless login',
    duration: '30 days',
    provider: 'first-party',
  },
  {
    name: 'mdb_cookie_consent',
    category: 'essential',
    purpose: 'Stores your cookie preferences',
    duration: '12 months',
    provider: 'first-party',
  },
  // Functional cookies
  {
    name: 'mdb_theme_preference',
    category: 'functional',
    purpose: 'Remembers your preferred theme settings',
    duration: '12 months',
    provider: 'first-party',
  },
  {
    name: 'mdb_form_draft',
    category: 'functional',
    purpose: 'Auto-saves form drafts to prevent data loss',
    duration: 'Session',
    provider: 'first-party',
  },
  // Analytics cookies (future)
  {
    name: '_ga',
    category: 'analytics',
    purpose: 'Google Analytics - measures how you use the site',
    duration: '2 years',
    provider: 'Google',
  },
  {
    name: '_gid',
    category: 'analytics',
    purpose: 'Google Analytics - distinguishes users',
    duration: '24 hours',
    provider: 'Google',
  },
  // Marketing cookies (future)
  {
    name: '_fbp',
    category: 'marketing',
    purpose: 'Facebook Pixel - used for targeted advertising',
    duration: '3 months',
    provider: 'Facebook',
  },
];

// Consent banner/modal state
export type ConsentModalState = 'hidden' | 'banner' | 'preferences';

// API request/response types
export interface SaveConsentRequest {
  preferences: Omit<ConsentPreferences, 'essential'>;
  source: 'banner' | 'settings';
}

export interface ConsentResponse {
  success: boolean;
  preferences: ConsentPreferences;
  consentedAt?: Date;
  message?: string;
}

// Category descriptions for UI
export const CATEGORY_INFO: Record<CookieCategory, {
  title: string;
  description: string;
  required: boolean;
}> = {
  essential: {
    title: 'Essential',
    description: 'Required for the website to function. These cannot be disabled.',
    required: true,
  },
  functional: {
    title: 'Functional',
    description: 'Enable personalized features like saving your preferences and auto-saving form drafts.',
    required: false,
  },
  analytics: {
    title: 'Analytics',
    description: 'Help us understand how you use the site so we can improve your experience.',
    required: false,
  },
  marketing: {
    title: 'Marketing',
    description: 'Used to show you relevant ads on other websites.',
    required: false,
  },
};

// Current consent/policy version - increment when policy changes
export const CONSENT_VERSION = '1.0.0';

// Consent expiry in days (12 months per GDPR)
export const CONSENT_EXPIRY_DAYS = 365;
