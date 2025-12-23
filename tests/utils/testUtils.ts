/**
 * Test utilities and helpers for unit and integration tests
 */

import { FormConfiguration, FieldConfig, FormResponse, FormSubmission } from '@/types/form';

// ===========================================
// Form Configuration Factories
// ===========================================

let formIdCounter = 0;
let fieldIdCounter = 0;

/**
 * Create a mock field configuration with sensible defaults
 */
export function createMockField(overrides: Partial<FieldConfig> = {}): FieldConfig {
  fieldIdCounter++;
  return {
    path: `field_${fieldIdCounter}`,
    label: `Field ${fieldIdCounter}`,
    type: 'string',
    included: true,
    required: false,
    ...overrides,
  };
}

/**
 * Create a mock form configuration with sensible defaults
 */
export function createMockFormConfig(overrides: Partial<FormConfiguration> = {}): FormConfiguration {
  formIdCounter++;
  const now = new Date().toISOString();
  return {
    id: `form-${formIdCounter}`,
    name: `Test Form ${formIdCounter}`,
    description: 'A test form',
    collection: 'test_collection',
    database: 'test_db',
    fieldConfigs: [
      createMockField({ path: 'name', label: 'Name', required: true }),
      createMockField({ path: 'email', label: 'Email', type: 'email' }),
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a minimal valid form configuration
 */
export function createMinimalFormConfig(name: string = 'Minimal Form'): FormConfiguration {
  return {
    name,
    collection: 'test',
    database: 'test',
    fieldConfigs: [],
  };
}

// ===========================================
// Response Factories
// ===========================================

let responseIdCounter = 0;

/**
 * Create a mock form response
 */
export function createMockResponse(overrides: Partial<FormResponse> = {}): FormResponse {
  responseIdCounter++;
  return {
    _id: `response-${responseIdCounter}`,
    formId: 'test-form',
    formVersion: 1,
    data: {},
    status: 'submitted',
    submittedAt: new Date(),
    metadata: {
      deviceType: 'desktop',
    },
    ...overrides,
  };
}

/**
 * Create a mock form submission
 */
export function createMockSubmission(overrides: Partial<FormSubmission> = {}): FormSubmission {
  responseIdCounter++;
  return {
    id: `submission-${responseIdCounter}`,
    formId: 'test-form',
    formName: 'Test Form',
    data: {},
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ===========================================
// Date Helpers
// ===========================================

/**
 * Create a date offset from now
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Create a date offset from now
 */
export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Format date as ISO string for consistent testing
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ===========================================
// Mock Helpers
// ===========================================

/**
 * Create a mock localStorage implementation
 */
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

/**
 * Create a mock Request object for API testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return new Request(urlObj.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ===========================================
// Assertion Helpers
// ===========================================

/**
 * Assert that an object has all required properties
 */
export function assertHasProperties<T>(obj: T, properties: (keyof T)[]): void {
  properties.forEach(prop => {
    if (!(prop in (obj as any))) {
      throw new Error(`Expected object to have property: ${String(prop)}`);
    }
  });
}

/**
 * Assert that a date is within a range
 */
export function assertDateWithinRange(date: Date, start: Date, end: Date): void {
  const time = date.getTime();
  if (time < start.getTime() || time > end.getTime()) {
    throw new Error(
      `Expected date ${date.toISOString()} to be between ${start.toISOString()} and ${end.toISOString()}`
    );
  }
}

/**
 * Assert that a value is approximately equal (for floating point comparisons)
 */
export function assertApproxEqual(actual: number, expected: number, precision: number = 2): void {
  const factor = Math.pow(10, precision);
  const roundedActual = Math.round(actual * factor) / factor;
  const roundedExpected = Math.round(expected * factor) / factor;

  if (roundedActual !== roundedExpected) {
    throw new Error(`Expected ${actual} to be approximately equal to ${expected}`);
  }
}

// ===========================================
// Reset Functions
// ===========================================

/**
 * Reset all counters (call in beforeEach)
 */
export function resetCounters(): void {
  formIdCounter = 0;
  fieldIdCounter = 0;
  responseIdCounter = 0;
}

// ===========================================
// Async Helpers
// ===========================================

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function until it succeeds or times out
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 100 } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delay * attempt);
      }
    }
  }

  throw lastError;
}
