/**
 * Comprehensive tests for form runtime engine
 * Tests state initialization, field behavior, validation, and document preparation
 */

import {
  createFormState,
  isFieldVisible,
  isFieldEditable,
  isFieldRequired,
  updateFormState,
  validateForm,
  prepareDocument,
  getSubmitConfig,
  getDeleteConfig,
  getDefaultLifecycle,
} from '@/lib/formRuntime';
import { FormConfiguration, FieldConfig, FormMode, FormLifecycle } from '@/types/form';

// Helper to create a minimal field config
const createField = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
  path: 'field',
  label: 'Field',
  type: 'string',
  included: true,
  required: false,
  ...overrides,
});

// Helper to create a minimal form config
const createFormConfig = (overrides: Partial<FormConfiguration> = {}): FormConfiguration => ({
  id: 'test-form',
  name: 'Test Form',
  fieldConfigs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('Form Runtime Engine', () => {
  // ===========================================
  // createFormState tests
  // ===========================================
  describe('createFormState', () => {
    describe('create mode', () => {
      it('should create initial state with empty values', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name', label: 'Name' }),
            createField({ path: 'email', label: 'Email' }),
          ],
        });

        const state = createFormState(config, 'create');

        expect(state.meta.mode).toBe('create');
        expect(state.meta.isNew).toBe(true);
        expect(state.meta.documentId).toBeUndefined();
        expect(state.meta.isSubmitting).toBe(false);
        expect(state.meta.isDirty).toBe(false);
        expect(state.values).toEqual({});
        expect(state.errors).toEqual({});
        expect(state.touched).toEqual({});
      });

      it('should apply field-level defaults', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'status', defaultValue: 'draft' }),
            createField({ path: 'priority', defaultValue: 1 }),
            createField({ path: 'name' }), // no default
          ],
        });

        const state = createFormState(config, 'create');

        expect(state.values.status).toBe('draft');
        expect(state.values.priority).toBe(1);
        expect(state.values.name).toBeUndefined();
      });

      it('should apply lifecycle-level defaults', () => {
        const config = createFormConfig({
          fieldConfigs: [createField({ path: 'name' })],
          lifecycle: {
            create: {
              defaults: {
                name: 'Default Name',
                createdBy: 'system',
              },
            },
          },
        });

        const state = createFormState(config, 'create');

        expect(state.values.name).toBe('Default Name');
        expect(state.values.createdBy).toBe('system');
      });

      it('should prioritize field defaults over lifecycle defaults', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'status', defaultValue: 'pending' }),
          ],
          lifecycle: {
            create: {
              defaults: {
                status: 'draft',
              },
            },
          },
        });

        const state = createFormState(config, 'create');

        // Field default should be applied first, lifecycle should not override
        expect(state.values.status).toBe('pending');
      });
    });

    describe('edit mode', () => {
      it('should hydrate from existing data without applying defaults', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name', defaultValue: 'Default' }),
            createField({ path: 'email' }),
          ],
        });

        const existingData = { name: 'John', email: 'john@example.com' };
        const state = createFormState(config, 'edit', existingData, 'doc123');

        expect(state.meta.mode).toBe('edit');
        expect(state.meta.isNew).toBe(false);
        expect(state.meta.documentId).toBe('doc123');
        expect(state.values.name).toBe('John');
        expect(state.values.email).toBe('john@example.com');
      });

      it('should not apply defaults even for empty fields', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name', defaultValue: 'Default' }),
          ],
        });

        const state = createFormState(config, 'edit', {});

        expect(state.values.name).toBeUndefined();
      });
    });

    describe('view mode', () => {
      it('should hydrate from existing data', () => {
        const config = createFormConfig({
          fieldConfigs: [createField({ path: 'name' })],
        });

        const existingData = { name: 'John' };
        const state = createFormState(config, 'view', existingData, 'doc123');

        expect(state.meta.mode).toBe('view');
        expect(state.meta.isNew).toBe(false);
        expect(state.values.name).toBe('John');
      });
    });

    describe('clone mode', () => {
      it('should copy existing data', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name' }),
            createField({ path: 'email' }),
          ],
        });

        const existingData = { name: 'John', email: 'john@example.com' };
        const state = createFormState(config, 'clone', existingData);

        expect(state.meta.mode).toBe('clone');
        expect(state.meta.isNew).toBe(true);
        expect(state.meta.documentId).toBeUndefined();
        expect(state.values.name).toBe('John');
        expect(state.values.email).toBe('john@example.com');
      });

      it('should clear specified fields', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name' }),
            createField({ path: '_id' }),
            createField({ path: 'createdAt' }),
          ],
          lifecycle: {
            clone: {
              clearFields: ['_id', 'createdAt'],
            },
          },
        });

        const existingData = { name: 'John', _id: 'doc123', createdAt: '2024-01-01' };
        const state = createFormState(config, 'clone', existingData);

        expect(state.values.name).toBe('John');
        expect(state.values._id).toBeUndefined();
        expect(state.values.createdAt).toBeUndefined();
      });

      it('should apply defaults to cleared fields', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'status', defaultValue: 'draft' }),
          ],
          lifecycle: {
            clone: {
              clearFields: ['status'],
            },
          },
        });

        const existingData = { status: 'published' };
        const state = createFormState(config, 'clone', existingData);

        expect(state.values.status).toBe('draft');
      });
    });

    describe('computed fields', () => {
      it('should compute derived values', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'quantity', defaultValue: 5 }),
            createField({ path: 'price', defaultValue: 10 }),
            createField({
              path: 'total',
              computed: { formula: 'quantity * price' },
            }),
          ],
        });

        const state = createFormState(config, 'create');

        expect(state.derived.total).toBe(50);
      });
    });
  });

  // ===========================================
  // Field behavior tests
  // ===========================================
  describe('isFieldVisible', () => {
    it('should return true when no mode config is defined', () => {
      const field = createField();
      expect(isFieldVisible(field, 'create')).toBe(true);
      expect(isFieldVisible(field, 'edit')).toBe(true);
      expect(isFieldVisible(field, 'view')).toBe(true);
    });

    it('should return true when visibleIn is not defined', () => {
      const field = createField({ modeConfig: {} });
      expect(isFieldVisible(field, 'create')).toBe(true);
    });

    it('should respect visibleIn configuration', () => {
      const field = createField({
        modeConfig: { visibleIn: ['create', 'edit'] },
      });

      expect(isFieldVisible(field, 'create')).toBe(true);
      expect(isFieldVisible(field, 'edit')).toBe(true);
      expect(isFieldVisible(field, 'view')).toBe(false);
      expect(isFieldVisible(field, 'clone')).toBe(false);
    });
  });

  describe('isFieldEditable', () => {
    it('should return false for view mode always', () => {
      const field = createField();
      expect(isFieldEditable(field, 'view')).toBe(false);
    });

    it('should return true by default for create/edit/clone modes', () => {
      const field = createField();
      expect(isFieldEditable(field, 'create')).toBe(true);
      expect(isFieldEditable(field, 'edit')).toBe(true);
      expect(isFieldEditable(field, 'clone')).toBe(true);
    });

    it('should respect immutableFields in edit mode', () => {
      const field = createField({ path: 'email' });
      const lifecycle: FormLifecycle = {
        edit: {
          immutableFields: ['email'],
        },
      };

      expect(isFieldEditable(field, 'edit', lifecycle)).toBe(false);
      expect(isFieldEditable(field, 'create', lifecycle)).toBe(true);
    });

    it('should respect editableIn configuration', () => {
      const field = createField({
        modeConfig: { editableIn: ['create'] },
      });

      expect(isFieldEditable(field, 'create')).toBe(true);
      expect(isFieldEditable(field, 'edit')).toBe(false);
      expect(isFieldEditable(field, 'clone')).toBe(false);
    });
  });

  describe('isFieldRequired', () => {
    it('should use field.required when no mode config', () => {
      const requiredField = createField({ required: true });
      const optionalField = createField({ required: false });

      expect(isFieldRequired(requiredField, 'create')).toBe(true);
      expect(isFieldRequired(optionalField, 'create')).toBe(false);
    });

    it('should respect requiredIn configuration', () => {
      const field = createField({
        required: false,
        modeConfig: { requiredIn: ['create', 'edit'] },
      });

      expect(isFieldRequired(field, 'create')).toBe(true);
      expect(isFieldRequired(field, 'edit')).toBe(true);
      expect(isFieldRequired(field, 'clone')).toBe(false);
      expect(isFieldRequired(field, 'view')).toBe(false);
    });
  });

  // ===========================================
  // updateFormState tests
  // ===========================================
  describe('updateFormState', () => {
    it('should update field value', () => {
      const config = createFormConfig({
        fieldConfigs: [createField({ path: 'name' })],
      });
      const initialState = createFormState(config, 'create');

      const newState = updateFormState(initialState, 'name', 'John', config.fieldConfigs);

      expect(newState.values.name).toBe('John');
      expect(newState.touched.name).toBe(true);
    });

    it('should mark form as dirty when values change', () => {
      const config = createFormConfig({
        fieldConfigs: [createField({ path: 'name' })],
      });
      const initialState = createFormState(config, 'create');

      const newState = updateFormState(initialState, 'name', 'John', config.fieldConfigs);

      expect(newState.meta.isDirty).toBe(true);
    });

    it('should not mark as dirty when value returns to initial', () => {
      const config = createFormConfig({
        fieldConfigs: [createField({ path: 'name', defaultValue: 'Initial' })],
      });
      const initialState = createFormState(config, 'create');

      // Change the value
      let state = updateFormState(initialState, 'name', 'Changed', config.fieldConfigs);
      expect(state.meta.isDirty).toBe(true);

      // Change back to initial
      state = updateFormState(state, 'name', 'Initial', config.fieldConfigs);
      expect(state.meta.isDirty).toBe(false);
    });

    it('should recompute derived values', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'quantity', defaultValue: 1 }),
          createField({ path: 'price', defaultValue: 10 }),
          createField({
            path: 'total',
            computed: { formula: 'quantity * price' },
          }),
        ],
      });
      const initialState = createFormState(config, 'create');
      expect(initialState.derived.total).toBe(10);

      const newState = updateFormState(initialState, 'quantity', 5, config.fieldConfigs);

      expect(newState.derived.total).toBe(50);
    });
  });

  // ===========================================
  // validateForm tests
  // ===========================================
  describe('validateForm', () => {
    it('should return empty errors for valid form', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'name', required: true }),
          createField({ path: 'email' }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values.name = 'John';

      const errors = validateForm(state, config.fieldConfigs);

      expect(errors).toEqual({});
    });

    it('should validate required fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'name', label: 'Name', required: true }),
        ],
      });
      const state = createFormState(config, 'create');

      const errors = validateForm(state, config.fieldConfigs);

      expect(errors.name).toBe('Name is required');
    });

    it('should validate empty string as missing for required fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'name', label: 'Name', required: true }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values.name = '';

      const errors = validateForm(state, config.fieldConfigs);

      expect(errors.name).toBe('Name is required');
    });

    it('should validate min/max for numbers', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({
            path: 'age',
            label: 'Age',
            type: 'number',
            validation: { min: 0, max: 120 },
          }),
        ],
      });
      const state = createFormState(config, 'create');

      state.values.age = -5;
      expect(validateForm(state, config.fieldConfigs).age).toBe('Age must be at least 0');

      state.values.age = 150;
      expect(validateForm(state, config.fieldConfigs).age).toBe('Age must be at most 120');

      state.values.age = 25;
      expect(validateForm(state, config.fieldConfigs)).toEqual({});
    });

    it('should validate minLength/maxLength for strings', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({
            path: 'username',
            label: 'Username',
            validation: { minLength: 3, maxLength: 20 },
          }),
        ],
      });
      const state = createFormState(config, 'create');

      state.values.username = 'ab';
      expect(validateForm(state, config.fieldConfigs).username).toBe('Username must be at least 3 characters');

      state.values.username = 'a'.repeat(25);
      expect(validateForm(state, config.fieldConfigs).username).toBe('Username must be at most 20 characters');

      state.values.username = 'john123';
      expect(validateForm(state, config.fieldConfigs)).toEqual({});
    });

    it('should validate pattern', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({
            path: 'email',
            label: 'Email',
            validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          }),
        ],
      });
      const state = createFormState(config, 'create');

      state.values.email = 'invalid-email';
      expect(validateForm(state, config.fieldConfigs).email).toBe('Email format is invalid');

      state.values.email = 'test@example.com';
      expect(validateForm(state, config.fieldConfigs)).toEqual({});
    });

    it('should skip validation for invisible fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({
            path: 'secret',
            label: 'Secret',
            required: true,
            modeConfig: { visibleIn: ['edit'] },
          }),
        ],
      });
      const state = createFormState(config, 'create');

      const errors = validateForm(state, config.fieldConfigs);

      expect(errors).toEqual({});
    });

    it('should respect mode-specific required fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({
            path: 'approver',
            label: 'Approver',
            modeConfig: { requiredIn: ['edit'] },
          }),
        ],
      });

      let state = createFormState(config, 'create');
      expect(validateForm(state, config.fieldConfigs)).toEqual({});

      state = createFormState(config, 'edit');
      expect(validateForm(state, config.fieldConfigs).approver).toBe('Approver is required');
    });
  });

  // ===========================================
  // prepareDocument tests
  // ===========================================
  describe('prepareDocument', () => {
    it('should include regular fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'name' }),
          createField({ path: 'email' }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values.name = 'John';
      state.values.email = 'john@example.com';

      const doc = prepareDocument(state, config.fieldConfigs);

      expect(doc).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should exclude fields with includeInDocument: false', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'name' }),
          createField({ path: 'tempField', includeInDocument: false }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values.name = 'John';
      state.values.tempField = 'temp';

      const doc = prepareDocument(state, config.fieldConfigs);

      expect(doc).toEqual({ name: 'John' });
    });

    it('should exclude computed fields', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'quantity' }),
          createField({ path: 'total', computed: { formula: 'quantity * 10' } }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values.quantity = 5;

      const doc = prepareDocument(state, config.fieldConfigs);

      expect(doc).toEqual({ quantity: 5 });
      expect(doc.total).toBeUndefined();
    });

    it('should handle nested field paths', () => {
      const config = createFormConfig({
        fieldConfigs: [
          createField({ path: 'user.name' }),
          createField({ path: 'user.email' }),
          createField({ path: 'user.address.city' }),
        ],
      });
      const state = createFormState(config, 'create');
      state.values['user.name'] = 'John';
      state.values['user.email'] = 'john@example.com';
      state.values['user.address.city'] = 'NYC';

      const doc = prepareDocument(state, config.fieldConfigs);

      expect(doc).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com',
          address: {
            city: 'NYC',
          },
        },
      });
    });

    describe('transforms', () => {
      it('should omit specified fields', () => {
        const config = createFormConfig({
          fieldConfigs: [
            createField({ path: 'name' }),
            createField({ path: 'password' }),
          ],
        });
        const state = createFormState(config, 'create');
        state.values.name = 'John';
        state.values.password = 'secret';

        const doc = prepareDocument(state, config.fieldConfigs, {
          transforms: { omitFields: ['password'] },
        });

        expect(doc).toEqual({ name: 'John' });
      });

      it('should rename specified fields', () => {
        const config = createFormConfig({
          fieldConfigs: [createField({ path: 'userName' })],
        });
        const state = createFormState(config, 'create');
        state.values.userName = 'John';

        const doc = prepareDocument(state, config.fieldConfigs, {
          transforms: { renameFields: { userName: 'username' } },
        });

        expect(doc).toEqual({ username: 'John' });
      });

      it('should add static fields', () => {
        const config = createFormConfig({
          fieldConfigs: [createField({ path: 'name' })],
        });
        const state = createFormState(config, 'create');
        state.values.name = 'John';

        const doc = prepareDocument(state, config.fieldConfigs, {
          transforms: {
            addFields: {
              source: 'web-form',
              version: 2,
            },
          },
        });

        expect(doc).toEqual({
          name: 'John',
          source: 'web-form',
          version: 2,
        });
      });
    });
  });

  // ===========================================
  // Lifecycle configuration tests
  // ===========================================
  describe('getSubmitConfig', () => {
    const lifecycle: FormLifecycle = {
      create: {
        onSubmit: {
          mode: 'insert',
          collection: 'users',
        },
      },
      edit: {
        onSubmit: {
          mode: 'update',
          collection: 'users',
        },
      },
      clone: {
        onSubmit: {
          mode: 'insert',
          collection: 'users',
        },
      },
    };

    it('should return create submit config for create mode', () => {
      expect(getSubmitConfig(lifecycle, 'create')?.mode).toBe('insert');
    });

    it('should return edit submit config for edit mode', () => {
      expect(getSubmitConfig(lifecycle, 'edit')?.mode).toBe('update');
    });

    it('should return clone submit config for clone mode', () => {
      expect(getSubmitConfig(lifecycle, 'clone')?.mode).toBe('insert');
    });

    it('should return undefined for view mode', () => {
      expect(getSubmitConfig(lifecycle, 'view')).toBeUndefined();
    });

    it('should return undefined when lifecycle is undefined', () => {
      expect(getSubmitConfig(undefined, 'create')).toBeUndefined();
    });
  });

  describe('getDeleteConfig', () => {
    const lifecycle: FormLifecycle = {
      edit: {
        onDelete: {
          enabled: true,
          confirm: {
            title: 'Delete',
            message: 'Are you sure?',
          },
        },
      },
    };

    it('should return delete config for edit mode', () => {
      expect(getDeleteConfig(lifecycle, 'edit')?.enabled).toBe(true);
    });

    it('should return undefined for non-edit modes', () => {
      expect(getDeleteConfig(lifecycle, 'create')).toBeUndefined();
      expect(getDeleteConfig(lifecycle, 'view')).toBeUndefined();
      expect(getDeleteConfig(lifecycle, 'clone')).toBeUndefined();
    });
  });

  describe('getDefaultLifecycle', () => {
    it('should return default lifecycle for a collection', () => {
      const lifecycle = getDefaultLifecycle('users');

      expect(lifecycle.create?.onSubmit?.mode).toBe('insert');
      expect(lifecycle.create?.onSubmit?.collection).toBe('users');
      expect(lifecycle.edit?.onSubmit?.mode).toBe('update');
      expect(lifecycle.edit?.onDelete?.enabled).toBe(true);
      expect(lifecycle.clone?.clearFields).toContain('_id');
    });
  });
});
