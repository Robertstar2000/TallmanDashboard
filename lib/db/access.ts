/**
 * MS Access Database Utilities
 * 
 * This module provides functions to interact with MS Access databases
 * using the mdb-reader package, without requiring ODBC or the Microsoft Access Database Engine.
 */

import * as fs from 'fs';
import MDBReader from 'mdb-reader';

/**
 * Executes a query against an MS Access database
 * @param filePath Path to the MS Access database file
 * @param query SQL query to execute
 * @returns Query results
 */
export async function executeAccessQuery(filePath: string, query: string): Promise<any[]> {
  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`MS Access file not found at path: ${filePath}`);
    }
    
    // Read the database file
    const buffer = fs.readFileSync(filePath);
    const reader = new MDBReader(buffer);
    
    // This is a very simplified query parser that only handles basic SELECT queries
    // In a real implementation, you would need a proper SQL parser
    
    // Extract the table name from the query
    const fromMatch = query.match(/from\s+([^\s]+)/i);
    if (!fromMatch || fromMatch.length < 2) {
      throw new Error('Invalid query format: Could not determine table name');
    }
    
    const tableName = fromMatch[1].replace(/[\s;]/g, '');
    
    // Check if the table exists
    if (!reader.getTableNames().includes(tableName)) {
      throw new Error(`Table '${tableName}' not found in the database`);
    }
    
    // Get the data from the table
    const table = reader.getTable(tableName);
    let data = table.getData();
    
    // Handle COUNT queries
    if (query.toLowerCase().includes('count(')) {
      if (query.toLowerCase().includes('count(*)')) {
        return [{ Count: data.length }];
      }
      
      // If it's counting a specific column
      const countMatch = query.match(/count\(\s*([^\s\)]+)\s*\)/i);
      if (countMatch && countMatch.length >= 2) {
        const columnName = countMatch[1];
        const columns = table.getColumnNames();
        
        if (!columns.includes(columnName)) {
          throw new Error(`Column '${columnName}' not found in table '${tableName}'`);
        }
        
        // Count non-null values in the column
        const count = data.filter((row: any) => row[columnName] !== null && row[columnName] !== undefined).length;
        return [{ Count: count }];
      }
    }
    
    // Handle WHERE clauses
    const whereMatch = query.match(/where\s+(.*?)(?:order\s+by|group\s+by|having|$)/i);
    if (whereMatch && whereMatch.length >= 2) {
      const whereClause = whereMatch[1].trim();
      
      // Very simple WHERE parser that only handles basic conditions
      // This is not a full SQL parser and has many limitations
      const conditions = whereClause.split(/\s+and\s+/i);
      
      data = data.filter((row: any) => {
        return conditions.every(condition => {
          // Parse the condition (column operator value)
          const parts = condition.match(/([^\s<>=!]+)\s*([<>=!]+)\s*(.+)/);
          if (!parts || parts.length < 4) return true;
          
          const column = parts[1];
          const operator = parts[2];
          let value = parts[3].replace(/['";]/g, '');
          
          // Try to convert value to number if possible
          let numericValue: number | string = value;
          if (!isNaN(Number(value))) {
            numericValue = Number(value);
          }
          
          // Apply the condition
          switch (operator) {
            case '=':
              return row[column] == numericValue;
            case '!=':
            case '<>':
              return row[column] != numericValue;
            case '>':
              return row[column] > numericValue;
            case '<':
              return row[column] < numericValue;
            case '>=':
              return row[column] >= numericValue;
            case '<=':
              return row[column] <= numericValue;
            default:
              return true;
          }
        });
      });
    }
    
    // Handle SELECT columns
    const selectMatch = query.match(/select\s+(.*?)\s+from/i);
    if (selectMatch && selectMatch.length >= 2) {
      const selectClause = selectMatch[1].trim();
      
      // If not selecting all columns
      if (selectClause !== '*') {
        const selectedColumns = selectClause.split(',').map(c => c.trim());
        
        // Project only selected columns
        data = data.map((row: any) => {
          const newRow: any = {};
          selectedColumns.forEach(col => {
            newRow[col] = row[col];
          });
          return newRow;
        });
      }
    }
    
    // Handle ORDER BY
    const orderByMatch = query.match(/order\s+by\s+(.*?)(?:limit|$)/i);
    if (orderByMatch && orderByMatch.length >= 2) {
      const orderByClause = orderByMatch[1].trim();
      const orderParts = orderByClause.split(',').map(part => part.trim());
      
      // Sort the data based on the ORDER BY clause
      data.sort((a: any, b: any) => {
        for (const part of orderParts) {
          const [column, direction] = part.split(/\s+/);
          const desc = direction && direction.toLowerCase() === 'desc';
          
          if (a[column] < b[column]) return desc ? 1 : -1;
          if (a[column] > b[column]) return desc ? -1 : 1;
        }
        return 0;
      });
    }
    
    // Handle LIMIT
    const limitMatch = query.match(/limit\s+(\d+)/i);
    if (limitMatch && limitMatch.length >= 2) {
      const limit = parseInt(limitMatch[1]);
      data = data.slice(0, limit);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error executing Access query:', error);
    throw new Error(`Access query execution failed: ${error.message}`);
  }
}
