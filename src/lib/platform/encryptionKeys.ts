/**
 * Encryption Key Management Service
 *
 * Manages Data Encryption Keys (DEKs) for MongoDB Queryable Encryption.
 * Keys are stored in a dedicated key vault collection and wrapped using
 * a Customer Master Key (CMK) from the configured KMS provider.
 *
 * Supports:
 * - Local KMS (development only)
 * - AWS KMS
 * - Azure Key Vault
 * - GCP Cloud KMS
 */

import { MongoClient, Binary, ClientEncryption, UUID, Document } from 'mongodb';
import { KMSProvider, CollectionEncryptionConfig } from '@/types/form';

// Type alias for the KMS providers that MongoDB driver expects
type MongoKMSProviders = {
  local?: { key: Buffer };
  aws?: { accessKeyId: string; secretAccessKey: string; sessionToken?: string };
  azure?: { tenantId: string; clientId: string; clientSecret: string };
  gcp?: { email: string; privateKey: string };
};

// ============================================
// Types
// ============================================

export interface KMSProviderCredentials {
  local?: {
    key: Buffer; // 96-byte local master key (dev only)
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
  };
  gcp?: {
    email: string;
    privateKey: string;
  };
}

export interface MasterKeyOptions {
  aws?: {
    key: string; // ARN
    region: string;
  };
  azure?: {
    keyVaultEndpoint: string;
    keyName: string;
  };
  gcp?: {
    projectId: string;
    location: string;
    keyRing: string;
    keyName: string;
  };
}

export interface DataEncryptionKey {
  keyId: string; // UUID for the key
  keyAltName: string; // Human-readable identifier
  organizationId: string; // Owner organization
  formId?: string; // Optional: specific form
  fieldPath?: string; // Optional: specific field
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'rotating' | 'retired';
}

export interface EncryptionKeyMetadata {
  organizationId: string;
  formId?: string;
  purpose: string;
  createdAt: Date;
}

// ============================================
// Environment Configuration
// ============================================

const KEY_VAULT_DB = process.env.QE_KEY_VAULT_DB || 'encryption';
const KEY_VAULT_COLLECTION = process.env.QE_KEY_VAULT_COLLECTION || '__keyVault';
const KEY_VAULT_NAMESPACE = `${KEY_VAULT_DB}.${KEY_VAULT_COLLECTION}`;

/**
 * Get the configured KMS provider from environment
 */
export function getConfiguredKMSProvider(): KMSProvider {
  const provider = process.env.QE_KMS_PROVIDER || 'local';
  if (!['local', 'aws', 'azure', 'gcp'].includes(provider)) {
    throw new Error(`Invalid KMS provider: ${provider}. Must be one of: local, aws, azure, gcp`);
  }
  return provider as KMSProvider;
}

/**
 * Get KMS provider credentials from environment variables
 */
export function getKMSProviderCredentials(): MongoKMSProviders {
  const provider = getConfiguredKMSProvider();

  switch (provider) {
    case 'local': {
      const keyBase64 = process.env.QE_LOCAL_MASTER_KEY;
      if (!keyBase64) {
        throw new Error(
          'QE_LOCAL_MASTER_KEY environment variable is required for local KMS. ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(96).toString(\'base64\'))"'
        );
      }
      const key = Buffer.from(keyBase64, 'base64');
      if (key.length !== 96) {
        throw new Error('QE_LOCAL_MASTER_KEY must be exactly 96 bytes (128 chars base64)');
      }
      return { local: { key } };
    }

    case 'aws': {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const sessionToken = process.env.AWS_SESSION_TOKEN;

      if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for AWS KMS');
      }

      return {
        aws: {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken && { sessionToken }),
        },
      };
    }

    case 'azure': {
      const tenantId = process.env.AZURE_TENANT_ID;
      const clientId = process.env.AZURE_CLIENT_ID;
      const clientSecret = process.env.AZURE_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        throw new Error(
          'AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET are required for Azure Key Vault'
        );
      }

      return {
        azure: {
          tenantId,
          clientId,
          clientSecret,
        },
      };
    }

    case 'gcp': {
      const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GCP_PRIVATE_KEY;

      if (!email || !privateKey) {
        throw new Error('GCP_SERVICE_ACCOUNT_EMAIL and GCP_PRIVATE_KEY are required for GCP Cloud KMS');
      }

      return {
        gcp: {
          email,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        },
      };
    }

    default:
      throw new Error(`Unsupported KMS provider: ${provider}`);
  }
}

/**
 * Get master key options for the configured KMS provider
 */
