'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  alpha,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add,
  Title,
  Notes,
  HorizontalRule,
  Image,
  SpaceBar,
  TextFields,
  Input
} from '@mui/icons-material';
import { FieldConfig, FieldSource, LayoutConfig, LayoutFieldType } from '@/types/form';
import { generateFieldPath } from '@/utils/fieldPath';

interface AddCustomFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (field: FieldConfig) => void;
  existingPaths: string[];
}

// Data input field types
const DATA_FIELD_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'array', label: 'Array (List)' },
  { value: 'array-object', label: 'Array of Objects' },
  { value: 'object', label: 'Object' }
];

// Layout/display-only field types (like Google Forms)
const LAYOUT_FIELD_TYPES: { value: LayoutFieldType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'section-header',
    label: 'Section Header',
    description: 'Title and description to organize form sections',
    icon: <Title fontSize="small" />
  },
  {
    value: 'description',
    label: 'Text Block',
    description: 'Instructions, help text, or information',
    icon: <Notes fontSize="small" />
  },
  {
    value: 'divider',
    label: 'Divider',
    description: 'Visual separator line',
    icon: <HorizontalRule fontSize="small" />
  },
  {
    value: 'image',
    label: 'Image',
    description: 'Display an image in the form',
    icon: <Image fontSize="small" />
  },
  {
    value: 'spacer',
    label: 'Spacer',
    description: 'Empty vertical space',
    icon: <SpaceBar fontSize="small" />
  }
];

