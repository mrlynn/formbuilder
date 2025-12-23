'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  alpha,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Tooltip,
  Button
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Settings,
  Add,
  Edit,
  Visibility,
  ContentCopy,
  Delete,
  Save,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  FormLifecycle,
  SubmitConfig,
  DeleteConfig,
  ActionSuccessConfig,
  ActionErrorConfig,
  FieldConfig
} from '@/types/form';
import { getDefaultLifecycle } from '@/lib/formRuntime';
import { HelpButton } from '@/components/Help';

interface LifecycleConfigEditorProps {
  config?: FormLifecycle;
  collection: string;
  fieldConfigs: FieldConfig[];
  onChange: (lifecycle: FormLifecycle) => void;
}

type ModeTab = 'create' | 'edit' | 'view' | 'clone';

const modeIcons: Record<ModeTab, React.ReactElement> = {
  create: <Add fontSize="small" />,
  edit: <Edit fontSize="small" />,
  view: <Visibility fontSize="small" />,
  clone: <ContentCopy fontSize="small" />
};

const modeDescriptions: Record<ModeTab, string> = {
  create: 'New document creation - defaults apply',
  edit: 'Existing document editing - can delete',
  view: 'Read-only display mode',
  clone: 'Copy existing into new document'
};

export function LifecycleConfigEditor({
  config,
  collection,
  fieldConfigs,
  onChange
}: LifecycleConfigEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ModeTab>('create');

  // Use provided config or generate defaults
  const lifecycle = config || getDefaultLifecycle(collection);

  const handleUpdate = (updates: Partial<FormLifecycle>) => {
    onChange({ ...lifecycle, ...updates });
  };

  const updateSubmitConfig = (mode: 'create' | 'edit' | 'clone', updates: Partial<SubmitConfig>) => {
    const modeConfig = lifecycle[mode];
    const defaultConfig = getDefaultLifecycle(collection)[mode];
    const currentSubmit = modeConfig?.onSubmit || defaultConfig?.onSubmit;

    handleUpdate({
      [mode]: {
        ...modeConfig,
        onSubmit: { ...currentSubmit, ...updates } as SubmitConfig
      }
    });
  };

  const updateDeleteConfig = (updates: Partial<DeleteConfig>) => {
    const editConfig = lifecycle.edit;
    const defaultEdit = getDefaultLifecycle(collection).edit!;
    const currentDelete = editConfig?.onDelete || defaultEdit.onDelete;
    const currentSubmit = editConfig?.onSubmit || defaultEdit.onSubmit;

    handleUpdate({
      edit: {
        onSubmit: currentSubmit,
        ...editConfig,
        onDelete: { ...currentDelete, ...updates } as DeleteConfig
      }
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 1,
          px: 1.5,
          borderRadius: 1,
          bgcolor: expanded ? alpha('#9c27b0', 0.08) : 'transparent',
          '&:hover': { bgcolor: alpha('#9c27b0', 0.05) }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings fontSize="small" sx={{ color: '#9c27b0' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Form Lifecycle
          </Typography>
          <HelpButton topicId="form-lifecycle" tooltip="Form Lifecycle Help" size="small" />
          {config && (
            <Chip
              label="Configured"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                bgcolor: alpha('#9c27b0', 0.1),
                color: '#9c27b0'
              }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Paper
          elevation={0}
          sx={{
            mt: 1,
            p: 2,
            bgcolor: alpha('#9c27b0', 0.03),
            border: '1px solid',
            borderColor: alpha('#9c27b0', 0.15),
            borderRadius: 1
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Configure how the form behaves in each mode: create, edit, view, and clone.
          </Typography>

          {/* Mode Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 40,
              mb: 2,
              '& .MuiTab-root': {
                minHeight: 40,
                py: 1,
                textTransform: 'none',
                fontSize: '0.8rem'
              }
            }}
          >
            {(['create', 'edit', 'view', 'clone'] as ModeTab[]).map((mode) => (
              <Tab
                key={mode}
                value={mode}
                icon={modeIcons[mode]}
                iconPosition="start"
                label={mode.charAt(0).toUpperCase() + mode.slice(1)}
              />
            ))}
          </Tabs>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {modeDescriptions[activeTab]}
          </Typography>

          {/* Create Mode Config */}
          {activeTab === 'create' && (
            <CreateModeConfig
              config={lifecycle.create}
              collection={collection}
              fieldConfigs={fieldConfigs}
              onUpdateSubmit={(updates) => updateSubmitConfig('create', updates)}
            />
          )}

          {/* Edit Mode Config */}
          {activeTab === 'edit' && (
            <EditModeConfig
              config={lifecycle.edit}
              collection={collection}
              fieldConfigs={fieldConfigs}
              onUpdateSubmit={(updates) => updateSubmitConfig('edit', updates)}
              onUpdateDelete={updateDeleteConfig}
              onUpdateImmutableFields={(fields) => {
                const editConfig = lifecycle.edit;
                const defaultEdit = getDefaultLifecycle(collection).edit!;
                handleUpdate({
                  edit: {
                    onSubmit: editConfig?.onSubmit || defaultEdit.onSubmit,
                    ...editConfig,
                    immutableFields: fields
                  }
                });
              }}
            />
          )}

          {/* View Mode Config */}
          {activeTab === 'view' && (
            <ViewModeConfig
              config={lifecycle.view}
              onUpdate={(updates) => handleUpdate({ view: updates })}
            />
          )}

          {/* Clone Mode Config */}
          {activeTab === 'clone' && (
            <CloneModeConfig
              config={lifecycle.clone}
              collection={collection}
              fieldConfigs={fieldConfigs}
              onUpdateSubmit={(updates) => updateSubmitConfig('clone', updates)}
              onUpdateClearFields={(fields) => {
                const cloneConfig = lifecycle.clone;
                const defaultClone = getDefaultLifecycle(collection).clone!;
                handleUpdate({
                  clone: {
                    onSubmit: cloneConfig?.onSubmit || defaultClone.onSubmit,
                    ...cloneConfig,
                    clearFields: fields
                  }
                });
              }}
            />
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}

// ============================================
// Mode-specific Config Components
// ============================================

interface CreateModeConfigProps {
  config?: FormLifecycle['create'];
  collection: string;
  fieldConfigs: FieldConfig[];
  onUpdateSubmit: (updates: Partial<SubmitConfig>) => void;
}

function CreateModeConfig({ config, collection, fieldConfigs, onUpdateSubmit }: CreateModeConfigProps) {
  const submitConfig = config?.onSubmit;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Submit Configuration */}
      <SubmitConfigSection
        config={submitConfig}
        collection={collection}
        onUpdate={onUpdateSubmit}
        defaultMode="insert"
      />

      <Divider />

      {/* Default Values Section */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Default Values
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Set default values for fields when creating new documents. Field-level defaults take precedence.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          sx={{ fontSize: '0.7rem' }}
        >
          Add Default Value
        </Button>
      </Box>
    </Box>
  );
}

interface EditModeConfigProps {
  config?: FormLifecycle['edit'];
  collection: string;
  fieldConfigs: FieldConfig[];
  onUpdateSubmit: (updates: Partial<SubmitConfig>) => void;
  onUpdateDelete: (updates: Partial<DeleteConfig>) => void;
  onUpdateImmutableFields: (fields: string[]) => void;
}

function EditModeConfig({ config, collection, fieldConfigs, onUpdateSubmit, onUpdateDelete, onUpdateImmutableFields }: EditModeConfigProps) {
  const submitConfig = config?.onSubmit;
  const deleteConfig = config?.onDelete;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Submit Configuration */}
      <SubmitConfigSection
        config={submitConfig}
        collection={collection}
        onUpdate={onUpdateSubmit}
        defaultMode="update"
      />

      <Divider />

      {/* Delete Configuration */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Delete Action
        </Typography>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={deleteConfig?.enabled !== false}
              onChange={(e) => onUpdateDelete({ enabled: e.target.checked })}
            />
          }
          label={<Typography variant="caption">Enable delete action</Typography>}
        />

        {deleteConfig?.enabled !== false && (
          <Box sx={{ mt: 1, pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              label="Confirmation Title"
              value={deleteConfig?.confirm?.title || 'Delete Document'}
              onChange={(e) => onUpdateDelete({
                confirm: { ...deleteConfig?.confirm!, title: e.target.value }
              })}
              fullWidth
            />
            <TextField
              size="small"
              label="Confirmation Message"
              value={deleteConfig?.confirm?.message || 'Are you sure?'}
              onChange={(e) => onUpdateDelete({
                confirm: { ...deleteConfig?.confirm!, message: e.target.value }
              })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Immutable Fields */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Immutable Fields
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Fields that cannot be edited in edit mode (read-only after creation).
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {fieldConfigs.slice(0, 10).map((field) => (
            <Chip
              key={field.path}
              label={field.path}
              size="small"
              variant={config?.immutableFields?.includes(field.path) ? 'filled' : 'outlined'}
              onClick={() => {
                const current = config?.immutableFields || [];
                const updated = current.includes(field.path)
                  ? current.filter(f => f !== field.path)
                  : [...current, field.path];
                onUpdateImmutableFields(updated);
              }}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

interface ViewModeConfigProps {
  config?: FormLifecycle['view'];
  onUpdate: (updates: Partial<NonNullable<FormLifecycle['view']>>) => void;
}

function ViewModeConfig({ config, onUpdate }: ViewModeConfigProps) {
  const actions = config?.actions || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
        Available Actions
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Actions shown in view mode (e.g., Edit, Clone, Delete buttons).
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['edit', 'clone', 'delete'].map((action) => {
          const isEnabled = actions.some(a => a.action === action);
          return (
            <Chip
              key={action}
              label={action.charAt(0).toUpperCase() + action.slice(1)}
              size="small"
              variant={isEnabled ? 'filled' : 'outlined'}
              color={action === 'delete' ? 'error' : 'default'}
              onClick={() => {
                if (isEnabled) {
                  onUpdate({ actions: actions.filter(a => a.action !== action) });
                } else {
                  onUpdate({
                    actions: [...actions, {
                      id: action,
                      label: action.charAt(0).toUpperCase() + action.slice(1),
                      action: action as 'edit' | 'clone' | 'delete'
                    }]
                  });
                }
              }}
              sx={{ cursor: 'pointer' }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

interface CloneModeConfigProps {
  config?: FormLifecycle['clone'];
  collection: string;
  fieldConfigs: FieldConfig[];
  onUpdateSubmit: (updates: Partial<SubmitConfig>) => void;
  onUpdateClearFields: (fields: string[]) => void;
}

function CloneModeConfig({ config, collection, fieldConfigs, onUpdateSubmit, onUpdateClearFields }: CloneModeConfigProps) {
  const submitConfig = config?.onSubmit;
  const clearFields = config?.clearFields || ['_id', 'createdAt', 'updatedAt'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Submit Configuration */}
      <SubmitConfigSection
        config={submitConfig}
        collection={collection}
        onUpdate={onUpdateSubmit}
        defaultMode="insert"
      />

      <Divider />

      {/* Fields to Clear */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Clear Fields When Cloning
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          These fields will be cleared when cloning a document (new values required).
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {['_id', 'createdAt', 'updatedAt', ...fieldConfigs.slice(0, 5).map(f => f.path)].map((field) => (
            <Chip
              key={field}
              label={field}
              size="small"
              variant={clearFields.includes(field) ? 'filled' : 'outlined'}
              onClick={() => {
                const updated = clearFields.includes(field)
                  ? clearFields.filter(f => f !== field)
                  : [...clearFields, field];
                onUpdateClearFields(updated);
              }}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ============================================
// Shared Submit Config Component
// ============================================

interface SubmitConfigSectionProps {
  config?: SubmitConfig;
  collection: string;
  onUpdate: (updates: Partial<SubmitConfig>) => void;
  defaultMode: 'insert' | 'update' | 'upsert';
}

function SubmitConfigSection({ config, collection, onUpdate, defaultMode }: SubmitConfigSectionProps) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
        Submit Behavior
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Submit Mode</InputLabel>
          <Select
            value={config?.mode || defaultMode}
            label="Submit Mode"
            onChange={(e) => onUpdate({ mode: e.target.value as SubmitConfig['mode'] })}
          >
            <MenuItem value="insert">Insert (create new)</MenuItem>
            <MenuItem value="update">Update (modify existing)</MenuItem>
            <MenuItem value="upsert">Upsert (create or update)</MenuItem>
            <MenuItem value="custom">Custom (webhook)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Collection"
          value={config?.collection || collection}
          onChange={(e) => onUpdate({ collection: e.target.value })}
          placeholder={collection}
          fullWidth
        />

        {/* Success Action */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>On Success</InputLabel>
            <Select
              value={config?.success?.action || 'toast'}
              label="On Success"
              onChange={(e) => onUpdate({
                success: { ...config?.success, action: e.target.value as ActionSuccessConfig['action'] }
              })}
            >
              <MenuItem value="toast">Show Toast</MenuItem>
              <MenuItem value="navigate">Navigate</MenuItem>
              <MenuItem value="refresh">Refresh</MenuItem>
              <MenuItem value="close">Close</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Success Message"
            value={config?.success?.message || ''}
            onChange={(e) => onUpdate({
              success: { ...config?.success!, message: e.target.value }
            })}
            sx={{ flex: 1 }}
            placeholder="Document saved successfully"
          />
        </Box>

        {/* Error Action */}
        <FormControl size="small">
          <InputLabel>On Error</InputLabel>
          <Select
            value={config?.error?.action || 'toast'}
            label="On Error"
            onChange={(e) => onUpdate({
              error: { ...config?.error, action: e.target.value as ActionErrorConfig['action'] }
            })}
          >
            <MenuItem value="toast">Show Toast</MenuItem>
            <MenuItem value="inline">Inline Error</MenuItem>
            <MenuItem value="modal">Error Modal</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
