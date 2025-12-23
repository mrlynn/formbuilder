/**
 * Question Type System - Comprehensive Type Definitions
 *
 * This module defines a robust question type system where each question type
 * has its own set of custom attributes that users can configure when building forms.
 *
 * Architecture Overview:
 * - Base question interface provides common properties
 * - Each question type extends the base with type-specific attributes
 * - Union type enables type-safe handling of all question types
 * - Registry pattern enables extensibility without modifying core logic
 */

// ============================================
// Base Types & Enums
// ============================================

/**
 * All supported question type identifiers
 */
export type QuestionTypeId =
  // Text & Input
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  // Choice
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'yes_no'
  // Rating & Scale
  | 'rating'
  | 'scale'
  | 'slider'
  | 'nps'
  // Date & Time
  | 'date'
  | 'time'
  | 'datetime'
  // Advanced
  | 'file_upload'
  | 'image_upload'
  | 'signature'
  | 'matrix'
  | 'ranking'
  // Specialized
  | 'address'
  | 'payment'
  | 'opinion_scale'
  | 'color_picker'
  | 'tags';

/**
 * Question categories for organization in the UI
 */
export type QuestionCategory =
  | 'text_input'
  | 'choice'
  | 'rating_scale'
  | 'date_time'
  | 'media_upload'
  | 'advanced'
  | 'specialized';

/**
 * UI control types for attribute editors
 */
export type AttributeControlType =
  | 'text_input'
  | 'number_input'
  | 'textarea'
  | 'toggle'
  | 'dropdown'
  | 'multi_select'
  | 'color_picker'
  | 'icon_picker'
  | 'slider'
  | 'key_value_editor'
  | 'option_list_editor'
  | 'date_picker'
  | 'time_picker'
  | 'file_type_selector'
  | 'regex_editor'
  | 'conditional_editor';

/**
 * Validation rule types
 */
export type ValidationRuleType =
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'phone'
  | 'custom';

// ============================================
// Attribute Schema Definition
// ============================================

/**
 * Defines a single configurable attribute for a question type
 */
export interface AttributeSchema<T = any> {
  /** Attribute identifier (camelCase) */
  name: string;
  /** Display label for the UI */
  label: string;
  /** Description/help text */
  description?: string;
  /** Data type */
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Default value */
  defaultValue: T;
  /** UI control type for editing */
  controlType: AttributeControlType;
  /** Options for dropdown/multi-select controls */
  options?: Array<{ value: any; label: string }>;
  /** Validation rules for the attribute itself */
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  /** Conditional visibility based on other attributes */
  showWhen?: {
    attribute: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  /** Group for organizing attributes in the UI */
  group?: 'basic' | 'appearance' | 'validation' | 'behavior' | 'advanced';
  /** Order within the group */
  order?: number;
}

// ============================================
// Base Question Interface
// ============================================

/**
 * Base interface for all question types
 * Contains common properties shared by all questions
 */
export interface BaseQuestion {
  /** Unique identifier */
  id: string;
  /** Question type identifier */
  type: QuestionTypeId;
  /** Field path for data binding (MongoDB document path) */
  path: string;
  /** Display label/question text */
  label: string;
  /** Optional description/helper text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the question is required */
  required: boolean;
  /** Whether the question is included in the form */
  included: boolean;
  /** Data source: schema-derived, custom-added, or form variable */
  source: 'schema' | 'custom' | 'variable';
  /** Whether to include in the final document */
  includeInDocument: boolean;
  /** Conditional visibility logic */
  conditionalLogic?: ConditionalLogic;
  /** Validation rules */
  validation?: QuestionValidation;
  /** Form mode configuration */
  modeConfig?: QuestionModeConfig;
  /** Created/updated timestamps */
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Conditional logic for showing/hiding questions
 */
export interface ConditionalLogic {
  action: 'show' | 'hide';
  logicType: 'all' | 'any';
  conditions: FieldCondition[];
}

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty' | 'isTrue' | 'isFalse';
  value?: any;
}

/**
 * Validation configuration
 */
export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  customValidator?: string; // Formula/expression
  customMessage?: string;
}

