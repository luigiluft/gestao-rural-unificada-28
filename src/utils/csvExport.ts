// CSV export utility functions
import { ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl";

export interface CSVExportOptions {
  data: any[];
  columns: ColumnConfig[];
  filename: string;
  customFormatters?: Record<string, (value: any) => string>;
}

export const exportToCSV = ({ data, columns, filename, customFormatters = {} }: CSVExportOptions) => {
  if (!data || data.length === 0) {
    throw new Error("Nenhum dado para exportar");
  }

  // Get visible columns in their current order
  const visibleColumns = columns.filter(col => col.visible);
  
  if (visibleColumns.length === 0) {
    throw new Error("Nenhuma coluna visível para exportar");
  }

  // Create CSV header
  const headers = visibleColumns.map(col => col.label);
  
  // Create CSV rows
  const rows = data.map(item => {
    return visibleColumns.map(col => {
      let value = item[col.key];
      
      // Apply custom formatters if available
      if (customFormatters[col.key]) {
        value = customFormatters[col.key](value);
      } else {
        // Default formatting
        value = formatValue(value, col.key);
      }
      
      // Escape CSV values
      return escapeCsvValue(value);
    });
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download file
  downloadCSV(csvContent, filename);
};

const formatValue = (value: any, columnKey: string): string => {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle dates
  if (columnKey.includes('data') || columnKey.includes('created_at') || columnKey.includes('updated_at')) {
    if (typeof value === 'string' && value.includes('T')) {
      try {
        return new Date(value).toLocaleDateString('pt-BR');
      } catch {
        return String(value);
      }
    }
  }

  // Handle currency values
  if (columnKey.includes('valor') || columnKey.includes('preco')) {
    if (typeof value === 'number') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
  }

  // Handle arrays (like products)
  if (Array.isArray(value)) {
    return value.length.toString();
  }

  // Handle objects
  if (typeof value === 'object') {
    if (value.nome) return value.nome;
    if (value.label) return value.label;
    return JSON.stringify(value);
  }

  return String(value);
};

const escapeCsvValue = (value: string): string => {
  // Convert to string if not already
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

const downloadCSV = (csvContent: string, filename: string) => {
  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};