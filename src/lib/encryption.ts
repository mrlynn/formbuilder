/**
 * Encryption utilities for secure storage of sensitive data
 * Uses AES-256-GCM for authenticated encryption
 *
 * Key Management:
 * - Phase 1: Environment variable (VAULT_ENCRYPTION_KEY)
 * - Phase 2: Cloud KMS integration (AWS KMS, Azure Key Vault, etc.)
 */

import crypto from 'crypto';

// Encryption key ID for key rotation support
const CURRENT_KEY_ID = 'v1';

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Throws if not configured
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.VAULT_ENCRYPTION_KEY;

  if (!keyBase64) {
    throw new Error(
      'VAULT_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  const key = Buffer.from(keyBase64, 'base64');

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `VAULT_ENCRYPTION_KEY must be exactly ${KEY_LENGTH} bytes (256 bits). ` +
      `Got ${key.length} bytes. Generate with: openssl rand -base64 32`
    );
  }

  return key;
}

/**
 * Encrypt a plaintext string
 * Returns format: "keyId:iv:ciphertext:authTag" (all base64)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return formatted string
  return [
    CURRENT_KEY_ID,
    iv.toString('base64'),
    encrypted.toString('base64'),
    authTag.toString('base64'),
  ].join(':');
}

/**
 * Decrypt an encrypted string
 * Expects format: "keyId:iv:ciphertext:authTag"
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [keyId, ivBase64, ciphertextBase64, authTagBase64] = parts;

  // In future, use keyId to look up the correct key for key rotation
  if (keyId !== CURRENT_KEY_ID) {
    throw new Error(`Unknown encryption key ID: ${keyId}. Key rotation not yet implemented.`);
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set auth tag
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Verify that encryption is properly configured
 * Call this at startup to fail fast if misconfigured
 */
export function verifyEncryptionConfig(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test encryption/decryption with a sample value
 * Useful for health checks
 */
export function testEncryption(): { success: boolean; error?: string } {
  try {
    const testValue = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testValue) {
      return { success: false, error: 'Decrypted value does not match original' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown encryption error',
    };
  }
}

/**
 * Generate a new encryption key (for setup instructions)
 * This is NOT used at runtime - just for documentation
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Hash a value for non-reversible storage (e.g., for lookups)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(prefix: string = ''): string {
  const randomPart = crypto.randomBytes(12).toString('base64url');
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}