/**
 * Mode-specific configuration
 */
export interface QuestionModeConfig {
  visibleIn?: ('create' | 'edit' | 'view' | 'clone' | 'search')[];
  editableIn?: ('create' | 'edit' | 'clone')[];
  requiredIn?: ('create' | 'edit' | 'clone')[];
}

// ============================================
// Text & Input Question Types
// ============================================

/**
 * Short text input (single line)
 */
export interface ShortTextQuestion extends BaseQuestion {
  type: 'short_text';
  attributes: {
    /** Maximum character count */
    maxLength: number;
    /** Show character counter */
    showCharacterCount: boolean;
    /** Input mask pattern (e.g., phone, SSN) */
    inputMask?: string;
    /** Auto-capitalize behavior */
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
    /** Spellcheck enabled */
    spellcheck: boolean;
    /** Autocomplete hint */
    autocomplete?: string;
  };
}

/**
 * Long text/paragraph input (multi-line)
 */
export interface LongTextQuestion extends BaseQuestion {
  type: 'long_text';
  attributes: {
    /** Minimum character count */
    minLength: number;
    /** Maximum character count */
    maxLength: number;
    /** Number of visible rows */
    rows: number;
    /** Auto-resize as user types */
    autoResize: boolean;
    /** Show character counter */
    showCharacterCount: boolean;
    /** Enable rich text formatting */
    richText: boolean;
    /** Spellcheck enabled */
    spellcheck: boolean;
  };
}

/**
 * Number input
 */
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  attributes: {
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step increment */
    step: number;
    /** Number of decimal places */
    decimalPlaces: number;
    /** Display format */
    format: 'number' | 'currency' | 'percentage';
    /** Currency code (for currency format) */
    currencyCode?: string;
    /** Show increment/decrement buttons */
    showStepper: boolean;
    /** Thousand separator */
    useThousandSeparator: boolean;
    /** Prefix (e.g., "$") */
    prefix?: string;
    /** Suffix (e.g., "kg") */
    suffix?: string;
  };
}

/**
 * Email input with validation
 */
export interface EmailQuestion extends BaseQuestion {
  type: 'email';
  attributes: {
    /** Allow multiple emails (comma-separated) */
    allowMultiple: boolean;
    /** Validate email format */
    validateFormat: boolean;
    /** Check for disposable email domains */
    blockDisposable: boolean;
    /** Allowed domains (empty = all allowed) */
    allowedDomains: string[];
    /** Blocked domains */
    blockedDomains: string[];
    /** Show confirmation input */
    confirmEmail: boolean;
  };
}

/**
 * Phone number input
 */
export interface PhoneQuestion extends BaseQuestion {
  type: 'phone';
  attributes: {
    /** Default country code */
    defaultCountry: string;
    /** Show country selector */
    showCountrySelector: boolean;
    /** Allowed countries (empty = all) */
    allowedCountries: string[];
    /** Phone format */
    format: 'national' | 'international' | 'e164';
    /** Validate phone number */
    validateFormat: boolean;
  };
}

/**
 * URL input
 */
export interface UrlQuestion extends BaseQuestion {
  type: 'url';
  attributes: {
    /** Require HTTPS */
    requireHttps: boolean;
    /** Validate URL format */
    validateFormat: boolean;
    /** Allowed protocols */
    allowedProtocols: string[];
    /** Show preview of linked content */
    showPreview: boolean;
  };
}

// ============================================
// Choice Question Types
// ============================================

/**
 * Choice option definition
 */
export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Multiple choice (radio buttons - single select)
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  attributes: {
    /** Available options */
    options: ChoiceOption[];
    /** Layout direction */
    layout: 'vertical' | 'horizontal' | 'grid';
    /** Number of columns for grid layout */
    columns: number;
    /** Randomize option order */
    randomize: boolean;
    /** Allow "Other" option with text input */
    allowOther: boolean;
    /** "Other" option label */
    otherLabel: string;
    /** Show images with options */
    showImages: boolean;
    /** Image size */
    imageSize: 'small' | 'medium' | 'large';
  };
}

