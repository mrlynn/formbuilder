/**
 * Platform Module Index
 *
 * Central export for all platform functionality.
 */

// Database
export * from './db';

// Encryption
export { encrypt, decrypt, generateSecureId, testEncryption, verifyEncryptionConfig } from '../encryption';

// Connection Vault
export * from './connectionVault';

// Organizations
export * from './organizations';

// Users
export * from './users';

// OAuth
export * from './oauth';

// Permissions (RBAC)
export * from './permissions';

// Rate Limiting
export * from './rateLimit';

// Submissions
export * from './submissions';

// Form Access Control
export * from './formAccess';