export function getMasterKeyOptions(config?: CollectionEncryptionConfig): Record<string, any> | undefined {
  const provider = getConfiguredKMSProvider();

  switch (provider) {
    case 'local':
      return undefined; // Local KMS doesn't need master key options

    case 'aws': {
      const keyArn = config?.awsKms?.keyArn || process.env.AWS_KMS_KEY_ARN;
      const region = config?.awsKms?.region || process.env.AWS_KMS_KEY_REGION || 'us-east-1';

      if (!keyArn) {
        throw new Error('AWS KMS key ARN is required (AWS_KMS_KEY_ARN or config.awsKms.keyArn)');
      }

      return {
        aws: {
          key: keyArn,
          region,
        },
      };
    }

    case 'azure': {
      const keyVaultEndpoint =
        config?.azureKms?.keyVaultEndpoint || process.env.AZURE_KEY_VAULT_ENDPOINT;
      const keyName = config?.azureKms?.keyName || process.env.AZURE_KEY_NAME;

      if (!keyVaultEndpoint || !keyName) {
        throw new Error(
          'Azure Key Vault endpoint and key name are required (AZURE_KEY_VAULT_ENDPOINT, AZURE_KEY_NAME)'
        );
      }

      return {
        azure: {
          keyVaultEndpoint,
          keyName,
        },
      };
    }

    case 'gcp': {
      const projectId = config?.gcpKms?.projectId || process.env.GCP_PROJECT_ID;
      const location = config?.gcpKms?.location || process.env.GCP_LOCATION || 'global';
      const keyRing = config?.gcpKms?.keyRing || process.env.GCP_KEY_RING;
      const keyName = config?.gcpKms?.keyName || process.env.GCP_KEY_NAME;

      if (!projectId || !keyRing || !keyName) {
        throw new Error(
          'GCP project ID, key ring, and key name are required (GCP_PROJECT_ID, GCP_KEY_RING, GCP_KEY_NAME)'
        );
      }

      return {
        gcp: {
          projectId,
          location,
          keyRing,
          keyName,
        },
      };
    }

    default:
      return undefined;
  }
}

// ============================================
// Key Vault Operations
// ============================================

/**
 * Ensure the key vault collection exists with proper indexes
 */
export async function ensureKeyVaultCollection(client: MongoClient): Promise<void> {
  const db = client.db(KEY_VAULT_DB);
  const collections = await db.listCollections({ name: KEY_VAULT_COLLECTION }).toArray();

  if (collections.length === 0) {
    await db.createCollection(KEY_VAULT_COLLECTION);
  }

  // Create unique index on keyAltNames for fast lookups
  const collection = db.collection(KEY_VAULT_COLLECTION);
  await collection.createIndex(
    { keyAltNames: 1 },
    {
      unique: true,
      partialFilterExpression: { keyAltNames: { $exists: true } },
    }
  );
}

/**
 * Create a ClientEncryption instance for key operations
 */
export async function createClientEncryption(
  client: MongoClient,
  config?: CollectionEncryptionConfig
): Promise<ClientEncryption> {
  const kmsProviders = getKMSProviderCredentials();

  return new ClientEncryption(client, {
    keyVaultNamespace: KEY_VAULT_NAMESPACE,
    kmsProviders,
  });
}

/**
 * Create a new Data Encryption Key (DEK)
 */
export async function createDataEncryptionKey(
  client: MongoClient,
  organizationId: string,
  keyAltName: string,
  config?: CollectionEncryptionConfig
): Promise<UUID> {
  await ensureKeyVaultCollection(client);

  const clientEncryption = await createClientEncryption(client, config);
  const provider = getConfiguredKMSProvider();
  const masterKeyOptions = getMasterKeyOptions(config);

  const dataKeyId = await clientEncryption.createDataKey(provider, {
    masterKey: masterKeyOptions,
    keyAltNames: [keyAltName],
  });

  console.log(`[EncryptionKeys] Created DEK for org ${organizationId}: ${keyAltName}`);

  return dataKeyId;
}

/**
 * Get or create a DEK for an organization
 */
export async function getOrCreateOrganizationKey(
  client: MongoClient,
  organizationId: string,
  config?: CollectionEncryptionConfig
): Promise<UUID> {
  const keyAltName = `org_${organizationId}_default`;

  // Try to find existing key
  const existingKey = await findKeyByAltName(client, keyAltName);
  if (existingKey) {
    return existingKey;
  }

  // Create new key
  return createDataEncryptionKey(client, organizationId, keyAltName, config);
}

/**
 * Get or create a DEK for a specific form
 */
export async function getOrCreateFormKey(
  client: MongoClient,
  organizationId: string,
  formId: string,
  config?: CollectionEncryptionConfig
): Promise<UUID> {
  const keyAltName = `org_${organizationId}_form_${formId}`;

  // Try to find existing key
  const existingKey = await findKeyByAltName(client, keyAltName);
  if (existingKey) {
    return existingKey;
  }

  // Create new key
  return createDataEncryptionKey(client, organizationId, keyAltName, config);
}

