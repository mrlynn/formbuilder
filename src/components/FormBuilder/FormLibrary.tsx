'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ListSubheader,
  Badge,
} from '@mui/material';
import { Delete, Code, Download, Upload, BarChart } from '@mui/icons-material';
import {
  loadAllFormConfigurations,
  deleteFormConfiguration,
  exportFormConfiguration,
  importFormConfiguration
} from '@/lib/formStorage';
import { FormConfiguration } from '@/types/form';
import { HelpButton } from '@/components/Help';
import { generateFormCode } from '@/lib/formCodeGenerators';

interface FormLibraryProps {
  onLoadForm: (config: FormConfiguration) => void;
}

export function FormLibrary({ onLoadForm }: FormLibraryProps) {
  const [configs, setConfigs] = useState<FormConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<FormConfiguration | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeTab, setCodeTab] = useState(0);
  const [framework, setFramework] = useState<
    'react' | 'vue' | 'angular' | 'html' | 'react-hook-form' |
    'nextjs' | 'svelte' | 'solidjs' | 'remix' |
    'python-flask' | 'python-fastapi' | 'python-django' |
    'node-express' | 'php' | 'ruby-rails' | 'go-gin' | 'java-spring' |
    'zod-schema' | 'yup-schema' | 'typescript-types'
  >('react');
  const [language, setLanguage] = useState<'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java'>('typescript');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadConfigs();
    loadResponseCounts();
  }, []);

  const loadResponseCounts = async () => {
    // Load response counts for all forms
    const counts: Record<string, number> = {};
    // This would ideally fetch from an API that returns counts for multiple forms
    // For now, we'll fetch individually (could be optimized)
    try {
      const configs = loadAllFormConfigurations();
      for (const config of configs) {
        if (config.id) {
          try {
            const response = await fetch(`/api/forms/${config.id}/responses?statsOnly=true&pageSize=1`);
            const data = await response.json();
            if (data.success && data.stats) {
              counts[config.id] = data.stats.total || 0;
            }
          } catch (err) {
            // Ignore errors for individual forms
          }
        }
      }
      setResponseCounts(counts);
    } catch (err) {
      // Ignore errors
    }
  };

  const loadConfigs = () => {
    const loaded = loadAllFormConfigurations();
    setConfigs(loaded);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this form configuration?')) {
      deleteFormConfiguration(id);
      loadConfigs();
    }
  };

  const handleGenerateCode = (config: FormConfiguration) => {
    setSelectedConfig(config);
    setCodeDialogOpen(true);
    updateGeneratedCode(config, framework, language);
  };

  const updateGeneratedCode = (
    config: FormConfiguration,
    fw: typeof framework,
    lang: typeof language
  ) => {
    // Auto-detect language based on framework
    let detectedLang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java' = lang;
    if (fw.startsWith('python-')) detectedLang = 'python';
    else if (fw === 'php') detectedLang = 'php';
    else if (fw === 'ruby-rails') detectedLang = 'ruby';
    else if (fw === 'go-gin') detectedLang = 'go';
    else if (fw === 'java-spring') detectedLang = 'java';
    else if (fw === 'node-express') detectedLang = lang; // Keep selected
    else detectedLang = lang; // Frontend frameworks
    
    const code = generateFormCode(config, {
      framework: fw,
      language: detectedLang,
      styling: 'mui'
    });
    setGeneratedCode(code);
  };

  const handleDownloadCode = () => {
    if (!selectedConfig) return;
    
    // Auto-detect language based on framework
    let detectedLang: typeof language = language;
    if (framework.startsWith('python-')) detectedLang = 'python';
    else if (framework === 'php') detectedLang = 'php';
    else if (framework === 'ruby-rails') detectedLang = 'ruby';
    else if (framework === 'go-gin') detectedLang = 'go';
    else if (framework === 'java-spring') detectedLang = 'java';
    
    const code = generateFormCode(selectedConfig, {
      framework,
      language: detectedLang,
      styling: 'mui'
    });
    
    // Determine file extension
    let extension = 'txt';
    if (framework === 'zod-schema' || framework === 'yup-schema' || framework === 'typescript-types') {
      extension = 'ts';
    } else if (detectedLang === 'typescript') extension = framework === 'nextjs' ? 'tsx' : 'ts';
    else if (detectedLang === 'javascript') extension = 'js';
    else if (detectedLang === 'python') extension = 'py';
    else if (detectedLang === 'php') extension = 'php';
    else if (detectedLang === 'ruby') extension = 'rb';
    else if (detectedLang === 'go') extension = 'go';
    else if (detectedLang === 'java') extension = 'java';
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedConfig.name.replace(/\s+/g, '-')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (config: FormConfiguration) => {
    const json = exportFormConfiguration(config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = event.target?.result as string;
            const config = importFormConfiguration(json);
            // Save imported config
            const { saveFormConfiguration } = require('@/lib/formStorage');
            saveFormConfiguration(config);
            loadConfigs();
            alert('Form configuration imported successfully!');
          } catch (error: any) {
            alert(`Failed to import: ${error.message}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha('#00ED64', 0.05),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Saved Forms
          </Typography>
          <HelpButton topicId="form-library" tooltip="Form Library Help" />
        </Box>
        <Button
          size="small"
          startIcon={<Upload />}
          onClick={handleImport}
          variant="outlined"
        >
          Import
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {configs.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              No saved forms. Save a form configuration to see it here.
            </Typography>
          </Box>
        ) : (
          <List>
            {configs.map((config) => (
              <ListItem
                key={config.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: alpha('#00ED64', 0.05)
                  }
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onLoadForm(config)}
                      title="Load form"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    {config.id && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`/forms/${config.id}/analytics`, '_blank');
                        }}
                        title="View analytics"
                      >
                        <BarChart fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleGenerateCode(config)}
                      title="Generate code"
                    >
                      <Code fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExport(config)}
                      title="Export config"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => config.id && handleDelete(config.id)}
                      color="error"
                      title="Delete"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {config.name}
                      {config.id && responseCounts[config.id] !== undefined && (
                        <Badge
                          badgeContent={responseCounts[config.id]}
                          color="primary"
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: '#00ED64',
                            },
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      {config.description && (
                        <Typography variant="caption" display="block">
                          {config.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {config.collection} • {config.fieldConfigs.filter((f) => f.included).length} fields
                        {config.updatedAt && ` • Updated ${new Date(config.updatedAt).toLocaleDateString()}`}
                        {config.id && responseCounts[config.id] !== undefined && ` • ${responseCounts[config.id]} responses`}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Code Generation Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                Generate Code - {selectedConfig?.name}
              </Typography>
              <HelpButton topicId="code-generation" tooltip="Code Generation Help" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Framework</InputLabel>
                <Select
                  value={framework}
                  label="Framework"
                  onChange={(e) => {
                    const fw = e.target.value as typeof framework;
                    setFramework(fw);
                    if (selectedConfig) {
                      updateGeneratedCode(selectedConfig, fw, language);
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400
                      }
                    }
                  }}
                >
                  <ListSubheader>Frontend</ListSubheader>
                  <MenuItem value="react">React</MenuItem>
                  <MenuItem value="vue">Vue</MenuItem>
                  <MenuItem value="angular">Angular</MenuItem>
                  <MenuItem value="svelte">Svelte</MenuItem>
                  <MenuItem value="solidjs">SolidJS</MenuItem>
                  <MenuItem value="nextjs">Next.js</MenuItem>
                  <MenuItem value="remix">Remix</MenuItem>
                  <MenuItem value="react-hook-form">React Hook Form</MenuItem>
                  <MenuItem value="html">Plain HTML</MenuItem>
                  <ListSubheader>Backend - Python</ListSubheader>
                  <MenuItem value="python-flask">Flask</MenuItem>
                  <MenuItem value="python-fastapi">FastAPI</MenuItem>
                  <MenuItem value="python-django">Django</MenuItem>
                  <ListSubheader>Backend - Node.js</ListSubheader>
                  <MenuItem value="node-express">Express</MenuItem>
                  <ListSubheader>Backend - Other</ListSubheader>
                  <MenuItem value="php">PHP</MenuItem>
                  <MenuItem value="ruby-rails">Ruby on Rails</MenuItem>
                  <MenuItem value="go-gin">Go (Gin)</MenuItem>
                  <MenuItem value="java-spring">Java Spring</MenuItem>
                  <ListSubheader>Schemas & Types</ListSubheader>
                  <MenuItem value="zod-schema">Zod Schema</MenuItem>
                  <MenuItem value="yup-schema">Yup Schema</MenuItem>
                  <MenuItem value="typescript-types">TypeScript Types</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={(e) => {
                    const lang = e.target.value as typeof language;
                    setLanguage(lang);
                    if (selectedConfig) {
                      updateGeneratedCode(selectedConfig, framework, lang);
                    }
                  }}
                  disabled={framework.startsWith('python-') || framework === 'php' || framework === 'ruby-rails' || framework === 'go-gin' || framework === 'java-spring' || framework.endsWith('-schema') || framework === 'typescript-types'}
                >
                  <MenuItem value="typescript">TypeScript</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="php">PHP</MenuItem>
                  <MenuItem value="ruby">Ruby</MenuItem>
                  <MenuItem value="go">Go</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={generatedCode}
            InputProps={{
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
            onFocus={(e) => e.target.select()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            navigator.clipboard.writeText(generatedCode);
            alert('Code copied to clipboard!');
          }}>
            Copy
          </Button>
          <Button onClick={handleDownloadCode} variant="contained">
            Download
          </Button>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

