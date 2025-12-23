'use client';

import { Fragment } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Close,
  Help,
  LightbulbOutlined,
  WarningAmber,
  Code,
  ChevronRight,
  LinkOutlined,
  Search,
  KeyboardCommandKey,
} from '@mui/icons-material';
import { HelpTopic, HelpContent } from '@/types/help';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  topic: HelpTopic | null;
  onNavigateToTopic?: (topicId: string) => void;
  onOpenSearch?: () => void;
}

export function HelpModal({ open, onClose, topic, onNavigateToTopic, onOpenSearch }: HelpModalProps) {
  if (!topic) return null;

  const renderContent = (content: HelpContent, index: number) => {
    switch (content.type) {
      case 'heading':
        return (
          <Typography
            key={index}
            variant="subtitle1"
            sx={{ fontWeight: 600, mt: index > 0 ? 2 : 0, mb: 1 }}
          >
            {content.content as string}
          </Typography>
        );

      case 'text':
        return (
          <Typography
            key={index}
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.7 }}
          >
            {content.content as string}
          </Typography>
        );

      case 'list':
        return (
          <List key={index} dense sx={{ py: 0, mb: 1.5 }}>
            {(content.content as string[]).map((item, i) => (
              <ListItem key={i} sx={{ py: 0.25, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <ChevronRight fontSize="small" sx={{ color: '#00ED64' }} />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
            ))}
          </List>
        );

      case 'code':
        return (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 2,
              mb: 1.5,
              bgcolor: '#001E2B',
              borderRadius: 1,
              overflow: 'auto',
            }}
          >
            <Box
              component="pre"
              sx={{
                m: 0,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#00ED64',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {Array.isArray(content.content)
                ? content.content.join('\n')
                : content.content}
            </Box>
          </Paper>
        );

      case 'tip':
        return (
          <Paper
            key={index}
            elevation={0}
            role="note"
            aria-label="Tip"
            sx={{
              p: 2,
              mb: 1.5,
              bgcolor: alpha('#00ED64', 0.08),
              border: '1px solid',
              borderColor: alpha('#00ED64', 0.3),
              borderRadius: 1,
              display: 'flex',
              gap: 1.5,
            }}
          >
            <LightbulbOutlined sx={{ color: '#00ED64', fontSize: 20, mt: 0.25 }} aria-hidden="true" />
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {content.content as string}
            </Typography>
          </Paper>
        );

      case 'warning':
        return (
          <Paper
            key={index}
            elevation={0}
            role="alert"
            aria-label="Warning"
            sx={{
              p: 2,
              mb: 1.5,
              bgcolor: alpha('#ff9800', 0.08),
              border: '1px solid',
              borderColor: alpha('#ff9800', 0.3),
              borderRadius: 1,
              display: 'flex',
              gap: 1.5,
            }}
          >
            <WarningAmber sx={{ color: '#ff9800', fontSize: 20, mt: 0.25 }} aria-hidden="true" />
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {content.content as string}
            </Typography>
          </Paper>
        );

      case 'example':
        return (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 2,
              mb: 1.5,
              bgcolor: alpha('#2196f3', 0.05),
              border: '1px solid',
              borderColor: alpha('#2196f3', 0.2),
              borderRadius: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#2196f3',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Example
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {content.content as string}
            </Typography>
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="help-dialog-title"
      aria-describedby="help-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
        role: 'dialog',
        'aria-modal': true,
      }}
    >
      <DialogTitle
        id="help-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha('#00ED64', 0.05),
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Help sx={{ color: '#00ED64' }} aria-hidden="true" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {topic.title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close help dialog"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }} id="help-dialog-description">
        {/* Description */}
        <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
          {topic.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Main Content */}
        {topic.content.map((content, index) => (
          <Fragment key={index}>{renderContent(content, index)}</Fragment>
        ))}

        {/* Related Topics */}
        {topic.relatedTopics && topic.relatedTopics.length > 0 && onNavigateToTopic && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Related Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {topic.relatedTopics.map((relatedId) => (
                <Chip
                  key={relatedId}
                  label={relatedId.replace(/-/g, ' ')}
                  size="small"
                  icon={<LinkOutlined fontSize="small" />}
                  onClick={() => onNavigateToTopic(relatedId)}
                  sx={{
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#00ED64', 0.1),
                    },
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        {onOpenSearch ? (
          <Button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            startIcon={<Search fontSize="small" />}
            size="small"
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              '&:hover': {
                bgcolor: alpha('#00ED64', 0.1),
              },
            }}
          >
            Search all topics
            <Box
              component="kbd"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.125,
                bgcolor: alpha('#000', 0.05),
                borderRadius: 0.5,
                fontSize: '0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              <KeyboardCommandKey sx={{ fontSize: 10 }} />
              /
            </Box>
          </Button>
        ) : (
          <Box />
        )}
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#00ED64', color: '#001E2B' }}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
