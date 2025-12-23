'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  alpha,
  Skeleton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  ContentCopy,
  BarChart,
  MoreVert,
  Public,
  Lock,
  Description,
  CalendarToday,
  People,
  OpenInNew,
  Code,
  Download,
  ArrowBack,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SavedForm {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  collection?: string;
  fieldCount?: number;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  responseCount?: number;
}

export default function MyFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; formId: string | null }>({
    el: null,
    formId: null,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms/list');
      const data = await response.json();

      if (data.success && data.forms) {
        // Enrich forms with response counts
        const enrichedForms = await Promise.all(
          data.forms.map(async (form: SavedForm) => {
            try {
              const statsRes = await fetch(`/api/forms/${form.id}/responses?statsOnly=true&pageSize=1`);
              const statsData = await statsRes.json();
              return {
                ...form,
                responseCount: statsData.success ? statsData.stats?.total || 0 : 0,
              };
            } catch {
              return { ...form, responseCount: 0 };
            }
          })
        );
        setForms(enrichedForms);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setSnackbar({ open: true, message: 'Form deleted successfully', severity: 'success' });
        loadForms();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete form', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting form', severity: 'error' });
    }

    handleMenuClose();
  };

  const handleCopyLink = (form: SavedForm) => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/forms/${form.slug || form.id}`;
    navigator.clipboard.writeText(formUrl);
    setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, formId: string) => {
    setMenuAnchor({ el: event.currentTarget, formId });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ el: null, formId: null });
  };

  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.collection?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedForms = filteredForms.filter((f) => f.isPublished);
  const draftForms = filteredForms.filter((f) => !f.isPublished);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const FormCard = ({ form }: { form: SavedForm }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: form.isPublished ? alpha('#00ED64', 0.3) : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#00ED64',
          boxShadow: `0 4px 20px ${alpha('#00ED64', 0.15)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
              {form.name}
            </Typography>
            {form.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {form.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, form.id)}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            icon={form.isPublished ? <Public sx={{ fontSize: 14 }} /> : <Lock sx={{ fontSize: 14 }} />}
            label={form.isPublished ? 'Published' : 'Draft'}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              bgcolor: form.isPublished ? alpha('#00ED64', 0.15) : alpha('#fff', 0.05),
              color: form.isPublished ? '#00ED64' : 'text.secondary',
              '& .MuiChip-icon': {
                color: form.isPublished ? '#00ED64' : 'text.secondary',
              },
            }}
          />
          {form.collection && (
            <Chip
              icon={<Description sx={{ fontSize: 14 }} />}
              label={form.collection}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                bgcolor: alpha('#fff', 0.05),
              }}
            />
          )}
          {form.responseCount !== undefined && form.responseCount > 0 && (
            <Chip
              icon={<People sx={{ fontSize: 14 }} />}
              label={`${form.responseCount} responses`}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                bgcolor: alpha('#2196f3', 0.15),
                color: '#2196f3',
                '& .MuiChip-icon': { color: '#2196f3' },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 12 }} />
            {formatDate(form.updatedAt || form.createdAt)}
          </Typography>
          {form.fieldCount !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {form.fieldCount} fields
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        {/* Edit button - always visible */}
        <Tooltip title="Edit form in builder">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 16 }} />}
            component={Link}
            href={`/builder?formId=${form.id}`}
            sx={{
              borderColor: alpha('#2196f3', 0.5),
              color: '#2196f3',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#2196f3',
                bgcolor: alpha('#2196f3', 0.1),
              },
            }}
          >
            Edit
          </Button>
        </Tooltip>
        {form.isPublished && (
          <Tooltip title="View published form">
            <Button
              size="small"
              variant="contained"
              startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
              component={Link}
              href={`/forms/${form.slug || form.id}`}
              target="_blank"
              sx={{
                bgcolor: '#00ED64',
                color: '#001E2B',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#00CC55' },
              }}
            >
              Open
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Copy form link">
          <IconButton size="small" onClick={() => handleCopyLink(form)} sx={{ color: 'text.secondary' }}>
            <ContentCopy sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="View responses">
          <IconButton
            size="small"
            component={Link}
            href={`/forms/${form.id}/responses`}
            sx={{ color: 'text.secondary' }}
          >
            <People sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="View analytics">
          <IconButton
            size="small"
            component={Link}
            href={`/forms/${form.id}/analytics`}
            sx={{ color: 'text.secondary' }}
          >
            <BarChart sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#001E2B' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: alpha('#fff', 0.1),
          bgcolor: alpha('#fff', 0.02),
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Back to builder">
                <IconButton
                  component={Link}
                  href="/builder"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#00ED64', bgcolor: alpha('#00ED64', 0.1) },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  My Forms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage and access your saved forms
                </Typography>
              </Box>
            </Box>
            <Button
              component={Link}
              href="/builder"
              variant="contained"
              startIcon={<Add />}
              sx={{
                bgcolor: '#00ED64',
                color: '#001E2B',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { bgcolor: '#00CC55' },
              }}
            >
              Create Form
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 4,
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha('#fff', 0.03),
              '& fieldset': { borderColor: alpha('#fff', 0.1) },
              '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
              '&.Mui-focused fieldset': { borderColor: '#00ED64' },
            },
          }}
        />

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={200}
                  sx={{ bgcolor: alpha('#fff', 0.05) }}
                />
              </Grid>
            ))}
          </Grid>
        ) : filteredForms.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: alpha('#fff', 0.02),
              border: '1px dashed',
              borderColor: alpha('#fff', 0.1),
              borderRadius: 2,
            }}
          >
            <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              {searchQuery ? 'No forms found' : 'No forms yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first form to get started'}
            </Typography>
            {!searchQuery && (
              <Button
                component={Link}
                href="/builder"
                variant="contained"
                startIcon={<Add />}
                sx={{
                  bgcolor: '#00ED64',
                  color: '#001E2B',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#00CC55' },
                }}
              >
                Create Your First Form
              </Button>
            )}
          </Paper>
        ) : (
          <>
            {/* Published Forms Section */}
            {publishedForms.length > 0 && (
              <Box sx={{ mb: 5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#00ED64',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Public sx={{ fontSize: 20 }} />
                  Published Forms
                  <Chip
                    label={publishedForms.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: alpha('#00ED64', 0.15),
                      color: '#00ED64',
                    }}
                  />
                </Typography>
                <Grid container spacing={3}>
                  {publishedForms.map((form) => (
                    <Grid item xs={12} sm={6} md={4} key={form.id}>
                      <FormCard form={form} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Draft Forms Section */}
            {draftForms.length > 0 && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Lock sx={{ fontSize: 20 }} />
                  Draft Forms
                  <Chip
                    label={draftForms.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: alpha('#fff', 0.1),
                      color: 'text.secondary',
                    }}
                  />
                </Typography>
                <Grid container spacing={3}>
                  {draftForms.map((form) => (
                    <Grid item xs={12} sm={6} md={4} key={form.id}>
                      <FormCard form={form} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 180,
          },
        }}
      >
        <MenuItem
          component={Link}
          href={`/builder?formId=${menuAnchor.formId}`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <Edit fontSize="small" sx={{ color: '#2196f3' }} />
          </ListItemIcon>
          <ListItemText>Edit Form</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const form = forms.find((f) => f.id === menuAnchor.formId);
            if (form) handleCopyLink(form);
          }}
        >
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        <MenuItem
          component={Link}
          href={`/forms/${menuAnchor.formId}/responses`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <People fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Responses</ListItemText>
        </MenuItem>
        <MenuItem
          component={Link}
          href={`/forms/${menuAnchor.formId}/analytics`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <BarChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => menuAnchor.formId && handleDelete(menuAnchor.formId)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Form</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
