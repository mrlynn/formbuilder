'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  Collapse,
  Drawer,
  Snackbar,
} from '@mui/material';
import {
  Refresh,
  Search,
  Download,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  ContentCopy,
  Storage,
  ArrowUpward,
  ArrowDownward,
  Add,
  TableChart,
  ViewModule,
  Code,
  ExpandMore,
  ExpandLess,
  Close,
  Check,
} from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { ConnectionPanel } from '@/components/ConnectionPanel/ConnectionPanel';

interface Document {
  _id: string;
  [key: string]: any;
}

type ViewMode = 'table' | 'cards' | 'json';

// JSON Syntax Highlighter Component
function JsonSyntaxHighlight({ data, compact = false }: { data: any; compact?: boolean }) {
  const jsonString = JSON.stringify(data, null, compact ? 0 : 2);

  // Simple syntax highlighting
  const highlighted = jsonString
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: compact ? 0.5 : 2,
        fontSize: compact ? 11 : 12,
        fontFamily: 'Monaco, Consolas, monospace',
        bgcolor: alpha('#000', 0.03),
        borderRadius: 1,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        '& .json-key': { color: '#0550ae' },
        '& .json-string': { color: '#0a3069' },
        '& .json-number': { color: '#0550ae' },
        '& .json-boolean': { color: '#cf222e' },
        '& .json-null': { color: '#8250df' },
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// Document Card Component
function DocumentCard({
  doc,
  onView,
  onCopy,
  onEdit,
  onDelete
}: {
  doc: Document;
  onView: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Get preview fields (first 4 non-_id fields)
  const previewFields = Object.entries(doc)
    .filter(([key]) => key !== '_id')
    .slice(0, 4);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return '{...}';
    if (typeof value === 'string' && value.length > 50) return value.slice(0, 50) + '...';
    return String(value);
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: alpha('#00ED64', 0.5),
          boxShadow: `0 4px 12px ${alpha('#00ED64', 0.1)}`,
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Document ID Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Chip
            label={`_id: ${String(doc._id).slice(-12)}`}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontSize: 10,
              height: 20,
              bgcolor: alpha('#00ED64', 0.1),
              color: '#00ED64',
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy JSON">
              <IconButton size="small" onClick={onCopy}>
                <ContentCopy sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={onView}>
                <Visibility sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Preview Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {previewFields.map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  minWidth: 80,
                  flexShrink: 0,
                }}
              >
                {key}:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatValue(value)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Expand Button */}
        {Object.keys(doc).length > 5 && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            sx={{
              mt: 1,
              p: 0,
              minWidth: 'auto',
              fontSize: 11,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'transparent', color: '#00ED64' },
            }}
          >
            {expanded ? 'Show less' : `+${Object.keys(doc).length - 5} more fields`}
          </Button>
        )}

        {/* Expanded JSON View */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            <JsonSyntaxHighlight data={doc} />
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={onEdit}>
          Edit
        </Button>
        <Button size="small" color="error" startIcon={<Delete sx={{ fontSize: 14 }} />} onClick={onDelete}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}

