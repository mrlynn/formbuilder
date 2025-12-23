'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  alpha,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  Storage,
  Folder,
  Collections,
  Save,
  Bookmark,
  Delete,
  AccessTime
} from '@mui/icons-material';
import { usePipeline } from '@/contexts/PipelineContext';
import { SavedConnectionInfo } from '@/types/pipeline';
import { HelpButton } from '@/components/Help/HelpButton';

interface Database {
  name: string;
  sizeOnDisk: number;
}

interface Collection {
  name: string;
  type: string;
}

export function ConnectionPanel() {
  const { connectionString, databaseName, collection, dispatch } = usePipeline();
  const [isExpanded, setIsExpanded] = useState(!connectionString || !databaseName || !collection);
  const [connString, setConnString] = useState(connectionString || '');
  const [selectedDb, setSelectedDb] = useState(databaseName || '');
  const [selectedCollection, setSelectedCollection] = useState(collection || '');

  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isConnected, setIsConnected] = useState(!!connectionString);

  // Saved connections state
  const [savedConnections, setSavedConnections] = useState<SavedConnectionInfo[]>([]);
  const [showSavedConnections, setShowSavedConnections] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSavedConnections, setIsLoadingSavedConnections] = useState(false);

  // Sync with context when it changes externally
  useEffect(() => {
    if (connectionString) {
      setConnString(connectionString);
    }
    if (databaseName) {
      setSelectedDb(databaseName);
      // Auto-expand if database is selected but no collection
      if (databaseName && !collection) {
        setIsExpanded(true);
      }
    }
    if (collection) {
      setSelectedCollection(collection);
    }
  }, [connectionString, databaseName, collection]);

  const loadCollections = async () => {
    if (!connString.trim() || !selectedDb) return;

    setIsLoadingCollections(true);
    try {
      const response = await fetch('/api/mongodb/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: connString.trim(),
          databaseName: selectedDb
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCollections(data.collections || []);
      } else {
        setConnectionError(data.error || 'Failed to load collections');
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to load collections');
    } finally {
      setIsLoadingCollections(false);
    }
  };

  useEffect(() => {
    if (connString.trim() && selectedDb && isConnected) {
      loadCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connString, selectedDb, isConnected]);

  const testConnection = async () => {
    if (!connString.trim()) {
      setConnectionError('Please enter a connection string');
      return;
    }

    setIsTesting(true);
    setConnectionError(null);

    try {
      const response = await fetch('/api/mongodb/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connString.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setDatabases(data.databases || []);
        setIsConnected(true);
        setConnectionError(null);
        const defaultDb = selectedDb || data.databases[0]?.name || '';
        if (defaultDb) {
          setSelectedDb(defaultDb);
          dispatch({
            type: 'SET_CONNECTION',
            payload: {
              connectionString: connString.trim(),
              databaseName: defaultDb
            }
          });
        }
      } else {
        setConnectionError(data.error || 'Connection failed');
        setIsConnected(false);
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to test connection');
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDatabaseChange = (dbName: string) => {
    setSelectedDb(dbName);
    setSelectedCollection('');
    dispatch({
      type: 'SET_CONNECTION',
      payload: {
        connectionString: connString.trim(),
        databaseName: dbName
      }
    });
  };

  const handleCollectionChange = (collName: string) => {
    setSelectedCollection(collName);
    dispatch({
      type: 'SET_COLLECTION',
      payload: { collection: collName }
    });
  };

  // Load saved connections on mount
  useEffect(() => {
    loadSavedConnections();
  }, []);

  const loadSavedConnections = async () => {
    setIsLoadingSavedConnections(true);
    try {
      const response = await fetch('/api/connections/list');
      const data = await response.json();
      if (data.success) {
        setSavedConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to load saved connections:', error);
    } finally {
      setIsLoadingSavedConnections(false);
    }
  };

  const saveCurrentConnection = async () => {
    if (!connString.trim() || !connectionName.trim()) {
      setConnectionError('Please enter a connection name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/connections/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectionName,
          connectionString: connString.trim(),
          defaultDatabase: selectedDb || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadSavedConnections();
        setShowSaveDialog(false);
        setConnectionName('');
      } else {
        setConnectionError(data.error || 'Failed to save connection');
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to save connection');
    } finally {
      setIsSaving(false);
    }
  };

  const loadConnection = async (id: string) => {
    try {
      const response = await fetch('/api/connections/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        const conn = data.connection;
        setConnString(conn.connectionString);
        if (conn.defaultDatabase) {
          setSelectedDb(conn.defaultDatabase);
        }
        setShowSavedConnections(false);
        // Auto-test the connection
        await testConnectionWithString(conn.connectionString, conn.defaultDatabase);
      } else {
        setConnectionError(data.error || 'Failed to load connection');
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to load connection');
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const response = await fetch('/api/connections/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        await loadSavedConnections();
      } else {
        setConnectionError(data.error || 'Failed to delete connection');
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to delete connection');
    }
  };

  const testConnectionWithString = async (connStr: string, defaultDb?: string) => {
    setIsTesting(true);
    setConnectionError(null);

    try {
      const response = await fetch('/api/mongodb/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connStr }),
      });

      const data = await response.json();

      if (data.success) {
        setDatabases(data.databases || []);
        setIsConnected(true);
        setConnectionError(null);
        const dbToUse = defaultDb || selectedDb || data.databases[0]?.name || '';
        if (dbToUse) {
          setSelectedDb(dbToUse);
          dispatch({
            type: 'SET_CONNECTION',
            payload: {
              connectionString: connStr,
              databaseName: dbToUse,
            },
          });
        }
      } else {
        setConnectionError(data.error || 'Connection failed');
        setIsConnected(false);
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to test connection');
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          p: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isConnected ? alpha('#00ED64', 0.1) : alpha('#f85149', 0.1)
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          {isConnected ? (
            <CheckCircle sx={{ color: '#00ED64', fontSize: 20 }} />
          ) : (
            <ErrorIcon sx={{ color: '#f85149', fontSize: 20 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {isConnected
                ? `Connected${databaseName ? ` • ${databaseName}` : ''}${collection ? ` • ${collection}` : ''}`
                : 'Not Connected'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {isConnected
                ? collection
                  ? 'MongoDB connection active'
                  : 'Select a collection to continue'
                : 'Configure MongoDB connection'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HelpButton topicId="mongodb-connection" tooltip="Connection Help" />
          <IconButton size="small">
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Saved Connections Button */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<Bookmark />}
              onClick={() => setShowSavedConnections(true)}
            >
              Saved Connections {savedConnections.length > 0 && `(${savedConnections.length})`}
            </Button>
            {isConnected && connString.trim() && (
              <Tooltip title="Save current connection">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setShowSaveDialog(true)}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <Save />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <TextField
            label="MongoDB Connection String"
            type="password"
            fullWidth
            size="small"
            value={connString}
            onChange={(e) => setConnString(e.target.value)}
            placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
            sx={{ mb: 2 }}
            disabled={isTesting}
            helperText="Enter your MongoDB connection string"
          />

          {connectionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setConnectionError(null)}>
              {connectionError}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={testConnection}
            disabled={isTesting || !connString.trim()}
            startIcon={isTesting ? <CircularProgress size={16} /> : <Storage />}
            sx={{ mb: 2 }}
          >
            {isTesting ? 'Testing Connection...' : 'Test Connection'}
          </Button>

          {isConnected && databases.length > 0 && (
            <>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Database</InputLabel>
                <Select
                  value={selectedDb}
                  label="Database"
                  onChange={(e) => handleDatabaseChange(e.target.value)}
                >
                  {databases.map((db) => (
                    <MenuItem key={db.name} value={db.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Folder sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {db.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedDb && (
                <FormControl fullWidth size="small">
                  <InputLabel>Collection</InputLabel>
                  <Select
                    value={selectedCollection}
                    label="Collection"
                    onChange={(e) => handleCollectionChange(e.target.value)}
                    disabled={isLoadingCollections}
                  >
                    {isLoadingCollections ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          Loading collections...
                        </Box>
                      </MenuItem>
                    ) : (
                      collections.map((coll) => (
                        <MenuItem key={coll.name} value={coll.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Collections sx={{ fontSize: 18, color: 'text.secondary' }} />
                            {coll.name}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </Box>
      </Collapse>

      {/* Saved Connections Dialog */}
      <Dialog
        open={showSavedConnections}
        onClose={() => setShowSavedConnections(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bookmark />
            Saved Connections
          </Box>
        </DialogTitle>
        <DialogContent>
          {isLoadingSavedConnections ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : savedConnections.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No saved connections yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Save a connection after testing it successfully
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {savedConnections.map((conn) => (
                <Box key={conn.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Delete connection">
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConnection(conn.id);
                          }}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemButton onClick={() => loadConnection(conn.id)}>
                      <ListItemIcon>
                        <Storage />
                      </ListItemIcon>
                      <ListItemText
                        primary={conn.name}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {conn.defaultDatabase && (
                              <Typography variant="caption" component="span">
                                Database: {conn.defaultDatabase}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: 12 }} />
                              <Typography variant="caption" component="span">
                                Last used: {formatTimestamp(conn.lastUsed)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavedConnections(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Save Connection Dialog */}
      <Dialog
        open={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setConnectionName('');
          setConnectionError(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Save Connection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Connection Name"
            type="text"
            fullWidth
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            placeholder="My MongoDB Cluster"
            helperText="Give this connection a memorable name"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowSaveDialog(false);
              setConnectionName('');
              setConnectionError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveCurrentConnection}
            disabled={!connectionName.trim() || isSaving}
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