/**
 * Checkboxes (multi-select)
 */
export interface CheckboxesQuestion extends BaseQuestion {
  type: 'checkboxes';
  attributes: {
    /** Available options */
    options: ChoiceOption[];
    /** Layout direction */
    layout: 'vertical' | 'horizontal' | 'grid';
    /** Number of columns for grid layout */
    columns: number;
    /** Randomize option order */
    randomize: boolean;
    /** Allow "Other" option with text input */
    allowOther: boolean;
    /** "Other" option label */
    otherLabel: string;
    /** Minimum selections required */
    minSelections: number;
    /** Maximum selections allowed */
    maxSelections?: number;
    /** Show "Select All" option */
    showSelectAll: boolean;
  };
}

/**
 * Dropdown select
 */
export interface DropdownQuestion extends BaseQuestion {
  type: 'dropdown';
  attributes: {
    /** Available options */
    options: ChoiceOption[];
    /** Allow multiple selections */
    multiple: boolean;
    /** Enable search/filter */
    searchable: boolean;
    /** Allow creating new options */
    allowCreate: boolean;
    /** Group options by category */
    grouped: boolean;
    /** Option groups */
    groups?: Array<{ label: string; options: ChoiceOption[] }>;
    /** Show clear button */
    clearable: boolean;
    /** Loading state placeholder */
    loadingText: string;
    /** Empty state text */
    noOptionsText: string;
    /** Lookup configuration for dynamic options */
    lookup?: LookupConfig;
  };
}

/**
 * Lookup configuration for dynamic dropdown options
 */
export interface LookupConfig {
  collection: string;
  displayField: string;
  valueField: string;
  filterField?: string;
  filterSourceField?: string;
  searchable?: boolean;
  preloadOptions?: boolean;
}

/**
 * Yes/No toggle
 */
export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
  attributes: {
    /** Display style */
    style: 'toggle' | 'buttons' | 'radio';
    /** Yes label */
    yesLabel: string;
    /** No label */
    noLabel: string;
    /** Default value */
    defaultValue?: boolean;
    /** Store as boolean or string */
    valueType: 'boolean' | 'string';
  };
}

// ============================================
// Rating & Scale Question Types
// ============================================

/**
 * Rating (stars, emojis, etc.)
 */
export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  attributes: {
    /** Maximum rating value */
    maxRating: number;
    /** Rating icon type */
    iconType: 'star' | 'heart' | 'thumb' | 'emoji' | 'number' | 'custom';
    /** Custom icons (for custom type) */
    customIcons?: string[];
    /** Icon size */
    iconSize: 'small' | 'medium' | 'large';
    /** Show value labels */
    showLabels: boolean;
    /** Value labels */
    labels?: Record<number, string>;
    /** Allow half ratings */
    allowHalf: boolean;
    /** Hover preview */
    showHoverPreview: boolean;
    /** Active color */
    activeColor: string;
    /** Inactive color */
    inactiveColor: string;
  };
}

/**
 * Linear scale (1-10, etc.)
 */
export interface ScaleQuestion extends BaseQuestion {
  type: 'scale';
  attributes: {
    /** Minimum value */
    minValue: number;
    /** Maximum value */
    maxValue: number;
    /** Step increment */
    step: number;
    /** Low label (left side) */
    lowLabel: string;
    /** High label (right side) */
    highLabel: string;
    /** Middle label */
    middleLabel?: string;
    /** Show value labels */
    showValueLabels: boolean;
    /** Custom value labels */
    valueLabels?: Record<number, string>;
    /** Display style */
    displayStyle: 'buttons' | 'slider' | 'radio';
  };
}

/**
 * Slider input
 */
