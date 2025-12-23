# Example Forms - Feature Showcase

This directory contains example form configurations that demonstrate **all features** of the Form Builder application.

## Quick Start

1. **Seed the test database:**
   ```bash
   npx ts-node scripts/seed-test-database.ts
   ```

2. **Import an example form** via the Form Builder UI or API

3. **Explore each feature** as documented below

---

## Example Forms

### 1. Employee Onboarding Form
**File:** `employee-onboarding-form.json`
**Collection:** `employees`

A comprehensive 4-page employee onboarding form demonstrating the full feature set.

### 2. Product Catalog Form
**File:** `product-catalog-form.json`
**Collection:** `products`

A 5-page e-commerce product entry form with pricing calculations and variant management.

---

## Feature Coverage Matrix

| Feature | Employee Form | Product Form |
|---------|:------------:|:------------:|
| **Layout Fields** | | |
| Section Header | ✅ | ✅ |
| Description/Text Block | ✅ | ✅ |
| Divider | ✅ | ✅ |
| Spacer | ✅ | |
| **Field Types** | | |
| String | ✅ | ✅ |
| Number | ✅ | ✅ |
| Boolean (Switch) | ✅ | ✅ |
| Date | ✅ | ✅ |
| Email | ✅ | |
| Nested Object | ✅ | |
| Array (Tags) | ✅ | ✅ |
| Array (Key-Value) | ✅ | ✅ |
| Array (Repeater) | ✅ | ✅ |
| **Advanced Features** | | |
| Lookup Fields | ✅ | |
| Cascading Lookups | ✅ | |
| Computed Fields | ✅ | ✅ |
| Conditional Logic | ✅ | ✅ |
| **Form Structure** | | |
| Multi-Page | ✅ (4 pages) | ✅ (5 pages) |
| Step Indicator | ✅ (progress) | ✅ (tabs) |
| Form Variables | ✅ | |
| **Lifecycle** | | |
| Create Mode | ✅ | ✅ |
| Edit Mode | ✅ | ✅ |
| Default Values | ✅ | ✅ |
| Immutable Fields | ✅ | |
| **Theming** | | |
| Custom Colors | ✅ (MongoDB) | ✅ (Blue) |
| Input Styles | ✅ (outlined) | ✅ (filled) |

---

## Feature Details

### 1. Layout Fields (Non-Data Elements)

Layout fields organize and explain the form without collecting data.

```json
{
  "path": "layout_welcome_header",
  "type": "section-header",
  "includeInDocument": false,
  "layout": {
    "type": "section-header",
    "title": "Welcome to Our Team!",
    "subtitle": "Please complete this form..."
  }
}
```

**Types Available:**
- `section-header` - Title + optional subtitle
- `description` - Text block for instructions
- `divider` - Horizontal line separator
- `spacer` - Vertical whitespace
- `image` - Display an image

---

### 2. Lookup Fields (References)

Connect fields to other collections for dropdown selection.

**Simple Lookup:**
```json
{
  "path": "departmentCode",
  "lookup": {
    "collection": "departments",
    "displayField": "name",
    "valueField": "code",
    "searchable": true,
    "preloadOptions": true
  }
}
```

**Cascading Lookup (filtered by another field):**
```json
{
  "path": "jobTitle",
  "lookup": {
    "collection": "job_titles",
    "displayField": "title",
    "valueField": "title",
    "filterField": "departmentCode",
    "filterSourceField": "departmentCode"
  }
}
```

When user selects a department, job titles automatically filter to show only matching options.

---

### 3. Computed Fields

Auto-calculated fields based on formulas.

```json
{
  "path": "totalCompensation",
  "computed": {
    "formula": "salary + bonus + stockOptions",
    "dependencies": ["salary", "bonus", "stockOptions"],
    "outputType": "number"
  },
  "includeInDocument": false
}
```

**Supported Operations:**
- Basic math: `+`, `-`, `*`, `/`
- Functions: `ROUND()`, `ABS()`, `MIN()`, `MAX()`
- Conditionals in formulas

---

### 4. Conditional Logic

Show/hide fields based on other field values.

```json
{
  "path": "healthcarePlan",
  "conditionalLogic": {
    "action": "show",
    "logicType": "all",
    "conditions": [
      { "field": "enrolledInHealthcare", "operator": "isTrue" }
    ]
  }
}
```

**Operators:**
- `equals`, `notEquals`
- `contains`, `notContains`
- `greaterThan`, `lessThan`
- `isEmpty`, `isNotEmpty`
- `isTrue`, `isFalse`

**Logic Types:**
- `all` - AND (all conditions must match)
- `any` - OR (any condition can match)

---

### 5. Array Patterns

