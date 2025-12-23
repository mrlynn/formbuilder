# MongoDB Queryable Encryption - Implementation Design

## Overview

This document outlines the architecture and implementation plan for integrating MongoDB Queryable Encryption (QE) into the Form Builder application. QE enables client-side encryption of sensitive form fields while maintaining the ability to query encrypted data.

## Use Cases

- **Healthcare Forms**: Encrypt patient names, SSN, medical record numbers
- **Financial Forms**: Encrypt account numbers, tax IDs, salary information
- **HR Forms**: Encrypt personal identifiable information (PII)
- **Customer Forms**: Encrypt credit card numbers, contact details

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Form Builder UI                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Field Config   │  │  Encryption     │  │   Form Preview      │ │
│  │  Panel          │  │  Settings       │  │   (shows 🔒 icons)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Submission Handler                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. Validate form data                                       │   │
│  │  2. Identify encrypted fields from FieldConfig               │   │
│  │  3. Initialize MongoDB Client with Auto Encryption           │   │
│  │  4. Insert document (encryption happens automatically)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Key Management Service                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Local KMS      │  │  AWS KMS        │  │  Azure Key Vault    │ │
│  │  (Development)  │  │  (Production)   │  │  (Production)       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Collection: form_submissions                                │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  {                                                   │    │   │
│  │  │    name: "John Doe",           // plaintext         │    │   │
│  │  │    email: "john@example.com",  // plaintext         │    │   │
│  │  │    ssn: Binary(encrypted),     // ENCRYPTED         │    │   │
│  │  │    salary: Binary(encrypted),  // ENCRYPTED         │    │   │
│  │  │    _formMetadata: { ... }                           │    │   │
│  │  │  }                                                   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Type Definitions & Field Configuration

### 1.1 New Types for Encryption Configuration

Add to `src/types/form.ts`:

```typescript
// ============================================
// Field-Level Encryption Configuration
// ============================================

/**
 * Encryption algorithm types supported by MongoDB Queryable Encryption
 */
export type EncryptionAlgorithm =
  | 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'  // Supports equality queries
  | 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'         // Maximum security, no queries
  | 'Indexed'                                       // QE: Supports equality queries
  | 'Unindexed'                                     // QE: No query support
  | 'Range';                                        // QE: Supports range queries (preview)

/**
 * Query capabilities for encrypted fields
 */
export type EncryptedQueryType =
  | 'none'        // Field cannot be queried (maximum security)
  | 'equality'    // Supports exact match queries only
  | 'range';      // Supports range queries (>, <, between) - QE only

/**
 * Sensitivity level for compliance categorization
 */
export type DataSensitivityLevel =
  | 'public'      // No encryption needed
  | 'internal'    // Low sensitivity, encryption optional
  | 'confidential'// Medium sensitivity, encryption recommended
  | 'restricted'  // High sensitivity (PII, PHI), encryption required
  | 'secret';     // Maximum sensitivity (financial, legal), mandatory encryption

/**
 * Compliance frameworks that may require encryption
 */
export type ComplianceFramework =
  | 'HIPAA'       // Health Insurance Portability and Accountability Act
  | 'PCI-DSS'     // Payment Card Industry Data Security Standard
  | 'GDPR'        // General Data Protection Regulation
  | 'SOC2'        // Service Organization Control 2
  | 'CCPA'        // California Consumer Privacy Act
  | 'FERPA';      // Family Educational Rights and Privacy Act

/**
 * Field-level encryption configuration
 */
export interface FieldEncryptionConfig {
  /**
   * Whether encryption is enabled for this field
   */
  enabled: boolean;

  /**
   * Encryption algorithm to use
   * - 'Indexed': Allows equality queries on encrypted data (recommended)
   * - 'Unindexed': Maximum security, no query support
   * - 'Range': Allows range queries (MongoDB 7.0+)
   */
  algorithm: EncryptionAlgorithm;

  /**
   * What types of queries are allowed on this encrypted field
   */
  queryType: EncryptedQueryType;

  /**
   * Data sensitivity classification
   */
  sensitivityLevel: DataSensitivityLevel;

  /**
   * Compliance frameworks this field falls under
   */
  compliance?: ComplianceFramework[];

  /**
   * Custom key ID for field-specific encryption keys
   * If not specified, uses the collection's default key
   */
  keyId?: string;

  /**
   * Contention factor for indexed encrypted fields (1-8, default 4)
   * Higher values = better insert performance, lower query performance
   */
  contentionFactor?: number;

  /**
   * For range queries: minimum expected value
   */
  rangeMin?: number | Date;

  /**
   * For range queries: maximum expected value
   */
  rangeMax?: number | Date;

  /**
   * Human-readable reason for encryption (for audit purposes)
   */
  encryptionReason?: string;
}

/**
 * Collection-level encryption configuration
 */
export interface CollectionEncryptionConfig {
  /**
   * Whether queryable encryption is enabled for this collection
   */
  enabled: boolean;

  /**
   * KMS provider to use
   */
  kmsProvider: 'local' | 'aws' | 'azure' | 'gcp';

  /**
   * Reference to the encryption key vault
   */
  keyVaultNamespace?: string;  // e.g., "encryption.__keyVault"

  /**
   * Data Encryption Key (DEK) ID for this collection
   */
  dataKeyId?: string;

  /**
   * Whether to automatically create encryption schema
   */
  autoGenerateSchema?: boolean;
}
```

