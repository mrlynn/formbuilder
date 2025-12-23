import { SessionOptions } from 'iron-session';
import { FormConfiguration } from '@/types/form';
import { randomBytes } from 'crypto';

export interface SavedConnection {
  id: string;
  name: string;
  connectionString: string;
  defaultDatabase?: string;
  createdAt: number;
  lastUsed: number;
}

export interface SavedForm extends FormConfiguration {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Lightweight session data - only store session ID
// All other data is stored in files keyed by session ID
export interface SessionData {
  sessionId: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'mongodb-pipeline-builder-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

// Helper to ensure session has a unique ID
export function ensureSessionId(session: any): string {
  if (!session.sessionId) {
    session.sessionId = randomBytes(16).toString('hex');
  }
  return session.sessionId;
}
