/**
 * Question Types Module
 *
 * This module provides a comprehensive question type system for the form builder.
 *
 * Architecture:
 * - Types: TypeScript definitions for all question types
 * - Registry: Central registry for type metadata, defaults, and schemas
 * - Renderers: React components for rendering questions
 * - AttributeEditor: Dynamic editor for question-specific attributes
 *
 * Usage:
 * ```tsx
 * import { QuestionRenderer, AttributeEditor, questionTypeRegistry } from '@/components/QuestionTypes';
 *
 * // Render a question
 * <QuestionRenderer question={question} value={value} onChange={handleChange} />
 *
 * // Edit question attributes
 * <AttributeEditor question={question} onChange={handleAttributesChange} />
 *
 * // Create a new question
 * const newQuestion = questionTypeRegistry.create('rating', { label: 'How satisfied are you?' });
 *
 * // Get all question types by category
 * const categories = questionTypeRegistry.getByCategory();
 * ```
 */

// Core renderer and registry
export {
  QuestionRenderer,
  registerRenderer,
  getRenderer,
  hasRenderer,
  withQuestionWrapper,
  useQuestionState,
} from './QuestionRenderer';
export type { QuestionRendererProps, QuestionRendererComponent } from './QuestionRenderer';

// Attribute editor
export { AttributeEditor } from './AttributeEditor';
export type { AttributeEditorProps } from './AttributeEditor';

// Individual renderers (auto-register on import)
export { RatingRenderer } from './renderers/RatingRenderer';
export { ScaleRenderer } from './renderers/ScaleRenderer';
export { MultipleChoiceRenderer } from './renderers/MultipleChoiceRenderer';
export { NPSRenderer } from './renderers/NPSRenderer';

// Re-export types
export type {
  Question,
  QuestionTypeId,
  QuestionCategory,
  BaseQuestion,
  QuestionValidation,
  QuestionModeConfig,
  ConditionalLogic,
  FieldCondition,
  AttributeSchema,
  QuestionTypeMetadata,
  QuestionTypeRegistryEntry,
  ValidationResult,
  // Individual question types
  ShortTextQuestion,
  LongTextQuestion,
  NumberQuestion,
  EmailQuestion,
  PhoneQuestion,
  UrlQuestion,
  MultipleChoiceQuestion,
  CheckboxesQuestion,
  DropdownQuestion,
  YesNoQuestion,
  RatingQuestion,
  ScaleQuestion,
  SliderQuestion,
  NpsQuestion,
  OpinionScaleQuestion,
  DateQuestion,
  TimeQuestion,
  DateTimeQuestion,
  FileUploadQuestion,
  ImageUploadQuestion,
  SignatureQuestion,
  MatrixQuestion,
  RankingQuestion,
  AddressQuestion,
  TagsQuestion,
  ColorPickerQuestion,
  PaymentQuestion,
  ChoiceOption,
  LookupConfig,
  // Type guards
  isShortTextQuestion,
  isMultipleChoiceQuestion,
  isRatingQuestion,
  isScaleQuestion,
  isDateQuestion,
  isFileUploadQuestion,
  isMatrixQuestion,
  createTypeGuard,
  // Utility types
  QuestionAttributes,
  QuestionTypeMap,
  QuestionByType,
} from '@/types/questionTypes';

// Re-export registry
export {
  questionTypeRegistry,
  createQuestion,
  getDefaultAttributes,
  getQuestionTypeMetadata,
  getQuestionTypesByCategory,
  searchQuestionTypes,
  validateQuestion,
  defaultAttributes,
  attributeSchemas,
  questionTypeMetadata,
} from '@/lib/questionTypes/registry';

// Re-export schema utilities
export {
  baseQuestionSchema,
  attributeSchemas as mongoDbAttributeSchemas,
  createQuestionIndexes,
  createQuestionsCollection,
  getFormQuestionsPipeline,
  getQuestionsGroupedByPagePipeline,
  getQuestionTypeStatsPipeline,
  questionToDocument,
  documentToQuestion,
} from '@/lib/questionTypes/schema';
export type { QuestionDocument } from '@/lib/questionTypes/schema';
