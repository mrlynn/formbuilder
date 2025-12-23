'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  alpha,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Business,
  People,
  Settings,
  MoreVert,
  PersonAdd,
  Delete,
  Edit,
  Check,
  ContentCopy,
} from '@mui/icons-material';

interface Organization {
  orgId: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: string;
  createdAt: string;
}

interface OrgMember {
  userId: string;
  email: string;
  displayName?: string;
  role: string;
}

export function OrganizationSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create org dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Manage org dialog
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuOrg, setMenuOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations');
      const data = await response.json();

      if (response.ok) {
        setOrganizations(data.organizations || []);
      } else {
        setError(data.error || 'Failed to load organizations');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) {
      setCreateError('Name and slug are required');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreateDialogOpen(false);
        setNewOrgName('');
        setNewOrgSlug('');
        fetchOrganizations();
      } else {
        setCreateError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setCreateError('Failed to connect to server');
    } finally {
      setCreating(false);
    }
  };

  const handleManageOrg = async (org: Organization) => {
    setSelectedOrg(org);
    setManageDialogOpen(true);
    setLoadingMembers(true);

    try {
      const response = await fetch(`/api/organizations/${org.orgId}`);
      const data = await response.json();

      if (response.ok && data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedOrg || !inviteEmail) return;

    try {
      setInviting(true);

      const response = await fetch(`/api/organizations/${selectedOrg.orgId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('member');
        // Refresh members
        handleManageOrg(selectedOrg);
      }
    } catch (err) {
      console.error('Failed to invite:', err);
    } finally {
      setInviting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return '#9c27b0';
      case 'pro':
        return '#00ED64';
      default:
        return '#666';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: '#00ED64' };
      case 'admin':
        return { label: 'Admin', color: '#2196f3' };
      case 'member':
        return { label: 'Member', color: '#666' };
      default:
        return { label: role, color: '#666' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#00ED64' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Organizations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your organizations and team members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            bgcolor: '#00ED64',
            color: '#001E2B',
            fontWeight: 600,
            '&:hover': { bgcolor: '#00c853' },
          }}
        >
          Create Organization
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {organizations.length === 0 ? (
        <Card
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            bgcolor: 'transparent',
            textAlign: 'center',
            py: 6,
          }}
        >
          <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No organizations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create an organization to manage forms and connections for your team.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderColor: '#00ED64', color: '#00ED64' }}
          >
            Create Your First Organization
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {organizations.map((org) => {
            const roleBadge = getRoleBadge(org.role);
            return (
              <Grid item xs={12} sm={6} md={4} key={org.orgId}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: '#00ED64',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {org.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          /{org.slug}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setMenuOrg(org);
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip
                        label={org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getPlanColor(org.plan), 0.1),
                          color: getPlanColor(org.plan),
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        label={roleBadge.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(roleBadge.color, 0.1),
                          color: roleBadge.color,
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<People />}
                      onClick={() => handleManageOrg(org)}
                      sx={{ color: 'text.secondary' }}
                    >
                      Manage Team
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Settings />}
                      onClick={() => handleManageOrg(org)}
                      sx={{ color: 'text.secondary' }}
                    >
                      Settings
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (menuOrg) handleManageOrg(menuOrg);
          setMenuAnchor(null);
        }}>
          <Settings sx={{ mr: 1, fontSize: 18 }} />
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => setMenuAnchor(null)}
          sx={{ color: 'error.main' }}
          disabled={menuOrg?.role !== 'owner'}
        >
          <Delete sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Organization Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Organization</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Organization Name"
            fullWidth
            value={newOrgName}
            onChange={(e) => {
              setNewOrgName(e.target.value);
              setNewOrgSlug(generateSlug(e.target.value));
            }}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="URL Slug"
            fullWidth
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            helperText="Only lowercase letters, numbers, and hyphens"
            InputProps={{
              startAdornment: (
                <Typography color="text.secondary" sx={{ mr: 0.5 }}>
                  /
                </Typography>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateOrg}
            variant="contained"
            disabled={creating || !newOrgName || !newOrgSlug}
            sx={{ bgcolor: '#00ED64', color: '#001E2B', '&:hover': { bgcolor: '#00c853' } }}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Organization Dialog */}
      <Dialog
        open={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ color: '#00ED64' }} />
            {selectedOrg?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Team Members
          </Typography>

          {loadingMembers ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: '#00ED64' }} />
            </Box>
          ) : (
            <List>
              {members.map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <ListItem key={member.userId}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#00ED64', color: '#001E2B' }}>
                        {(member.displayName || member.email)[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.displayName || member.email.split('@')[0]}
                      secondary={member.email}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={badge.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(badge.color, 0.1),
                          color: badge.color,
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}

          <Button
            startIcon={<PersonAdd />}
            onClick={() => setInviteDialogOpen(true)}
            sx={{ mt: 2, color: '#00ED64' }}
          >
            Invite Member
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={inviteRole}
              label="Role"
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <MenuItem value="viewer">Viewer - Can view forms and responses</MenuItem>
              <MenuItem value="member">Member - Can create and edit forms</MenuItem>
              <MenuItem value="admin">Admin - Full access to organization</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={inviting || !inviteEmail}
            sx={{ bgcolor: '#00ED64', color: '#001E2B', '&:hover': { bgcolor: '#00c853' } }}
          >
            {inviting ? <CircularProgress size={20} /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
