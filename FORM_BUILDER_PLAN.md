# Data Entry Form Builder - Implementation Plan

## Overview

Add a third tab to the MongoDB Aggregation Pipeline Builder that enables users to build and use data entry forms for inserting and updating documents in their collections.

## Features

### 1. Form Builder Interface
- **Schema-Based Form Generation**: Automatically generate form fields based on collection schema
- **Field Configuration**: 
  - Include/exclude fields from the form
  - Set field labels and placeholders
  - Configure validation rules (required, min/max, patterns)
  - Set default values
- **Field Type Detection**: Automatically detect field types from sample documents:
  - String → TextField
  - Number → Number input
  - Boolean → Checkbox/Switch
  - Date → DatePicker
  - Object → Nested form section
  - Array → Array input with add/remove items
  - ObjectId → Reference selector (for lookups)
- **Nested Object Support**: Handle nested objects and arrays with expandable sections
- **Form Preview**: Live preview of the form as it's being configured

### 2. Form Execution
- **Insert Mode**: Create new documents
- **Update Mode**: Edit existing documents (load by _id or query)
- **Bulk Insert**: Support for inserting multiple documents at once
- **Validation**: Client and server-side validation
- **Error Handling**: Display validation errors inline

### 3. Integration Points
- **Connection Context**: Uses existing connection/collection from PipelineContext
- **Schema Inference**: Leverages existing schema API and sample documents
- **Consistent UI**: Matches the visual design of ERD and Pipeline Builder tabs

## Architecture

### Components Structure
```
src/
├── components/
│   ├── FormBuilder/
│   │   ├── FormBuilder.tsx          # Main form builder component
│   │   ├── FormFieldConfig.tsx      # Field configuration panel
│   │   ├── FormPreview.tsx          # Live form preview
│   │   ├── FieldRenderer.tsx        # Renders form fields based on type
│   │   ├── NestedFieldSection.tsx   # Handles nested objects
│   │   ├── ArrayFieldInput.tsx      # Handles array fields
│   │   └── FormActions.tsx          # Insert/Update buttons and actions
│   └── MainTabs/
│       └── FormBuilderView.tsx      # Tab wrapper component
├── app/api/mongodb/
│   ├── field-schema/route.ts        # Get detailed field schema with types
│   ├── insert-document/route.ts    # Insert new document
│   └── bulk-insert/route.ts         # Insert multiple documents
├── lib/
│   └── formGenerator.ts             # Generate form config from schema
└── types/
    └── form.ts                      # Form-related TypeScript types
```

### API Routes

#### GET /api/mongodb/field-schema
Get detailed schema information for a collection including:
- Field names and paths
- Field types (inferred from sample documents)
- Nested structure
- Array indicators
- Sample values

#### POST /api/mongodb/insert-document
Insert a single document into a collection.

#### POST /api/mongodb/bulk-insert
Insert multiple documents at once.

## UI/UX Design

### Layout
- **Left Panel**: Field configuration (similar to ConnectionPanel)
  - List of all fields from schema
  - Toggle to include/exclude
  - Field configuration options
- **Center Panel**: Form preview and execution
  - Live form preview
  - Form inputs
  - Validation errors
  - Action buttons (Insert/Update)
- **Right Panel**: Document viewer (optional)
  - Show inserted/updated documents
  - Success/error messages

### Form Field Types

1. **Text Fields**
   - Short text → TextField
   - Long text → TextArea
   - Email → Email input with validation
   - URL → URL input with validation

2. **Number Fields**
   - Integer → Number input
   - Decimal → Number input with step
   - Currency → Number input with formatting

3. **Date/Time Fields**
   - Date → DatePicker
   - DateTime → DateTimePicker
   - Time → TimePicker

4. **Boolean Fields**
   - Checkbox
   - Switch (toggle)

5. **Select Fields**
   - Dropdown (if field has limited values)
   - Multi-select (for arrays)

6. **Nested Objects**
   - Collapsible section
   - Sub-form with nested fields

7. **Arrays**
   - Dynamic list with add/remove
   - Each item can be object or primitive

8. **ObjectId References**
   - Autocomplete from related collection
   - Or manual ObjectId input

## Implementation Phases

### Phase 1: Foundation
- [ ] Create FormBuilderView component
- [ ] Add third tab to MainTabs
- [ ] Create field-schema API route
- [ ] Basic form generation from schema

### Phase 2: Field Configuration
- [ ] Field configuration panel
- [ ] Include/exclude toggles
- [ ] Field label and placeholder configuration
- [ ] Validation rules configuration

### Phase 3: Field Rendering
- [ ] Implement FieldRenderer with type detection
- [ ] Support for nested objects
- [ ] Support for arrays
- [ ] Date/Time pickers

### Phase 4: Form Execution
- [ ] Insert document API route
- [ ] Update document (reuse existing route)
- [ ] Form validation
- [ ] Error handling and display

### Phase 5: Advanced Features
- [ ] Bulk insert
- [ ] Form templates/saved configurations
- [ ] Export form configuration
- [ ] Import form configuration

## Technical Considerations

### Schema Inference
- Use sample documents to infer field types
- Handle missing fields gracefully
- Support for dynamic schemas (MongoDB is schema-less)

### Validation
- Client-side: Immediate feedback
- Server-side: Final validation before insert
- Type coercion where appropriate (string to number, etc.)

### Performance
- Lazy load nested forms
- Debounce form preview updates
- Efficient schema analysis

### User Experience
- Auto-save form configuration
- Form templates for common patterns
- Keyboard shortcuts
- Clear visual feedback

## Integration with Existing Features

1. **Connection Panel**: Reuse existing connection/collection selection
2. **Schema API**: Extend existing schema route or create new detailed route
3. **Sample Documents**: Use for type inference and default values
4. **Context**: Extend PipelineContext or create FormContext
5. **Styling**: Match existing MUI theme and design patterns

