'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { QuestionTypePicker } from './QuestionTypePicker';
import { FieldConfig } from '@/types/form';

interface AddQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (field: FieldConfig) => void;
}

export function AddQuestionDialog({
  open,
  onClose,
  onAdd,
}: AddQuestionDialogProps) {
  const handleSelect = (field: FieldConfig) => {
    onAdd(field);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add sx={{ color: '#00ED64' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add Question
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <QuestionTypePicker onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
