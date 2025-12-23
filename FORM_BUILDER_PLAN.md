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

---

## UI Simplification Framework

> **Goal:** Dramatically simplify the layout and make it beautiful and intuitive WITHOUT removing any existing functionality.

### Audit Framework: Categorizing UI Elements

#### Usage Frequency Matrix

| Category | Definition | Target Visibility | Examples |
|----------|------------|-------------------|----------|
| **Core** | Used in >80% of sessions | Always visible | Save, Add Field, Preview |
| **Frequent** | Used in 40-80% of sessions | One click away | Field validation, Conditional logic |
| **Occasional** | Used in 10-40% of sessions | Two clicks or contextual | Custom CSS, Advanced field options |
| **Rare** | Used in <10% of sessions | Settings/Advanced panels | Schema export, Webhook config |

#### User Journey Stage Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│  CREATION          CONFIGURATION       REFINEMENT      DEPLOY   │
│  ─────────         ─────────────       ──────────      ──────   │
│  • Add fields      • Validation        • Styling       • Publish │
│  • Reorder         • Conditionals      • Custom code   • Embed   │
│  • Basic labels    • Data mapping      • A11y tweaks   • Share   │
│  • Field types     • Required/optional • Performance   • Export  │
│                                                                  │
│  [PRIMARY]         [SECONDARY]         [TERTIARY]     [FINAL]   │
└─────────────────────────────────────────────────────────────────┘
```

#### UI Element Audit Tracker

| Element | Category | Journey Stage | Current Location | Proposed Location | Status |
|---------|----------|---------------|------------------|-------------------|--------|
| "Add Field" button | Core | Creation | FAB + toolbar | FAB only (bottom-right) | [x] |
| Form name/status | Core | All | Multiple chips in toolbar | Single text + icon | [x] |
| Save button | Core | All | Toolbar with icon | Toolbar, text only | [x] |
| Publish button | Core | Deploy | Toolbar | Toolbar (primary CTA) | [x] |
| My Forms | Frequent | All | Toolbar button | Icon button with tooltip | [x] |
| Settings | Frequent | Configuration | Toolbar button | Icon button with tooltip | [x] |
| View Published | Occasional | Deploy | Toolbar icon | More menu | [x] |
| New Form | Occasional | Creation | Toolbar (conditional) | More menu | [x] |
| Storage Config | Occasional | Configuration | Chip in toolbar | Contextual chip OR More menu | [x] |
| Insert Test Doc | Rare | Testing | Toolbar menu | More menu | [x] |
| Field validation | Frequent | Configuration | FieldDetailPanel | Inspector panel accordion | [ ] |
| Export JSON Schema | Rare | Deploy | Not implemented | Settings > Export | [ ] |

---

### Simplification Patterns

#### Pattern A: Progressive Disclosure Layers ("Iceberg" Model)

Show 20% of functionality that handles 80% of use cases.

```
Layer 0: Visible by default (Core features)
    │
    ├── Layer 1: One interaction away (Click/hover reveals)
    │       │
    │       └── Layer 2: Intentional access (Panel/modal/settings)
    │               │
    │               └── Layer 3: Expert mode (Full configuration)
```

**Implementation:**
```tsx
<FieldEditor>
  <BasicOptions />           {/* Always visible */}
  <Expandable label="Validation">
    <ValidationOptions />    {/* Layer 1 */}
  </Expandable>
  <Expandable label="Advanced">
    <AdvancedOptions />      {/* Layer 2 */}
  </Expandable>
</FieldEditor>
```

#### Pattern B: Contextual Tooling

Tools appear where and when they're needed, not in a persistent toolbar.

**Hover Actions Pattern:**
```tsx
<FieldWrapper
  onMouseEnter={() => setShowActions(true)}
  onMouseLeave={() => setShowActions(false)}
>
  <FieldContent />
  {showActions && (
    <ActionBar position="right">
      <IconButton icon="edit" />
      <IconButton icon="duplicate" />
      <IconButton icon="delete" />
    </ActionBar>
  )}
