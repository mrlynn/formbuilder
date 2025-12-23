'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Switch,
  List,
  ListItemButton,
  alpha,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  Add,
  Delete,
  Storage,
  DragIndicator,
  Title,
  Notes,
  HorizontalRule,
  Image,
  SpaceBar,
  Link as LinkIcon,
  Functions,
  Rule,
  ChevronRight,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { FieldConfig, LayoutFieldType } from '@/types/form';
import { AddQuestionDialog } from './AddQuestionDialog';
import { HelpButton } from '@/components/Help';

// Layout field types that don't have data input
const LAYOUT_FIELD_TYPES: LayoutFieldType[] = ['section-header', 'description', 'divider', 'image', 'spacer'];

// Get icon for layout field type
const getLayoutIcon = (type: LayoutFieldType) => {
  switch (type) {
    case 'section-header': return <Title fontSize="small" />;
    case 'description': return <Notes fontSize="small" />;
    case 'divider': return <HorizontalRule fontSize="small" />;
    case 'image': return <Image fontSize="small" />;
    case 'spacer': return <SpaceBar fontSize="small" />;
    default: return null;
  }
};

// Get feature badges for a field
const getFieldFeatures = (config: FieldConfig) => {
  const features: { icon: React.ReactNode; label: string; color: string }[] = [];

  if (config.conditionalLogic?.conditions?.length) {
    features.push({
      icon: <Rule sx={{ fontSize: 12 }} />,
      label: `${config.conditionalLogic.conditions.length} rule${config.conditionalLogic.conditions.length > 1 ? 's' : ''}`,
      color: '#00ED64'
    });
  }

  if (config.lookup) {
    features.push({
      icon: <LinkIcon sx={{ fontSize: 12 }} />,
      label: 'Lookup',
      color: '#2196f3'
    });
  }

  if (config.computed) {
    features.push({
      icon: <Functions sx={{ fontSize: 12 }} />,
      label: 'Computed',
      color: '#9c27b0'
    });
  }

  return features;
};

interface CompactFieldListProps {
  fieldConfigs: FieldConfig[];
  selectedPath: string | null;
  onSelectField: (path: string | null) => void;
  onUpdateField: (path: string, updates: Partial<FieldConfig>) => void;
  onAddField?: (field: FieldConfig) => void;
  onRemoveField?: (path: string) => void;
  onReorderFields?: (newOrder: FieldConfig[]) => void;
}