export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  attributes: {
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Step increment */
    step: number;
    /** Default value */
    defaultValue?: number;
    /** Show tick marks */
    showTicks: boolean;
    /** Tick interval */
    tickInterval: number;
    /** Show current value */
    showValue: boolean;
    /** Value display position */
    valuePosition: 'above' | 'below' | 'tooltip';
    /** Show min/max labels */
    showMinMax: boolean;
    /** Custom marks */
    marks?: Array<{ value: number; label: string }>;
    /** Track color */
    trackColor: string;
    /** Enable range selection (two handles) */
    range: boolean;
  };
}

/**
 * Net Promoter Score (NPS)
 */
export interface NpsQuestion extends BaseQuestion {
  type: 'nps';
  attributes: {
    /** Low label (0-6: Detractors) */
    detractorLabel: string;
    /** Middle label (7-8: Passives) */
    passiveLabel: string;
    /** High label (9-10: Promoters) */
    promoterLabel: string;
    /** Show category labels */
    showCategoryLabels: boolean;
    /** Show score explanation */
    showExplanation: boolean;
    /** Follow-up question for detractors */
    detractorFollowUp?: string;
    /** Follow-up question for promoters */
    promoterFollowUp?: string;
    /** Color coding */
    useColorCoding: boolean;
  };
}

/**
 * Opinion scale (Likert-style)
 */
export interface OpinionScaleQuestion extends BaseQuestion {
  type: 'opinion_scale';
  attributes: {
    /** Scale options */
    options: Array<{
      value: number;
      label: string;
      emoji?: string;
    }>;
    /** Show neutral option */
    showNeutral: boolean;
    /** Neutral label */
    neutralLabel: string;
    /** Display style */
    displayStyle: 'buttons' | 'emojis' | 'icons';
    /** Custom scale (e.g., "Strongly Disagree" to "Strongly Agree") */
    scaleType: 'agreement' | 'satisfaction' | 'frequency' | 'importance' | 'custom';
  };
}

// ============================================
// Date & Time Question Types
// ============================================

/**
 * Date picker
 */
export interface DateQuestion extends BaseQuestion {
  type: 'date';
  attributes: {
    /** Date format for display */
    displayFormat: string;
    /** Date format for storage */
    storageFormat: 'iso' | 'unix' | 'string';
    /** Minimum date */
    minDate?: string;
    /** Maximum date */
    maxDate?: string;
    /** Disable specific dates */
    disabledDates?: string[];
    /** Disable weekends */
    disableWeekends: boolean;
    /** Disable past dates */
    disablePast: boolean;
    /** Disable future dates */
    disableFuture: boolean;
    /** Show week numbers */
    showWeekNumbers: boolean;
    /** First day of week (0 = Sunday, 1 = Monday) */
    firstDayOfWeek: number;
    /** Allow date range selection */
    range: boolean;
    /** Picker style */
    pickerStyle: 'calendar' | 'input' | 'both';
  };
}

/**
 * Time picker
 */
export interface TimeQuestion extends BaseQuestion {
  type: 'time';
  attributes: {
    /** Time format */
    format: '12h' | '24h';
    /** Time interval in minutes */
    minuteStep: number;
    /** Minimum time */
    minTime?: string;
    /** Maximum time */
    maxTime?: string;
    /** Show seconds */
    showSeconds: boolean;
    /** Picker style */
    pickerStyle: 'clock' | 'dropdown' | 'input';
  };
}

/**
 * Date and time combined
 */
export interface DateTimeQuestion extends BaseQuestion {
  type: 'datetime';
  attributes: {
    /** Date format */
    dateFormat: string;
    /** Time format */
    timeFormat: '12h' | '24h';
    /** Storage format */
    storageFormat: 'iso' | 'unix';
    /** Timezone handling */
    timezone: 'local' | 'utc' | 'custom';
    /** Custom timezone */
    customTimezone?: string;
    /** Show timezone selector */
    showTimezoneSelector: boolean;
    /** Minimum datetime */
    minDateTime?: string;
    /** Maximum datetime */
    maxDateTime?: string;
    /** Time interval in minutes */
    minuteStep: number;
  };
}

