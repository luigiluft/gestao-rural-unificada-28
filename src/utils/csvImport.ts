// CSV import utility functions

export interface CSVImportResult {
  data: any[];
  errors: string[];
}

export const importFromCSV = (file: File): Promise<CSVImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const result = parseCSV(csvContent);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

const parseCSV = (csvContent: string): CSVImportResult => {
  const errors: string[] = [];
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return { data: [], errors: ['Arquivo CSV vazio ou inválido'] };
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push(`Linha ${i + 1}: número de colunas não corresponde ao cabeçalho`);
        continue;
      }
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = parseValue(values[index]);
      });
      
      data.push(row);
    } catch (error) {
      errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }
  
  return { data, errors };
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of value
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add last value
  values.push(currentValue.trim());
  
  return values;
};

const parseValue = (value: string): any => {
  // Remove BOM if present
  value = value.replace(/^\uFEFF/, '');
  
  // Handle empty values
  if (value === '' || value === 'null' || value === 'undefined') {
    return null;
  }
  
  // Handle numbers with Brazilian formatting (R$ 1.234,56)
  if (value.startsWith('R$')) {
    const numStr = value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(numStr);
    return isNaN(num) ? value : num;
  }
  
  // Handle regular numbers
  const num = Number(value);
  if (!isNaN(num) && value !== '') {
    return num;
  }
  
  // Handle booleans
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Return as string
  return value;
};
