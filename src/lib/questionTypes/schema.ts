/**
 * MongoDB Schema Design for Question Types
 *
 * This module defines the MongoDB schema for storing questions with their
 * type-specific attributes. It uses a flexible schema approach that:
 * - Stores common fields at the root level
 * - Uses a discriminator field (`type`) to determine question type
 * - Stores type-specific attributes in an `attributes` subdocument
 * - Supports easy querying with proper indexing
 * - Enables JSON Schema validation per question type
 */

import { Collection, Db, Document, ObjectId } from 'mongodb';
import { QuestionTypeId, Question } from '@/types/questionTypes';

// ============================================
// MongoDB Document Interfaces
// ============================================

/**
 * Base MongoDB document structure for questions
 */
export interface QuestionDocument {
  _id: ObjectId;
  /** Discriminator field - determines which type-specific schema applies */
  type: QuestionTypeId;
  /** Form this question belongs to */
  formId: string;
  /** Field path for data binding */
  path: string;
  /** Question label/text */
  label: string;
  /** Optional description */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Required flag */
  required: boolean;
  /** Included in form flag */
  included: boolean;
  /** Data source */
  source: 'schema' | 'custom' | 'variable';
  /** Include in final document */
  includeInDocument: boolean;
  /** Order within the form */
  order: number;
  /** Page ID for multi-page forms */
  pageId?: string;
  /** Conditional logic */
  conditionalLogic?: {
    action: 'show' | 'hide';
    logicType: 'all' | 'any';
    conditions: Array<{
      field: string;
      operator: string;
      value?: any;
    }>;
  };
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    customValidator?: string;
    customMessage?: string;
  };
  /** Mode-specific config */
  modeConfig?: {
    visibleIn?: string[];
    editableIn?: string[];
    requiredIn?: string[];
  };
  /** Type-specific attributes - schema varies by type */
  attributes: Document;
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// JSON Schema Validators
// ============================================

/**
 * Base JSON schema for all questions (common fields)
 */
export const baseQuestionSchema = {
  bsonType: 'object',
  required: ['type', 'formId', 'path', 'label', 'required', 'included', 'order', 'attributes', 'createdAt', 'updatedAt'],
  properties: {
    _id: { bsonType: 'objectId' },
    type: {
      bsonType: 'string',
      enum: [
        'short_text', 'long_text', 'number', 'email', 'phone', 'url',
        'multiple_choice', 'checkboxes', 'dropdown', 'yes_no',
        'rating', 'scale', 'slider', 'nps', 'opinion_scale',
        'date', 'time', 'datetime',
        'file_upload', 'image_upload', 'signature',
        'matrix', 'ranking', 'address', 'tags', 'color_picker', 'payment'
      ]
    },
    formId: { bsonType: 'string' },
    path: { bsonType: 'string' },
    label: { bsonType: 'string' },
    description: { bsonType: 'string' },
    placeholder: { bsonType: 'string' },
    required: { bsonType: 'bool' },
    included: { bsonType: 'bool' },
    source: { bsonType: 'string', enum: ['schema', 'custom', 'variable'] },
    includeInDocument: { bsonType: 'bool' },
    order: { bsonType: 'int' },
    pageId: { bsonType: 'string' },
    conditionalLogic: {
      bsonType: 'object',
      properties: {
        action: { bsonType: 'string', enum: ['show', 'hide'] },
        logicType: { bsonType: 'string', enum: ['all', 'any'] },
        conditions: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['field', 'operator'],
            properties: {
              field: { bsonType: 'string' },
              operator: { bsonType: 'string' },
              value: {}
            }
          }
        }
      }
    },
    validation: {
      bsonType: 'object',
      properties: {
        min: { bsonType: 'number' },
        max: { bsonType: 'number' },
        minLength: { bsonType: 'int' },
        maxLength: { bsonType: 'int' },
        pattern: { bsonType: 'string' },
        patternMessage: { bsonType: 'string' },
        customValidator: { bsonType: 'string' },
        customMessage: { bsonType: 'string' }
      }
    },
    modeConfig: {
      bsonType: 'object',
      properties: {
        visibleIn: { bsonType: 'array', items: { bsonType: 'string' } },
        editableIn: { bsonType: 'array', items: { bsonType: 'string' } },
        requiredIn: { bsonType: 'array', items: { bsonType: 'string' } }
      }
    },
    attributes: { bsonType: 'object' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' }
  }
};

