# Production Architecture: Secure Multi-Tenant Form Builder

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Platform Types | ✅ Complete | `src/types/platform.ts` |
| Encryption Service | ✅ Complete | `src/lib/encryption.ts` |
| Database Layer | ✅ Complete | `src/lib/platform/db.ts` |
| Connection Vault | ✅ Complete | `src/lib/platform/connectionVault.ts` |
| Organization Service | ✅ Complete | `src/lib/platform/organizations.ts` |
| User Service | ✅ Complete | `src/lib/platform/users.ts` |
| OAuth Providers | ✅ Complete | `src/lib/platform/oauth.ts` |
| RBAC Permissions | ✅ Complete | `src/lib/platform/permissions.ts` |
| Rate Limiting | ✅ Complete | `src/lib/platform/rateLimit.ts` |
| Form Access Control | ✅ Complete | `src/lib/platform/formAccess.ts` |
| Hybrid Submissions | ✅ Complete | `src/lib/platform/submissions.ts` |
| API Routes | ✅ Complete | `src/app/api/organizations/`, `src/app/api/auth/oauth/` |

## Overview

This document outlines the architecture for running the form builder in production with:
- Secure connection string storage (vault pattern)
- Multi-tenant organization isolation
- OAuth + Magic Link + Passkey authentication
- Granular RBAC permissions
- Rate limiting for free tier
- Hybrid sync/async submission handling

---

## 1. Multi-Tenancy Model

