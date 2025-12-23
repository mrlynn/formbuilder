'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  TextField,
  Chip,
  IconButton,
  Paper,
  Collapse,
  Alert,
  alpha,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Public,
  Lock,
  LockPerson,
  Google,
  GitHub,
  Email,
  Fingerprint,
  Add,
  Delete,
  Info,
  Warning,
} from '@mui/icons-material';
import { FormAccessControl, FormAuthMethod, FormAccessType } from '@/types/form';

interface AccessControlEditorProps {
  value?: FormAccessControl;
  onChange: (value: FormAccessControl | undefined) => void;
  disabled?: boolean;
}

const AUTH_METHODS: { id: FormAuthMethod; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'google',
    label: 'Google',
    icon: <Google />,
    description: 'Sign in with Google account',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: <GitHub />,
    description: 'Sign in with GitHub account',
  },
  {
    id: 'magic-link',
    label: 'Email',
    icon: <Email />,
    description: 'Sign in via email link',
  },
  {
    id: 'passkey',
    label: 'Passkey',
    icon: <Fingerprint />,
    description: 'Sign in with biometrics or security key',
  },
];

const DEFAULT_ACCESS_CONTROL: FormAccessControl = {
  type: 'public',
};

export function AccessControlEditor({
  value,
  onChange,
  disabled = false,
}: AccessControlEditorProps) {
  const [newDomain, setNewDomain] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Use default if value is undefined
  const currentValue = value || DEFAULT_ACCESS_CONTROL;

  const handleTypeChange = (type: FormAccessType) => {
    const newValue: FormAccessControl = { type };

    if (type !== 'public') {
      newValue.authMethods = currentValue.authMethods || ['magic-link', 'passkey', 'google', 'github'];
    }

    if (type === 'restricted') {
      newValue.allowedDomains = currentValue.allowedDomains || [];
      newValue.allowedEmails = currentValue.allowedEmails || [];
    }

    onChange(newValue);
  };

  const handleAuthMethodToggle = (method: FormAuthMethod) => {
    const currentMethods = currentValue.authMethods || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter((m) => m !== method)
      : [...currentMethods, method];

    // Must have at least one method
    if (newMethods.length === 0) return;

    onChange({ ...currentValue, authMethods: newMethods });
  };

  const handleAddDomain = () => {
    if (!newDomain) return;

    const domain = newDomain.toLowerCase().replace(/^@/, '');
    const currentDomains = currentValue.allowedDomains || [];

    if (!currentDomains.includes(domain)) {
      onChange({
        ...currentValue,
        allowedDomains: [...currentDomains, domain],
      });
    }

    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    onChange({
      ...currentValue,
      allowedDomains: (currentValue.allowedDomains || []).filter((d) => d !== domain),
    });
  };

  const handleAddEmail = () => {
    if (!newEmail) return;

    const email = newEmail.toLowerCase();
    const currentEmails = currentValue.allowedEmails || [];

    if (!currentEmails.includes(email)) {
      onChange({
        ...currentValue,
        allowedEmails: [...currentEmails, email],
      });
    }

    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    onChange({
      ...currentValue,
      allowedEmails: (currentValue.allowedEmails || []).filter((e) => e !== email),
    });
  };

  const getAccessIcon = (type: FormAccessType) => {
    switch (type) {
      case 'public':
        return <Public sx={{ color: '#00ED64' }} />;
      case 'authenticated':
        return <Lock sx={{ color: '#2196f3' }} />;
      case 'restricted':
        return <LockPerson sx={{ color: '#ff9800' }} />;
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Who can access this form?
      </Typography>

      <FormControl component="fieldset" disabled={disabled}>
        <RadioGroup
          value={currentValue.type}
          onChange={(e) => handleTypeChange(e.target.value as FormAccessType)}
        >
          {/* Public */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 1,
              border: '1px solid',
              borderColor: currentValue.type === 'public' ? '#00ED64' : 'divider',
              borderRadius: 2,
              bgcolor: currentValue.type === 'public' ? alpha('#00ED64', 0.05) : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: currentValue.type === 'public' ? '#00ED64' : alpha('#00ED64', 0.5),
              },
            }}
            onClick={() => !disabled && handleTypeChange('public')}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Radio value="public" />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Public sx={{ color: '#00ED64', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Public
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Anyone with the link can view and submit the form
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Authenticated */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 1,
              border: '1px solid',
              borderColor: currentValue.type === 'authenticated' ? '#2196f3' : 'divider',
              borderRadius: 2,
              bgcolor: currentValue.type === 'authenticated' ? alpha('#2196f3', 0.05) : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: currentValue.type === 'authenticated' ? '#2196f3' : alpha('#2196f3', 0.5),
              },
            }}
            onClick={() => !disabled && handleTypeChange('authenticated')}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Radio value="authenticated" />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lock sx={{ color: '#2196f3', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Sign-in Required
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Users must sign in to access the form
                </Typography>
              </Box>
            </Box>

            <Collapse in={currentValue.type === 'authenticated'}>
              <Box sx={{ ml: 5, mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Allowed sign-in methods:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {AUTH_METHODS.map((method) => (
                    <Chip
                      key={method.id}
                      icon={method.icon as React.ReactElement}
                      label={method.label}
                      onClick={() => !disabled && handleAuthMethodToggle(method.id)}
                      color={(currentValue.authMethods || []).includes(method.id) ? 'primary' : 'default'}
                      variant={(currentValue.authMethods || []).includes(method.id) ? 'filled' : 'outlined'}
                      size="small"
                      sx={{
                        '&.MuiChip-colorPrimary': {
                          bgcolor: alpha('#2196f3', 0.1),
                          color: '#2196f3',
                          borderColor: '#2196f3',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Collapse>
          </Paper>

          {/* Restricted */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: currentValue.type === 'restricted' ? '#ff9800' : 'divider',
              borderRadius: 2,
              bgcolor: currentValue.type === 'restricted' ? alpha('#ff9800', 0.05) : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: currentValue.type === 'restricted' ? '#ff9800' : alpha('#ff9800', 0.5),
              },
            }}
            onClick={() => !disabled && handleTypeChange('restricted')}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Radio value="restricted" />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockPerson sx={{ color: '#ff9800', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Restricted
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Only specific users or email domains can access
                </Typography>
              </Box>
            </Box>

            <Collapse in={currentValue.type === 'restricted'}>
              <Box sx={{ ml: 5, mt: 2 }}>
                {/* Auth Methods */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Allowed sign-in methods:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {AUTH_METHODS.map((method) => (
                    <Chip
                      key={method.id}
                      icon={method.icon as React.ReactElement}
                      label={method.label}
                      onClick={() => !disabled && handleAuthMethodToggle(method.id)}
                      color={(currentValue.authMethods || []).includes(method.id) ? 'primary' : 'default'}
                      variant={(currentValue.authMethods || []).includes(method.id) ? 'filled' : 'outlined'}
                      size="small"
                      sx={{
                        '&.MuiChip-colorPrimary': {
                          bgcolor: alpha('#ff9800', 0.1),
                          color: '#ff9800',
                          borderColor: '#ff9800',
                        },
                      }}
                    />
                  ))}
                </Box>

                {/* Allowed Domains */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Allowed email domains:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="acme.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                    disabled={disabled}
                    InputProps={{
                      startAdornment: <Typography color="text.secondary">@</Typography>,
                    }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={handleAddDomain}
                    disabled={disabled || !newDomain}
                    sx={{ color: '#ff9800' }}
                  >
                    <Add />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {(currentValue.allowedDomains || []).map((domain) => (
                    <Chip
                      key={domain}
                      label={`@${domain}`}
                      size="small"
                      onDelete={() => handleRemoveDomain(domain)}
                      sx={{ bgcolor: alpha('#ff9800', 0.1) }}
                    />
                  ))}
                </Box>

                {/* Allowed Emails */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Allowed email addresses:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="user@example.com"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    disabled={disabled}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={handleAddEmail}
                    disabled={disabled || !newEmail}
                    sx={{ color: '#ff9800' }}
                  >
                    <Add />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(currentValue.allowedEmails || []).map((email) => (
                    <Chip
                      key={email}
                      label={email}
                      size="small"
                      onDelete={() => handleRemoveEmail(email)}
                      sx={{ bgcolor: alpha('#ff9800', 0.1) }}
                    />
                  ))}
                </Box>

                {/* Warning if no restrictions set */}
                {currentValue.type === 'restricted' &&
                  !(currentValue.allowedDomains?.length || currentValue.allowedEmails?.length) && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Add at least one domain or email address to restrict access.
                    </Alert>
                  )}
              </Box>
            </Collapse>
          </Paper>
        </RadioGroup>
      </FormControl>

      {/* Info box */}
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
          <Info sx={{ color: '#00ED64', fontSize: 20, mt: 0.25 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {currentValue.type === 'public' && 'Public forms can be accessed by anyone with the link.'}
              {currentValue.type === 'authenticated' &&
                'Users will be prompted to sign in before accessing the form.'}
              {currentValue.type === 'restricted' &&
                'Only users from allowed domains or with allowed emails can access.'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rate limiting: {currentValue.type === 'public' ? '10' : '50'} submissions per hour per{' '}
              {currentValue.type === 'public' ? 'IP address' : 'user'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