export function CompactFieldList({
  fieldConfigs,
  selectedPath,
  onSelectField,
  onUpdateField,
  onAddField,
  onRemoveField,
  onReorderFields
}: CompactFieldListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Separate schema fields from custom fields
  const schemaFields = fieldConfigs.filter((f) => f.source !== 'custom');
  const customFields = fieldConfigs.filter((f) => f.source === 'custom');

  const handleAddField = (field: FieldConfig) => {
    onAddField?.(field);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedField(path);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', path);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedField(null);
    setDragOverField(null);
    dragCounter.current = 0;
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragEnter = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (path !== draggedField) {
      setDragOverField(path);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverField(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setDragOverField(null);
    dragCounter.current = 0;

    if (!draggedField || draggedField === targetPath || !onReorderFields) return;

    const dragIndex = fieldConfigs.findIndex((f) => f.path === draggedField);
    const dropIndex = fieldConfigs.findIndex((f) => f.path === targetPath);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newConfigs = [...fieldConfigs];
    const [removed] = newConfigs.splice(dragIndex, 1);
    newConfigs.splice(dropIndex, 0, removed);
    onReorderFields(newConfigs);
    setDraggedField(null);
  };

  // Check if this is a layout field
  const isLayoutField = (config: FieldConfig) => {
    if (config.layout) return true;
    const normalizedType = config.type?.toLowerCase().trim();
    return LAYOUT_FIELD_TYPES.some(lt => lt === normalizedType);
  };

  const getFieldBorderColor = (config: FieldConfig, isSelected: boolean) => {
    if (isSelected) return '#00ED64';
    if (dragOverField === config.path) return '#00ED64';
    return 'transparent';
  };

  const getFieldBgColor = (config: FieldConfig, isSelected: boolean) => {
    if (isSelected) return alpha('#00ED64', 0.15);
    if (dragOverField === config.path) return alpha('#00ED64', 0.1);
    if (!config.included) return alpha('#000', 0.02);
    return 'transparent';
  };

  const handleToggleInclude = (e: React.MouseEvent, config: FieldConfig) => {
    e.stopPropagation();
    onUpdateField(config.path, { included: !config.included });
  };

  const handleDelete = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    onRemoveField?.(path);
    if (selectedPath === path) {
      onSelectField(null);
    }
  };

  const renderFieldItem = (config: FieldConfig) => {
    const isSelected = selectedPath === config.path;
    const isLayout = isLayoutField(config);
    const features = getFieldFeatures(config);

    return (
      <ListItemButton
        key={config.path}
        selected={isSelected}
        draggable={!!onReorderFields}
        onDragStart={(e) => handleDragStart(e, config.path)}
        onDragEnd={handleDragEnd}
        onDragEnter={(e) => handleDragEnter(e, config.path)}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, config.path)}
        onClick={() => onSelectField(isSelected ? null : config.path)}
        sx={{
          py: 0.75,
          px: 1,
          mb: 0.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: getFieldBorderColor(config, isSelected),
          bgcolor: getFieldBgColor(config, isSelected),
          opacity: config.included ? 1 : 0.5,
          cursor: onReorderFields ? 'grab' : 'pointer',
          transition: 'all 0.15s',
          '&:hover': {
            bgcolor: isSelected ? alpha('#00ED64', 0.15) : alpha('#00ED64', 0.05),
          },
          '&:active': onReorderFields ? { cursor: 'grabbing' } : {},
          '&.Mui-selected': {
            bgcolor: alpha('#00ED64', 0.15),
            '&:hover': {
              bgcolor: alpha('#00ED64', 0.2),
            }
          }
        }}
      >
        {/* Drag Handle */}
        {onReorderFields && (
          <DragIndicator
            fontSize="small"
            sx={{ color: 'text.disabled', mr: 0.5, fontSize: 16 }}
          />
        )}

        {/* Layout field icon */}
        {isLayout && (
          <Box sx={{ color: '#9c27b0', display: 'flex', alignItems: 'center', mr: 0.5 }}>
            {getLayoutIcon(config.type as LayoutFieldType)}
          </Box>
        )}

        {/* Field name and badges */}
        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSelected ? 600 : 400,
                fontFamily: isLayout ? 'inherit' : 'monospace',
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {isLayout ? (config.layout?.title || config.label || config.type) : config.path}
            </Typography>
            {config.required && (
              <Typography
                component="span"
                sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.9rem' }}
              >
                *
              </Typography>
            )}
          </Box>

          {/* Feature badges - compact inline display */}
          {features.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
              {features.map((feature, i) => (
                <Chip
                  key={i}
                  icon={feature.icon as React.ReactElement}
                  label={feature.label}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    bgcolor: alpha(feature.color, 0.1),
                    color: feature.color,
                    '& .MuiChip-icon': {
                      color: feature.color,
                      ml: 0.5
                    },
                    '& .MuiChip-label': {
                      px: 0.5
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Type chip - compact */}
        <Chip
          label={config.type}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.6rem',
            bgcolor: isLayout ? alpha('#9c27b0', 0.1) : alpha('#00ED64', 0.1),
            color: isLayout ? '#9c27b0' : '#00ED64',
            mr: 0.5
          }}
        />

        {/* Include/exclude toggle */}
        {!isLayout && (
          <Tooltip title={config.included ? 'Included in form' : 'Excluded from form'}>
            <IconButton
              size="small"
              onClick={(e) => handleToggleInclude(e, config)}
              sx={{
                p: 0.25,
                color: config.included ? '#00ED64' : 'text.disabled'
              }}
            >
              {config.included ? (
                <Visibility sx={{ fontSize: 16 }} />
              ) : (
                <VisibilityOff sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete button for custom fields */}
        {config.source === 'custom' && onRemoveField && (
          <Tooltip title="Remove">
            <IconButton
              size="small"
              onClick={(e) => handleDelete(e, config.path)}
              sx={{ p: 0.25, color: 'error.main' }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Selection indicator */}
        <ChevronRight
          sx={{
            fontSize: 18,
            color: isSelected ? '#00ED64' : 'text.disabled',
            transition: 'transform 0.15s',
            transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)'
          }}
        />
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha('#00ED64', 0.05)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Questions
            </Typography>
            <HelpButton topicId="field-configuration" tooltip="Question Configuration Help" />
          </Box>
          {onAddField && (
            <Button
              size="small"
              variant="text"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                color: '#ff9800',
                fontSize: '0.7rem',
                py: 0.25,
                px: 1,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: alpha('#ff9800', 0.05)
                }
              }}
            >
              Add
            </Button>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {schemaFields.filter(f => f.included).length}/{schemaFields.length} schema
          {customFields.length > 0 && ` • ${customFields.length} custom`}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {fieldConfigs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              gap: 1,
              p: 2
            }}
          >
            <Storage sx={{ fontSize: 32, opacity: 0.3 }} />
            <Typography variant="caption">
              Add questions to build your form
            </Typography>
            {onAddField && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  fontSize: '0.7rem',
                  '&:hover': {
                    borderColor: '#ff9800',
                    bgcolor: alpha('#ff9800', 0.05)
                  }
                }}
              >
                Add Question
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Custom Questions Section */}
            {customFields.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.5,
                    px: 0.5,
                    color: '#ff9800',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase'
                  }}
                >
                  Your Questions ({customFields.length})
                </Typography>
                <List sx={{ p: 0 }} dense>
                  {customFields.map(renderFieldItem)}
                </List>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* From Database Section */}
            {schemaFields.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.5,
                    px: 0.5,
                    color: '#00ED64',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase'
                  }}
                >
                  From Database ({schemaFields.length})
                </Typography>
                <List sx={{ p: 0 }} dense>
                  {schemaFields.map(renderFieldItem)}
                </List>
              </>
            )}
          </>
        )}
      </Box>

      {/* Add Question Dialog */}
      <AddQuestionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddField}
      />
    </Box>
  );
}
