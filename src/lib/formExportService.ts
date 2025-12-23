import { FormResponse } from '@/types/form';
import * as XLSX from 'xlsx';

interface ExportOptions {
  fields?: string[]; // Which fields to include (empty = all)
  includeMetadata?: boolean;
  dateFormat?: string;
}

/**
 * Export responses to CSV format
 */
export async function exportToCSV(
  responses: FormResponse[],
  options: ExportOptions = {}
): Promise<string> {
  const { fields, includeMetadata = false } = options;

  if (responses.length === 0) {
    return '';
  }

  // Determine all fields if not specified
  const allFields = fields || (() => {
    const fieldSet = new Set<string>();
    responses.forEach(r => {
      Object.keys(r.data).forEach(key => fieldSet.add(key));
    });
    return Array.from(fieldSet);
  })();

  // Build CSV rows
  const rows: any[] = responses.map(response => {
    const row: any = {};
    
    // Add metadata columns if requested
    if (includeMetadata) {
      row['_id'] = response._id;
      row['formId'] = response.formId;
      row['status'] = response.status;
      row['submittedAt'] = new Date(response.submittedAt).toISOString();
      if (response.completionTime) {
        row['completionTime'] = response.completionTime;
      }
      if (response.metadata?.deviceType) {
        row['deviceType'] = response.metadata.deviceType;
      }
    }

    // Add data fields
    allFields.forEach(field => {
      const value = response.data[field];
      row[field] = value !== null && value !== undefined
        ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
        : '';
    });

    return row;
  });

  // Create CSV content
  const headers = includeMetadata
    ? ['_id', 'formId', 'status', 'submittedAt', 'completionTime', 'deviceType', ...allFields]
    : allFields;

  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Export responses to Excel format
 */
export async function exportToExcel(
  responses: FormResponse[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const { fields, includeMetadata = false } = options;

  if (responses.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // Determine all fields if not specified
  const allFields = fields || (() => {
    const fieldSet = new Set<string>();
    responses.forEach(r => {
      Object.keys(r.data).forEach(key => fieldSet.add(key));
    });
    return Array.from(fieldSet);
  })();

  // Build worksheet data
  const rows: any[] = responses.map(response => {
    const row: any = {};
    
    // Add metadata columns if requested
    if (includeMetadata) {
      row['_id'] = response._id;
      row['formId'] = response.formId;
      row['status'] = response.status;
      row['submittedAt'] = new Date(response.submittedAt);
      if (response.completionTime) {
        row['completionTime'] = response.completionTime;
      }
      if (response.metadata?.deviceType) {
        row['deviceType'] = response.metadata.deviceType;
      }
    }

    // Add data fields
    allFields.forEach(field => {
      const value = response.data[field];
      row[field] = value !== null && value !== undefined
        ? (typeof value === 'object' ? JSON.stringify(value) : value)
        : '';
    });

    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Responses');

  // Convert to buffer
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

/**
 * Export responses to JSON format
 */
export function exportToJSON(
  responses: FormResponse[],
  options: ExportOptions = {}
): string {
  const { fields, includeMetadata = true } = options;

  let data = responses;

  // Filter fields if specified
  if (fields && fields.length > 0) {
    data = responses.map(response => ({
      ...response,
      data: Object.fromEntries(
        fields
          .filter(field => field in response.data)
          .map(field => [field, response.data[field]])
      ),
    }));
  }

  // Remove metadata if not requested
  if (!includeMetadata) {
    data = data.map(({ _id, formId, data: responseData }) => ({
      data: responseData,
    })) as any;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Export responses to PDF format (basic implementation)
 * Note: For production, consider using puppeteer or pdfkit for better formatting
 */
export async function exportToPDF(
  responses: FormResponse[],
  options: ExportOptions = {}
): Promise<string> {
  // For now, return a simple text-based representation
  // In production, use pdfkit or puppeteer for proper PDF generation
  const json = exportToJSON(responses, options);
  return `Form Responses Report\nGenerated: ${new Date().toISOString()}\n\n${json}`;
}

