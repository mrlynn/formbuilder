'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { FormDraft } from '@/types/form';

const DATA_DIR = process.env.DATA_DIR || './.data';
const DRAFTS_FILE = 'form-drafts.json';

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

/**
 * Get all drafts for a session
 */
export async function getDrafts(sessionId: string): Promise<FormDraft[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, sessionId, DRAFTS_FILE);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save all drafts for a session
 */
export async function saveDrafts(sessionId: string, drafts: FormDraft[]): Promise<void> {
  await ensureDataDir();
  const sessionDir = path.join(DATA_DIR, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const filePath = path.join(sessionDir, DRAFTS_FILE);
  await fs.writeFile(filePath, JSON.stringify(drafts, null, 2));
}

/**
 * Get a draft for a specific form
 */
export async function getDraftForForm(
  sessionId: string,
  formId: string
): Promise<FormDraft | null> {
  const drafts = await getDrafts(sessionId);
  return drafts.find(d => d.formId === formId) || null;
}

/**
 * Save or update a draft
 */
export async function saveDraft(sessionId: string, draft: FormDraft): Promise<void> {
  const drafts = await getDrafts(sessionId);

  // Find existing draft for this form
  const existingIndex = drafts.findIndex(d => d.formId === draft.formId);

  if (existingIndex >= 0) {
    // Update existing
    drafts[existingIndex] = {
      ...drafts[existingIndex],
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
  } else {
    // Add new draft
    drafts.push({
      ...draft,
      lastSavedAt: new Date().toISOString(),
    });
  }

  await saveDrafts(sessionId, drafts);
}

/**
 * Delete a draft for a specific form
 */
export async function deleteDraft(sessionId: string, formId: string): Promise<boolean> {
  const drafts = await getDrafts(sessionId);
  const initialLength = drafts.length;

  const filteredDrafts = drafts.filter(d => d.formId !== formId);

  if (filteredDrafts.length < initialLength) {
    await saveDrafts(sessionId, filteredDrafts);
    return true;
  }

  return false;
}

/**
 * Clean up expired drafts
 */
export async function cleanExpiredDrafts(sessionId: string): Promise<number> {
  const drafts = await getDrafts(sessionId);
  const now = new Date();

  const validDrafts = drafts.filter(d => {
    if (!d.expiresAt) return true;
    return new Date(d.expiresAt) > now;
  });

  const removedCount = drafts.length - validDrafts.length;

  if (removedCount > 0) {
    await saveDrafts(sessionId, validDrafts);
  }

  return removedCount;
}

// ============================================
// Global drafts (for published forms)
// ============================================

const GLOBAL_DRAFTS_FILE = 'global-form-drafts.json';

/**
 * Get all global drafts
 */
export async function getGlobalDrafts(): Promise<FormDraft[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, GLOBAL_DRAFTS_FILE);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save all global drafts
 */
export async function saveGlobalDrafts(drafts: FormDraft[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, GLOBAL_DRAFTS_FILE);
  await fs.writeFile(filePath, JSON.stringify(drafts, null, 2));
}

/**
 * Get a global draft by form ID and fingerprint/session
 */
export async function getGlobalDraftForForm(
  formId: string,
  identifier: string  // fingerprint or session ID
): Promise<FormDraft | null> {
  const drafts = await getGlobalDrafts();
  return drafts.find(d =>
    d.formId === formId &&
    (d.fingerprint === identifier || d.sessionId === identifier)
  ) || null;
}

/**
 * Save or update a global draft
 */
export async function saveGlobalDraft(draft: FormDraft): Promise<void> {
  const drafts = await getGlobalDrafts();
  const identifier = draft.fingerprint || draft.sessionId;

  // Find existing draft
  const existingIndex = drafts.findIndex(d =>
    d.formId === draft.formId &&
    (d.fingerprint === identifier || d.sessionId === identifier)
  );

  if (existingIndex >= 0) {
    drafts[existingIndex] = {
      ...drafts[existingIndex],
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
  } else {
    drafts.push({
      ...draft,
      lastSavedAt: new Date().toISOString(),
    });
  }

  await saveGlobalDrafts(drafts);
}

/**
 * Delete a global draft
 */
export async function deleteGlobalDraft(
  formId: string,
  identifier: string
): Promise<boolean> {
  const drafts = await getGlobalDrafts();
  const initialLength = drafts.length;

  const filteredDrafts = drafts.filter(d =>
    !(d.formId === formId &&
      (d.fingerprint === identifier || d.sessionId === identifier))
  );

  if (filteredDrafts.length < initialLength) {
    await saveGlobalDrafts(filteredDrafts);
    return true;
  }

  return false;
}

/**
 * Clean up expired global drafts
 */
export async function cleanExpiredGlobalDrafts(): Promise<number> {
  const drafts = await getGlobalDrafts();
  const now = new Date();

  const validDrafts = drafts.filter(d => {
    if (!d.expiresAt) return true;
    return new Date(d.expiresAt) > now;
  });

  const removedCount = drafts.length - validDrafts.length;

  if (removedCount > 0) {
    await saveGlobalDrafts(validDrafts);
  }

  return removedCount;
}
