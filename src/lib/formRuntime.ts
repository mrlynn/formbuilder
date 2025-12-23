/**
 * Form Runtime Engine
 *
 * Handles form state initialization, lifecycle management, and action execution.
 * This is the core runtime that powers form behavior across all modes.
 */

import {
  FormMode,
  FormState,
  FormMeta,
  FormConfiguration,
  FormLifecycle,
  FieldConfig,
  SubmitConfig,
  DeleteConfig,
  ActionSuccessConfig,
  ActionErrorConfig,
} from '@/types/form';
import { evaluateFormula } from '@/utils/computedFields';

// ============================================
// State Initialization
// ============================================

/**
 * Create initial form state based on mode
 */
export function createFormState(
  config: FormConfiguration,
  mode: FormMode,
  existingData?: Record<string, any>,
  documentId?: string
): FormState {
  const isNew = mode === 'create' || mode === 'clone';

  // Initialize values based on mode
  let values: Record<string, any> = {};
  let initialValues: Record<string, any> = {};

  if (mode === 'create') {
    // Apply defaults only in create mode
    values = applyDefaults(config.fieldConfigs, config.lifecycle?.create?.defaults);
    initialValues = { ...values };
  } else if (mode === 'edit' || mode === 'view') {
    // Hydrate from existing data - no defaults
    values = existingData ? { ...existingData } : {};
    initialValues = { ...values };
  } else if (mode === 'clone') {
    // Clone: copy existing data but clear specified fields
    values = existingData ? { ...existingData } : {};
    const clearFields = config.lifecycle?.clone?.clearFields || [];
    clearFields.forEach(field => {
      delete values[field];
    });
    // Apply defaults for cleared fields
    values = applyDefaults(config.fieldConfigs, config.lifecycle?.create?.defaults, values);
    initialValues = { ...values };
  }

  // Compute derived values
  const derived = computeDerivedValues(config.fieldConfigs, values);

  return {
    values,
    initialValues,
    errors: {},
    touched: {},
    meta: {
      mode,
      isNew,
      documentId: isNew ? undefined : documentId,
      isSubmitting: false,
      isValidating: false,
      isDirty: false,
      submitCount: 0,
    },
    derived,
  };
}

/**
 * Apply default values to empty fields
 */
function applyDefaults(
  fieldConfigs: FieldConfig[],
  lifecycleDefaults?: Record<string, any>,
  existingValues: Record<string, any> = {}
): Record<string, any> {
  const values = { ...existingValues };

  // First, apply field-level defaults
  for (const field of fieldConfigs) {
    if (field.defaultValue !== undefined && values[field.path] === undefined) {
      values[field.path] = field.defaultValue;
    }
  }

  // Then, apply lifecycle-level defaults (these take precedence for undefined values)
  if (lifecycleDefaults) {
    for (const [path, defaultValue] of Object.entries(lifecycleDefaults)) {
      if (values[path] === undefined) {
        values[path] = defaultValue;
      }
    }
  }

  return values;
}

/**
 * Compute derived/computed field values
 */
function computeDerivedValues(
  fieldConfigs: FieldConfig[],
  values: Record<string, any>
): Record<string, any> {
  const derived: Record<string, any> = {};

  for (const field of fieldConfigs) {
    if (field.computed) {
      const result = evaluateFormula(field.computed.formula, values, fieldConfigs);
      if (result !== null) {
        derived[field.path] = result;
      }
    }
  }

  return derived;
}

// ============================================
// Field Behavior by Mode
// ============================================

/**
 * Check if a field is visible in the current mode
 */
export function isFieldVisible(field: FieldConfig, mode: FormMode): boolean {
  if (!field.modeConfig?.visibleIn) {
    return true; // Visible by default
  }
  return field.modeConfig.visibleIn.includes(mode);
}

/**
 * Check if a field is editable in the current mode
 */
export function isFieldEditable(
  field: FieldConfig,
  mode: FormMode,
  lifecycle?: FormLifecycle
): boolean {
  // View mode is always read-only
  if (mode === 'view') return false;

  // Check if field is in immutableFields for edit mode
  if (mode === 'edit' && lifecycle?.edit?.immutableFields?.includes(field.path)) {
    return false;
  }

  // Check field-level mode config
  if (field.modeConfig?.editableIn) {
    return field.modeConfig.editableIn.includes(mode);
  }

  return true; // Editable by default in create/edit/clone
}

/**
 * Check if a field is required in the current mode
 */
export function isFieldRequired(field: FieldConfig, mode: FormMode): boolean {
  if (field.modeConfig?.requiredIn) {
    return field.modeConfig.requiredIn.includes(mode);
  }
  return field.required;
}

// ============================================
// State Updates
// ============================================

/**
 * Update form state when a field value changes
 */
export function updateFormState(
  state: FormState,
  fieldPath: string,
  value: any,
  fieldConfigs: FieldConfig[]
): FormState {
  const newValues = { ...state.values, [fieldPath]: value };
  const newTouched = { ...state.touched, [fieldPath]: true };

  // Recompute derived values
  const derived = computeDerivedValues(fieldConfigs, newValues);

  // Check if dirty
  const isDirty = !isEqual(newValues, state.initialValues);

  return {
    ...state,
    values: newValues,
    touched: newTouched,
    derived,
    meta: {
      ...state.meta,
      isDirty,
    },
  };
}