</FieldWrapper>
```

#### Pattern C: Smart Defaults with Override

Make the common case automatic, the uncommon case possible.

```
┌────────────────────────────────────────┐
│  Max Length: 255 characters  [Change]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ☑️ Use default validation             │
│     └─ [Customize validation rules]    │
└────────────────────────────────────────┘
```

#### Pattern D: Mode-Based Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Form Builder                          [Simple] [Advanced]  │
├─────────────────────────────────────────────────────────────┤
│  SIMPLE MODE:                ADVANCED MODE:                 │
│  • Drag-drop fields          • All simple features, plus:   │
│  • Basic labels/required     • JSON schema editor           │
│  • Standard validation       • Custom validation regex      │
│  • Preview                   • Conditional logic builder    │
│                              • CSS overrides                │
└─────────────────────────────────────────────────────────────┘
```

#### Pattern E: The Inspector Panel

Consolidate all configuration into a right-side inspector (like Figma/Sketch):

```
┌──────────────────────┬─────────────────┐
│                      │  INSPECTOR      │
│                      │  ───────────    │
│   CANVAS             │  Field: Email   │
│   (Form Preview)     │                 │
│                      │  ▼ Basic        │
│                      │    Label: ___   │
│                      │    Required: ☐  │
│                      │                 │
│                      │  ▶ Validation   │
│                      │  ▶ Appearance   │
│                      │  ▶ Advanced     │
└──────────────────────┴─────────────────┘
```

---

### Visual Hierarchy Principles

#### The Calm Interface Checklist

- [x] **Reduce Visual Weight**: Remove toolbar backgrounds, use icons with tooltips, consolidate into overflow menus
- [x] **Whitespace as Structure**: Use consistent spacing scale (4/8/16/24/32px), separate sections with space not lines
- [x] **Color Restraint**: Brand color for CTAs only, neutrals for everything else
- [x] **Typography Hierarchy**: Max 3 levels visible at once (24px title, 16px section, 14px labels)
- [x] **Interactive State Clarity**: Subtle hover (4% black), clear selection (8% primary + border)

#### Color Palette

```
PRIMARY (use sparingly):
├── Action:     #1976d2 (MUI primary) — CTAs only
├── Destructive: #d32f2f (MUI error) — Delete only
└── Success:    #2e7d32 (MUI success) — Confirmations only

NEUTRAL (use liberally):
├── Text Primary:   rgba(0,0,0,0.87)
├── Text Secondary: rgba(0,0,0,0.60)
├── Borders:        rgba(0,0,0,0.12)
└── Backgrounds:    #fafafa, #ffffff
```

---

### Material UI Implementation Notes

#### Theme Customization for Calm UI

```tsx
const calmTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: { '&:before': { display: 'none' }, boxShadow: 'none' },
      },
    },
  },
});
```

#### Recommended Components by Pattern

| Pattern | MUI Components |
|---------|----------------|
| Progressive Disclosure | `Accordion`, `Collapse`, `Popover` |
| Contextual Actions | `SpeedDial`, `Menu`, `IconButton` |
| Inspector Panel | `Drawer` (persistent), `Tabs`, `Stack` |
| Smart Defaults | `Chip` (with edit popover), `Switch` |

---

### Engineering Team Alignment

#### Decision Evaluation Criteria

| Criterion | Question | Weight |
|-----------|----------|--------|
| **Discoverability** | Can a new user find this feature within 30 seconds? | High for Core |
| **Efficiency** | Can a power user access this in ≤2 clicks? | High for Frequent |
| **Clarity** | Is it obvious what this control does? | Always High |
| **Consistency** | Does it follow patterns established elsewhere? | Always High |

#### Common Pitfalls to Avoid

| Pitfall | Wrong | Right |
|---------|-------|-------|
| Removing Access | Remove JSON export button | Move to Settings > Export |
| Too Many Clicks | 6-level navigation to validation | Inspector panel with accordions |
| Inconsistent Disclosure | Mix of modals, accordions, pages | All field config in Inspector |
| Hidden Without Hints | Features exist with no indication | "Need more? [Show advanced]" |
| Modal Overload | Every config opens modal | Modals only for destructive/wizard/focus tasks |

#### Code Review Checklist for UI Changes

