import { FormConfiguration } from '@/types/form';

const STORAGE_KEY = 'mongodb-form-configurations';

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

export function saveFormConfiguration(config: FormConfiguration): string {
  if (!isBrowser) {
    console.warn('saveFormConfiguration called on server side - skipping localStorage');
    return config.id || '';
  }

  const configs = loadAllFormConfigurations();

  // Generate ID if not provided
  if (!config.id) {
    config.id = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  config.updatedAt = new Date().toISOString();
  if (!config.createdAt) {
    config.createdAt = config.updatedAt;
  }

  // Update or add configuration
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    configs.push(config);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  return config.id;
}

export function loadAllFormConfigurations(): FormConfiguration[] {
  if (!isBrowser) {
    // On server side, return empty array - forms are stored in .data/ files
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load form configurations:', error);
    return [];
  }
}

export function loadFormConfiguration(id: string): FormConfiguration | null {
  const configs = loadAllFormConfigurations();
  return configs.find((c) => c.id === id) || null;
}

export function deleteFormConfiguration(id: string): boolean {
  if (!isBrowser) {
    console.warn('deleteFormConfiguration called on server side - skipping localStorage');
    return false;
  }

  const configs = loadAllFormConfigurations();
  const filtered = configs.filter((c) => c.id !== id);

  if (filtered.length === configs.length) {
    return false; // Not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function exportFormConfiguration(config: FormConfiguration): string {
  return JSON.stringify(config, null, 2);
}

export function importFormConfiguration(json: string): FormConfiguration {
  const config = JSON.parse(json);
  // Validate structure
  if (!config.name || !config.fieldConfigs || !Array.isArray(config.fieldConfigs)) {
    throw new Error('Invalid form configuration format');
  }
  return config;
}