/**
 * Type-specific attribute schemas
 */
export const attributeSchemas: Record<QuestionTypeId, Document> = {
  // Text & Input Types
  short_text: {
    bsonType: 'object',
    properties: {
      maxLength: { bsonType: 'int', minimum: 1, maximum: 10000 },
      showCharacterCount: { bsonType: 'bool' },
      inputMask: { bsonType: 'string' },
      autoCapitalize: { bsonType: 'string', enum: ['none', 'sentences', 'words', 'characters'] },
      spellcheck: { bsonType: 'bool' },
      autocomplete: { bsonType: 'string' }
    }
  },

  long_text: {
    bsonType: 'object',
    properties: {
      minLength: { bsonType: 'int', minimum: 0 },
      maxLength: { bsonType: 'int', minimum: 1 },
      rows: { bsonType: 'int', minimum: 1, maximum: 50 },
      autoResize: { bsonType: 'bool' },
      showCharacterCount: { bsonType: 'bool' },
      richText: { bsonType: 'bool' },
      spellcheck: { bsonType: 'bool' }
    }
  },

  number: {
    bsonType: 'object',
    properties: {
      min: { bsonType: 'number' },
      max: { bsonType: 'number' },
      step: { bsonType: 'number', minimum: 0 },
      decimalPlaces: { bsonType: 'int', minimum: 0, maximum: 10 },
      format: { bsonType: 'string', enum: ['number', 'currency', 'percentage'] },
      currencyCode: { bsonType: 'string' },
      showStepper: { bsonType: 'bool' },
      useThousandSeparator: { bsonType: 'bool' },
      prefix: { bsonType: 'string' },
      suffix: { bsonType: 'string' }
    }
  },

  email: {
    bsonType: 'object',
    properties: {
      allowMultiple: { bsonType: 'bool' },
      validateFormat: { bsonType: 'bool' },
      blockDisposable: { bsonType: 'bool' },
      allowedDomains: { bsonType: 'array', items: { bsonType: 'string' } },
      blockedDomains: { bsonType: 'array', items: { bsonType: 'string' } },
      confirmEmail: { bsonType: 'bool' }
    }
  },

  phone: {
    bsonType: 'object',
    properties: {
      defaultCountry: { bsonType: 'string' },
      showCountrySelector: { bsonType: 'bool' },
      allowedCountries: { bsonType: 'array', items: { bsonType: 'string' } },
      format: { bsonType: 'string', enum: ['national', 'international', 'e164'] },
      validateFormat: { bsonType: 'bool' }
    }
  },

  url: {
    bsonType: 'object',
    properties: {
      requireHttps: { bsonType: 'bool' },
      validateFormat: { bsonType: 'bool' },
      allowedProtocols: { bsonType: 'array', items: { bsonType: 'string' } },
      showPreview: { bsonType: 'bool' }
    }
  },

  // Choice Types
  multiple_choice: {
    bsonType: 'object',
    required: ['options'],
    properties: {
      options: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label', 'value'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' },
            value: { bsonType: 'string' },
            imageUrl: { bsonType: 'string' },
            description: { bsonType: 'string' },
            disabled: { bsonType: 'bool' }
          }
        }
      },
      layout: { bsonType: 'string', enum: ['vertical', 'horizontal', 'grid'] },
      columns: { bsonType: 'int', minimum: 1, maximum: 6 },
      randomize: { bsonType: 'bool' },
      allowOther: { bsonType: 'bool' },
      otherLabel: { bsonType: 'string' },
      showImages: { bsonType: 'bool' },
      imageSize: { bsonType: 'string', enum: ['small', 'medium', 'large'] }
    }
  },

  checkboxes: {
    bsonType: 'object',
    required: ['options'],
    properties: {
      options: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label', 'value'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' },
            value: { bsonType: 'string' },
            imageUrl: { bsonType: 'string' },
            description: { bsonType: 'string' },
            disabled: { bsonType: 'bool' }
          }
        }
      },
      layout: { bsonType: 'string', enum: ['vertical', 'horizontal', 'grid'] },
      columns: { bsonType: 'int', minimum: 1, maximum: 6 },
      randomize: { bsonType: 'bool' },
      allowOther: { bsonType: 'bool' },
      otherLabel: { bsonType: 'string' },
      minSelections: { bsonType: 'int', minimum: 0 },
      maxSelections: { bsonType: 'int', minimum: 0 },
      showSelectAll: { bsonType: 'bool' }
    }
  },

  dropdown: {
    bsonType: 'object',
    properties: {
      options: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label', 'value'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' },
            value: { bsonType: 'string' },
            imageUrl: { bsonType: 'string' },
            description: { bsonType: 'string' },
            disabled: { bsonType: 'bool' }
          }
        }
      },
      multiple: { bsonType: 'bool' },
      searchable: { bsonType: 'bool' },
      allowCreate: { bsonType: 'bool' },
      grouped: { bsonType: 'bool' },
      groups: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          properties: {
            label: { bsonType: 'string' },
            options: { bsonType: 'array' }
          }
        }
      },
      clearable: { bsonType: 'bool' },
      loadingText: { bsonType: 'string' },
      noOptionsText: { bsonType: 'string' },
      lookup: {
        bsonType: 'object',
        properties: {
          collection: { bsonType: 'string' },
          displayField: { bsonType: 'string' },
          valueField: { bsonType: 'string' },
          filterField: { bsonType: 'string' },
          filterSourceField: { bsonType: 'string' },
          searchable: { bsonType: 'bool' },
          preloadOptions: { bsonType: 'bool' }
        }
      }
    }
  },

  yes_no: {
    bsonType: 'object',
    properties: {
      style: { bsonType: 'string', enum: ['toggle', 'buttons', 'radio'] },
      yesLabel: { bsonType: 'string' },
      noLabel: { bsonType: 'string' },
      defaultValue: { bsonType: 'bool' },
      valueType: { bsonType: 'string', enum: ['boolean', 'string'] }
    }
  },

  // Rating & Scale Types
  rating: {
    bsonType: 'object',
    properties: {
      maxRating: { bsonType: 'int', minimum: 1, maximum: 10 },
      iconType: { bsonType: 'string', enum: ['star', 'heart', 'thumb', 'emoji', 'number', 'custom'] },
      customIcons: { bsonType: 'array', items: { bsonType: 'string' } },
      iconSize: { bsonType: 'string', enum: ['small', 'medium', 'large'] },
      showLabels: { bsonType: 'bool' },
      labels: { bsonType: 'object' },
      allowHalf: { bsonType: 'bool' },
      showHoverPreview: { bsonType: 'bool' },
      activeColor: { bsonType: 'string' },
      inactiveColor: { bsonType: 'string' }
    }
  },

  scale: {
    bsonType: 'object',
    properties: {
      minValue: { bsonType: 'int' },
      maxValue: { bsonType: 'int' },
      step: { bsonType: 'int', minimum: 1 },
      lowLabel: { bsonType: 'string' },
      highLabel: { bsonType: 'string' },
      middleLabel: { bsonType: 'string' },
      showValueLabels: { bsonType: 'bool' },
      valueLabels: { bsonType: 'object' },
      displayStyle: { bsonType: 'string', enum: ['buttons', 'slider', 'radio'] }
    }
  },

  slider: {
    bsonType: 'object',
    properties: {
      min: { bsonType: 'number' },
      max: { bsonType: 'number' },
      step: { bsonType: 'number' },
      defaultValue: { bsonType: 'number' },
      showTicks: { bsonType: 'bool' },
      tickInterval: { bsonType: 'number' },
      showValue: { bsonType: 'bool' },
      valuePosition: { bsonType: 'string', enum: ['above', 'below', 'tooltip'] },
      showMinMax: { bsonType: 'bool' },
      marks: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          properties: {
            value: { bsonType: 'number' },
            label: { bsonType: 'string' }
          }
        }
      },
      trackColor: { bsonType: 'string' },
      range: { bsonType: 'bool' }
    }
  },

  nps: {
    bsonType: 'object',
    properties: {
      detractorLabel: { bsonType: 'string' },
      passiveLabel: { bsonType: 'string' },
      promoterLabel: { bsonType: 'string' },
      showCategoryLabels: { bsonType: 'bool' },
      showExplanation: { bsonType: 'bool' },
      detractorFollowUp: { bsonType: 'string' },
      promoterFollowUp: { bsonType: 'string' },
      useColorCoding: { bsonType: 'bool' }
    }
  },

  opinion_scale: {
    bsonType: 'object',
    properties: {
      options: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          properties: {
            value: { bsonType: 'int' },
            label: { bsonType: 'string' },
            emoji: { bsonType: 'string' }
          }
        }
      },
      showNeutral: { bsonType: 'bool' },
      neutralLabel: { bsonType: 'string' },
      displayStyle: { bsonType: 'string', enum: ['buttons', 'emojis', 'icons'] },
      scaleType: { bsonType: 'string', enum: ['agreement', 'satisfaction', 'frequency', 'importance', 'custom'] }
    }
  },

  // Date & Time Types
  date: {
    bsonType: 'object',
    properties: {
      displayFormat: { bsonType: 'string' },
      storageFormat: { bsonType: 'string', enum: ['iso', 'unix', 'string'] },
      minDate: { bsonType: 'string' },
      maxDate: { bsonType: 'string' },
      disabledDates: { bsonType: 'array', items: { bsonType: 'string' } },
      disableWeekends: { bsonType: 'bool' },
      disablePast: { bsonType: 'bool' },
      disableFuture: { bsonType: 'bool' },
      showWeekNumbers: { bsonType: 'bool' },
      firstDayOfWeek: { bsonType: 'int', minimum: 0, maximum: 6 },
      range: { bsonType: 'bool' },
      pickerStyle: { bsonType: 'string', enum: ['calendar', 'input', 'both'] }
    }
  },

  time: {
    bsonType: 'object',
    properties: {
      format: { bsonType: 'string', enum: ['12h', '24h'] },
      minuteStep: { bsonType: 'int', minimum: 1, maximum: 60 },
      minTime: { bsonType: 'string' },
      maxTime: { bsonType: 'string' },
      showSeconds: { bsonType: 'bool' },
      pickerStyle: { bsonType: 'string', enum: ['clock', 'dropdown', 'input'] }
    }
  },

  datetime: {
    bsonType: 'object',
    properties: {
      dateFormat: { bsonType: 'string' },
      timeFormat: { bsonType: 'string', enum: ['12h', '24h'] },
      storageFormat: { bsonType: 'string', enum: ['iso', 'unix'] },
      timezone: { bsonType: 'string', enum: ['local', 'utc', 'custom'] },
      customTimezone: { bsonType: 'string' },
      showTimezoneSelector: { bsonType: 'bool' },
      minDateTime: { bsonType: 'string' },
      maxDateTime: { bsonType: 'string' },
      minuteStep: { bsonType: 'int', minimum: 1, maximum: 60 }
    }
  },

  // Media & File Upload Types
  file_upload: {
    bsonType: 'object',
    properties: {
      allowedTypes: { bsonType: 'array', items: { bsonType: 'string' } },
      maxFileSize: { bsonType: 'long' },
      multiple: { bsonType: 'bool' },
      maxFiles: { bsonType: 'int', minimum: 1 },
      showPreview: { bsonType: 'bool' },
      dragDrop: { bsonType: 'bool' },
      uploadButtonText: { bsonType: 'string' },
      showProgress: { bsonType: 'bool' },
      acceptDescription: { bsonType: 'string' }
    }
  },

  image_upload: {
    bsonType: 'object',
    properties: {
      allowedTypes: { bsonType: 'array', items: { bsonType: 'string' } },
      maxFileSize: { bsonType: 'long' },
      multiple: { bsonType: 'bool' },
      maxImages: { bsonType: 'int', minimum: 1 },
      enableCrop: { bsonType: 'bool' },
      cropAspectRatio: { bsonType: 'double' },
      minDimensions: {
        bsonType: 'object',
        properties: {
          width: { bsonType: 'int' },
          height: { bsonType: 'int' }
        }
      },
      maxDimensions: {
        bsonType: 'object',
        properties: {
          width: { bsonType: 'int' },
          height: { bsonType: 'int' }
        }
      },
      showPreview: { bsonType: 'bool' },
      previewSize: { bsonType: 'string', enum: ['small', 'medium', 'large'] },
      compress: { bsonType: 'bool' },
      compressionQuality: { bsonType: 'double', minimum: 0, maximum: 1 }
    }
  },

  signature: {
    bsonType: 'object',
    properties: {
      canvasWidth: { bsonType: 'int', minimum: 100 },
      canvasHeight: { bsonType: 'int', minimum: 50 },
      strokeColor: { bsonType: 'string' },
      strokeWidth: { bsonType: 'int', minimum: 1 },
      backgroundColor: { bsonType: 'string' },
      showClear: { bsonType: 'bool' },
      allowTyped: { bsonType: 'bool' },
      outputFormat: { bsonType: 'string', enum: ['png', 'svg', 'base64'] }
    }
  },

  // Advanced Types
  matrix: {
    bsonType: 'object',
    required: ['rows', 'columns'],
    properties: {
      rows: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' }
          }
        }
      },
      columns: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' },
            value: {}
          }
        }
      },
      cellType: { bsonType: 'string', enum: ['radio', 'checkbox', 'dropdown', 'text', 'number'] },
      dropdownOptions: { bsonType: 'array' },
      requireAllRows: { bsonType: 'bool' },
      onePerColumn: { bsonType: 'bool' },
      randomizeRows: { bsonType: 'bool' },
      randomizeColumns: { bsonType: 'bool' },
      mobileLayout: { bsonType: 'string', enum: ['stack', 'scroll'] },
      alternateRowColors: { bsonType: 'bool' }
    }
  },

  ranking: {
    bsonType: 'object',
    required: ['items'],
    properties: {
      items: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['id', 'label'],
          properties: {
            id: { bsonType: 'string' },
            label: { bsonType: 'string' },
            imageUrl: { bsonType: 'string' }
          }
        }
      },
      minRank: { bsonType: 'int', minimum: 0 },
      maxRank: { bsonType: 'int', minimum: 0 },
      showRankNumbers: { bsonType: 'bool' },
      dragStyle: { bsonType: 'string', enum: ['list', 'cards', 'grid'] },
      showImages: { bsonType: 'bool' },
      randomize: { bsonType: 'bool' },
      allowTies: { bsonType: 'bool' }
    }
  },

  address: {
    bsonType: 'object',
    properties: {
      components: {
        bsonType: 'array',
        items: { bsonType: 'string', enum: ['street1', 'street2', 'city', 'state', 'postalCode', 'country'] }
      },
      defaultCountry: { bsonType: 'string' },
      autocomplete: { bsonType: 'bool' },
      autocompleteProvider: { bsonType: 'string', enum: ['google', 'mapbox', 'here'] },
      showMap: { bsonType: 'bool' },
      requireAll: { bsonType: 'bool' },
      allowedCountries: { bsonType: 'array', items: { bsonType: 'string' } },
      displayMode: { bsonType: 'string', enum: ['single', 'multi'] }
    }
  },

  tags: {
    bsonType: 'object',
    properties: {
      suggestions: { bsonType: 'array', items: { bsonType: 'string' } },
      allowCustom: { bsonType: 'bool' },
      minTags: { bsonType: 'int', minimum: 0 },
      maxTags: { bsonType: 'int', minimum: 0 },
      maxTagLength: { bsonType: 'int', minimum: 1 },
      validationPattern: { bsonType: 'string' },
      showSuggestions: { bsonType: 'bool' },
      createOnEnter: { bsonType: 'bool' },
      createOnComma: { bsonType: 'bool' },
      caseHandling: { bsonType: 'string', enum: ['preserve', 'lowercase', 'uppercase'] }
    }
  },

  color_picker: {
    bsonType: 'object',
    properties: {
      defaultColor: { bsonType: 'string' },
      format: { bsonType: 'string', enum: ['hex', 'rgb', 'hsl'] },
      showAlpha: { bsonType: 'bool' },
      presetColors: { bsonType: 'array', items: { bsonType: 'string' } },
      presetsOnly: { bsonType: 'bool' },
      pickerStyle: { bsonType: 'string', enum: ['chrome', 'sketch', 'compact', 'block'] }
    }
  },

  payment: {
    bsonType: 'object',
    properties: {
      provider: { bsonType: 'string', enum: ['stripe', 'paypal', 'square', 'custom'] },
      currency: { bsonType: 'string' },
      amountType: { bsonType: 'string', enum: ['fixed', 'variable', 'subscription'] },
      fixedAmount: { bsonType: 'double' },
      minAmount: { bsonType: 'double' },
      maxAmount: { bsonType: 'double' },
      presetAmounts: { bsonType: 'array', items: { bsonType: 'double' } },
      allowCustomAmount: { bsonType: 'bool' },
      showCurrencySymbol: { bsonType: 'bool' },
      subscriptionPlans: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          properties: {
            id: { bsonType: 'string' },
            name: { bsonType: 'string' },
            price: { bsonType: 'double' },
            interval: { bsonType: 'string', enum: ['month', 'year'] }
          }
        }
      }
    }
  }
};