// ============================================
// Media & File Upload Question Types
// ============================================

/**
 * File upload
 */
export interface FileUploadQuestion extends BaseQuestion {
  type: 'file_upload';
  attributes: {
    /** Allowed file types (MIME types or extensions) */
    allowedTypes: string[];
    /** Maximum file size in bytes */
    maxFileSize: number;
    /** Allow multiple files */
    multiple: boolean;
    /** Maximum number of files */
    maxFiles: number;
    /** Show file preview */
    showPreview: boolean;
    /** Enable drag and drop */
    dragDrop: boolean;
    /** Custom upload button text */
    uploadButtonText: string;
    /** Show upload progress */
    showProgress: boolean;
    /** Accepted file type descriptions for UI */
    acceptDescription: string;
  };
}

/**
 * Image upload
 */
export interface ImageUploadQuestion extends BaseQuestion {
  type: 'image_upload';
  attributes: {
    /** Allowed image types */
    allowedTypes: string[];
    /** Maximum file size in bytes */
    maxFileSize: number;
    /** Allow multiple images */
    multiple: boolean;
    /** Maximum number of images */
    maxImages: number;
    /** Enable image cropping */
    enableCrop: boolean;
    /** Crop aspect ratio */
    cropAspectRatio?: number;
    /** Minimum dimensions */
    minDimensions?: { width: number; height: number };
    /** Maximum dimensions */
    maxDimensions?: { width: number; height: number };
    /** Show preview */
    showPreview: boolean;
    /** Preview size */
    previewSize: 'small' | 'medium' | 'large';
    /** Enable image compression */
    compress: boolean;
    /** Compression quality (0-1) */
    compressionQuality: number;
  };
}

/**
 * Signature capture
 */
export interface SignatureQuestion extends BaseQuestion {
  type: 'signature';
  attributes: {
    /** Canvas width */
    canvasWidth: number;
    /** Canvas height */
    canvasHeight: number;
    /** Stroke color */
    strokeColor: string;
    /** Stroke width */
    strokeWidth: number;
    /** Background color */
    backgroundColor: string;
    /** Show clear button */
    showClear: boolean;
    /** Show type signature option */
    allowTyped: boolean;
    /** Output format */
    outputFormat: 'png' | 'svg' | 'base64';
  };
}

// ============================================
// Advanced Question Types
// ============================================

/**
 * Matrix/Grid question (rows × columns)
 */
export interface MatrixQuestion extends BaseQuestion {
  type: 'matrix';
  attributes: {
    /** Row definitions */
    rows: Array<{ id: string; label: string }>;
    /** Column definitions */
    columns: Array<{ id: string; label: string; value?: any }>;
    /** Input type per cell */
    cellType: 'radio' | 'checkbox' | 'dropdown' | 'text' | 'number';
    /** Dropdown options (for dropdown cell type) */
    dropdownOptions?: ChoiceOption[];
    /** Require all rows to be answered */
    requireAllRows: boolean;
    /** Allow one answer per column (radio only) */
    onePerColumn: boolean;
    /** Randomize rows */
    randomizeRows: boolean;
    /** Randomize columns */
    randomizeColumns: boolean;
    /** Mobile layout */
    mobileLayout: 'stack' | 'scroll';
    /** Alternate row colors */
    alternateRowColors: boolean;
  };
}

/**
 * Ranking/ordering question
 */
export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
  attributes: {
    /** Items to rank */
    items: Array<{ id: string; label: string; imageUrl?: string }>;
    /** Minimum items to rank (0 = rank all) */
    minRank: number;
    /** Maximum items to rank (0 = no limit) */
    maxRank: number;
    /** Show rank numbers */
    showRankNumbers: boolean;
    /** Drag and drop style */
    dragStyle: 'list' | 'cards' | 'grid';
    /** Show images with items */
    showImages: boolean;
    /** Randomize initial order */
    randomize: boolean;
    /** Allow ties (same rank for multiple items) */
    allowTies: boolean;
  };
}