### 1.2 Updated FieldConfig Interface

Extend the existing `FieldConfig` interface:

```typescript
export interface FieldConfig {
  // ... existing properties ...

  /**
   * Field-level encryption settings
   * When enabled, this field's data will be encrypted client-side
   * before being stored in MongoDB
   */
  encryption?: FieldEncryptionConfig;
}
```

### 1.3 Updated FormConfiguration Interface

```typescript
export interface FormConfiguration {
  // ... existing properties ...

  /**
   * Collection-level encryption configuration
   */
  collectionEncryption?: CollectionEncryptionConfig;
}
```

## Phase 2: Key Management Service

### 2.1 Key Vault Architecture

Create `src/lib/platform/encryptionKeys.ts`:

```typescript
/**
 * Encryption Key Management Service
 *
 * Manages Data Encryption Keys (DEKs) for MongoDB Queryable Encryption.
 * Keys are stored in a dedicated key vault collection and wrapped using
 * a Customer Master Key (CMK) from the configured KMS provider.
 */

import { MongoClient, Binary, ClientEncryption } from 'mongodb';

export interface KMSProviderConfig {
  local?: {
    key: Buffer;  // 96-byte local master key (dev only)
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  azure?: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    keyVaultEndpoint: string;
    keyName: string;
  };
  gcp?: {
    email: string;
    privateKey: string;
    projectId: string;
    location: string;
    keyRing: string;
    keyName: string;
  };
}

export interface DataEncryptionKey {
  keyId: string;           // UUID for the key
  keyAltName: string;      // Human-readable identifier
  organizationId: string;  // Owner organization
  formId?: string;         // Optional: specific form
  fieldPath?: string;      // Optional: specific field
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'rotating' | 'retired';
}

/**
 * Create a new Data Encryption Key for an organization
 */
export async function createDataEncryptionKey(
  clientEncryption: ClientEncryption,
  organizationId: string,
  keyAltName: string,
  kmsProvider: string,
  masterKeyOptions?: Record<string, any>
): Promise<Binary> {
  // Implementation details...
}

/**
 * Get or create a DEK for a specific field
 */
export async function getOrCreateFieldKey(
  organizationId: string,
  formId: string,
  fieldPath: string
): Promise<Binary> {
  // Implementation details...
}

/**
 * Rotate an existing DEK (creates new version, marks old as rotating)
 */
export async function rotateDataEncryptionKey(
  organizationId: string,
  keyId: string
): Promise<void> {
  // Implementation details...
}
```