/**
 * Simple deep equality check
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => isEqual(a[key], b[key]));
}

// ============================================
// Validation
// ============================================

/**
 * Validate all fields and return errors
 */
export function validateForm(
  state: FormState,
  fieldConfigs: FieldConfig[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  const mode = state.meta.mode;

  for (const field of fieldConfigs) {
    // Skip validation for fields not visible in this mode
    if (!isFieldVisible(field, mode)) continue;

    const value = state.values[field.path];
    const required = isFieldRequired(field, mode);

    // Required check
    if (required && (value === undefined || value === null || value === '')) {
      errors[field.path] = `${field.label} is required`;
      continue;
    }

    // Validation rules
    if (field.validation && value !== undefined && value !== null && value !== '') {
      const { min, max, minLength, maxLength, pattern } = field.validation;

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          errors[field.path] = `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          errors[field.path] = `${field.label} must be at most ${max}`;
        }
      }

      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) {
          errors[field.path] = `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength !== undefined && value.length > maxLength) {
          errors[field.path] = `${field.label} must be at most ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          errors[field.path] = `${field.label} format is invalid`;
        }
      }
    }
  }

  return errors;
}

// ============================================
// Document Preparation
// ============================================

/**
 * Prepare document for submission based on config
 */
export function prepareDocument(
  state: FormState,
  fieldConfigs: FieldConfig[],
  submitConfig?: SubmitConfig
): Record<string, any> {
  let document: Record<string, any> = {};

  // Include only fields that should be in document
  for (const field of fieldConfigs) {
    if (field.includeInDocument === false) continue;
    if (field.computed) continue; // Don't include computed fields (they're derived)

    const value = state.values[field.path];
    if (value !== undefined) {
      setNestedValue(document, field.path, value);
    }
  }

  // Apply transforms
  if (submitConfig?.transforms) {
    const { omitFields, renameFields, addFields } = submitConfig.transforms;

    // Remove omitted fields
    if (omitFields) {
      for (const path of omitFields) {
        deleteNestedValue(document, path);
      }
    }

    // Rename fields
    if (renameFields) {
      for (const [oldPath, newPath] of Object.entries(renameFields)) {
        const value = getNestedValue(document, oldPath);
        if (value !== undefined) {
          deleteNestedValue(document, oldPath);
          setNestedValue(document, newPath, value);
        }
      }
    }

    // Add static fields
    if (addFields) {
      for (const [path, value] of Object.entries(addFields)) {
        setNestedValue(document, path, value);
      }
    }
  }

  return document;
}

// Nested value utilities
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  target[lastKey] = value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function deleteNestedValue(obj: any, path: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, key) => acc?.[key], obj);
  if (target) delete target[lastKey];
}

// ============================================
// Action Execution
// ============================================

/**
 * Get submit configuration for current mode
 */
export function getSubmitConfig(
  lifecycle: FormLifecycle | undefined,
  mode: FormMode
): SubmitConfig | undefined {
  switch (mode) {
    case 'create':
      return lifecycle?.create?.onSubmit;
    case 'edit':
      return lifecycle?.edit?.onSubmit;
    case 'clone':
      return lifecycle?.clone?.onSubmit;
    default:
      return undefined;
  }
}

/**
 * Get delete configuration (only available in edit mode)
 */
export function getDeleteConfig(
  lifecycle: FormLifecycle | undefined,
  mode: FormMode
): DeleteConfig | undefined {
  if (mode !== 'edit') return undefined;
  return lifecycle?.edit?.onDelete;
}

/**
 * Default lifecycle configuration
 */
export function getDefaultLifecycle(collection: string): FormLifecycle {
  return {
    create: {
      onSubmit: {
        mode: 'insert',
        collection,
        success: {
          action: 'toast',
          message: 'Document created successfully',
        },
        error: {
          action: 'toast',
        },
      },
    },
    edit: {
      onSubmit: {
        mode: 'update',
        collection,
        success: {
          action: 'toast',
          message: 'Document updated successfully',
        },
        error: {
          action: 'toast',
        },
      },
      onDelete: {
        enabled: true,
        confirm: {
          title: 'Delete Document',
          message: 'Are you sure you want to delete this document? This action cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        },
        success: {
          action: 'navigate',
          target: 'back',
          message: 'Document deleted successfully',
        },
        error: {
          action: 'toast',
        },
      },
    },
    view: {
      actions: [
        { id: 'edit', label: 'Edit', action: 'edit' },
        { id: 'clone', label: 'Clone', action: 'clone' },
      ],
    },
    clone: {
      clearFields: ['_id', 'createdAt', 'updatedAt'],
      onSubmit: {
        mode: 'insert',
        collection,
        success: {
          action: 'toast',
          message: 'Document cloned successfully',
        },
        error: {
          action: 'toast',
        },
      },
    },
  };
}
