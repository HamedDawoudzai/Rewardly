'use strict';

/**
 * CSV Generator Utility
 * Converts arrays of objects to properly formatted CSV strings
 */

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} data - Array of objects to convert
 * @returns {string} CSV formatted string
 */
function generateCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object's keys
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.map(escapeCSVField).join(',');
  
  // Create data rows
  const dataRows = data.map(row => 
    headers.map(header => escapeCSVField(row[header])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape a field for CSV (handle commas, quotes, newlines)
 * @param {any} field - Field value to escape
 * @returns {string} Escaped CSV field
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Format date for CSV export
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForCSV(date) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return '';
  }
}

/**
 * Format currency for CSV export
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string
 */
function formatCurrency(cents) {
  if (cents === null || cents === undefined) return '';
  return `$${(cents / 100).toFixed(2)}`;
}

module.exports = { 
  generateCSV, 
  escapeCSVField,
  formatDateForCSV,
  formatCurrency
};