/**
 * Get or create a DEK for a specific field
 */
export async function getOrCreateFieldKey(
  client: MongoClient,
  organizationId: string,
  formId: string,
  fieldPath: string,
  config?: CollectionEncryptionConfig
): Promise<UUID> {
  // Sanitize field path for use in key name
  const sanitizedPath = fieldPath.replace(/[^a-zA-Z0-9_]/g, '_');
  const keyAltName = `org_${organizationId}_form_${formId}_field_${sanitizedPath}`;

  // Try to find existing key
  const existingKey = await findKeyByAltName(client, keyAltName);
  if (existingKey) {
    return existingKey;
  }

  // Create new key
  return createDataEncryptionKey(client, organizationId, keyAltName, config);
}

/**
 * Find a DEK by its alternative name
 */
export async function findKeyByAltName(client: MongoClient, keyAltName: string): Promise<UUID | null> {
  const db = client.db(KEY_VAULT_DB);
  const collection = db.collection(KEY_VAULT_COLLECTION);

  const keyDoc = await collection.findOne({ keyAltNames: keyAltName });
  if (!keyDoc) {
    return null;
  }

  // The _id in key vault is a UUID
  return keyDoc._id as unknown as UUID;
}

/**
 * Find a DEK by its UUID string
 */
export async function findKeyById(client: MongoClient, keyId: string): Promise<UUID | null> {
  const db = client.db(KEY_VAULT_DB);
  const collection = db.collection(KEY_VAULT_COLLECTION);

  try {
    // Search by converting the string to Binary for comparison
    const keyDoc = await collection.findOne({
      _id: { $eq: new UUID(keyId) }
    } as Document);
    if (!keyDoc) {
      return null;
    }
    return keyDoc._id as unknown as UUID;
  } catch {
    return null;
  }
}

/**
 * List all DEKs for an organization
 */
export async function listOrganizationKeys(
  client: MongoClient,
  organizationId: string
): Promise<DataEncryptionKey[]> {
  const db = client.db(KEY_VAULT_DB);
  const collection = db.collection(KEY_VAULT_COLLECTION);

  const prefix = `org_${organizationId}_`;
  const keyDocs = await collection
    .find({
      keyAltNames: { $regex: `^${prefix}` },
    })
    .toArray();

  return keyDocs.map((doc) => ({
    keyId: doc._id.toString(),
    keyAltName: doc.keyAltNames?.[0] || '',
    organizationId,
    createdAt: doc.creationDate || new Date(),
    status: 'active' as const,
  }));
}

/**
 * Rotate a DEK (creates new version, marks old as rotating)
 * Note: Full key rotation requires re-encrypting all data
 */
export async function rotateDataEncryptionKey(
  client: MongoClient,
  organizationId: string,
  keyAltName: string,
  config?: CollectionEncryptionConfig
): Promise<{ oldKeyId: UUID; newKeyId: UUID }> {
  // Find existing key
  const existingKey = await findKeyByAltName(client, keyAltName);
  if (!existingKey) {
    throw new Error(`Key not found: ${keyAltName}`);
  }

  // Create new key with rotated suffix
  const rotatedKeyAltName = `${keyAltName}_rotated_${Date.now()}`;
  const newKeyId = await createDataEncryptionKey(client, organizationId, rotatedKeyAltName, config);

  console.log(`[EncryptionKeys] Rotated key ${keyAltName} -> ${rotatedKeyAltName}`);

  return {
    oldKeyId: existingKey,
    newKeyId,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the key vault namespace
 */
export function getKeyVaultNamespace(): string {
  return KEY_VAULT_NAMESPACE;
}

/**
 * Check if queryable encryption is configured
 */
export function isQueryableEncryptionConfigured(): boolean {
  try {
    getKMSProviderCredentials();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test the encryption configuration
 */
export async function testEncryptionConfig(
  connectionString: string
): Promise<{ success: boolean; error?: string }> {
  let client: MongoClient | null = null;

  try {
    // Verify KMS credentials are available
    getKMSProviderCredentials();

    // Test connection and key vault setup
    client = new MongoClient(connectionString);
    await client.connect();

    await ensureKeyVaultCollection(client);

    // Try to create a test key
    const testKeyAltName = `_test_key_${Date.now()}`;
    const testKey = await createDataEncryptionKey(client, '_test', testKeyAltName);

    // Clean up test key
    const db = client.db(KEY_VAULT_DB);
    const collection = db.collection(KEY_VAULT_COLLECTION);
    await collection.deleteOne({ _id: testKey } as Document);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error testing encryption config',
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Generate a secure key for local KMS (development only)
 */
export function generateLocalMasterKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(96).toString('base64');
}