### 2.2 Environment Configuration

Add to `.env.example`:

```bash
# ============================================
# Queryable Encryption Configuration
# ============================================

# KMS Provider: local | aws | azure | gcp
QE_KMS_PROVIDER=local

# Local KMS (Development Only)
# Generate with: node -e "console.log(require('crypto').randomBytes(96).toString('base64'))"
QE_LOCAL_MASTER_KEY=

# AWS KMS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_KMS_KEY_ARN=
AWS_KMS_KEY_REGION=

# Azure Key Vault
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_KEY_VAULT_ENDPOINT=
AZURE_KEY_NAME=

# Key Vault Namespace (where DEKs are stored)
QE_KEY_VAULT_DB=encryption
QE_KEY_VAULT_COLLECTION=__keyVault
```

## Phase 3: MongoDB Client Factory

### 3.1 Encrypted Client Factory

Create `src/lib/platform/encryptedClient.ts`:

```typescript
/**
 * MongoDB Encrypted Client Factory
 *
 * Creates MongoClient instances configured for automatic encryption
 * based on form field configurations.
 */

import { MongoClient, AutoEncryptionOptions } from 'mongodb';

/**
 * Create a MongoDB client configured for automatic field-level encryption
 */
export async function createEncryptedClient(
  connectionString: string,
  organizationId: string,
  formConfig: FormConfiguration
): Promise<MongoClient> {

  // Build encryption schema from field configs
  const encryptionSchema = buildEncryptionSchema(formConfig);

  // Get KMS provider configuration
  const kmsProviders = await getKMSProviders();

  const autoEncryptionOptions: AutoEncryptionOptions = {
    keyVaultNamespace: `${process.env.QE_KEY_VAULT_DB}.${process.env.QE_KEY_VAULT_COLLECTION}`,
    kmsProviders,
    schemaMap: encryptionSchema,
    // For Queryable Encryption (MongoDB 7.0+)
    encryptedFieldsMap: buildEncryptedFieldsMap(formConfig),
  };

  const client = new MongoClient(connectionString, {
    autoEncryption: autoEncryptionOptions,
  });

  return client;
}

/**
 * Build MongoDB encryption schema from form field configurations
 */
function buildEncryptionSchema(
  formConfig: FormConfiguration
): Record<string, any> {
  const { collection, database, fieldConfigs } = formConfig;
  const namespace = `${database}.${collection}`;

  const encryptedFields = fieldConfigs
    .filter(f => f.encryption?.enabled)
    .map(f => ({
      path: f.path,
      bsonType: getBsonType(f.type),
      algorithm: f.encryption!.algorithm,
      keyId: f.encryption!.keyId,
    }));

  if (encryptedFields.length === 0) {
    return {};
  }

  return {
    [namespace]: {
      bsonType: 'object',
      encryptMetadata: {
        keyId: [formConfig.collectionEncryption?.dataKeyId],
      },
      properties: Object.fromEntries(
        encryptedFields.map(f => [
          f.path,
          {
            encrypt: {
              bsonType: f.bsonType,
              algorithm: f.algorithm,
              ...(f.keyId && { keyId: f.keyId }),
            },
          },
        ])
      ),
    },
  };
}

/**
 * Build encrypted fields map for Queryable Encryption
 */
function buildEncryptedFieldsMap(
  formConfig: FormConfiguration
): Record<string, any> {
  const { collection, database, fieldConfigs } = formConfig;
  const namespace = `${database}.${collection}`;

  const fields = fieldConfigs
    .filter(f => f.encryption?.enabled)
    .map(f => {
      const field: any = {
        path: f.path,
        bsonType: getBsonType(f.type),
        queries: [],
      };

      // Add query support based on configuration
      if (f.encryption!.queryType === 'equality') {
        field.queries.push({ queryType: 'equality' });
      } else if (f.encryption!.queryType === 'range') {
        field.queries.push({
          queryType: 'range',
          min: f.encryption!.rangeMin,
          max: f.encryption!.rangeMax,
        });
      }

      if (f.encryption!.contentionFactor) {
        field.queries[0].contention = f.encryption!.contentionFactor;
      }

      return field;
    });

  if (fields.length === 0) {
    return {};
  }

  return {
    [namespace]: { fields },
  };
}

function getBsonType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    short_text: 'string',
    long_text: 'string',
    email: 'string',
    phone: 'string',
    url: 'string',
    number: 'int',
    currency: 'double',
    date: 'date',
    boolean: 'bool',
    // Add more mappings as needed
  };
  return typeMap[fieldType] || 'string';
}
```

