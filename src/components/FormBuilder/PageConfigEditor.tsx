'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
} from '@mui/material';
import {
  Add,
  Delete,
  DragIndicator,
  ExpandMore,
  ExpandLess,
  Pages,
  Settings,
  ArrowUpward,
  ArrowDownward,
  Edit,
} from '@mui/icons-material';
import { FormPage, MultiPageConfig, FieldConfig } from '@/types/form';
import { HelpButton } from '@/components/Help';
import { randomBytes } from 'crypto';

interface PageConfigEditorProps {
  config?: MultiPageConfig;
  fieldConfigs: FieldConfig[];
  onChange: (config: MultiPageConfig | undefined) => void;
}

export function PageConfigEditor({
  config,
  fieldConfigs,
  onChange,
}: PageConfigEditorProps) {
  const [expanded, setExpanded] = useState(!!config?.enabled);
  const [editingPage, setEditingPage] = useState<FormPage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isEnabled = config?.enabled ?? false;
  const pages = config?.pages ?? [];

  const includedFields = fieldConfigs.filter((f) => f.included);

  // Get fields that are not assigned to any page
  const unassignedFields = includedFields.filter(
    (f) => !pages.some((p) => p.fields.includes(f.path))
  );

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
      setExpanded(false);
    } else {
      // Create initial page with all fields
      const initialPage: FormPage = {
        id: generateId(),
        title: 'Page 1',
        fields: includedFields.map((f) => f.path),
        order: 0,
        showInNavigation: true,
      };
      onChange({
        enabled: true,
        pages: [initialPage],
        showStepIndicator: true,
        stepIndicatorStyle: 'numbers',
        validateOnPageChange: true,
        showPageTitles: true,
      });
      setExpanded(true);
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const addPage = () => {
    const newPage: FormPage = {
      id: generateId(),
      title: `Page ${pages.length + 1}`,
      fields: [],
      order: pages.length,
      showInNavigation: true,
    };
    onChange({
      ...config!,
      pages: [...pages, newPage],
    });
  };

  const removePage = (pageId: string) => {
    const pageToRemove = pages.find((p) => p.id === pageId);
    if (!pageToRemove) return;

    // Move fields from removed page to first remaining page
    const remainingPages = pages.filter((p) => p.id !== pageId);
    if (remainingPages.length > 0 && pageToRemove.fields.length > 0) {
      remainingPages[0].fields = [...remainingPages[0].fields, ...pageToRemove.fields];
    }

    // Reorder remaining pages
    const reorderedPages = remainingPages.map((p, i) => ({ ...p, order: i }));

    if (reorderedPages.length === 0) {
      onChange(undefined);
    } else {
      onChange({
        ...config!,
        pages: reorderedPages,
      });
    }
  };

  const updatePage = (pageId: string, updates: Partial<FormPage>) => {
    onChange({
      ...config!,
      pages: pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    });
  };

  const movePage = (pageId: string, direction: 'up' | 'down') => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
    if (newIndex < 0 || newIndex >= pages.length) return;

    const newPages = [...pages];
    [newPages[pageIndex], newPages[newIndex]] = [newPages[newIndex], newPages[pageIndex]];

    // Update order values
    const reorderedPages = newPages.map((p, i) => ({ ...p, order: i }));

    onChange({
      ...config!,
      pages: reorderedPages,
    });
  };

  const moveFieldToPage = (fieldPath: string, fromPageId: string, toPageId: string) => {
    const newPages = pages.map((p) => {
      if (p.id === fromPageId) {
        return { ...p, fields: p.fields.filter((f) => f !== fieldPath) };
      }
      if (p.id === toPageId) {
        return { ...p, fields: [...p.fields, fieldPath] };
      }
      return p;
    });

    onChange({
      ...config!,
      pages: newPages,
    });
  };

  const addFieldToPage = (fieldPath: string, pageId: string) => {
    const newPages = pages.map((p) => {
      if (p.id === pageId) {
        return { ...p, fields: [...p.fields, fieldPath] };
      }
      return p;
    });

    onChange({
      ...config!,
      pages: newPages,
    });
  };

  const updateSettings = (updates: Partial<MultiPageConfig>) => {
    onChange({
      ...config!,
      ...updates,
    });
  };

  const getFieldLabel = (path: string) => {
    const field = fieldConfigs.find((f) => f.path === path);
    return field?.label || path;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isEnabled ? '#e91e63' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha('#e91e63', 0.05),
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Pages sx={{ color: '#e91e63' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Multi-Page Form
          </Typography>
          {isEnabled && (
            <Chip
              label={`${pages.length} pages`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha('#e91e63', 0.1),
                color: '#e91e63',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HelpButton topicId="multi-page-forms" tooltip="Multi-Page Forms Help" />
          <Switch
            size="small"
            checked={isEnabled}
            onChange={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={expanded && isEnabled}>
        <Box sx={{ p: 2 }}>
          {/* Settings */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Navigation Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Step Indicator</InputLabel>
                <Select
                  value={config?.stepIndicatorStyle || 'numbers'}
                  label="Step Indicator"
                  onChange={(e) =>
                    updateSettings({ stepIndicatorStyle: e.target.value as any })
                  }
                >
                  <MenuItem value="dots">Dots</MenuItem>
                  <MenuItem value="numbers">Numbers</MenuItem>
                  <MenuItem value="progress">Progress Bar</MenuItem>
                  <MenuItem value="tabs">Tabs</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.showStepIndicator ?? true}
                    onChange={(e) => updateSettings({ showStepIndicator: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">Show Step Indicator</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.validateOnPageChange ?? true}
                    onChange={(e) => updateSettings({ validateOnPageChange: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">Validate Before Next</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.allowJumpToPage ?? false}
                    onChange={(e) => updateSettings({ allowJumpToPage: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">Allow Page Jumping</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={config?.showReviewPage ?? false}
                    onChange={(e) => updateSettings({ showReviewPage: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">Show Review Page</Typography>}
              />
            </Box>
          </Box>

          {/* Pages List */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Pages
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={addPage}
              sx={{ color: '#e91e63' }}
            >
              Add Page
            </Button>
          </Box>

          <List sx={{ p: 0 }}>
            {pages.map((page, index) => (
              <Paper
                key={page.id}
                elevation={0}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <ListItem sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <DragIndicator fontSize="small" color="disabled" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {page.title}
                        </Typography>
                        <Chip
                          label={`${page.fields.length} fields`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      </Box>
                    }
                    secondary={page.description}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Move Up">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => movePage(page.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpward fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move Down">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => movePage(page.id, 'down')}
                            disabled={index === pages.length - 1}
                          >
                            <ArrowDownward fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingPage(page);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removePage(page.id)}
                            disabled={pages.length === 1}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>

                {/* Fields in this page */}
                <Box sx={{ px: 2, pb: 1 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {page.fields.map((fieldPath) => (
                      <Chip
                        key={fieldPath}
                        label={getFieldLabel(fieldPath)}
                        size="small"
                        onDelete={() => {
                          updatePage(page.id, {
                            fields: page.fields.filter((f) => f !== fieldPath),
                          });
                        }}
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          bgcolor: alpha('#e91e63', 0.1),
                        }}
                      />
                    ))}
                    {page.fields.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No fields - drag fields here or use the edit button
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </List>

          {/* Unassigned Fields */}
          {unassignedFields.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
                Unassigned Fields ({unassignedFields.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {unassignedFields.map((field) => (
                  <Chip
                    key={field.path}
                    label={field.label}
                    size="small"
                    onClick={() => {
                      if (pages.length > 0) {
                        addFieldToPage(field.path, pages[0].id);
                      }
                    }}
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      bgcolor: alpha('#ff9800', 0.1),
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha('#ff9800', 0.2) },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Edit Page Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Page</DialogTitle>
        <DialogContent>
          {editingPage && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Page Title"
                value={editingPage.title}
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description (optional)"
                value={editingPage.description || ''}
                onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Next Button Label"
                  value={editingPage.nextLabel || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, nextLabel: e.target.value })}
                  placeholder="Next"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Previous Button Label"
                  value={editingPage.prevLabel || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, prevLabel: e.target.value })}
                  placeholder="Previous"
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Field Selection */}
              <Typography variant="caption" color="text.secondary">
                Select fields for this page:
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {includedFields.map((field) => {
                  const isInPage = editingPage.fields.includes(field.path);
                  const isInOtherPage = pages.some(
                    (p) => p.id !== editingPage.id && p.fields.includes(field.path)
                  );

                  return (
                    <FormControlLabel
                      key={field.path}
                      control={
                        <Switch
                          size="small"
                          checked={isInPage}
                          disabled={isInOtherPage}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingPage({
                                ...editingPage,
                                fields: [...editingPage.fields, field.path],
                              });
                            } else {
                              setEditingPage({
                                ...editingPage,
                                fields: editingPage.fields.filter((f) => f !== field.path),
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{field.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.path}
                            {isInOtherPage && ' (assigned to another page)'}
                          </Typography>
                        </Box>
                      }
                      sx={{ display: 'flex', width: '100%', m: 0, py: 0.5 }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (editingPage) {
                updatePage(editingPage.id, editingPage);
              }
              setEditDialogOpen(false);
            }}
            variant="contained"
            sx={{ bgcolor: '#e91e63', '&:hover': { bgcolor: '#c2185b' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
