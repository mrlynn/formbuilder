'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  alpha,
  Link,
  Autocomplete,
} from '@mui/material';
import {
  Storage,
  VpnKey,
  Add,
  CheckCircle,
  Warning,
  Lock,
} from '@mui/icons-material';
import { FormDataSource } from '@/types/form';
import NextLink from 'next/link';

interface Connection {
  vaultId: string;
  name: string;
  description?: string;
  database: string;
  allowedCollections: string[];
  status: 'active' | 'disabled';
}

interface Organization {
  orgId: string;
  name: string;
}

interface DataSourceEditorProps {
  value?: FormDataSource;
  organizationId?: string;
  onChange: (value: FormDataSource | undefined, orgId?: string) => void;
  disabled?: boolean;
}

export function DataSourceEditor({
  value,
  organizationId,
  onChange,
  disabled = false,
}: DataSourceEditorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizationId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch connections when org changes
  useEffect(() => {
    if (selectedOrgId) {
      fetchConnections(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();

      if (response.ok && data.organizations) {
        setOrganizations(data.organizations);

        // If we have an organizationId, use it; otherwise use first org
        if (organizationId) {
          setSelectedOrgId(organizationId);
        } else if (data.organizations.length > 0) {
          setSelectedOrgId(data.organizations[0].orgId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  };

  const fetchConnections = async (orgId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}/vault`);
      const data = await response.json();

      if (response.ok) {
        setConnections(data.connections || []);
      } else {
        setError(data.error || 'Failed to load connections');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    // Clear selection when org changes
    onChange(undefined, orgId);
  };

  const handleConnectionChange = (vaultId: string) => {
    const connection = connections.find((c) => c.vaultId === vaultId);
    if (connection) {
      onChange(
        {
          vaultId,
          collection: value?.collection || '',
        },
        selectedOrgId
      );
    }
  };

  const handleCollectionChange = (collection: string) => {
    if (value) {
      onChange({ ...value, collection }, selectedOrgId);
    }
  };

  const selectedConnection = connections.find((c) => c.vaultId === value?.vaultId);
  const availableCollections = selectedConnection?.allowedCollections || [];

  if (organizations.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <VpnKey sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Organizations Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create an organization and add a connection to store form submissions securely.
        </Typography>
        <Button
          component={NextLink}
          href="/settings?tab=organizations"
          variant="outlined"
          startIcon={<Add />}
          sx={{ borderColor: '#00ED64', color: '#00ED64' }}
        >
          Create Organization
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Where should form data be stored?
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Organization Selector */}
      <FormControl fullWidth sx={{ mb: 2 }} disabled={disabled}>
        <InputLabel>Organization</InputLabel>
        <Select
          value={selectedOrgId}
          label="Organization"
          onChange={(e) => handleOrgChange(e.target.value)}
        >
          {organizations.map((org) => (
            <MenuItem key={org.orgId} value={org.orgId}>
              {org.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Connection Selector */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: '#00ED64' }} />
        </Box>
      ) : connections.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Lock sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No connections in this organization
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a secure MongoDB connection to store form submissions.
          </Typography>
          <Button
            component={NextLink}
            href="/settings?tab=connections"
            variant="outlined"
            startIcon={<Add />}
            size="small"
            sx={{ borderColor: '#00ED64', color: '#00ED64' }}
          >
            Add Connection
          </Button>
        </Paper>
      ) : (
        <>
          <FormControl fullWidth sx={{ mb: 2 }} disabled={disabled}>
            <InputLabel>Connection</InputLabel>
            <Select
              value={value?.vaultId || ''}
              label="Connection"
              onChange={(e) => handleConnectionChange(e.target.value)}
            >
              {connections
                .filter((c) => c.status === 'active')
                .map((conn) => (
                  <MenuItem key={conn.vaultId} value={conn.vaultId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Storage sx={{ color: '#00ED64', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2">{conn.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Database: {conn.database}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Collection Selector */}
          {selectedConnection && (
            <Box>
              {availableCollections.length > 0 ? (
                <Autocomplete
                  freeSolo
                  options={availableCollections}
                  value={value?.collection || ''}
                  onChange={(_, newValue) => handleCollectionChange(newValue || '')}
                  onInputChange={(_, newValue) => handleCollectionChange(newValue)}
                  disabled={disabled}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Collection"
                      placeholder="Select or enter collection name"
                      helperText={
                        availableCollections.length > 0
                          ? 'Select from allowed collections or enter a new name'
                          : 'Enter the collection name for form submissions'
                      }
                    />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Collection"
                  value={value?.collection || ''}
                  onChange={(e) => handleCollectionChange(e.target.value)}
                  placeholder="form_submissions"
                  disabled={disabled}
                  helperText="Enter the collection name for form submissions"
                />
              )}
            </Box>
          )}
        </>
      )}

      {/* Selected Connection Info */}
      {selectedConnection && value?.collection && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            bgcolor: alpha('#00ED64', 0.05),
            border: '1px solid',
            borderColor: alpha('#00ED64', 0.2),
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <CheckCircle sx={{ color: '#00ED64', fontSize: 20, mt: 0.25 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Form submissions will be stored in:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', mt: 0.5 }}
              >
                {selectedConnection.database}.{value.collection}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Connection: {selectedConnection.name} • Encrypted storage
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Security Notice */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: 2,
          bgcolor: alpha('#2196f3', 0.05),
          border: '1px solid',
          borderColor: alpha('#2196f3', 0.2),
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Lock sx={{ color: '#2196f3', fontSize: 20, mt: 0.25 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Secure Connection Storage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Connection strings are encrypted with AES-256 and only decrypted server-side when
              processing form submissions. Your credentials are never exposed to the browser.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