## Phase 4: UI Components

### 4.1 Field Encryption Settings Panel

Create `src/components/FormBuilder/FieldEncryptionSettings.tsx`:

```typescript
/**
 * UI component for configuring field-level encryption
 *
 * Appears in the FieldDetailPanel when a field is selected.
 * Allows form builders to:
 * - Enable/disable encryption for the field
 * - Choose encryption algorithm
 * - Set sensitivity level
 * - Configure query capabilities
 */

interface FieldEncryptionSettingsProps {
  fieldConfig: FieldConfig;
  onChange: (encryption: FieldEncryptionConfig | undefined) => void;
  collectionEncryption?: CollectionEncryptionConfig;
}

export function FieldEncryptionSettings({
  fieldConfig,
  onChange,
  collectionEncryption,
}: FieldEncryptionSettingsProps) {
  // Component implementation...
  //
  // Features:
  // - Toggle to enable encryption
  // - Dropdown for algorithm selection
  // - Sensitivity level selector (visual chips)
  // - Compliance framework multi-select
  // - Query capability toggle (equality/range/none)
  // - Warning banners for security implications
  // - Preview of how data will appear in MongoDB
}
```

### 4.2 Visual Indicators

Add encryption indicators throughout the UI:

```typescript
// In CompactFieldList.tsx
// Show 🔒 icon next to encrypted fields

// In FormModeWrapper.tsx (preview)
// Show "Encrypted" badge on sensitive fields

// In DocumentPreview.tsx
// Show "[ENCRYPTED]" placeholder for encrypted values
```

## Phase 5: Submission Handler Integration

### 5.1 Updated Submission Flow

Modify `src/lib/platform/submissions.ts`:

```typescript
export async function createSubmission(
  submission: CreateSubmissionInput
): Promise<PlatformFormSubmission> {
  // ... existing validation ...

  // Check if form has encrypted fields
  const hasEncryptedFields = submission.formConfig.fieldConfigs
    .some(f => f.encryption?.enabled);

  if (hasEncryptedFields) {
    // Use encrypted client for sync
    return createEncryptedSubmission(submission);
  }

  // ... existing non-encrypted flow ...
}

async function createEncryptedSubmission(
  submission: CreateSubmissionInput
): Promise<PlatformFormSubmission> {
  const { formConfig, data, organizationId } = submission;

  // Get vault credentials
  const credentials = await getDecryptedConnectionString(
    organizationId,
    formConfig.dataSource!.vaultId
  );

  if (!credentials) {
    throw new Error('Unable to access encryption credentials');
  }

  // Create encrypted MongoDB client
  const encryptedClient = await createEncryptedClient(
    credentials.connectionString,
    organizationId,
    formConfig
  );

  try {
    await encryptedClient.connect();

    const db = encryptedClient.db(credentials.database);
    const collection = db.collection(formConfig.dataSource!.collection);

    // Insert with automatic encryption
    // MongoDB driver handles encryption transparently
    const result = await collection.insertOne({
      ...data,
      _formMetadata: {
        formId: formConfig.id,
        submittedAt: new Date(),
        encrypted: true,
        encryptedFields: formConfig.fieldConfigs
          .filter(f => f.encryption?.enabled)
          .map(f => f.path),
      },
    });

    // ... create platform submission record ...

  } finally {
    await encryptedClient.close();
  }
}
```