// ============================================
// Database Operations
// ============================================

/**
 * Create indexes for the questions collection
 */
export async function createQuestionIndexes(collection: Collection<QuestionDocument>): Promise<void> {
  await collection.createIndexes([
    // Primary lookup - find all questions for a form
    { key: { formId: 1, order: 1 }, name: 'formId_order' },
    // Find questions by type
    { key: { formId: 1, type: 1 }, name: 'formId_type' },
    // Find questions by path
    { key: { formId: 1, path: 1 }, name: 'formId_path', unique: true },
    // Filter by page
    { key: { formId: 1, pageId: 1, order: 1 }, name: 'formId_pageId_order' },
    // Find included questions only
    { key: { formId: 1, included: 1, order: 1 }, name: 'formId_included_order' },
    // Full-text search on labels
    { key: { label: 'text', description: 'text' }, name: 'text_search' }
  ]);
}

/**
 * Create collection with validation
 */
export async function createQuestionsCollection(db: Db): Promise<Collection<QuestionDocument>> {
  // Check if collection exists
  const collections = await db.listCollections({ name: 'questions' }).toArray();

  if (collections.length === 0) {
    // Create with validation
    await db.createCollection('questions', {
      validator: {
        $jsonSchema: baseQuestionSchema
      },
      validationLevel: 'moderate',
      validationAction: 'warn'
    });
  }

  const collection = db.collection<QuestionDocument>('questions');
  await createQuestionIndexes(collection);

  return collection;
}

