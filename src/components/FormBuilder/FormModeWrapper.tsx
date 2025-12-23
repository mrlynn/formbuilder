'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  alpha,
  Tooltip,
  Button,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Close,
  ArrowBack,
} from '@mui/icons-material';
import { FormMode, FieldConfig } from '@/types/form';
import { FormPreview } from './FormPreview';
import { SearchResultsPanel } from './SearchResultsPanel';
import { usePipeline } from '@/contexts/PipelineContext';

interface SearchResult {
  _id: string;
  [key: string]: any;
}

interface FormModeWrapperProps {
  fieldConfigs: FieldConfig[];
  formData: Record<string, any>;
  onFormDataChange: (path: string, value: any) => void;
  onResetForm: () => void;
  allFieldConfigs: FieldConfig[];
  onUpdateFieldConfig?: (path: string, updates: Partial<FieldConfig>) => void;
  onDeleteField?: (path: string) => void;
  onSelectField?: (path: string) => void;
}

export function FormModeWrapper({
  fieldConfigs,
  formData,
  onFormDataChange,
  onResetForm,
  allFieldConfigs,
  onUpdateFieldConfig,
  onDeleteField,
  onSelectField,
}: FormModeWrapperProps) {
  const { connectionString, databaseName, collection } = usePipeline();
  const [mode, setMode] = useState<FormMode>('create');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(0);
  const [searchRowsPerPage, setSearchRowsPerPage] = useState(25);
  const [editingDocument, setEditingDocument] = useState<SearchResult | null>(null);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const hasConnection = Boolean(connectionString && databaseName && collection);

  // Build query from form data
  const buildQueryFromFormData = useCallback(() => {
    const query: Record<string, any> = {};

    for (const [path, value] of Object.entries(formData)) {
      if (value === '' || value === null || value === undefined) continue;
      if (Array.isArray(value) && value.length === 0) continue;

      // Find field config to determine type
      const fieldConfig = allFieldConfigs.find(f => f.path === path);
      const fieldType = fieldConfig?.type || 'string';

      // Build appropriate query based on type
      if (fieldType === 'string' || fieldType === 'email' || fieldType === 'url') {
        // Use contains search for strings
        query[path] = {
          value,
          operator: 'contains',
          type: 'string'
        };
      } else if (fieldType === 'number') {
        query[path] = {
          value,
          operator: 'eq',
          type: 'number'
        };
      } else if (fieldType === 'boolean') {
        query[path] = {
          value,
          operator: 'eq',
          type: 'boolean'
        };
      } else if (fieldType === 'date') {
        query[path] = {
          value,
          operator: 'eq',
          type: 'date'
        };
      } else {
        // Default to equality
        query[path] = value;
      }
    }

    return query;
  }, [formData, allFieldConfigs]);

  // Execute search
  const executeSearch = useCallback(async () => {
    if (!hasConnection) {
      setSearchError('No MongoDB connection. Connect to a database first.');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const query = buildQueryFromFormData();
      const sort = sortField ? { [sortField]: sortDirection === 'asc' ? 1 : -1 } : undefined;

      const response = await fetch('/api/mongodb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName,
          collection,
          query,
          sort,
          limit: searchRowsPerPage,
          skip: searchPage * searchRowsPerPage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.documents);
        setSearchTotalCount(data.totalCount);
      } else {
        setSearchError(data.error || 'Search failed');
        setSearchResults([]);
        setSearchTotalCount(0);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
      setSearchResults([]);
      setSearchTotalCount(0);
    } finally {
      setSearchLoading(false);
    }
  }, [
    hasConnection,
    connectionString,
    databaseName,
    collection,
    buildQueryFromFormData,
    searchPage,
    searchRowsPerPage,
    sortField,
    sortDirection,
  ]);

  // Handle mode change
  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: FormMode | null) => {
    if (newMode) {
      setMode(newMode);
      // Reset form data when switching modes
      if (newMode === 'create') {
        onResetForm();
        setEditingDocument(null);
      } else if (newMode === 'search') {
        onResetForm();
        setEditingDocument(null);
        setSearchResults([]);
        setSearchTotalCount(0);
      }
    }
  };

  // Handle edit document from search results
  const handleEditDocument = (doc: SearchResult) => {
    setEditingDocument(doc);
    setMode('edit');
    // Load document data into form
    for (const config of allFieldConfigs) {
      const value = getNestedValue(doc, config.path);
      if (value !== undefined) {
        onFormDataChange(config.path, value);
      }
    }
  };

  // Handle view document (read-only)
  const handleViewDocument = (doc: SearchResult) => {
    setEditingDocument(doc);
    setMode('view');
    // Load document data into form
    for (const config of allFieldConfigs) {
      const value = getNestedValue(doc, config.path);
      if (value !== undefined) {
        onFormDataChange(config.path, value);
      }
    }
  };

  // Handle update document
  const handleUpdateDocument = async () => {
    if (!editingDocument || !hasConnection) return;

    try {
      const response = await fetch('/api/mongodb/update-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName,
          collection,
          documentId: editingDocument._id,
          updatedDocument: formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Go back to search results
        setMode('search');
        setEditingDocument(null);
        executeSearch(); // Refresh results
      } else {
        setSearchError(data.error || 'Update failed');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Update failed');
    }
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle back to search
  const handleBackToSearch = () => {
    setMode('search');
    setEditingDocument(null);
    onResetForm();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mode Toggle Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(mode === 'edit' || mode === 'view') && editingDocument && (
            <Tooltip title="Back to search results">
              <IconButton size="small" onClick={handleBackToSearch}>
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                textTransform: 'none',
                fontSize: 13,
                border: '1px solid',
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: alpha('#00ED64', 0.1),
                  color: '#00ED64',
                  borderColor: alpha('#00ED64', 0.3),
                  '&:hover': {
                    bgcolor: alpha('#00ED64', 0.15),
                  },
                },
              },
            }}
          >
            <ToggleButton value="create">
              <AddIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Create
            </ToggleButton>
            <ToggleButton value="search" disabled={!hasConnection}>
              <SearchIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Search
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Editing indicator */}
          {editingDocument && (
            <Chip
              label={mode === 'edit' ? 'Editing' : 'Viewing'}
              icon={mode === 'edit' ? <EditIcon sx={{ fontSize: 14 }} /> : undefined}
              size="small"
              sx={{
                bgcolor: mode === 'edit' ? alpha('#2196f3', 0.1) : alpha('#9c27b0', 0.1),
                color: mode === 'edit' ? '#2196f3' : '#9c27b0',
                fontSize: 11,
              }}
              onDelete={() => handleBackToSearch()}
            />
          )}
        </Box>

        {/* Search button (only in search mode) */}
        {mode === 'search' && !editingDocument && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SearchIcon />}
            onClick={executeSearch}
            disabled={!hasConnection || searchLoading}
            sx={{
              background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
              color: '#001E2B',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
              },
            }}
          >
            Search
          </Button>
        )}

        {/* Update button (only in edit mode) */}
        {mode === 'edit' && editingDocument && (
          <Button
            variant="contained"
            size="small"
            onClick={handleUpdateDocument}
            disabled={!hasConnection}
            sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Save Changes
          </Button>
        )}
      </Box>

      {/* Content area - either form preview or search results */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mode === 'search' && !editingDocument ? (
          // Search mode: show form as filter + results
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Filter form (collapsed) */}
            <Box
              sx={{
                maxHeight: '35%',
                overflow: 'auto',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ p: 1, bgcolor: alpha('#00ED64', 0.03) }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Search Filters
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                  Fill in any fields to filter results
                </Typography>
              </Box>
              <Box sx={{ px: 2, pb: 2 }}>
                <FormPreview
                  fieldConfigs={fieldConfigs}
                  formData={formData}
                  onFormDataChange={onFormDataChange}
                  onResetForm={onResetForm}
                  allFieldConfigs={allFieldConfigs}
                  editableMode={false}
                />
              </Box>
            </Box>

            {/* Search results */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <SearchResultsPanel
                results={searchResults}
                totalCount={searchTotalCount}
                loading={searchLoading}
                error={searchError}
                fieldConfigs={allFieldConfigs}
                page={searchPage}
                rowsPerPage={searchRowsPerPage}
                onPageChange={setSearchPage}
                onRowsPerPageChange={(rpp) => {
                  setSearchRowsPerPage(rpp);
                  setSearchPage(0);
                }}
                onEditDocument={handleEditDocument}
                onViewDocument={handleViewDocument}
                onRefresh={executeSearch}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </Box>
          </Box>
        ) : (
          // Create/Edit/View mode: show full form
          <FormPreview
            fieldConfigs={fieldConfigs}
            formData={formData}
            onFormDataChange={mode === 'view' ? () => {} : onFormDataChange}
            onResetForm={mode === 'view' ? undefined : onResetForm}
            allFieldConfigs={allFieldConfigs}
            onUpdateFieldConfig={mode === 'create' ? onUpdateFieldConfig : undefined}
            onDeleteField={mode === 'create' ? onDeleteField : undefined}
            onSelectField={mode === 'create' ? onSelectField : undefined}
            editableMode={mode === 'create'}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}