## Phase 6: Search Support for Encrypted Fields

### 6.1 Query Builder for Encrypted Fields

Modify `src/app/api/forms/search/route.ts`:

```typescript
// When building queries for encrypted fields:
// - Only allow supported query types (equality/range)
// - Use encrypted client for queries
// - Document query limitations in UI

function buildMongoQuery(
  filters: Record<string, any>,
  fieldConfigs: FieldConfig[]
): Record<string, any> {
  const query: Record<string, any> = {};

  for (const [fieldPath, filter] of Object.entries(filters)) {
    const fieldConfig = fieldConfigs.find(f => f.path === fieldPath);

    if (fieldConfig?.encryption?.enabled) {
      // Encrypted field - limited query support
      const { queryType } = fieldConfig.encryption;

      if (queryType === 'none') {
        // Skip - field cannot be queried
        console.warn(`Cannot query encrypted field: ${fieldPath}`);
        continue;
      }

      if (queryType === 'equality') {
        // Only exact match supported
        query[fieldPath] = filter.value;
      } else if (queryType === 'range') {
        // Range query with encrypted values
        // MongoDB handles this with Queryable Encryption
        query[fieldPath] = buildRangeQuery(filter);
      }
    } else {
      // Non-encrypted field - full query support
      // ... existing query building logic ...
    }
  }

  return query;
}
```

## Phase 7: Migration & Compatibility

### 7.1 Migration Strategy

For existing forms with sensitive data:

1. **Identify Candidates**: Scan forms for fields that should be encrypted
2. **Create Keys**: Generate DEKs for each organization/form
3. **Migrate Data**: Re-insert existing documents with encryption
4. **Update Forms**: Add encryption config to field definitions
5. **Verify**: Test queries and submissions

### 7.2 Backwards Compatibility

- Forms without encryption config continue to work unchanged
- Encryption is opt-in per field
- Legacy connection strings still supported (no QE)
- Vault-based connections required for QE

## Phase 8: Security Considerations

### 8.1 Key Security

- Master keys never stored in application database
- Use cloud KMS for production (AWS/Azure/GCP)
- Implement key rotation policy
- Audit key access

### 8.2 Access Control

- Only organization admins can enable encryption
- Encryption settings locked after first submission
- Audit log for encryption configuration changes

### 8.3 Compliance

- Log encryption metadata (not encrypted values)
- Support data subject access requests (DSAR)
- Implement right to erasure (key deletion option)

## Implementation Timeline

| Phase | Description | Estimated Effort |
|-------|-------------|------------------|
| 1 | Type definitions & field config | 1-2 days |
| 2 | Key management service | 2-3 days |
| 3 | MongoDB client factory | 2-3 days |
| 4 | UI components | 2-3 days |
| 5 | Submission handler | 2-3 days |
| 6 | Search support | 1-2 days |
| 7 | Migration tools | 2-3 days |
| 8 | Security hardening | 2-3 days |

**Total: 14-22 days**

## Prerequisites

1. **MongoDB Atlas**: M10 or higher cluster (required for QE)
2. **MongoDB Driver**: v6.0+ with encryption support
3. **KMS Provider**: AWS KMS, Azure Key Vault, or GCP Cloud KMS
4. **Node.js**: v18+ (for crypto support)

## Additional Dependencies

```json
{
  "mongodb": "^6.0.0",
  "mongodb-client-encryption": "^6.0.0"
}
```

## References

- [MongoDB Queryable Encryption Documentation](https://www.mongodb.com/docs/manual/core/queryable-encryption/)
- [CSFLE Quick Start](https://www.mongodb.com/docs/manual/core/csfle/quick-start/)
- [Encryption Key Management](https://www.mongodb.com/docs/manual/core/csfle/fundamentals/keys-key-vaults/)
- [Supported Query Types](https://www.mongodb.com/docs/manual/core/queryable-encryption/fundamentals/encrypt-and-query/)
