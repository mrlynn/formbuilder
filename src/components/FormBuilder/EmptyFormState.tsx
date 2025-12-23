'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  alpha,
  Tabs,
  Tab,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add,
  AutoAwesome,
  Folder,
  Storage,
  Description,
  Lightbulb,
} from '@mui/icons-material';
import { QuestionTypePicker } from './QuestionTypePicker';
import { FieldConfig } from '@/types/form';
import AIFormGeneratorDialog from './AIFormGeneratorDialog';

interface EmptyFormStateProps {
  onAddField: (field: FieldConfig) => void;
  onOpenLibrary: () => void;
  onConnectDatabase?: () => void;
  hasConnection: boolean;
}

// Form templates for quick start
const TEMPLATES = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Name, email, message',
    icon: '📧',
    fields: [
      { path: 'name', label: 'Your Name', type: 'string', included: true, required: true },
      { path: 'email', label: 'Email Address', type: 'email', included: true, required: true },
      { path: 'subject', label: 'Subject', type: 'string', included: true, required: false },
      { path: 'message', label: 'Message', type: 'string', included: true, required: true },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback Survey',
    description: 'Rating & comments',
    icon: '⭐',
    fields: [
      { path: 'rating', label: 'How would you rate us?', type: 'number', included: true, required: true, validation: { min: 1, max: 5 } },
      { path: 'recommend', label: 'Would you recommend us?', type: 'boolean', included: true, required: true },
      { path: 'feedback', label: 'Any additional feedback?', type: 'string', included: true, required: false },
    ],
  },
  {
    id: 'registration',
    name: 'Event Registration',
    description: 'Attendee info',
    icon: '🎫',
    fields: [
      { path: 'firstName', label: 'First Name', type: 'string', included: true, required: true },
      { path: 'lastName', label: 'Last Name', type: 'string', included: true, required: true },
      { path: 'email', label: 'Email', type: 'email', included: true, required: true },
      { path: 'phone', label: 'Phone Number', type: 'string', included: true, required: false },
      { path: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'string', included: true, required: false },
    ],
  },
  {
    id: 'application',
    name: 'Job Application',
    description: 'Resume & details',
    icon: '💼',
    fields: [
      { path: 'fullName', label: 'Full Name', type: 'string', included: true, required: true },
      { path: 'email', label: 'Email', type: 'email', included: true, required: true },
      { path: 'phone', label: 'Phone', type: 'string', included: true, required: true },
      { path: 'position', label: 'Position Applying For', type: 'string', included: true, required: true },
      { path: 'experience', label: 'Years of Experience', type: 'number', included: true, required: true },
      { path: 'coverLetter', label: 'Cover Letter', type: 'string', included: true, required: false },
    ],
  },
  {
    id: 'patient-intake-encrypted',
    name: 'Patient Intake (Encrypted)',
    description: 'HIPAA-compliant with QE',
    icon: '🏥',
    fields: [
      { path: 'firstName', label: 'First Name', type: 'string', included: true, required: true },
      { path: 'lastName', label: 'Last Name', type: 'string', included: true, required: true },
      { path: 'dateOfBirth', label: 'Date of Birth', type: 'date', included: true, required: true },
      { path: 'ssn', label: 'Social Security Number', type: 'string', included: true, required: true, validation: { pattern: '^\\d{3}-\\d{2}-\\d{4}$' }, encryption: { enabled: true, algorithm: 'Indexed', queryType: 'equality' } },
      { path: 'insuranceId', label: 'Insurance ID', type: 'string', included: true, required: true, encryption: { enabled: true, algorithm: 'Indexed', queryType: 'equality' } },
      { path: 'medicalHistory', label: 'Medical History', type: 'string', included: true, required: false, encryption: { enabled: true, algorithm: 'Unindexed' } },
      { path: 'allergies', label: 'Known Allergies', type: 'string', included: true, required: false },
      { path: 'emergencyContact', label: 'Emergency Contact Phone', type: 'string', included: true, required: true },
    ],
  },
  {
    id: 'financial-application-encrypted',
    name: 'Financial Application (Encrypted)',
    description: 'PCI-compliant with QE',
    icon: '🏦',
    fields: [
      { path: 'fullName', label: 'Full Legal Name', type: 'string', included: true, required: true },
      { path: 'email', label: 'Email Address', type: 'email', included: true, required: true },
      { path: 'phone', label: 'Phone Number', type: 'string', included: true, required: true },
      { path: 'ssn', label: 'Social Security Number', type: 'string', included: true, required: true, validation: { pattern: '^\\d{3}-\\d{2}-\\d{4}$' }, encryption: { enabled: true, algorithm: 'Indexed', queryType: 'equality' } },
      { path: 'annualIncome', label: 'Annual Income ($)', type: 'number', included: true, required: true, encryption: { enabled: true, algorithm: 'Indexed', queryType: 'range' } },
      { path: 'employerName', label: 'Current Employer', type: 'string', included: true, required: true },
      { path: 'bankAccountNumber', label: 'Bank Account Number', type: 'string', included: true, required: true, encryption: { enabled: true, algorithm: 'Indexed', queryType: 'equality' } },
      { path: 'routingNumber', label: 'Routing Number', type: 'string', included: true, required: true, validation: { pattern: '^\\d{9}$' }, encryption: { enabled: true, algorithm: 'Unindexed' } },
    ],
  },
];

