// Authentication Types

export interface User {
  _id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // User preferences
  displayName?: string;
  avatarUrl?: string;

  // Passkey credentials
  passkeys?: PasskeyCredential[];

  // Trusted devices
  trustedDevices?: TrustedDevice[];
}

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: AuthenticatorTransport[];
  createdAt: Date;
  lastUsedAt?: Date;
  friendlyName?: string;
}

export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid';

export interface TrustedDevice {
  id: string;
  fingerprint: string;
  userAgent: string;
  ipAddress?: string;
  location?: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export interface MagicLink {
  _id: string;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Session {
  userId: string;
  email: string;
  deviceId?: string;
  isPasskeyAuth?: boolean;
  createdAt: Date;
  expiresAt: Date;
}

// API Request/Response types
export interface SendMagicLinkRequest {
  email: string;
}

export interface SendMagicLinkResponse {
  success: boolean;
  message: string;
}

export interface VerifyMagicLinkRequest {
  token: string;
  trustDevice?: boolean;
}

export interface VerifyMagicLinkResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface PasskeyRegistrationOptionsRequest {
  email: string;
}

export interface PasskeyRegistrationResponse {
  success: boolean;
  message?: string;
}

export interface PasskeyLoginOptionsRequest {
  email?: string;
}

export interface PasskeyLoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPasskey: boolean;
  isTrustedDevice: boolean;
}

// Session configuration
export const SESSION_CONFIG = {
  cookieName: 'mdb_tools_session',
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Magic link configuration
export const MAGIC_LINK_CONFIG = {
  expiresInMinutes: 5,
  maxAttemptsPerHour: 5,
};

// Device trust configuration
export const DEVICE_TRUST_CONFIG = {
  expiresInDays: 30,
  maxDevicesPerUser: 5,
};