#### Tags Pattern (String Array)
```json
{
  "path": "skills",
  "type": "array",
  "arrayPattern": {
    "pattern": "tags",
    "suggestions": ["JavaScript", "Python", "React"],
    "allowCustom": true
  }
}
```

#### Key-Value Pattern (Attribute Pattern)
```json
{
  "path": "metadata",
  "type": "array-object",
  "arrayPattern": {
    "pattern": "key-value",
    "keyField": "key",
    "valueField": "value",
    "keyLabel": "Preference",
    "valueLabel": "Value"
  }
}
```

---

### 6. Repeater Fields

Dynamic arrays with defined schemas.

```json
{
  "path": "workHistory",
  "type": "array-object",
  "repeater": {
    "enabled": true,
    "minItems": 0,
    "maxItems": 10,
    "itemSchema": [
      { "name": "company", "type": "string", "label": "Company", "required": true },
      { "name": "title", "type": "string", "label": "Title", "required": true },
      { "name": "startDate", "type": "date", "label": "Start Date", "required": true },
      { "name": "endDate", "type": "date", "label": "End Date" },
      { "name": "description", "type": "string", "label": "Description" }
    ],
    "allowDuplication": false,
    "collapsible": true
  }
}
```

---

### 7. Multi-Page Forms

Break complex forms into logical sections.

```json
{
  "multiPage": {
    "enabled": true,
    "showStepIndicator": true,
    "stepIndicatorStyle": "progress",
    "allowJumpToPage": false,
    "validateOnPageChange": true,
    "showPageTitles": true,
    "submitButtonLabel": "Complete Onboarding",
    "showReviewPage": true,
    "pages": [
      {
        "id": "page-1",
        "title": "Personal Information",
        "description": "Your basic contact details",
        "fields": ["firstName", "lastName", "email"],
        "order": 1
      }
    ]
  }
}
```

**Step Indicator Styles:**
- `dots` - Simple dot indicators
- `numbers` - Numbered steps
- `progress` - Progress bar
- `tabs` - Tab navigation

---

### 8. Form Variables

State management for form behavior.

```json
{
  "variables": [
    {
      "name": "selectedDepartment",
      "type": "string",
      "valueSource": {
        "type": "field",
        "fieldPath": "departmentCode"
      }
    },
    {
      "name": "isNewHire",
      "type": "boolean",
      "defaultValue": true
    }
  ]
}
```

**Value Source Types:**
- `static` - Fixed default value
- `field` - Mirror another field's value
- `formula` - Calculated value
- `url-param` - From URL query parameter

---

### 9. Mode Configuration

Control field behavior per form mode.

```json
{
  "path": "employeeId",
  "modeConfig": {
    "editableIn": ["create"],
    "visibleIn": ["create", "edit", "view"]
  }
}
```

Field is editable only during creation, read-only in edit mode.

---

### 10. Form Lifecycle

Configure what happens on form submission.

```json
{
  "lifecycle": {
    "create": {
      "defaults": {
        "status": "active",
        "isFullTime": true
      },
      "onSubmit": {
        "mode": "insert",
        "transforms": {
          "addFields": { "createdAt": "$$NOW" }
        },
        "success": {
          "action": "toast",
          "message": "Employee created!"
        }
      }
    },
    "edit": {
      "immutableFields": ["employeeId"],
      "onSubmit": {
        "mode": "update",
        "transforms": {
          "addFields": { "updatedAt": "$$NOW" }
        }
      }
    }
  }
}
```

---

### 11. Theming

Customize form appearance.

```json
{
  "theme": {
    "primaryColor": "#00ED64",
    "secondaryColor": "#001E2B",
    "backgroundColor": "#FAFAFA",
    "surfaceColor": "#FFFFFF",
    "borderRadius": 8,
    "spacing": "comfortable",
    "inputStyle": "outlined",
    "buttonStyle": "contained",
    "elevation": 1,
    "mode": "light"
  }
}
```

---

## Testing the Forms

### Via API

```bash
# Create form from JSON
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d @employee-onboarding-form.json

# Access published form
open http://localhost:3000/forms/employee-onboarding
```

### Via Form Builder UI

1. Navigate to the Form Builder
2. Select database: `form_builder_test`
3. Select collection: `employees` or `products`
4. Import the JSON configuration

---

## Best Practices Demonstrated

1. **Logical Page Grouping** - Related fields on same page
2. **Progressive Disclosure** - Conditional fields reduce clutter
3. **Inline Help** - Description blocks explain complex sections
4. **Visual Hierarchy** - Section headers organize content
5. **Computed Summaries** - Auto-calculate totals/percentages
6. **Smart Defaults** - Reduce user input where possible
7. **Validation** - Min/max constraints prevent errors
8. **Flexible Data** - Key-value pattern for extensibility