- [ ] No functionality removed — All features still accessible
- [ ] Consistent location — Similar features live in similar places
- [ ] Progressive disclosure — Complex options collapsed, not deleted
- [ ] Keyboard accessible — Can reach all features without mouse
- [ ] Loading states — Async operations show progress
- [ ] Error states — Failures clearly communicated
- [ ] Empty states — Guide users when there's no content

---

### UI Simplification Phases

#### Phase S1: Audit & Consolidate
- [x] Complete UI element audit using frequency matrix
- [x] Identify and eliminate duplicate controls (toolbar consolidated)
- [x] Establish Inspector panel pattern (FieldDetailPanel with accordions)
- [x] Create component library for progressive disclosure (Accordion-based sections)

#### Phase S2: Simplify Primary Flows
- [x] Redesign field addition flow (Quick-add row in AddQuestionDialog)
- [x] Implement contextual tooling for field manipulation (hover actions in CompactFieldList)
- [x] Apply smart defaults across all field types (QuestionTypePicker with placeholders & validation)
- [x] Reduce main toolbar to essential actions only

#### Phase S3: Organize Advanced Features
- [x] Create Settings architecture (FormSettingsDrawer with tabbed organization)
- [x] Build Simple/Advanced mode toggle (toolbar toggle, hides Logic & Security in simple mode)
- [x] Implement keyboard shortcuts for power users (Cmd+S save, Cmd+N add field, Cmd+, settings, Cmd+Shift+A toggle advanced, Escape close, Cmd+L library, ? help)
- [x] Add guided discovery for hidden features (KeyboardShortcutsHelp dialog, hints in simple mode)

#### Phase S4: Polish & Validate
- [x] Apply calm UI principles throughout (theme updated)
- [ ] Conduct usability testing (new + power users)
- [ ] Iterate based on metrics
- [x] Document patterns for future development (Implementation Patterns Reference section added)

---

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  UI SIMPLIFICATION QUICK REFERENCE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WHEN IN DOUBT:                                             │
│  • Hide, don't delete                                       │
│  • Default, don't require                                   │
│  • Suggest, don't demand                                    │
│  • Collapse, don't remove                                   │
│                                                             │
│  VISIBILITY RULE:                                           │
│  Core = Always visible                                      │
│  Frequent = One click                                       │
│  Occasional = Two clicks                                    │
│  Rare = Settings panel                                      │
│                                                             │
│  LOCATION RULE:                                             │
│  Field config → Inspector panel                             │
│  Form config → Settings modal                               │
│  Actions → Contextual menus                                 │
│  Navigation → Left sidebar                                  │
│                                                             │
│  CALM UI RULE:                                              │
│  Less color, more whitespace                                │
│  Less shadow, more border                                   │
│  Less text, more icons (with tooltips)                      │
│  Less chrome, more content                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Patterns Reference

This section documents the patterns implemented during the UI simplification effort for future development.

### Pattern 1: Progressive Disclosure with Accordions

**File:** `src/components/FormBuilder/FieldDetailPanel.tsx`

Always-visible basic settings (label, placeholder, required), with advanced options in collapsible accordions.

```tsx
// Basic settings always visible
<Box>
  <TextField label="Label" />
  <TextField label="Placeholder" />
  <Switch label="Required" />
</Box>

// Advanced options in accordions
<Accordion defaultExpanded>
  <AccordionSummary>Type Options</AccordionSummary>
  <AccordionDetails>...</AccordionDetails>
</Accordion>

{/* Only show if advanced mode OR has active config */}
{(advancedMode || config.lookup) && (
  <Accordion>
    <AccordionSummary>Logic & Data</AccordionSummary>
    <AccordionDetails>...</AccordionDetails>
  </Accordion>
)}
```

### Pattern 2: Contextual Hover Actions

**File:** `src/components/FormBuilder/CompactFieldList.tsx`

Actions hidden by default, revealed on hover or selection.

```tsx
<ListItemButton
  sx={{
    '& .field-actions': { opacity: 0, transition: 'opacity 0.15s' },
    '&:hover .field-actions': { opacity: 1 },
    '&.Mui-selected .field-actions': { opacity: 1 },
  }}
>
  <Content />
  <Box className="field-actions">
    <IconButton>...</IconButton>
  </Box>
</ListItemButton>
```