// ============================================
// Aggregation Pipelines
// ============================================

/**
 * Get questions for a form with all metadata
 */
export function getFormQuestionsPipeline(formId: string) {
  return [
    { $match: { formId, included: true } },
    { $sort: { order: 1 } },
    {
      $project: {
        _id: 1,
        type: 1,
        path: 1,
        label: 1,
        description: 1,
        placeholder: 1,
        required: 1,
        conditionalLogic: 1,
        validation: 1,
        modeConfig: 1,
        attributes: 1,
        pageId: 1,
        order: 1
      }
    }
  ];
}

/**
 * Get questions grouped by page
 */
export function getQuestionsGroupedByPagePipeline(formId: string) {
  return [
    { $match: { formId, included: true } },
    { $sort: { order: 1 } },
    {
      $group: {
        _id: { $ifNull: ['$pageId', 'default'] },
        questions: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        pageId: '$_id',
        questions: 1,
        _id: 0
      }
    }
  ];
}

/**
 * Get question type statistics for a form
 */
export function getQuestionTypeStatsPipeline(formId: string) {
  return [
    { $match: { formId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        required: { $sum: { $cond: ['$required', 1, 0] } },
        optional: { $sum: { $cond: ['$required', 0, 1] } }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        required: 1,
        optional: 1,
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert a Question type to a QuestionDocument for MongoDB
 */
export function questionToDocument(question: Question, formId: string, order: number): Omit<QuestionDocument, '_id'> {
  const now = new Date();
  return {
    type: question.type,
    formId,
    path: question.path,
    label: question.label,
    description: question.description,
    placeholder: question.placeholder,
    required: question.required,
    included: question.included,
    source: question.source,
    includeInDocument: question.includeInDocument,
    order,
    conditionalLogic: question.conditionalLogic,
    validation: question.validation,
    modeConfig: question.modeConfig,
    attributes: (question as any).attributes || {},
    createdAt: question.createdAt || now,
    updatedAt: now
  };
}

/**
 * Convert a QuestionDocument to a Question type
 */
export function documentToQuestion(doc: QuestionDocument): Question {
  const base = {
    id: doc._id.toString(),
    type: doc.type,
    path: doc.path,
    label: doc.label,
    description: doc.description,
    placeholder: doc.placeholder,
    required: doc.required,
    included: doc.included,
    source: doc.source,
    includeInDocument: doc.includeInDocument,
    conditionalLogic: doc.conditionalLogic,
    validation: doc.validation,
    modeConfig: doc.modeConfig,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    attributes: doc.attributes
  };

  return base as Question;
}
