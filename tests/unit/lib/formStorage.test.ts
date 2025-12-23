/**
 * Tests for browser-side form storage (localStorage)
 */

import {
  saveFormConfiguration,
  loadAllFormConfigurations,
  loadFormConfiguration,
  deleteFormConfiguration,
  exportFormConfiguration,
  importFormConfiguration,
} from '@/lib/formStorage';
import { FormConfiguration } from '@/types/form';
import { createMockFormConfig, resetCounters } from '../../utils/testUtils';

describe('formStorage (localStorage)', () => {
  let localStorageData: Record<string, string> = {};
  let mockGetItem: jest.Mock;
  let mockSetItem: jest.Mock;

  beforeEach(() => {
    resetCounters();
    localStorageData = {};

    // Create fresh mocks for localStorage
    mockGetItem = jest.fn((key: string) => localStorageData[key] || null);
    mockSetItem = jest.fn((key: string, value: string) => { localStorageData[key] = value; });

    // Replace global localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: jest.fn((key: string) => { delete localStorageData[key]; }),
        clear: jest.fn(() => { localStorageData = {}; }),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });
  });

  // ===========================================
  // saveFormConfiguration tests
  // ===========================================
  describe('saveFormConfiguration', () => {
    it('should save a new form and return its ID', () => {
      const config: FormConfiguration = {
        name: 'Test Form',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
      };

      const id = saveFormConfiguration(config);

      expect(id).toBeDefined();
      expect(id).toContain('form-');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should generate ID if not provided', () => {
      const config: FormConfiguration = {
        name: 'No ID Form',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
      };

      const id = saveFormConfiguration(config);

      expect(id).toMatch(/^form-\d+-[a-z0-9]+$/);
    });

    it('should preserve existing ID', () => {
      const config: FormConfiguration = {
        id: 'existing-id-123',
        name: 'Existing Form',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
      };

      const id = saveFormConfiguration(config);

      expect(id).toBe('existing-id-123');
    });

    it('should set createdAt for new forms', () => {
      const config: FormConfiguration = {
        name: 'New Form',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
      };

      saveFormConfiguration(config);

      const saved = JSON.parse(localStorageData['mongodb-form-configurations'])[0];
      expect(saved.createdAt).toBeDefined();
      expect(new Date(saved.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should update updatedAt on save', () => {
      const config: FormConfiguration = {
        id: 'update-test',
        name: 'Update Test',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      saveFormConfiguration(config);

      const saved = JSON.parse(localStorageData['mongodb-form-configurations'])[0];
      expect(saved.updatedAt).toBeDefined();
      expect(new Date(saved.updatedAt).getTime()).toBeGreaterThan(
        new Date('2024-01-01').getTime()
      );
    });

    it('should update existing form instead of duplicating', () => {
      const config: FormConfiguration = {
        id: 'duplicate-test',
        name: 'Original',
        collection: 'test',
        database: 'testdb',
        fieldConfigs: [],
      };

      saveFormConfiguration(config);
      config.name = 'Updated';
      saveFormConfiguration(config);

      const configs = JSON.parse(localStorageData['mongodb-form-configurations']);
      expect(configs.length).toBe(1);
      expect(configs[0].name).toBe('Updated');
    });
  });

  // ===========================================
  // loadAllFormConfigurations tests
  // ===========================================
  describe('loadAllFormConfigurations', () => {
    it('should return empty array when no forms saved', () => {
      const configs = loadAllFormConfigurations();
      expect(configs).toEqual([]);
    });

    it('should return all saved forms', () => {
      const forms: FormConfiguration[] = [
        createMockFormConfig({ id: 'form-1', name: 'Form 1' }),
        createMockFormConfig({ id: 'form-2', name: 'Form 2' }),
      ];

      localStorageData['mongodb-form-configurations'] = JSON.stringify(forms);

      const configs = loadAllFormConfigurations();

      expect(configs).toHaveLength(2);
      expect(configs.map(c => c.name)).toContain('Form 1');
      expect(configs.map(c => c.name)).toContain('Form 2');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageData['mongodb-form-configurations'] = 'not valid json';

      const configs = loadAllFormConfigurations();

      expect(configs).toEqual([]);
    });
  });

  // ===========================================
  // loadFormConfiguration tests
  // ===========================================
  describe('loadFormConfiguration', () => {
    it('should return null for non-existent form', () => {
      const config = loadFormConfiguration('non-existent');
      expect(config).toBeNull();
    });

    it('should return the correct form by ID', () => {
      const forms: FormConfiguration[] = [
        createMockFormConfig({ id: 'find-me', name: 'Find Me' }),
        createMockFormConfig({ id: 'other', name: 'Other' }),
      ];

      localStorageData['mongodb-form-configurations'] = JSON.stringify(forms);

      const config = loadFormConfiguration('find-me');

      expect(config).not.toBeNull();
      expect(config?.name).toBe('Find Me');
    });

    it('should return null when localStorage is empty', () => {
      const config = loadFormConfiguration('any-id');
      expect(config).toBeNull();
    });
  });

  // ===========================================
  // deleteFormConfiguration tests
  // ===========================================
  describe('deleteFormConfiguration', () => {
    it('should return false when form not found', () => {
      const result = deleteFormConfiguration('non-existent');
      expect(result).toBe(false);
    });

    it('should delete the form and return true', () => {
      const forms: FormConfiguration[] = [
        createMockFormConfig({ id: 'delete-me', name: 'Delete Me' }),
        createMockFormConfig({ id: 'keep-me', name: 'Keep Me' }),
      ];

      localStorageData['mongodb-form-configurations'] = JSON.stringify(forms);

      const result = deleteFormConfiguration('delete-me');

      expect(result).toBe(true);

      const remaining = JSON.parse(localStorageData['mongodb-form-configurations']);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('keep-me');
    });

    it('should handle deleting last form', () => {
      const forms: FormConfiguration[] = [
        createMockFormConfig({ id: 'only-form', name: 'Only Form' }),
      ];

      localStorageData['mongodb-form-configurations'] = JSON.stringify(forms);

      const result = deleteFormConfiguration('only-form');

      expect(result).toBe(true);

      const remaining = JSON.parse(localStorageData['mongodb-form-configurations']);
      expect(remaining).toHaveLength(0);
    });
  });

  // ===========================================
  // exportFormConfiguration tests
  // ===========================================
  describe('exportFormConfiguration', () => {
    it('should export form as formatted JSON string', () => {
      const config = createMockFormConfig({ id: 'export-test', name: 'Export Test' });

      const exported = exportFormConfiguration(config);

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe('export-test');
      expect(parsed.name).toBe('Export Test');
    });

    it('should include all field configs', () => {
      const config = createMockFormConfig({
        id: 'with-fields',
        fieldConfigs: [
          { path: 'field1', label: 'Field 1', type: 'string', included: true, required: true },
          { path: 'field2', label: 'Field 2', type: 'number', included: true, required: false },
        ],
      });

      const exported = exportFormConfiguration(config);
      const parsed = JSON.parse(exported);

      expect(parsed.fieldConfigs).toHaveLength(2);
    });

    it('should produce pretty-printed JSON', () => {
      const config = createMockFormConfig({ name: 'Pretty Print' });

      const exported = exportFormConfiguration(config);

      expect(exported).toContain('\n');
      expect(exported).toContain('  ');
    });
  });

  // ===========================================
  // importFormConfiguration tests
  // ===========================================
  describe('importFormConfiguration', () => {
    it('should import valid form JSON', () => {
      const json = JSON.stringify({
        name: 'Imported Form',
        fieldConfigs: [
          { path: 'field1', label: 'Field 1', type: 'string', included: true, required: false },
        ],
      });

      const config = importFormConfiguration(json);

      expect(config.name).toBe('Imported Form');
      expect(config.fieldConfigs).toHaveLength(1);
    });

    it('should throw error for missing name', () => {
      const json = JSON.stringify({
        fieldConfigs: [],
      });

      expect(() => importFormConfiguration(json)).toThrow('Invalid form configuration format');
    });

    it('should throw error for missing fieldConfigs', () => {
      const json = JSON.stringify({
        name: 'No Fields',
      });

      expect(() => importFormConfiguration(json)).toThrow('Invalid form configuration format');
    });

    it('should throw error for non-array fieldConfigs', () => {
      const json = JSON.stringify({
        name: 'Bad Fields',
        fieldConfigs: 'not an array',
      });

      expect(() => importFormConfiguration(json)).toThrow('Invalid form configuration format');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => importFormConfiguration('not json')).toThrow();
    });

    it('should preserve all properties from import', () => {
      const original = createMockFormConfig({
        id: 'preserve-props',
        name: 'Preserve Props',
        description: 'Test description',
        slug: 'test-slug',
        isPublished: true,
        theme: { primaryColor: '#ff0000' },
      });

      const json = JSON.stringify(original);
      const imported = importFormConfiguration(json);

      expect(imported.id).toBe('preserve-props');
      expect(imported.description).toBe('Test description');
      expect(imported.slug).toBe('test-slug');
      expect(imported.isPublished).toBe(true);
      expect(imported.theme?.primaryColor).toBe('#ff0000');
    });
  });
});
