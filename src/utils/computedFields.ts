import { FieldConfig, ComputedConfig } from '@/types/form';
import {
  evaluateFormula as evaluateFormulaEngine,
  validateFormula as validateFormulaEngine,
  extractFieldReferences,
  formulaFunctions,
  FormulaFunction,
} from '@/lib/formulaEngine';

// Re-export the formula functions for UI
export { formulaFunctions };
export type { FormulaFunction };

/**
 * Safely evaluate a formula expression with form data
 * Uses the new formula engine with function support
 */
export function evaluateFormula(
  formula: string,
  formData: Record<string, any>,
  allFields: FieldConfig[]
): any {
  const result = evaluateFormulaEngine(formula, formData);
  if (result.success) {
    return result.value;
  }
  console.error('Formula evaluation error:', result.error);
  return null;
}

/**
 * Extract field dependencies from a formula
 */
export function extractDependencies(
  formula: string,
  allFields: FieldConfig[]
): string[] {
  const references = extractFieldReferences(formula);

  // Filter to only include valid field paths
  const validPaths = new Set(allFields.filter(f => f.included).map(f => f.path));

  return references.filter(ref => {
    // Check exact match
    if (validPaths.has(ref)) return true;

    // Check if it's a nested path of a valid field
    for (const path of validPaths) {
      if (ref.startsWith(path + '.')) return true;
    }

    return false;
  });
}

/**
 * Validate a formula expression
 */
export function validateFormula(
  formula: string,
  allFields: FieldConfig[]
): { valid: boolean; error?: string } {
  const result = validateFormulaEngine(formula);
  return {
    valid: result.valid,
    error: result.error,
  };
}

/**
 * Common formula templates organized by category
 */
export const formulaTemplates = [
  // Basic Math
  { name: 'Sum Two Fields', formula: 'fieldA + fieldB', category: 'math', description: 'Add two fields together' },
  { name: 'Product', formula: 'price * quantity', category: 'math', description: 'Multiply two fields' },
  { name: 'Percentage', formula: 'round((part / total) * 100, 2)', category: 'math', description: 'Calculate percentage' },
  { name: 'Average of Fields', formula: 'average(score1, score2, score3)', category: 'math', description: 'Average multiple values' },
  { name: 'Discount Price', formula: 'price - (price * discountPercent / 100)', category: 'math', description: 'Apply percentage discount' },
  { name: 'Tax Calculation', formula: 'round(subtotal * taxRate / 100, 2)', category: 'math', description: 'Calculate tax amount' },
  { name: 'Total with Tax', formula: 'round(subtotal * (1 + taxRate / 100), 2)', category: 'math', description: 'Total including tax' },

  // String Operations
  { name: 'Full Name', formula: 'concat(firstName, " ", lastName)', category: 'string', description: 'Combine name fields' },
  { name: 'Uppercase Name', formula: 'upper(name)', category: 'string', description: 'Convert to uppercase' },
  { name: 'Initials', formula: 'concat(left(firstName, 1), left(lastName, 1))', category: 'string', description: 'Get initials' },
  { name: 'String Length', formula: 'len(description)', category: 'string', description: 'Count characters' },
  { name: 'Email Domain', formula: 'right(email, len(email) - len(replace(email, "@", "")) - 1)', category: 'string', description: 'Extract domain from email' },
  { name: 'Formatted Address', formula: 'concat(street, ", ", city, ", ", state, " ", zip)', category: 'string', description: 'Combine address fields' },

  // Conditional
  { name: 'With Default', formula: 'coalesce(optionalField, "N/A")', category: 'conditional', description: 'Provide default for empty values' },
  { name: 'Status Check', formula: 'if(quantity > 0, "In Stock", "Out of Stock")', category: 'conditional', description: 'Show stock status' },
  { name: 'Price Tier', formula: 'if(total >= 100, "Premium", if(total >= 50, "Standard", "Basic"))', category: 'conditional', description: 'Categorize by amount' },
  { name: 'Age Category', formula: 'if(age >= 18, "Adult", "Minor")', category: 'conditional', description: 'Age-based category' },
  { name: 'Is Empty Check', formula: 'if(isEmpty(notes), "No notes", notes)', category: 'conditional', description: 'Handle empty values' },

  // Date Operations
  { name: 'Current Year', formula: 'year(now())', category: 'date', description: 'Get current year' },
  { name: 'Age from Birthdate', formula: 'dateDiff(now(), birthDate, "years")', category: 'date', description: 'Calculate age' },
  { name: 'Days Until Due', formula: 'dateDiff(dueDate, now(), "days")', category: 'date', description: 'Days remaining' },
  { name: 'Next Month', formula: 'dateAdd(now(), 1, "months")', category: 'date', description: 'Date one month from now' },

  // Array Operations
  { name: 'Item Count', formula: 'count(items)', category: 'array', description: 'Count array items' },
  { name: 'Tags as String', formula: 'join(tags, ", ")', category: 'array', description: 'Join array into text' },
  { name: 'First Item', formula: 'first(items)', category: 'array', description: 'Get first array item' },
  { name: 'Has Admin Role', formula: 'contains(roles, "admin")', category: 'array', description: 'Check if array contains value' },
];

/**
 * Get formula templates grouped by category
 */
export function getTemplatesByCategory(): Record<string, typeof formulaTemplates> {
  const grouped: Record<string, typeof formulaTemplates> = {};

  for (const template of formulaTemplates) {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  }

  return grouped;
}

/**
 * Get all available functions grouped by category
 */
export function getFunctionsByCategory(): Record<string, FormulaFunction[]> {
  const grouped: Record<string, FormulaFunction[]> = {};

  for (const fn of formulaFunctions) {
    if (!grouped[fn.category]) {
      grouped[fn.category] = [];
    }
    grouped[fn.category].push(fn);
  }

  return grouped;
}
