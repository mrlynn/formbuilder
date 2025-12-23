/**
 * Comprehensive tests for conditional logic utility functions
 * Tests all operators and logic combinations
 */

import {
  getNestedValue,
  evaluateCondition,
  evaluateConditionalLogic,
  getOperatorLabel,
  operatorRequiresValue,
  getOperatorsForType,
} from '@/utils/conditionalLogic';
import { FieldCondition, ConditionalLogic, ConditionOperator } from '@/types/form';

describe('conditionalLogic utilities', () => {
  // ===========================================
  // getNestedValue tests
  // ===========================================
  describe('getNestedValue', () => {
    it('should get top-level value', () => {
      const obj = { name: 'John', age: 30 };
      expect(getNestedValue(obj, 'name')).toBe('John');
      expect(getNestedValue(obj, 'age')).toBe(30);
    });

    it('should get nested value with dot notation', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark' },
          },
        },
      };
      expect(getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(getNestedValue(obj, 'user.profile.settings.theme')).toBe('dark');
    });

    it('should return undefined for non-existent paths', () => {
      const obj = { name: 'John' };
      expect(getNestedValue(obj, 'age')).toBeUndefined();
      expect(getNestedValue(obj, 'user.profile.name')).toBeUndefined();
    });

    it('should handle null/undefined intermediate values', () => {
      const obj = { user: null };
      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
    });

    it('should handle empty object', () => {
      expect(getNestedValue({}, 'any.path')).toBeUndefined();
    });

    it('should handle array values', () => {
      const obj = { items: [1, 2, 3] };
      expect(getNestedValue(obj, 'items')).toEqual([1, 2, 3]);
    });
  });

  // ===========================================
  // evaluateCondition tests - all operators
  // ===========================================
  describe('evaluateCondition', () => {
    describe('equals operator', () => {
      it('should return true for matching string values', () => {
        const condition: FieldCondition = { field: 'status', operator: 'equals', value: 'active' };
        expect(evaluateCondition(condition, { status: 'active' })).toBe(true);
      });

      it('should return false for non-matching string values', () => {
        const condition: FieldCondition = { field: 'status', operator: 'equals', value: 'active' };
        expect(evaluateCondition(condition, { status: 'inactive' })).toBe(false);
      });

      it('should return true for matching number values', () => {
        const condition: FieldCondition = { field: 'count', operator: 'equals', value: 5 };
        expect(evaluateCondition(condition, { count: 5 })).toBe(true);
      });

      it('should return true for matching boolean values', () => {
        const condition: FieldCondition = { field: 'enabled', operator: 'equals', value: true };
        expect(evaluateCondition(condition, { enabled: true })).toBe(true);
      });

      it('should handle nested field paths', () => {
        const condition: FieldCondition = { field: 'user.role', operator: 'equals', value: 'admin' };
        expect(evaluateCondition(condition, { user: { role: 'admin' } })).toBe(true);
        expect(evaluateCondition(condition, { user: { role: 'user' } })).toBe(false);
      });
    });

    describe('notEquals operator', () => {
      it('should return true for non-matching values', () => {
        const condition: FieldCondition = { field: 'status', operator: 'notEquals', value: 'active' };
        expect(evaluateCondition(condition, { status: 'inactive' })).toBe(true);
      });

      it('should return false for matching values', () => {
        const condition: FieldCondition = { field: 'status', operator: 'notEquals', value: 'active' };
        expect(evaluateCondition(condition, { status: 'active' })).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should return true for string containing substring (case-insensitive)', () => {
        const condition: FieldCondition = { field: 'email', operator: 'contains', value: 'test' };
        expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
        expect(evaluateCondition(condition, { email: 'TEST@example.com' })).toBe(true);
        expect(evaluateCondition(condition, { email: 'myTest@example.com' })).toBe(true);
      });

      it('should return false for string not containing substring', () => {
        const condition: FieldCondition = { field: 'email', operator: 'contains', value: 'admin' };
        expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(false);
      });

      it('should return true for array containing value', () => {
        const condition: FieldCondition = { field: 'tags', operator: 'contains', value: 'featured' };
        expect(evaluateCondition(condition, { tags: ['new', 'featured', 'sale'] })).toBe(true);
      });

      it('should return false for array not containing value', () => {
        const condition: FieldCondition = { field: 'tags', operator: 'contains', value: 'premium' };
        expect(evaluateCondition(condition, { tags: ['new', 'featured', 'sale'] })).toBe(false);
      });

      it('should return false for non-string/non-array values', () => {
        const condition: FieldCondition = { field: 'count', operator: 'contains', value: '5' };
        expect(evaluateCondition(condition, { count: 5 })).toBe(false);
      });
    });

    describe('notContains operator', () => {
      it('should return true for string not containing substring', () => {
        const condition: FieldCondition = { field: 'email', operator: 'notContains', value: 'spam' };
        expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
      });

      it('should return false for string containing substring', () => {
        const condition: FieldCondition = { field: 'email', operator: 'notContains', value: 'test' };
        expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(false);
      });

      it('should return true for array not containing value', () => {
        const condition: FieldCondition = { field: 'tags', operator: 'notContains', value: 'spam' };
        expect(evaluateCondition(condition, { tags: ['new', 'featured'] })).toBe(true);
      });

      it('should return false for array containing value', () => {
        const condition: FieldCondition = { field: 'tags', operator: 'notContains', value: 'featured' };
        expect(evaluateCondition(condition, { tags: ['new', 'featured'] })).toBe(false);
      });
    });

    describe('greaterThan operator', () => {
      it('should return true for greater values', () => {
        const condition: FieldCondition = { field: 'age', operator: 'greaterThan', value: 18 };
        expect(evaluateCondition(condition, { age: 25 })).toBe(true);
      });

      it('should return false for equal values', () => {
        const condition: FieldCondition = { field: 'age', operator: 'greaterThan', value: 18 };
        expect(evaluateCondition(condition, { age: 18 })).toBe(false);
      });

      it('should return false for lesser values', () => {
        const condition: FieldCondition = { field: 'age', operator: 'greaterThan', value: 18 };
        expect(evaluateCondition(condition, { age: 15 })).toBe(false);
      });

      it('should return false for non-numeric values', () => {
        const condition: FieldCondition = { field: 'value', operator: 'greaterThan', value: 10 };
        expect(evaluateCondition(condition, { value: 'twenty' })).toBe(false);
      });
    });

    describe('lessThan operator', () => {
      it('should return true for lesser values', () => {
        const condition: FieldCondition = { field: 'count', operator: 'lessThan', value: 100 };
        expect(evaluateCondition(condition, { count: 50 })).toBe(true);
      });

      it('should return false for equal values', () => {
        const condition: FieldCondition = { field: 'count', operator: 'lessThan', value: 100 };
        expect(evaluateCondition(condition, { count: 100 })).toBe(false);
      });

      it('should return false for greater values', () => {
        const condition: FieldCondition = { field: 'count', operator: 'lessThan', value: 100 };
        expect(evaluateCondition(condition, { count: 150 })).toBe(false);
      });
    });

    describe('isEmpty operator', () => {
      it('should return true for undefined', () => {
        const condition: FieldCondition = { field: 'optional', operator: 'isEmpty', value: '' };
        expect(evaluateCondition(condition, {})).toBe(true);
      });

      it('should return true for null', () => {
        const condition: FieldCondition = { field: 'optional', operator: 'isEmpty', value: '' };
        expect(evaluateCondition(condition, { optional: null })).toBe(true);
      });

      it('should return true for empty string', () => {
        const condition: FieldCondition = { field: 'name', operator: 'isEmpty', value: '' };
        expect(evaluateCondition(condition, { name: '' })).toBe(true);
      });

      it('should return true for empty array', () => {
        const condition: FieldCondition = { field: 'items', operator: 'isEmpty', value: '' };
        expect(evaluateCondition(condition, { items: [] })).toBe(true);
      });

      it('should return false for non-empty values', () => {
        const condition: FieldCondition = { field: 'name', operator: 'isEmpty', value: '' };
        expect(evaluateCondition(condition, { name: 'John' })).toBe(false);
        expect(evaluateCondition(condition, { name: 0 })).toBe(false);
        expect(evaluateCondition(condition, { name: false })).toBe(false);
      });
    });

    describe('isNotEmpty operator', () => {
      it('should return false for undefined', () => {
        const condition: FieldCondition = { field: 'optional', operator: 'isNotEmpty', value: '' };
        expect(evaluateCondition(condition, {})).toBe(false);
      });

      it('should return true for non-empty values', () => {
        const condition: FieldCondition = { field: 'name', operator: 'isNotEmpty', value: '' };
        expect(evaluateCondition(condition, { name: 'John' })).toBe(true);
        expect(evaluateCondition(condition, { name: 0 })).toBe(true);
      });

      it('should return true for non-empty array', () => {
        const condition: FieldCondition = { field: 'items', operator: 'isNotEmpty', value: '' };
        expect(evaluateCondition(condition, { items: [1, 2, 3] })).toBe(true);
      });
    });

    describe('isTrue operator', () => {
      it('should return true for true boolean', () => {
        const condition: FieldCondition = { field: 'active', operator: 'isTrue', value: '' };
        expect(evaluateCondition(condition, { active: true })).toBe(true);
      });

      it('should return false for false boolean', () => {
        const condition: FieldCondition = { field: 'active', operator: 'isTrue', value: '' };
        expect(evaluateCondition(condition, { active: false })).toBe(false);
      });

      it('should return false for truthy non-boolean values', () => {
        const condition: FieldCondition = { field: 'active', operator: 'isTrue', value: '' };
        expect(evaluateCondition(condition, { active: 1 })).toBe(false);
        expect(evaluateCondition(condition, { active: 'true' })).toBe(false);
      });
    });

    describe('isFalse operator', () => {
      it('should return true for false boolean', () => {
        const condition: FieldCondition = { field: 'disabled', operator: 'isFalse', value: '' };
        expect(evaluateCondition(condition, { disabled: false })).toBe(true);
      });

      it('should return false for true boolean', () => {
        const condition: FieldCondition = { field: 'disabled', operator: 'isFalse', value: '' };
        expect(evaluateCondition(condition, { disabled: true })).toBe(false);
      });
    });

    describe('unknown operator', () => {
      it('should return true for unknown operators', () => {
        const condition: FieldCondition = { field: 'any', operator: 'unknownOp' as ConditionOperator, value: 'x' };
        expect(evaluateCondition(condition, { any: 'value' })).toBe(true);
      });
    });
  });

  // ===========================================
  // evaluateConditionalLogic tests
  // ===========================================
  describe('evaluateConditionalLogic', () => {
    it('should return true when no conditional logic defined', () => {
      expect(evaluateConditionalLogic(undefined, { any: 'data' })).toBe(true);
    });

    it('should return true when conditions array is empty', () => {
      const logic: ConditionalLogic = {
        action: 'show',
        logicType: 'all',
        conditions: [],
      };
      expect(evaluateConditionalLogic(logic, { any: 'data' })).toBe(true);
    });

    describe('show action with all logic (AND)', () => {
      it('should show when all conditions are met', () => {
        const logic: ConditionalLogic = {
          action: 'show',
          logicType: 'all',
          conditions: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            { field: 'country', operator: 'equals', value: 'US' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { age: 25, country: 'US' })).toBe(true);
      });

      it('should hide when any condition is not met', () => {
        const logic: ConditionalLogic = {
          action: 'show',
          logicType: 'all',
          conditions: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            { field: 'country', operator: 'equals', value: 'US' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { age: 15, country: 'US' })).toBe(false);
        expect(evaluateConditionalLogic(logic, { age: 25, country: 'UK' })).toBe(false);
      });
    });

    describe('show action with any logic (OR)', () => {
      it('should show when any condition is met', () => {
        const logic: ConditionalLogic = {
          action: 'show',
          logicType: 'any',
          conditions: [
            { field: 'role', operator: 'equals', value: 'admin' },
            { field: 'role', operator: 'equals', value: 'superuser' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { role: 'admin' })).toBe(true);
        expect(evaluateConditionalLogic(logic, { role: 'superuser' })).toBe(true);
      });

      it('should hide when no conditions are met', () => {
        const logic: ConditionalLogic = {
          action: 'show',
          logicType: 'any',
          conditions: [
            { field: 'role', operator: 'equals', value: 'admin' },
            { field: 'role', operator: 'equals', value: 'superuser' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { role: 'user' })).toBe(false);
      });
    });

    describe('hide action with all logic (AND)', () => {
      it('should hide when all conditions are met', () => {
        const logic: ConditionalLogic = {
          action: 'hide',
          logicType: 'all',
          conditions: [
            { field: 'type', operator: 'equals', value: 'internal' },
            { field: 'status', operator: 'equals', value: 'draft' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { type: 'internal', status: 'draft' })).toBe(false);
      });

      it('should show when any condition is not met', () => {
        const logic: ConditionalLogic = {
          action: 'hide',
          logicType: 'all',
          conditions: [
            { field: 'type', operator: 'equals', value: 'internal' },
            { field: 'status', operator: 'equals', value: 'draft' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { type: 'external', status: 'draft' })).toBe(true);
        expect(evaluateConditionalLogic(logic, { type: 'internal', status: 'published' })).toBe(true);
      });
    });

    describe('hide action with any logic (OR)', () => {
      it('should hide when any condition is met', () => {
        const logic: ConditionalLogic = {
          action: 'hide',
          logicType: 'any',
          conditions: [
            { field: 'blocked', operator: 'isTrue', value: '' },
            { field: 'suspended', operator: 'isTrue', value: '' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { blocked: true, suspended: false })).toBe(false);
        expect(evaluateConditionalLogic(logic, { blocked: false, suspended: true })).toBe(false);
      });

      it('should show when no conditions are met', () => {
        const logic: ConditionalLogic = {
          action: 'hide',
          logicType: 'any',
          conditions: [
            { field: 'blocked', operator: 'isTrue', value: '' },
            { field: 'suspended', operator: 'isTrue', value: '' },
          ],
        };
        expect(evaluateConditionalLogic(logic, { blocked: false, suspended: false })).toBe(true);
      });
    });

    describe('complex nested conditions', () => {
      it('should handle complex real-world scenario', () => {
        const logic: ConditionalLogic = {
          action: 'show',
          logicType: 'all',
          conditions: [
            { field: 'user.age', operator: 'greaterThan', value: 21 },
            { field: 'user.verified', operator: 'isTrue', value: '' },
            { field: 'user.country', operator: 'equals', value: 'US' },
          ],
        };

        expect(evaluateConditionalLogic(logic, {
          user: { age: 25, verified: true, country: 'US' }
        })).toBe(true);

        expect(evaluateConditionalLogic(logic, {
          user: { age: 25, verified: false, country: 'US' }
        })).toBe(false);
      });
    });
  });

  // ===========================================
  // Helper function tests
  // ===========================================
  describe('getOperatorLabel', () => {
    it('should return correct labels for all operators', () => {
      expect(getOperatorLabel('equals')).toBe('equals');
      expect(getOperatorLabel('notEquals')).toBe('does not equal');
      expect(getOperatorLabel('contains')).toBe('contains');
      expect(getOperatorLabel('notContains')).toBe('does not contain');
      expect(getOperatorLabel('greaterThan')).toBe('is greater than');
      expect(getOperatorLabel('lessThan')).toBe('is less than');
      expect(getOperatorLabel('isEmpty')).toBe('is empty');
      expect(getOperatorLabel('isNotEmpty')).toBe('is not empty');
      expect(getOperatorLabel('isTrue')).toBe('is true');
      expect(getOperatorLabel('isFalse')).toBe('is false');
    });
  });

  describe('operatorRequiresValue', () => {
    it('should return true for operators requiring values', () => {
      expect(operatorRequiresValue('equals')).toBe(true);
      expect(operatorRequiresValue('notEquals')).toBe(true);
      expect(operatorRequiresValue('contains')).toBe(true);
      expect(operatorRequiresValue('notContains')).toBe(true);
      expect(operatorRequiresValue('greaterThan')).toBe(true);
      expect(operatorRequiresValue('lessThan')).toBe(true);
    });

    it('should return false for operators not requiring values', () => {
      expect(operatorRequiresValue('isEmpty')).toBe(false);
      expect(operatorRequiresValue('isNotEmpty')).toBe(false);
      expect(operatorRequiresValue('isTrue')).toBe(false);
      expect(operatorRequiresValue('isFalse')).toBe(false);
    });
  });

  describe('getOperatorsForType', () => {
    it('should return boolean operators for boolean type', () => {
      const ops = getOperatorsForType('boolean');
      expect(ops).toEqual(['isTrue', 'isFalse']);
    });

    it('should return numeric operators for number type', () => {
      const ops = getOperatorsForType('number');
      expect(ops).toContain('equals');
      expect(ops).toContain('greaterThan');
      expect(ops).toContain('lessThan');
      expect(ops).not.toContain('contains');
    });

    it('should return array operators for array type', () => {
      const ops = getOperatorsForType('array');
      expect(ops).toContain('contains');
      expect(ops).toContain('notContains');
      expect(ops).toContain('isEmpty');
      expect(ops).not.toContain('equals');
    });

    it('should return string operators for string and default types', () => {
      const stringOps = getOperatorsForType('string');
      const defaultOps = getOperatorsForType('unknown');

      expect(stringOps).toContain('equals');
      expect(stringOps).toContain('contains');
      expect(defaultOps).toEqual(stringOps);
    });
  });
});