export function AddCustomFieldDialog({
  open,
  onClose,
  onAdd,
  existingPaths
}: AddCustomFieldDialogProps) {
  // Tab state: 0 = Data Field, 1 = Layout Element
  const [activeTab, setActiveTab] = useState(0);

  // Data field state
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('string');
  const [isRequired, setIsRequired] = useState(false);
  const [includeInDocument, setIncludeInDocument] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [defaultValue, setDefaultValue] = useState('');

  // Layout field state
  const [layoutType, setLayoutType] = useState<LayoutFieldType>('section-header');
  const [layoutTitle, setLayoutTitle] = useState('');
  const [layoutSubtitle, setLayoutSubtitle] = useState('');
  const [layoutContent, setLayoutContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [spacerHeight, setSpacerHeight] = useState(24);

  const [error, setError] = useState<string | null>(null);

  // Generate clean path for layout fields
  const generateLayoutPath = (title: string, type: string) => {
    const baseName = title || type.replace('-', ' ');
    return generateFieldPath(baseName, existingPaths);
  };

  const handleFieldNameChange = (value: string) => {
    // Convert to valid path format (camelCase, no spaces)
    const sanitized = value
      .replace(/[^a-zA-Z0-9._]/g, '')
      .replace(/\s+/g, '');
    setFieldName(sanitized);

    // Auto-generate label if not manually set
    if (!fieldLabel || fieldLabel === generateLabel(fieldName)) {
      setFieldLabel(generateLabel(sanitized));
    }

    // Clear error when typing
    setError(null);
  };

  const generateLabel = (path: string): string => {
    if (!path) return '';
    // Convert camelCase or dot notation to readable label
    return path
      .split('.')
      .pop()!
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleSubmitDataField = () => {
    // Validate field name
    if (!fieldName.trim()) {
      setError('Field name is required');
      return;
    }

    // Check for duplicate paths
    if (existingPaths.includes(fieldName)) {
      setError('A field with this path already exists');
      return;
    }

    // Validate field name format
    if (!/^[a-zA-Z][a-zA-Z0-9._]*$/.test(fieldName)) {
      setError('Field name must start with a letter and contain only letters, numbers, dots, and underscores');
      return;
    }

    // Parse default value based on type
    let parsedDefaultValue: any = defaultValue;
    if (fieldType === 'number' && defaultValue) {
      parsedDefaultValue = Number(defaultValue);
    } else if (fieldType === 'boolean') {
      parsedDefaultValue = defaultValue === 'true';
    } else if (fieldType === 'array' || fieldType === 'array-object') {
      parsedDefaultValue = [];
    } else if (fieldType === 'object') {
      parsedDefaultValue = {};
    }

    const newField: FieldConfig = {
      path: fieldName,
      label: fieldLabel || generateLabel(fieldName),
      type: fieldType,
      included: true,
      required: isRequired,
      source: 'custom' as FieldSource,
      includeInDocument,
      placeholder: placeholder || undefined,
      defaultValue: parsedDefaultValue || undefined
    };

    onAdd(newField);
    handleClose();
  };

  const handleSubmitLayoutField = () => {
    // For section-header and description, require content
    if (layoutType === 'section-header' && !layoutTitle.trim()) {
      setError('Section title is required');
      return;
    }
    if (layoutType === 'description' && !layoutContent.trim()) {
      setError('Text content is required');
      return;
    }
    if (layoutType === 'image' && !imageUrl.trim()) {
      setError('Image URL is required');
      return;
    }

    // Build layout config
    const layoutConfig: LayoutConfig = {
      type: layoutType,
      ...(layoutType === 'section-header' && {
        title: layoutTitle,
        subtitle: layoutSubtitle || undefined
      }),
      ...(layoutType === 'description' && {
        content: layoutContent,
        contentType: 'text' as const
      }),
      ...(layoutType === 'image' && {
        imageUrl,
        imageAlt: layoutTitle || 'Form image',
        imageWidth: 'auto' as const,
        imageAlignment: 'center' as const
      }),
      ...(layoutType === 'spacer' && {
        height: spacerHeight
      })
    };

    // Create field with layout type
    const label = layoutTitle || LAYOUT_FIELD_TYPES.find(t => t.value === layoutType)?.label || 'Layout Element';
    const newField: FieldConfig = {
      path: generateLayoutPath(layoutTitle, layoutType),
      label,
      type: layoutType, // Use layout type as field type
      included: true,
      required: false,
      source: 'custom' as FieldSource,
      includeInDocument: false, // Layout fields never go in document
      layout: layoutConfig
    };

    onAdd(newField);
    handleClose();
  };

  const handleSubmit = () => {
    if (activeTab === 0) {
      handleSubmitDataField();
    } else {
      handleSubmitLayoutField();
    }
  };

  const handleClose = () => {
    // Reset form
    setActiveTab(0);
    setFieldName('');
    setFieldLabel('');
    setFieldType('string');
    setIsRequired(false);
    setIncludeInDocument(true);
    setPlaceholder('');
    setDefaultValue('');
    setLayoutType('section-header');
    setLayoutTitle('');
    setLayoutSubtitle('');
    setLayoutContent('');
    setImageUrl('');
    setSpacerHeight(24);
    setError(null);
    onClose();
  };

  // Render data field form
  const renderDataFieldForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        Create a custom field that doesn't exist in the collection schema.
        This can be used for lookups, calculations, or temporary form values.
      </Typography>

      {/* Field Name */}
      <TextField
        label="Field Name (Path)"
        value={fieldName}
        onChange={(e) => handleFieldNameChange(e.target.value)}
        error={!!error && activeTab === 0}
        helperText={(activeTab === 0 && error) || 'Use dot notation for nested fields (e.g., "address.city")'}
        fullWidth
        autoFocus={activeTab === 0}
        InputProps={{
          sx: { fontFamily: 'monospace' }
        }}
      />

      {/* Field Label */}
      <TextField
        label="Display Label"
        value={fieldLabel}
        onChange={(e) => setFieldLabel(e.target.value)}
        fullWidth
        helperText="How this field will be labeled in the form"
      />

      {/* Field Type */}
      <FormControl fullWidth>
        <InputLabel>Field Type</InputLabel>
        <Select
          value={fieldType}
          label="Field Type"
          onChange={(e) => setFieldType(e.target.value)}
        >
          {DATA_FIELD_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Placeholder */}
      <TextField
        label="Placeholder"
        value={placeholder}
        onChange={(e) => setPlaceholder(e.target.value)}
        fullWidth
        helperText="Hint text shown when field is empty"
      />

      {/* Default Value */}
      {fieldType !== 'array' && fieldType !== 'array-object' && fieldType !== 'object' && (
        <TextField
          label="Default Value"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          fullWidth
          type={fieldType === 'number' ? 'number' : 'text'}
          helperText={
            fieldType === 'boolean'
              ? 'Enter "true" or "false"'
              : 'Initial value for this field'
          }
        />
      )}

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
            />
          }
          label="Required"
        />
        <FormControlLabel
          control={
            <Switch
              checked={includeInDocument}
              onChange={(e) => setIncludeInDocument(e.target.checked)}
            />
          }
          label="Include in Document"
        />
      </Box>

      {!includeInDocument && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha('#00ED64', 0.05),
            borderRadius: 1,
            border: '1px solid',
            borderColor: alpha('#00ED64', 0.2)
          }}
        >
          <Typography variant="caption" color="text.secondary">
            This field will be available in the form for user input and can be used in
            calculations/lookups, but its value won't be included in the final document
            when inserting into MongoDB.
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Render layout element form
  const renderLayoutFieldForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        Add display-only elements like headers, instructions, or visual separators.
        These don't collect data - they help organize and explain the form.
      </Typography>

      {/* Layout Type Selection */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {LAYOUT_FIELD_TYPES.map((type) => (
          <Paper
            key={type.value}
            elevation={0}
            onClick={() => {
              setLayoutType(type.value);
              setError(null);
            }}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: layoutType === type.value ? '#00ED64' : 'divider',
              bgcolor: layoutType === type.value ? alpha('#00ED64', 0.05) : 'background.paper',
              borderRadius: 1,
              flex: '1 1 calc(50% - 8px)',
              minWidth: 140,
              transition: 'all 0.15s',
              '&:hover': {
                borderColor: layoutType === type.value ? '#00ED64' : alpha('#00ED64', 0.5)
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ color: layoutType === type.value ? '#00ED64' : 'text.secondary' }}>
                {type.icon}
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {type.label}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {type.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Type-specific fields */}
      {layoutType === 'section-header' && (
        <>
          <TextField
            label="Section Title"
            value={layoutTitle}
            onChange={(e) => {
              setLayoutTitle(e.target.value);
              setError(null);
            }}
            error={!!error && activeTab === 1}
            helperText={(activeTab === 1 && error) || 'Main heading for this section'}
            fullWidth
            autoFocus
          />
          <TextField
            label="Subtitle / Description"
            value={layoutSubtitle}
            onChange={(e) => setLayoutSubtitle(e.target.value)}
            fullWidth
            multiline
            rows={2}
            helperText="Optional description below the title"
          />
        </>
      )}

      {layoutType === 'description' && (
        <TextField
          label="Text Content"
          value={layoutContent}
          onChange={(e) => {
            setLayoutContent(e.target.value);
            setError(null);
          }}
          error={!!error && activeTab === 1}
          helperText={(activeTab === 1 && error) || 'Instructions, help text, or information to display'}
          fullWidth
          multiline
          rows={4}
          autoFocus
        />
      )}

      {layoutType === 'image' && (
        <>
          <TextField
            label="Image URL"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setError(null);
            }}
            error={!!error && activeTab === 1}
            helperText={(activeTab === 1 && error) || 'URL of the image to display'}
            fullWidth
            autoFocus
          />
          <TextField
            label="Alt Text / Caption"
            value={layoutTitle}
            onChange={(e) => setLayoutTitle(e.target.value)}
            fullWidth
            helperText="Descriptive text for the image"
          />
        </>
      )}

      {layoutType === 'spacer' && (
        <TextField
          label="Height (pixels)"
          value={spacerHeight}
          onChange={(e) => setSpacerHeight(Number(e.target.value) || 24)}
          type="number"
          inputProps={{ min: 8, max: 200 }}
          fullWidth
          helperText="Amount of vertical space to add"
        />
      )}

      {layoutType === 'divider' && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha('#00ED64', 0.05),
            borderRadius: 1,
            border: '1px solid',
            borderColor: alpha('#00ED64', 0.2),
            textAlign: 'center'
          }}
        >
          <HorizontalRule sx={{ color: 'text.secondary', fontSize: 32 }} />
          <Typography variant="caption" color="text.secondary">
            A simple horizontal line will be added to visually separate sections.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Add sx={{ color: '#00ED64' }} />
        Add Custom Element
      </DialogTitle>

      {/* Tabs for Data Field vs Layout Element */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setError(null);
          }}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab
            icon={<Input fontSize="small" />}
            iconPosition="start"
            label="Data Field"
            sx={{ '&.Mui-selected': { color: '#00ED64' } }}
          />
          <Tab
            icon={<TextFields fontSize="small" />}
            iconPosition="start"
            label="Layout Element"
            sx={{ '&.Mui-selected': { color: '#9c27b0' } }}
          />
        </Tabs>
      </Box>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {activeTab === 0 ? renderDataFieldForm() : renderLayoutFieldForm()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<Add />}
          sx={{
            bgcolor: activeTab === 0 ? '#00ED64' : '#9c27b0',
            '&:hover': { bgcolor: activeTab === 0 ? '#00CC55' : '#7b1fa2' }
          }}
        >
          {activeTab === 0 ? 'Add Field' : 'Add Element'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