export function EmptyFormState({
  onAddField,
  onOpenLibrary,
  onConnectDatabase,
  hasConnection,
}: EmptyFormStateProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    template.fields.forEach((field, index) => {
      // Add a small delay between each field to maintain order
      setTimeout(() => {
        onAddField({
          ...field,
          source: 'custom',
        } as FieldConfig);
      }, index * 10);
    });
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 700,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha('#00ED64', 0.1)} 0%, ${alpha('#00ED64', 0.02)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Create Your Form
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start from scratch or use a template. No database knowledge required.
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: '#00ED64',
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#00ED64',
            },
          }}
        >
          <Tab
            icon={<Add sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Add Questions"
          />
          <Tab
            icon={<AutoAwesome sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Templates"
          />
          <Tab
            icon={<AutoAwesome sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="AI Generate"
          />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ minHeight: 300 }}>
          {activeTab === 0 && (
            <QuestionTypePicker onSelect={onAddField} />
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {TEMPLATES.map((template) => (
                  <Paper
                    key={template.id}
                    elevation={0}
                    onClick={() => handleTemplateSelect(template)}
                    sx={{
                      flex: '1 1 calc(50% - 8px)',
                      minWidth: 200,
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: alpha('#00ED64', 0.5),
                        bgcolor: alpha('#00ED64', 0.03),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha('#00ED64', 0.1)}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Typography sx={{ fontSize: 28 }}>{template.icon}</Typography>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${template.fields.length} questions`}
                            size="small"
                            sx={{ fontSize: 10, height: 18 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <AutoAwesome sx={{ fontSize: 48, color: '#00ED64', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Generate Form with AI
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Describe your form in plain English and let AI create a complete form configuration with fields, validation, and conditional logic.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => setAiDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #00ED64 0%, #4DFF9F 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00CC55 0%, #3DFF8F 100%)',
                  },
                }}
              >
                Generate with AI
              </Button>
            </Box>
          )}
        </Box>

        {/* Footer with additional options */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha('#000', 0.02),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              Pro tip: Connect to MongoDB to import fields from existing data
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Folder />}
              onClick={onOpenLibrary}
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.secondary',
                },
              }}
            >
              My Forms
            </Button>
            {onConnectDatabase && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Storage />}
                onClick={onConnectDatabase}
                sx={{
                  borderColor: hasConnection ? alpha('#00ED64', 0.5) : 'divider',
                  color: hasConnection ? '#00ED64' : 'text.secondary',
                  '&:hover': {
                    borderColor: '#00ED64',
                    bgcolor: alpha('#00ED64', 0.05),
                  },
                }}
              >
                {hasConnection ? 'Connected' : 'Connect DB'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* AI Form Generator Dialog */}
      <AIFormGeneratorDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        onGenerate={(form) => {
          // Apply generated form fields
          if (form.fieldConfigs) {
            form.fieldConfigs.forEach((field, index) => {
              setTimeout(() => {
                onAddField(field);
              }, index * 50);
            });
          }
          setAiDialogOpen(false);
        }}
      />
    </Box>
  );
}