### Pattern 3: Simple/Advanced Mode Toggle

**File:** `src/components/FormBuilder/FormBuilder.tsx`

Global mode state passed to child components to show/hide advanced features.

```tsx
const [advancedMode, setAdvancedMode] = useState(false);

// In toolbar
<IconButton onClick={() => setAdvancedMode(!advancedMode)}>
  {advancedMode ? <Tune /> : <TuneOutlined />}
</IconButton>

// Pass to child components
<FieldDetailPanel advancedMode={advancedMode} />
```

### Pattern 4: Quick Add for Common Actions

**File:** `src/components/FormBuilder/AddQuestionDialog.tsx`

Quick-add buttons at top of dialog for most common field types.

```tsx
const QUICK_TYPES = [
  { id: 'short-text', label: 'Text', icon: <TextFields />, fieldType: 'string', defaultConfig: {...} },
  // ...
];

// Quick add row at top of dialog
<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
  {QUICK_TYPES.map((type) => (
    <ButtonBase onClick={() => handleQuickAdd(type)}>
      {type.icon} {type.label}
    </ButtonBase>
  ))}
</Box>
```

### Pattern 5: Smart Defaults

**File:** `src/components/FormBuilder/QuestionTypePicker.tsx`

Each field type has sensible defaults pre-configured.

```tsx
const QUESTION_TYPES = [
  {
    id: 'email',
    fieldType: 'email',
    defaultConfig: {
      placeholder: 'name@example.com',  // Helpful hint
    },
  },
  {
    id: 'short-text',
    fieldType: 'string',
    defaultConfig: {
      placeholder: 'Enter your answer',
      validation: { maxLength: 255 },  // Sensible limit
    },
  },
];
```

### Pattern 6: Keyboard Shortcuts with Discovery

**Files:** `src/components/FormBuilder/FormBuilder.tsx`, `src/components/FormBuilder/KeyboardShortcutsHelp.tsx`

Global keyboard handler with discoverable help dialog.

```tsx
// Keyboard handler
const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
  if (target.tagName === 'INPUT') return; // Don't trigger in inputs

  const cmdKey = isMac ? e.metaKey : e.ctrlKey;

  if (cmdKey && e.key === 's') { /* Save */ }
  if (e.key === '?') { setShortcutsHelpOpen(true); }
}, []);

// Menu item for discovery
<MenuItem onClick={() => setShortcutsHelpOpen(true)}>
  <Keyboard /> Keyboard Shortcuts
</MenuItem>
```

### Pattern 7: Consolidated Overflow Menu

**File:** `src/components/FormBuilder/FormBuilder.tsx`

Secondary actions moved to "More" menu to declutter toolbar.

```tsx
// Primary actions visible in toolbar
<Button>Save</Button>
<QuickPublishButton />

// Secondary actions in overflow menu
<IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
  <MoreVert />
</IconButton>
<Menu anchorEl={moreMenuAnchor}>
  <MenuItem>New Form</MenuItem>
  <MenuItem>View Published</MenuItem>
  <Divider />
  <MenuItem>Storage Settings</MenuItem>
  <MenuItem>Keyboard Shortcuts</MenuItem>
</Menu>
```

### Pattern 8: Theme-based Calm UI

**File:** `src/theme/theme.ts`

Shared component overrides for consistent calm styling.

```tsx
const sharedComponents = {
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: { borderRadius: 8, transition: 'all 0.15s ease' },
    },
  },
  MuiAccordion: {
    defaultProps: { disableGutters: true, elevation: 0 },
    styleOverrides: {
      root: { '&:before': { display: 'none' }, backgroundColor: 'transparent' },
    },
  },
  // ... more components
};
```

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save form |
| `Cmd/Ctrl + N` | Add new field |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + Shift + A` | Toggle advanced mode |
| `Cmd/Ctrl + L` | Toggle form library |
| `Escape` | Close panel/dialog |
| `?` | Show keyboard shortcuts help |

