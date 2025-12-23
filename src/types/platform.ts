// ============================================
// Platform Types for Multi-Tenant Form Builder
// ============================================

import { ObjectId } from 'mongodb';
import { PasskeyCredential, TrustedDevice } from './auth';
import { CollectionEncryptionConfig, FieldEncryptionConfig } from './form';

// ============================================
// Authentication Methods
// ============================================

export type AuthMethod = 'google' | 'github' | 'magic-link' | 'passkey';
export type AccessControlType = 'public' | 'authenticated' | 'restricted';

// ============================================
// Organization & Multi-tenancy
// ============================================

export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationSettings {
  allowedAuthMethods: AuthMethod[];
  defaultFormAccess: AccessControlType;
  dataRetentionDays: number;
  maxForms: number;
  maxSubmissionsPerMonth: number;
  maxConnections: number;
  allowCustomBranding: boolean;
}

export interface Organization {
  _id?: ObjectId;
  orgId: string;                      // "org_abc123"
  name: string;
  slug: string;                       // URL-friendly: "acme-corp"

  plan: OrgPlan;
  settings: OrganizationSettings;

  // Billing (for future use)
  billingEmail?: string;
  stripeCustomerId?: string;

  // Usage tracking
  currentMonthSubmissions: number;
  usageResetDate: Date;

  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface OrgMembership {
  orgId: string;
  role: OrgRole;
  joinedAt: Date;
  invitedBy?: string;
}

// Default settings per plan
export const ORG_PLAN_LIMITS: Record<OrgPlan, Partial<OrganizationSettings>> = {
  free: {
    maxForms: 5,
    maxSubmissionsPerMonth: 100,
    maxConnections: 2,
    dataRetentionDays: 30,
    allowCustomBranding: false,
  },
  pro: {
    maxForms: 50,
    maxSubmissionsPerMonth: 10000,
    maxConnections: 10,
    dataRetentionDays: 365,
    allowCustomBranding: true,
  },
  enterprise: {
    maxForms: -1, // unlimited
    maxSubmissionsPerMonth: -1,
    maxConnections: -1,
    dataRetentionDays: -1, // unlimited
    allowCustomBranding: true,
  },
};

// ============================================
// Platform User (Extended)
// ============================================

export type PlatformRole = 'admin' | 'support';

export interface OAuthConnection {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: Date;
  lastUsedAt?: Date;
}

export interface PlatformUser {
  _id?: ObjectId;
  userId: string;                     // "user_abc123"
  authId?: string;                    // Link to auth DB user ObjectId (for passkey/magic link users)
  email: string;
  emailVerified: boolean;

  // Profile
  displayName?: string;
  avatarUrl?: string;

  // Platform role (system-wide)
  platformRole?: PlatformRole;

  // Organization memberships
  organizations: OrgMembership[];

  // OAuth connections
  oauthConnections: OAuthConnection[];