/**
 * Address input
 */
export interface AddressQuestion extends BaseQuestion {
  type: 'address';
  attributes: {
    /** Address components to collect */
    components: Array<'street1' | 'street2' | 'city' | 'state' | 'postalCode' | 'country'>;
    /** Default country */
    defaultCountry: string;
    /** Enable address autocomplete */
    autocomplete: boolean;
    /** Autocomplete provider */
    autocompleteProvider?: 'google' | 'mapbox' | 'here';
    /** Show map preview */
    showMap: boolean;
    /** Require all components */
    requireAll: boolean;
    /** Country options (empty = all) */
    allowedCountries: string[];
    /** Single line or multi-field */
    displayMode: 'single' | 'multi';
  };
}

/**
 * Tags input
 */
export interface TagsQuestion extends BaseQuestion {
  type: 'tags';
  attributes: {
    /** Suggested tags */
    suggestions: string[];
    /** Allow custom tags */
    allowCustom: boolean;
    /** Minimum tags */
    minTags: number;
    /** Maximum tags */
    maxTags: number;
    /** Maximum tag length */
    maxTagLength: number;
    /** Tag validation pattern */
    validationPattern?: string;
    /** Show suggestions dropdown */
    showSuggestions: boolean;
    /** Create on enter */
    createOnEnter: boolean;
    /** Create on comma */
    createOnComma: boolean;
    /** Case handling */
    caseHandling: 'preserve' | 'lowercase' | 'uppercase';
  };
}

/**
 * Color picker
 */
export interface ColorPickerQuestion extends BaseQuestion {
  type: 'color_picker';
  attributes: {
    /** Default color */
    defaultColor: string;
    /** Color format */
    format: 'hex' | 'rgb' | 'hsl';
    /** Show alpha/opacity */
    showAlpha: boolean;
    /** Preset colors */
    presetColors: string[];
    /** Show preset colors only */
    presetsOnly: boolean;
    /** Picker style */
    pickerStyle: 'chrome' | 'sketch' | 'compact' | 'block';
  };
}

/**
 * Payment question (for payment forms)
 */
export interface PaymentQuestion extends BaseQuestion {
  type: 'payment';
  attributes: {
    /** Payment provider */
    provider: 'stripe' | 'paypal' | 'square' | 'custom';
    /** Currency */
    currency: string;
    /** Amount type */
    amountType: 'fixed' | 'variable' | 'subscription';
    /** Fixed amount */
    fixedAmount?: number;
    /** Minimum amount (for variable) */
    minAmount?: number;
    /** Maximum amount (for variable) */
    maxAmount?: number;
    /** Preset amounts */
    presetAmounts?: number[];
    /** Allow custom amount */
    allowCustomAmount: boolean;
    /** Show currency symbol */
    showCurrencySymbol: boolean;
    /** Subscription plans */
    subscriptionPlans?: Array<{
      id: string;
      name: string;
      price: number;
      interval: 'month' | 'year';
    }>;
  };
}

// ============================================
// Union Type of All Question Types
// ============================================

/**
 * Union type of all question types
 * Use this when you need to handle any question type
 */
export type Question =
  | ShortTextQuestion
  | LongTextQuestion
  | NumberQuestion
  | EmailQuestion
  | PhoneQuestion
  | UrlQuestion
  | MultipleChoiceQuestion
  | CheckboxesQuestion
  | DropdownQuestion
  | YesNoQuestion
  | RatingQuestion
  | ScaleQuestion
  | SliderQuestion
  | NpsQuestion
  | OpinionScaleQuestion
  | DateQuestion
  | TimeQuestion
  | DateTimeQuestion
  | FileUploadQuestion
  | ImageUploadQuestion
  | SignatureQuestion
  | MatrixQuestion
  | RankingQuestion
  | AddressQuestion
  | TagsQuestion
  | ColorPickerQuestion
  | PaymentQuestion;

