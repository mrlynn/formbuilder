/**
 * Tests for AI Prompt Utilities
 */

import {
  SYSTEM_PROMPTS,
  FIELD_TYPE_HINTS,
  suggestFieldType,
  buildFormGenerationPrompt,
  buildFormulaPrompt,
  buildValidationPrompt,
  buildConditionalLogicPrompt,
  buildFieldSuggestionPrompt,
  buildContentPrompt,
} from '@/lib/ai/prompts';

describe('AI Prompt Utilities', () => {
  // ===========================================
  // SYSTEM_PROMPTS
  // ===========================================
  describe('SYSTEM_PROMPTS', () => {
    it('should have all required system prompts', () => {
      expect(SYSTEM_PROMPTS.formGenerator).toBeDefined();
      expect(SYSTEM_PROMPTS.formulaAssistant).toBeDefined();
      expect(SYSTEM_PROMPTS.validationGenerator).toBeDefined();
      expect(SYSTEM_PROMPTS.conditionalLogicGenerator).toBeDefined();
      expect(SYSTEM_PROMPTS.fieldSuggester).toBeDefined();
      expect(SYSTEM_PROMPTS.contentGenerator).toBeDefined();
    });

    it('should include field type information in formGenerator prompt', () => {
      expect(SYSTEM_PROMPTS.formGenerator).toContain('short_text');
      expect(SYSTEM_PROMPTS.formGenerator).toContain('multiple_choice');
      expect(SYSTEM_PROMPTS.formGenerator).toContain('rating');
    });

    it('should include function list in formulaAssistant prompt', () => {
      expect(SYSTEM_PROMPTS.formulaAssistant).toContain('sum()');
      expect(SYSTEM_PROMPTS.formulaAssistant).toContain('if(');
      expect(SYSTEM_PROMPTS.formulaAssistant).toContain('concat()');
    });

    it('should include operators in conditionalLogicGenerator prompt', () => {
      expect(SYSTEM_PROMPTS.conditionalLogicGenerator).toContain('equals');
      expect(SYSTEM_PROMPTS.conditionalLogicGenerator).toContain('isEmpty');
      expect(SYSTEM_PROMPTS.conditionalLogicGenerator).toContain('greaterThan');
    });
  });

  // ===========================================
  // FIELD_TYPE_HINTS
  // ===========================================
  describe('FIELD_TYPE_HINTS', () => {
    it('should have common field type mappings', () => {
      expect(FIELD_TYPE_HINTS.email).toContain('email');
      expect(FIELD_TYPE_HINTS.phone).toContain('phone');
      expect(FIELD_TYPE_HINTS.date).toContain('date');
      expect(FIELD_TYPE_HINTS.rating).toContain('rating');
    });

    it('should map name to short_text', () => {
      expect(FIELD_TYPE_HINTS.name).toContain('short_text');
    });

    it('should map feedback/comment to long_text', () => {
      expect(FIELD_TYPE_HINTS.feedback).toContain('long_text');
      expect(FIELD_TYPE_HINTS.comment).toContain('long_text');
    });
  });

  // ===========================================
  // suggestFieldType
  // ===========================================
  describe('suggestFieldType', () => {
    it('should suggest email type for email fields', () => {
      expect(suggestFieldType('email')).toBe('email');
      expect(suggestFieldType('Email Address')).toBe('email');
      expect(suggestFieldType('user_email')).toBe('email');
    });

    it('should suggest phone type for phone fields', () => {
      expect(suggestFieldType('phone')).toBe('phone');
      expect(suggestFieldType('Phone Number')).toBe('phone');
      expect(suggestFieldType('contact_phone')).toBe('phone');
    });

    it('should suggest date type for date fields', () => {
      expect(suggestFieldType('date')).toBe('date');
      expect(suggestFieldType('Birthday')).toBe('date');
      expect(suggestFieldType('start_date')).toBe('date');
    });

    it('should suggest rating type for rating fields', () => {
      expect(suggestFieldType('rating')).toBe('rating');
      expect(suggestFieldType('Customer Rating')).toBe('rating');
    });

    it('should suggest long_text for feedback/comment fields', () => {
      expect(suggestFieldType('feedback')).toBe('long_text');
      expect(suggestFieldType('Comments')).toBe('long_text');
      expect(suggestFieldType('Description')).toBe('long_text');
    });

    it('should suggest number type for numeric fields', () => {
      expect(suggestFieldType('age')).toBe('number');
      expect(suggestFieldType('price')).toBe('number');
      expect(suggestFieldType('quantity')).toBe('number');
      expect(suggestFieldType('amount')).toBe('number');
    });

    it('should default to short_text for unknown fields', () => {
      expect(suggestFieldType('random_field')).toBe('short_text');
      expect(suggestFieldType('xyz123')).toBe('short_text');
    });
  });

  // ===========================================
  // buildFormGenerationPrompt
  // ===========================================
  describe('buildFormGenerationPrompt', () => {
    it('should include the user prompt', () => {
      const result = buildFormGenerationPrompt('Create a contact form');
      expect(result).toContain('Create a contact form');
    });

    it('should include industry context when provided', () => {
      const result = buildFormGenerationPrompt('Create a form', {
        industry: 'healthcare',
      });
      expect(result).toContain('Industry/Domain: healthcare');
    });

    it('should include audience context when provided', () => {
      const result = buildFormGenerationPrompt('Create a form', {
        audience: 'patients',
      });
      expect(result).toContain('Target Audience: patients');
    });

    it('should include max fields when provided', () => {
      const result = buildFormGenerationPrompt('Create a form', {
        maxFields: 10,
      });
      expect(result).toContain('Maximum fields: 10');
    });

    it('should include schema when provided', () => {
      const schema = { name: 'string', email: 'string' };
      const result = buildFormGenerationPrompt('Create a form', { schema });
      expect(result).toContain('MongoDB collection schema');
      expect(result).toContain('"name"');
      expect(result).toContain('"email"');
    });

    it('should include JSON response format instructions', () => {
      const result = buildFormGenerationPrompt('Create a form');
      expect(result).toContain('JSON object');
      expect(result).toContain('fieldConfigs');
    });
  });

  // ===========================================
  // buildFormulaPrompt
  // ===========================================
  describe('buildFormulaPrompt', () => {
    const fields = [
      { path: 'price', label: 'Price', type: 'number' },
      { path: 'quantity', label: 'Quantity', type: 'number' },
    ];

    it('should include the description', () => {
      const result = buildFormulaPrompt('Calculate total', fields);
      expect(result).toContain('Calculate total');
    });

    it('should list available fields', () => {
      const result = buildFormulaPrompt('Calculate total', fields);
      expect(result).toContain('price (Price): number');
      expect(result).toContain('quantity (Quantity): number');
    });

    it('should include output type when provided', () => {
      const result = buildFormulaPrompt('Calculate total', fields, 'number');
      expect(result).toContain('Expected output type: number');
    });
  });

  // ===========================================
  // buildValidationPrompt
  // ===========================================
  describe('buildValidationPrompt', () => {
    it('should include field information', () => {
      const result = buildValidationPrompt(
        { path: 'employee_id', label: 'Employee ID', type: 'short_text' },
        'Must be 2 letters followed by 4 digits'
      );
      expect(result).toContain('Employee ID');
      expect(result).toContain('employee_id');
      expect(result).toContain('short_text');
    });

    it('should include requirements description', () => {
      const result = buildValidationPrompt(
        { path: 'code', label: 'Code', type: 'short_text' },
        'Must be alphanumeric'
      );
      expect(result).toContain('Must be alphanumeric');
    });
  });

  // ===========================================
  // buildConditionalLogicPrompt
  // ===========================================
  describe('buildConditionalLogicPrompt', () => {
    const fields = [
      { path: 'status', label: 'Status', type: 'dropdown', options: ['active', 'inactive'] },
      { path: 'age', label: 'Age', type: 'number' },
    ];

    it('should include the action (show/hide)', () => {
      const result = buildConditionalLogicPrompt('Show when active', fields, 'show');
      expect(result).toContain('show');
    });

    it('should include the description', () => {
      const result = buildConditionalLogicPrompt('When status is active', fields, 'show');
      expect(result).toContain('When status is active');
    });

    it('should list available fields with options', () => {
      const result = buildConditionalLogicPrompt('When status is active', fields, 'show');
      expect(result).toContain('status (Status): dropdown');
      expect(result).toContain('options: active, inactive');
      expect(result).toContain('age (Age): number');
    });
  });

  // ===========================================
  // buildFieldSuggestionPrompt
  // ===========================================
  describe('buildFieldSuggestionPrompt', () => {
    const currentFields = [
      { path: 'name', label: 'Name', type: 'short_text' },
      { path: 'email', label: 'Email', type: 'email' },
    ];

    it('should list current fields', () => {
      const result = buildFieldSuggestionPrompt(currentFields, {});
      expect(result).toContain('Name (short_text)');
      expect(result).toContain('Email (email)');
    });

    it('should include form name when provided', () => {
      const result = buildFieldSuggestionPrompt(currentFields, {
        name: 'Contact Form',
      });
      expect(result).toContain('Form Name: Contact Form');
    });

    it('should include form description when provided', () => {
      const result = buildFieldSuggestionPrompt(currentFields, {
        description: 'A simple contact form',
      });
      expect(result).toContain('Description: A simple contact form');
    });

    it('should specify the limit', () => {
      const result = buildFieldSuggestionPrompt(currentFields, {}, 3);
      expect(result).toContain('Suggest 3 additional fields');
    });
  });

  // ===========================================
  // buildContentPrompt
  // ===========================================
  describe('buildContentPrompt', () => {
    it('should include content type', () => {
      const result = buildContentPrompt('label', {});
      expect(result).toContain('label');
    });

    it('should include style', () => {
      const result = buildContentPrompt('description', {}, 'friendly');
      expect(result).toContain('Style: friendly');
    });

    it('should include field context when provided', () => {
      const result = buildContentPrompt('placeholder', {
        fieldPath: 'email',
        fieldType: 'email',
      });
      expect(result).toContain('Field path: email');
      expect(result).toContain('Field type: email');
    });

    it('should include existing content when provided', () => {
      const result = buildContentPrompt('label', {
        existingContent: 'Enter email',
      });
      expect(result).toContain('Current content to improve: "Enter email"');
    });
  });
});
