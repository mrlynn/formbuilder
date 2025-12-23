/**
 * AI Services Index
 *
 * Main entry point for all AI-powered form building features.
 */

// Types
export * from './types';

// Prompts and utilities
export { SYSTEM_PROMPTS, FIELD_TYPE_HINTS, suggestFieldType } from './prompts';

// Form Generator
export { FormGenerator, createFormGenerator } from './formGenerator';

// Formula Assistant
export { FormulaAssistant, createFormulaAssistant } from './formulaAssistant';

// Validation Generator
export {
  ValidationGenerator,
  createValidationGenerator,
  COMMON_PATTERNS,
} from './validationGenerator';

// Conditional Logic Generator
export {
  ConditionalLogicGenerator,
  createConditionalLogicGenerator,
} from './conditionalLogicGenerator';

// ============================================
// Unified AI Service
// ============================================

import { FormGenerator, createFormGenerator } from './formGenerator';
import { FormulaAssistant, createFormulaAssistant } from './formulaAssistant';
import { ValidationGenerator, createValidationGenerator } from './validationGenerator';
import { ConditionalLogicGenerator, createConditionalLogicGenerator } from './conditionalLogicGenerator';

/**
 * Unified AI Service that provides access to all AI capabilities
 */
export class AIService {
  public readonly formGenerator: FormGenerator;
  public readonly formulaAssistant: FormulaAssistant;
  public readonly validationGenerator: ValidationGenerator;
  public readonly conditionalLogicGenerator: ConditionalLogicGenerator;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    this.formGenerator = createFormGenerator(key);
    this.formulaAssistant = createFormulaAssistant(key);
    this.validationGenerator = createValidationGenerator(key);
    this.conditionalLogicGenerator = createConditionalLogicGenerator(key);
  }
}

/**
 * Create a unified AI service instance
 */
export function createAIService(apiKey?: string): AIService {
  return new AIService(apiKey);
}

// Default export for convenience
export default AIService;
