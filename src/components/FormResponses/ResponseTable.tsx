'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { FormResponse } from '@/types/form';
import { format } from 'date-fns';

interface ResponseTableProps {
  responses: FormResponse[];
  onRowClick?: (response: FormResponse) => void;
}

export function ResponseTable({ responses, onRowClick }: ResponseTableProps) {
  if (responses.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell align="center" sx={{ py: 4 }}>
                No responses available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Get all unique field paths from responses
  const allFields = new Set<string>();
  responses.forEach(response => {
    Object.keys(response.data).forEach(key => allFields.add(key));
  });
  const fieldPaths = Array.from(allFields).slice(0, 10); // Limit to 10 fields for display

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Status</TableCell>
            {fieldPaths.map(field => (
              <TableCell key={field}>{field}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.map((response) => (
            <TableRow
              key={response._id}
              hover
              onClick={() => onRowClick?.(response)}
              sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              <TableCell>
                {format(new Date(response.submittedAt), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>{response.status}</TableCell>
              {fieldPaths.map(field => (
                <TableCell key={field}>
                  {response.data[field] !== undefined
                    ? String(response.data[field]).substring(0, 50)
                    : '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