// Document Detail Drawer
function DocumentDetailDrawer({
  open,
  document,
  onClose,
  onCopy,
}: {
  open: boolean;
  document: Document | null;
  onClose: () => void;
  onCopy: () => void;
}) {
  if (!document) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          bgcolor: 'background.default',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Document Details
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {String(document._id)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy JSON">
              <IconButton size="small" onClick={onCopy}>
                <ContentCopy sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <JsonSyntaxHighlight data={document} />
        </Box>

        {/* Actions */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            gap: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Button variant="outlined" startIcon={<Edit />} fullWidth>
            Edit Document
          </Button>
          <Button variant="outlined" color="error" startIcon={<Delete />} fullWidth>
            Delete
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export function DataBrowser() {
  const { connectionString, databaseName, collection } = usePipeline();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<string>('_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailDocument, setDetailDocument] = useState<Document | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const hasConnection = Boolean(connectionString && databaseName && collection);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!hasConnection) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mongodb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName,
          collection,
          query: {},
          sort: { [sortField]: sortDirection === 'asc' ? 1 : -1 },
          limit: rowsPerPage,
          skip: page * rowsPerPage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
        setTotalCount(data.totalCount);

        // Determine visible columns from first few documents
        if (data.documents.length > 0) {
          const allKeys = new Set<string>();
          data.documents.slice(0, 10).forEach((doc: Document) => {
            Object.keys(doc).forEach(key => allKeys.add(key));
          });
          // Prioritize common fields, then alphabetize the rest
          const priorityFields = ['_id', 'name', 'title', 'email', 'createdAt', 'updatedAt'];
          const sortedKeys = Array.from(allKeys).sort((a, b) => {
            const aIndex = priorityFields.indexOf(a);
            const bIndex = priorityFields.indexOf(b);
            if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
            if (aIndex >= 0) return -1;
            if (bIndex >= 0) return 1;
            return a.localeCompare(b);
          });
          setColumns(sortedKeys.slice(0, 8)); // Limit to 8 columns
        }
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [hasConnection, connectionString, databaseName, collection, page, rowsPerPage, sortField, sortDirection]);

  // Fetch on connection or pagination change
  useEffect(() => {
    if (hasConnection) {
      fetchDocuments();
    }
  }, [hasConnection, fetchDocuments]);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(0);
  };

  // Format cell value for display
  const formatCellValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Typography color="text.disabled" sx={{ fontSize: 12 }}>null</Typography>;
    }

    if (key === '_id') {
      const idStr = String(value);
      return (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11 }}>
          {idStr.length > 12 ? `...${idStr.slice(-8)}` : idStr}
        </Typography>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'true' : 'false'}
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            bgcolor: value ? alpha('#00ED64', 0.1) : alpha('#f44336', 0.1),
            color: value ? '#00ED64' : '#f44336',
          }}
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <Chip
          label={`[${value.length} items]`}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: 10 }}
        />
      );
    }

    if (typeof value === 'object') {
      return (
        <Chip
          label="{...}"
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }}
        />
      );
    }

    if (typeof value === 'string' && value.length > 40) {
      return (
        <Tooltip title={value}>
          <Typography sx={{ fontSize: 12 }}>{value.slice(0, 40)}...</Typography>
        </Tooltip>
      );
    }

    // Check for date strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return (
          <Typography sx={{ fontSize: 12 }}>
            {date.toLocaleDateString()}
          </Typography>
        );
      } catch {
        // Fall through to default
      }
    }

    return <Typography sx={{ fontSize: 12 }}>{String(value)}</Typography>;
  };

  // Handle document actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setSelectedDoc(doc);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDoc(null);
  };

  const handleCopyDocument = (doc?: Document) => {
    const docToCopy = doc || selectedDoc;
    if (docToCopy) {
      navigator.clipboard.writeText(JSON.stringify(docToCopy, null, 2));
      setSnackbarMessage('Document copied to clipboard');
      setSnackbarOpen(true);
    }
    handleMenuClose();
  };

  const handleViewDocument = (doc: Document) => {
    setDetailDocument(doc);
    setDetailDrawerOpen(true);
    handleMenuClose();
  };

  // If not connected, show connection panel
  if (!hasConnection) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Storage sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Connect to MongoDB
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect to your MongoDB database to browse and explore your data.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowConnectionPanel(true)}
              sx={{
                background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
                color: '#001E2B',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
                },
              }}
            >
              Connect Database
            </Button>
          </Paper>
        </Box>

        {/* Connection Panel Drawer */}
        {showConnectionPanel && (
          <Box
            sx={{
              position: 'fixed',
              top: 48,
              left: 0,
              bottom: 0,
              width: 360,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              zIndex: 1200,
              overflow: 'auto',
            }}
          >
            <ConnectionPanel />
          </Box>
        )}
      </Box>
    );
  }

  // Render Table View
  const renderTableView = () => (
    <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
      {loading && documents.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress size={32} />
        </Box>
      ) : documents.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Typography color="text.secondary">No documents found</Typography>
          <Button variant="outlined" startIcon={<Add />} size="small">
            Insert Document
          </Button>
        </Box>
      ) : (
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  onClick={() => handleSort(column)}
                  sx={{
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: alpha('#00ED64', 0.05),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {column}
                    {sortField === column && (
                      sortDirection === 'asc'
                        ? <ArrowUpward sx={{ fontSize: 14 }} />
                        : <ArrowDownward sx={{ fontSize: 14 }} />
                    )}
                  </Box>
                </TableCell>
              ))}
              <TableCell sx={{ width: 60, bgcolor: 'background.paper' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow
                key={doc._id}
                hover
                onClick={() => handleViewDocument(doc)}
                sx={{ cursor: 'pointer' }}
              >
                {columns.map((column) => (
                  <TableCell key={column} sx={{ maxWidth: 200 }}>
                    {formatCellValue(doc[column], column)}
                  </TableCell>
                ))}
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, doc)}
                  >
                    <MoreVert sx={{ fontSize: 16 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );

  // Render Cards View
  const renderCardsView = () => (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      {loading && documents.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress size={32} />
        </Box>
      ) : documents.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Typography color="text.secondary">No documents found</Typography>
          <Button variant="outlined" startIcon={<Add />} size="small">
            Insert Document
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc._id}>
              <DocumentCard
                doc={doc}
                onView={() => handleViewDocument(doc)}
                onCopy={() => handleCopyDocument(doc)}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // Render JSON View
  const renderJsonView = () => (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      {loading && documents.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress size={32} />
        </Box>
      ) : documents.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Typography color="text.secondary">No documents found</Typography>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: alpha('#000', 0.02),
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing {documents.length} of {totalCount} documents
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(documents, null, 2));
                setSnackbarMessage('All documents copied to clipboard');
                setSnackbarOpen(true);
              }}
            >
              Copy All
            </Button>
          </Box>
          <Box sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
            <JsonSyntaxHighlight data={documents} />
          </Box>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChart sx={{ fontSize: 20, color: '#00ED64' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Data Browser
            </Typography>
          </Box>
          <Chip
            label={`${databaseName}.${collection}`}
            size="small"
            sx={{
              bgcolor: alpha('#00ED64', 0.1),
              color: '#00ED64',
              fontWeight: 500,
            }}
          />
          <Chip
            label={loading ? '...' : `${totalCount.toLocaleString()} documents`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
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
            <ToggleButton value="table">
              <Tooltip title="Table View">
                <TableChart sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="cards">
              <Tooltip title="Card View">
                <ViewModule sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="json">
              <Tooltip title="JSON View">
                <Code sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <TextField
            placeholder="Search..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 180,
              '& .MuiOutlinedInput-root': {
                height: 32,
                fontSize: 13,
              },
            }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchDocuments} disabled={loading}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton size="small" disabled>
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content based on view mode */}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'cards' && renderCardsView()}
      {viewMode === 'json' && renderJsonView()}

      {/* Pagination */}
      {documents.length > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        />
      )}

      {/* Document Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedDoc && handleViewDocument(selectedDoc)}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCopyDocument()}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Copy JSON</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        open={detailDrawerOpen}
        document={detailDocument}
        onClose={() => setDetailDrawerOpen(false)}
        onCopy={() => handleCopyDocument(detailDocument || undefined)}
      />

      {/* Copy Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            bgcolor: '#00ED64',
            color: '#001E2B',
            fontWeight: 500,
          },
        }}
      />
    </Box>
  );
}