### Database Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLATFORM DATABASE (Shared)                        │
│                    mongodb+srv://.../form_builder_platform           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Collections:                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │ users           │  │ organizations   │  │ oauth_states    │      │
│  │ - platformRole  │  │ - plan          │  │ - state token   │      │
│  │ - orgMemberships│  │ - settings      │  │ - provider      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │ rate_limits     │  │ platform_audit  │  │ magic_links     │      │
│  │ - IP tracking   │  │ - system events │  │ - tokens        │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              ORGANIZATION DATABASES (Isolated per org)               │
│              mongodb+srv://.../org_{orgId}                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  org_acme_corp/                    org_startup_xyz/                  │
│  ┌─────────────────┐               ┌─────────────────┐              │
│  │ connection_vault│               │ connection_vault│              │
│  │ forms           │               │ forms           │              │
│  │ form_submissions│               │ form_submissions│              │
│  │ org_audit_logs  │               │ org_audit_logs  │              │
│  └─────────────────┘               └─────────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 CUSTOMER TARGET DATABASES                            │
│                 (Customer's own MongoDB clusters)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  mongodb+srv://customer1.mongodb.net/crm                             │
│  mongodb+srv://customer2.mongodb.net/inventory                       │
│  (Connection strings stored encrypted in connection_vault)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Connection Vault (Secure Secret Storage)

### Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENCRYPTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Form Developer enters connection string                             │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Client-side: Connection string in memory only          │        │
│  │  POST /api/connections/vault                             │        │
│  └─────────────────────────────────────────────────────────┘        │
│           │                                                          │
│           ▼ (HTTPS/TLS)                                              │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Server: Encrypt with AES-256-GCM                        │        │
│  │                                                          │        │
│  │  Phase 1: Environment Variable Key                       │        │
│  │  ─────────────────────────────────                       │        │
│  │  VAULT_ENCRYPTION_KEY=base64-encoded-32-byte-key         │        │
│  │                                                          │        │
│  │  Phase 2: Cloud KMS (Future)                             │        │
│  │  ─────────────────────────────────                       │        │
│  │  AWS KMS / Azure Key Vault / GCP Cloud KMS               │        │
│  │  - Key never leaves KMS                                  │        │
│  │  - Automatic key rotation                                │        │
│  │  - Audit trail of key usage                              │        │
│  └─────────────────────────────────────────────────────────┘        │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  MongoDB: Store encrypted blob                           │        │
│  │                                                          │        │
│  │  {                                                       │        │
│  │    vaultId: "vault_abc123",                              │        │
│  │    encryptedConnectionString: "aes256gcm:iv:ciphertext", │        │
│  │    encryptionKeyId: "v1",  // For key rotation           │        │
│  │    ...                                                   │        │
│  │  }                                                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ON FORM SUBMISSION:                                                 │
│  ───────────────────                                                 │
│  1. Load vault entry by vaultId                                      │
│  2. Decrypt connection string in memory                              │
│  3. Connect to target MongoDB                                        │
│  4. Insert document                                                  │
│  5. Close connection (connection string never persisted)             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Connection Vault Schema

```typescript
interface ConnectionVault {
  _id: ObjectId;
  vaultId: string;                    // Public reference ID (e.g., "vault_abc123")

  // Ownership
  organizationId: string;             // Which org owns this
  createdBy: string;                  // User who created it

  // Display info (not sensitive)
  name: string;                       // "Production CRM Database"
  description?: string;

  // Encrypted secret
  encryptedConnectionString: string;  // AES-256-GCM encrypted
  encryptionKeyId: string;            // "v1", "v2" for key rotation

  // Target configuration
  database: string;                   // Default database
  allowedCollections: string[];       // Whitelist of collections

  // Permissions within org
  permissions: {
    userId: string;
    role: 'owner' | 'admin' | 'user';
  }[];

  // Status & monitoring
  status: 'active' | 'disabled' | 'deleted';
  lastTestedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Authentication System

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION PROVIDERS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Google     │  │   GitHub     │  │  Magic Link  │              │
│  │   OAuth 2.0  │  │   OAuth 2.0  │  │   (Email)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └────────────┬────┴────────────────┘                        │
│                      ▼                                               │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │              Unified Auth Handler                        │        │
│  │                                                          │        │
│  │  1. Validate credentials/token                           │        │
│  │  2. Find or create user                                  │        │
│  │  3. Handle org membership                                │        │
│  │  4. Create session                                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                      │                                               │
│                      ▼                                               │
│  ┌──────────────┐    │    ┌──────────────┐                          │
│  │   Passkey    │◄───┴───►│   Session    │                          │
│  │  (Optional)  │         │   Cookie     │                          │
│  └──────────────┘         └──────────────┘                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Form-Level Access Control

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FORM ACCESS CONTROL                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PUBLIC FORM                                                         │
│  ───────────                                                         │
│  accessControl: {                                                    │
│    type: 'public',                                                   │
│    // No authentication required                                     │
│  }                                                                   │
│  → Anyone with URL can submit                                        │
│  → Rate limited: 10 submissions/hour per IP                          │
│                                                                      │
│  AUTHENTICATED FORM                                                  │
│  ──────────────────                                                  │
│  accessControl: {                                                    │
│    type: 'authenticated',                                            │
│    authMethods: ['google', 'github', 'magic-link', 'passkey'],      │
│  }                                                                   │
│  → Must sign in to view/submit                                       │
│  → Respondent identity captured                                      │
│  → Rate limited: 50 submissions/hour per user                        │
│                                                                      │
│  RESTRICTED FORM                                                     │
│  ───────────────                                                     │
│  accessControl: {                                                    │
│    type: 'restricted',                                               │
│    authMethods: ['google', 'magic-link'],                           │
│    allowedDomains: ['acme.com', 'partner.org'],                     │
│    allowedUsers: ['user_123', 'user_456'],                          │
│  }                                                                   │
│  → Must sign in AND match domain/user list                          │
│  → "You don't have access" if not allowed                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### OAuth Configuration

```typescript
// Environment Variables Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

// OAuth callback URLs
// Production: https://forms.yourdomain.com/api/auth/callback/{provider}
// Development: http://localhost:3000/api/auth/callback/{provider}
```

---

## 4. RBAC Permission System

### Permission Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PERMISSION LEVELS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PLATFORM LEVEL (System-wide)                                        │
│  ════════════════════════════                                        │
│  platform:admin    │ Full system access, manage all orgs            │
│  platform:support  │ View users/orgs, read audit logs               │
│                                                                      │
│  ORGANIZATION LEVEL                                                  │
│  ════════════════════════════                                        │
│  org:owner   │ Delete org, manage billing, transfer ownership       │
│  org:admin   │ Manage members, all connections, all forms           │
│  org:member  │ Create forms, use org connections                    │
│  org:viewer  │ View forms & responses (read-only)                   │
│                                                                      │
│  CONNECTION LEVEL (Per vault entry)                                  │
│  ════════════════════════════                                        │
│  connection:owner  │ Edit settings, delete, manage permissions      │
│  connection:admin  │ Edit settings, manage permissions              │
│  connection:user   │ Use in forms (cannot see connection string)    │
│                                                                      │
│  FORM LEVEL (Per form)                                               │
│  ════════════════════════════                                        │
│  form:owner    │ Full control, delete, transfer ownership           │
│  form:editor   │ Edit config, view/delete responses                 │
│  form:analyst  │ View responses, export data                        │
│  form:viewer   │ View form config only                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Resolution

```typescript
// Permission check flow
async function checkPermission(
  userId: string,
  resource: { type: 'org' | 'connection' | 'form'; id: string },
  action: string
): Promise<boolean> {
  // 1. Check platform role (admin bypasses all)
  const user = await getUser(userId);
  if (user.platformRole === 'admin') return true;

  // 2. Get resource's organization
  const orgId = await getResourceOrgId(resource);

  // 3. Check org membership
  const membership = user.organizations.find(o => o.orgId === orgId);
  if (!membership) return false;

  // 4. Check org-level permissions
  if (hasOrgPermission(membership.role, resource.type, action)) return true;

  // 5. Check resource-specific permissions
  const resourcePermissions = await getResourcePermissions(resource);
  const userPermission = resourcePermissions.find(p => p.userId === userId);

  return userPermission && hasResourcePermission(userPermission.role, action);
}
```

---

## 5. Rate Limiting

### Rate Limit Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RATE LIMITS                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PUBLIC FORM SUBMISSIONS                                             │
│  ────────────────────────                                            │
│  Limit: 10 submissions per hour per IP address                       │
│  Window: Sliding 1-hour window                                       │
│  Response: 429 Too Many Requests                                     │
│                                                                      │
│  AUTHENTICATED SUBMISSIONS                                           │
│  ─────────────────────────                                           │
│  Limit: 50 submissions per hour per user                             │
│  Window: Sliding 1-hour window                                       │
│  Response: 429 Too Many Requests                                     │
│                                                                      │
│  API REQUESTS (Form Developers)                                      │
│  ──────────────────────────────                                      │
│  Limit: 1000 requests per hour per user                              │
│  Window: Sliding 1-hour window                                       │
│  Response: 429 Too Many Requests                                     │
│                                                                      │
│  MAGIC LINK REQUESTS                                                 │
│  ───────────────────                                                 │
│  Limit: 5 per hour per email                                         │
│  Window: Sliding 1-hour window                                       │
│  Response: 429 + "Please check your email"                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Rate Limit Schema

```typescript
interface RateLimitEntry {
  _id: ObjectId;
  key: string;              // "ip:192.168.1.1" or "user:user_123"
  resource: string;         // "form_submit", "api", "magic_link"
  count: number;
  windowStart: Date;
  expiresAt: Date;          // TTL index for auto-cleanup
}

// MongoDB TTL index
db.rate_limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 6. Hybrid Submission System

### Submission Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   HYBRID SUBMISSION FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RESPONDENT SUBMITS FORM                                             │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Step 1: Validate & Rate Limit                           │        │
│  │  - Check form exists and is published                    │        │
│  │  - Verify access control                                 │        │
│  │  - Check rate limit                                      │        │
│  └─────────────────────────────────────────────────────────┘        │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Step 2: Save to Platform Database (ALWAYS)              │        │
│  │                                                          │        │
│  │  org_{orgId}.form_submissions.insertOne({                │        │
│  │    submissionId: "sub_xxx",                              │        │
│  │    formId: "form_yyy",                                   │        │
│  │    data: { ... },                                        │        │
│  │    syncStatus: 'pending',  // Key field                  │        │
│  │    syncAttempts: 0,                                      │        │
│  │    submittedAt: new Date()                               │        │
│  │  })                                                      │        │
│  │                                                          │        │
│  │  ✓ Data is NOW SAFE - will not be lost                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Step 3: Attempt Sync to Target MongoDB                  │        │
│  │                                                          │        │
│  │  try {                                                   │        │
│  │    const vault = await getVault(form.dataSource.vaultId);│        │
│  │    const connStr = decrypt(vault.encryptedConnectionString);│     │
│  │    const client = new MongoClient(connStr);              │        │
│  │    await client.db(vault.database)                       │        │
│  │      .collection(form.dataSource.collection)             │        │
│  │      .insertOne(data);                                   │        │
│  │                                                          │        │
│  │    // Update sync status                                 │        │
│  │    await updateSubmission(id, {                          │        │
│  │      syncStatus: 'synced',                               │        │
│  │      syncedAt: new Date()                                │        │
│  │    });                                                   │        │
│  │  } catch (error) {                                       │        │
│  │    // Leave as pending - background job will retry       │        │
│  │    await updateSubmission(id, {                          │        │
│  │      syncStatus: 'pending',                              │        │
│  │      syncError: error.message,                           │        │
│  │      syncAttempts: 1                                     │        │
│  │    });                                                   │        │
│  │  }                                                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  Step 4: Return Success to User                          │        │
│  │                                                          │        │
│  │  { success: true, submissionId: "sub_xxx" }              │        │
│  │                                                          │        │
│  │  User gets confirmation regardless of sync status        │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│                                                                      │
│  BACKGROUND RETRY WORKER (Runs every 5 minutes)                      │
│  ──────────────────────────────────────────────                      │
│                                                                      │
│  1. Find submissions with syncStatus: 'pending'                      │
│  2. For each, attempt sync with exponential backoff                  │
│  3. After 5 failures, mark as 'failed' and alert org admin          │
│  4. Admins can manually retry failed submissions                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Submission Schema

```typescript
interface FormSubmission {
  _id: ObjectId;
  submissionId: string;           // "sub_abc123"
  formId: string;
  formVersion: number;

  // The actual data
  data: Record<string, unknown>;

  // Respondent info
  respondent?: {
    userId?: string;              // If authenticated
    email?: string;
    authMethod?: 'google' | 'github' | 'magic-link' | 'passkey';
  };

  // Request metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
  };

  // Sync status
  syncStatus: 'pending' | 'synced' | 'failed';
  syncAttempts: number;
  syncedAt?: Date;
  syncError?: string;
  lastSyncAttempt?: Date;

  // Timestamps
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Updated Type Definitions

### New Types to Add

```typescript
// src/types/platform.ts

// ============================================
// Organization & Multi-tenancy
// ============================================

export interface Organization {
  _id: ObjectId;
  orgId: string;                      // "org_abc123"
  name: string;
  slug: string;                       // URL-friendly: "acme-corp"

  plan: 'free' | 'pro' | 'enterprise';

  settings: {
    allowedAuthMethods: AuthMethod[];
    defaultFormAccess: AccessControlType;
    dataRetentionDays: number;
    maxForms: number;
    maxSubmissionsPerMonth: number;
  };

  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export type AuthMethod = 'google' | 'github' | 'magic-link' | 'passkey';
export type AccessControlType = 'public' | 'authenticated' | 'restricted';

// ============================================
// User Extensions
// ============================================

export interface PlatformUser {
  _id: ObjectId;
  userId: string;                     // "user_abc123"
  email: string;
  emailVerified: boolean;

  // Profile
  displayName?: string;
  avatarUrl?: string;

  // Platform role (system-wide)
  platformRole?: 'admin' | 'support';

  // Organization memberships
  organizations: {
    orgId: string;
    role: OrgRole;
    joinedAt: Date;
    invitedBy?: string;
  }[];

  // OAuth connections
  oauthConnections: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    connectedAt: Date;
  }[];

  // Existing auth fields
  passkeys?: PasskeyCredential[];
  trustedDevices?: TrustedDevice[];

  createdAt: Date;
  lastLoginAt?: Date;
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// ============================================
// Connection Vault
// ============================================

export interface ConnectionVault {
  _id: ObjectId;
  vaultId: string;                    // "vault_abc123"
  organizationId: string;
  createdBy: string;

  name: string;
  description?: string;

  encryptedConnectionString: string;
  encryptionKeyId: string;

  database: string;
  allowedCollections: string[];

  permissions: {
    userId: string;
    role: 'owner' | 'admin' | 'user';
  }[];

  status: 'active' | 'disabled' | 'deleted';
  lastTestedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Form Access Control
// ============================================

export interface FormAccessControl {
  type: 'public' | 'authenticated' | 'restricted';

  // For authenticated/restricted
  authMethods?: AuthMethod[];

  // For restricted only
  allowedDomains?: string[];          // ["acme.com", "partner.org"]
  allowedUsers?: string[];            // ["user_123", "user_456"]
  allowedEmails?: string[];           // Specific email addresses
}

// ============================================
// Form Permissions
// ============================================

export interface FormPermission {
  userId: string;
  role: 'owner' | 'editor' | 'analyst' | 'viewer';
  grantedAt: Date;
  grantedBy: string;
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitConfig {
  resource: 'form_submit' | 'api' | 'magic_link';
  limit: number;
  windowSeconds: number;
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  public_submit: { resource: 'form_submit', limit: 10, windowSeconds: 3600 },
  auth_submit: { resource: 'form_submit', limit: 50, windowSeconds: 3600 },
  api: { resource: 'api', limit: 1000, windowSeconds: 3600 },
  magic_link: { resource: 'magic_link', limit: 5, windowSeconds: 3600 },
};
```

---

## 8. Environment Variables

```bash
# ============================================
# Database
# ============================================
MONGODB_URI=mongodb+srv://...                    # Platform database
MONGODB_DATABASE=form_builder_platform

# ============================================
# Encryption
# ============================================
SESSION_SECRET=your-32-character-session-secret
VAULT_ENCRYPTION_KEY=base64-encoded-32-byte-key  # Generate with: openssl rand -base64 32

# ============================================
# OAuth Providers
# ============================================
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ============================================
# Magic Link Email
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# ============================================
# WebAuthn (Passkeys)
# ============================================
WEBAUTHN_RP_ID=yourdomain.com                    # localhost for dev
WEBAUTHN_RP_NAME=Form Builder

# ============================================
# Application
# ============================================
NEXT_PUBLIC_APP_URL=https://forms.yourdomain.com
NODE_ENV=production
```

---

## 9. API Routes Structure

```
/api/
├── auth/
│   ├── session/              GET (check), DELETE (logout)
│   ├── magic-link/
│   │   ├── send/             POST
│   │   └── verify/           POST
│   ├── passkey/
│   │   ├── register-options/ POST
│   │   ├── register/         POST
│   │   ├── login-options/    POST
│   │   └── login/            POST
│   └── oauth/
│       ├── [provider]/       GET (initiate)
│       └── callback/
│           └── [provider]/   GET (callback)
│
├── organizations/
│   ├── route.ts              GET (list), POST (create)
│   └── [orgId]/
│       ├── route.ts          GET, PATCH, DELETE
│       ├── members/          GET, POST, DELETE
│       └── invites/          POST
│
├── connections/
│   ├── vault/                POST (create), GET (list)
│   └── vault/[vaultId]/
│       ├── route.ts          GET, PATCH, DELETE
│       ├── test/             POST (test connection)
│       └── permissions/      GET, POST, DELETE
│
├── forms/
│   ├── route.ts              GET (list), POST (create)
│   └── [formId]/
│       ├── route.ts          GET, PATCH, DELETE
│       ├── publish/          POST, DELETE
│       ├── submit/           POST (public submission)
│       ├── submissions/      GET (list), GET [id]
│       ├── permissions/      GET, POST, DELETE
│       └── analytics/        GET
│
└── admin/                    (Platform admins only)
    ├── users/
    ├── organizations/
    └── audit/
```

---

## 10. Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Connection Vault with encryption
- [ ] Organization model and database isolation
- [ ] Updated user model with org memberships
- [ ] Basic RBAC middleware

### Phase 2: Authentication
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Update magic-link for new user model
- [ ] Form-level access control

### Phase 3: Form Publishing
- [ ] Update form schema with dataSource (vaultId)
- [ ] Update submission flow to use vault
- [ ] Hybrid sync/async submission
- [ ] Background retry worker

### Phase 4: Rate Limiting & Security
- [ ] Rate limit middleware
- [ ] IP-based and user-based limits
- [ ] Audit logging

### Phase 5: Admin & Polish
- [ ] Platform admin dashboard
- [ ] Org admin dashboard
- [ ] Analytics and monitoring
- [ ] Documentation