// ============================================
// Question Type Metadata & Registry
// ============================================

/**
 * Metadata for a question type (used in the registry)
 */
export interface QuestionTypeMetadata {
  /** Type identifier */
  id: QuestionTypeId;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Category */
  category: QuestionCategory;
  /** Icon name (Material Icons) */
  icon: string;
  /** MongoDB BSON type for storage */
  bsonType: 'string' | 'number' | 'bool' | 'date' | 'array' | 'object';
  /** Attribute schemas for this type */
  attributeSchemas: AttributeSchema[];
  /** Default validation rules */
  defaultValidation?: Partial<QuestionValidation>;
  /** Tags for search/filter */
  tags: string[];
  /** Whether this is a premium feature */
  premium?: boolean;
  /** Feature flag for enabling/disabling */
  featureFlag?: string;
}

/**
 * Question type registry entry
 */
export interface QuestionTypeRegistryEntry<T extends Question = Question> {
  /** Type metadata */
  metadata: QuestionTypeMetadata;
  /** Factory function to create a new question */
  create: (overrides?: Partial<T>) => T;
  /** Validate question-specific attributes */
  validate: (question: T) => ValidationResult;
  /** Render function identifier (for component lookup) */
  renderer: string;
  /** Editor function identifier (for attribute editor lookup) */
  editor: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard for Short Text question
 */
export function isShortTextQuestion(q: Question): q is ShortTextQuestion {
  return q.type === 'short_text';
}

/**
 * Type guard for Multiple Choice question
 */
export function isMultipleChoiceQuestion(q: Question): q is MultipleChoiceQuestion {
  return q.type === 'multiple_choice';
}

/**
 * Type guard for Rating question
 */
export function isRatingQuestion(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

/**
 * Type guard for Scale question
 */
export function isScaleQuestion(q: Question): q is ScaleQuestion {
  return q.type === 'scale';
}

/**
 * Type guard for Date question
 */
export function isDateQuestion(q: Question): q is DateQuestion {
  return q.type === 'date';
}

/**
 * Type guard for File Upload question
 */
export function isFileUploadQuestion(q: Question): q is FileUploadQuestion {
  return q.type === 'file_upload';
}

/**
 * Type guard for Matrix question
 */
export function isMatrixQuestion(q: Question): q is MatrixQuestion {
  return q.type === 'matrix';
}

/**
 * Generic type guard factory
 */
export function createTypeGuard<T extends Question>(typeId: QuestionTypeId) {
  return (q: Question): q is T => q.type === typeId;
}

// ============================================
// Utility Types
// ============================================

/**
 * Extract attributes type from a question type
 */
export type QuestionAttributes<T extends Question> = T extends { attributes: infer A } ? A : never;

/**
 * Map from question type ID to question interface
 */
export type QuestionTypeMap = {
  short_text: ShortTextQuestion;
  long_text: LongTextQuestion;
  number: NumberQuestion;
  email: EmailQuestion;
  phone: PhoneQuestion;
  url: UrlQuestion;
  multiple_choice: MultipleChoiceQuestion;
  checkboxes: CheckboxesQuestion;
  dropdown: DropdownQuestion;
  yes_no: YesNoQuestion;
  rating: RatingQuestion;
  scale: ScaleQuestion;
  slider: SliderQuestion;
  nps: NpsQuestion;
  opinion_scale: OpinionScaleQuestion;
  date: DateQuestion;
  time: TimeQuestion;
  datetime: DateTimeQuestion;
  file_upload: FileUploadQuestion;
  image_upload: ImageUploadQuestion;
  signature: SignatureQuestion;
  matrix: MatrixQuestion;
  ranking: RankingQuestion;
  address: AddressQuestion;
  tags: TagsQuestion;
  color_picker: ColorPickerQuestion;
  payment: PaymentQuestion;
};

/**
 * Get question type by ID
 */
export type QuestionByType<T extends QuestionTypeId> = QuestionTypeMap[T];