  // Existing auth fields from User type
  passkeys?: PasskeyCredential[];
  trustedDevices?: TrustedDevice[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// ============================================
// Connection Vault
// ============================================

export type ConnectionRole = 'owner' | 'admin' | 'user';
export type ConnectionStatus = 'active' | 'disabled' | 'deleted';

export interface ConnectionPermission {
  userId: string;
  role: ConnectionRole;
  grantedAt: Date;
  grantedBy: string;
}

export interface ConnectionVault {
  _id?: ObjectId;
  vaultId: string;                    // "vault_abc123"
  organizationId: string;
  createdBy: string;

  // Display info (not sensitive)
  name: string;
  description?: string;

  // Encrypted secret - format: "keyId:iv:ciphertext:authTag"
  encryptedConnectionString: string;
  encryptionKeyId: string;            // For key rotation

  // Target configuration
  database: string;
  allowedCollections: string[];       // Whitelist of collections forms can use

  // Permissions within org
  permissions: ConnectionPermission[];

  // Status & monitoring
  status: ConnectionStatus;
  lastTestedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Form Access Control
// ============================================

export interface FormAccessControl {
  type: AccessControlType;

  // For authenticated/restricted forms
  authMethods?: AuthMethod[];

  // For restricted forms only
  allowedDomains?: string[];          // ["acme.com", "partner.org"]
  allowedUsers?: string[];            // ["user_123", "user_456"]
  allowedEmails?: string[];           // Specific email addresses
}

// ============================================
// Form Permissions (RBAC)
// ============================================

export type FormRole = 'owner' | 'editor' | 'analyst' | 'viewer';

export interface FormPermission {
  userId: string;
  role: FormRole;
  grantedAt: Date;
  grantedBy: string;
}

// Permission capabilities per role
export const FORM_ROLE_CAPABILITIES: Record<FormRole, string[]> = {
  owner: ['read', 'write', 'delete', 'publish', 'manage_permissions', 'transfer', 'view_responses', 'export_responses', 'delete_responses'],
  editor: ['read', 'write', 'publish', 'view_responses', 'export_responses', 'delete_responses'],
  analyst: ['read', 'view_responses', 'export_responses'],
  viewer: ['read'],
};

export const CONNECTION_ROLE_CAPABILITIES: Record<ConnectionRole, string[]> = {
  owner: ['read', 'write', 'delete', 'manage_permissions', 'use', 'view_connection_string'],
  admin: ['read', 'write', 'manage_permissions', 'use'],
  user: ['use'], // Can use in forms but cannot see connection string
};

export const ORG_ROLE_CAPABILITIES: Record<OrgRole, string[]> = {
  owner: ['manage_org', 'delete_org', 'manage_billing', 'manage_members', 'manage_all_forms', 'manage_all_connections'],
  admin: ['manage_members', 'manage_all_forms', 'manage_all_connections'],
  member: ['create_forms', 'use_connections'],
  viewer: ['view_forms', 'view_responses'],
};

// ============================================
// Form Data Source (replaces connectionString in form)
// ============================================

export interface FormDataSource {
  vaultId: string;                    // Reference to ConnectionVault
  collection: string;                 // Target collection for submissions
}

// ============================================
// Rate Limiting
// ============================================

export type RateLimitResource = 'form_submit_public' | 'form_submit_auth' | 'api' | 'magic_link';

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export const DEFAULT_RATE_LIMITS: Record<RateLimitResource, RateLimitConfig> = {
  form_submit_public: { limit: 10, windowSeconds: 3600 },   // 10/hour per IP
  form_submit_auth: { limit: 50, windowSeconds: 3600 },     // 50/hour per user
  api: { limit: 1000, windowSeconds: 3600 },                // 1000/hour per user
  magic_link: { limit: 5, windowSeconds: 3600 },            // 5/hour per email
};

export interface RateLimitEntry {
  _id?: ObjectId;
  key: string;                        // "ip:192.168.1.1" or "user:user_123" or "email:test@example.com"
  resource: RateLimitResource;
  count: number;
  windowStart: Date;
  expiresAt: Date;                    // TTL index for auto-cleanup
}

// ============================================
// Form Submission (Enhanced)
// ============================================

export type SubmissionSyncStatus = 'pending' | 'synced' | 'failed';

export interface FormSubmissionRespondent {
  userId?: string;
  email?: string;
  authMethod?: AuthMethod;
}

export interface FormSubmissionMetadata {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
}

export interface PlatformFormSubmission {
  _id?: ObjectId;
  submissionId: string;               // "sub_abc123"
  formId: string;
  formVersion: number;
  organizationId: string;

  // The actual form data
  data: Record<string, unknown>;

  // Respondent info (if authenticated)
  respondent?: FormSubmissionRespondent;

  // Request metadata
  metadata: FormSubmissionMetadata;

  // Sync status to target MongoDB
  syncStatus: SubmissionSyncStatus;
  syncAttempts: number;
  syncedAt?: Date;
  syncError?: string;
  lastSyncAttempt?: Date;

  // Target info (denormalized for sync worker)
  targetVaultId: string;
  targetCollection: string;

  // Encryption configuration (for background sync retries)
  encryptionConfig?: {
    collectionEncryption?: CollectionEncryptionConfig;
    encryptedFields?: Record<string, FieldEncryptionConfig>;
  };

  // Timestamps
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Audit Logging
// ============================================

export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'org.member_added'
  | 'org.member_removed'
  | 'connection.created'
  | 'connection.updated'
  | 'connection.deleted'
  | 'connection.tested'
  | 'connection.used'
  | 'form.created'
  | 'form.updated'
  | 'form.published'
  | 'form.unpublished'
  | 'form.deleted'
  | 'form.submitted'
  | 'form.submission_synced'
  | 'form.submission_failed';

export interface AuditLogEntry {
  _id?: ObjectId;
  eventType: AuditEventType;

  // Actor
  userId?: string;
  userEmail?: string;

  // Resource
  resourceType: 'user' | 'organization' | 'connection' | 'form' | 'submission';
  resourceId: string;
  organizationId?: string;

  // Details
  action: string;
  details: Record<string, unknown>;

  // Request context
  ipAddress?: string;
  userAgent?: string;

  // Timestamp
  timestamp: Date;
}

// ============================================
// OAuth State (for OAuth flow)
// ============================================

export interface OAuthState {
  _id?: ObjectId;
  state: string;                      // Random state token
  provider: 'google' | 'github';
  redirectTo?: string;                // Where to redirect after auth
  createdAt: Date;
  expiresAt: Date;                    // TTL: 10 minutes
}

// ============================================
// Org Invitation
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface OrgInvitation {
  _id?: ObjectId;
  invitationId: string;               // "inv_abc123"
  organizationId: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;

  invitedBy: string;                  // userId
  token: string;                      // Secure token for accepting

  createdAt: Date;
  expiresAt: Date;                    // 7 days
  acceptedAt?: Date;
}
