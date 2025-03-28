import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import MDBReader from 'mdb-reader';

// Common table names in Point of Rental based on actual database and schema
const POR_COMMON_TABLES = [
  // Actual tables found in the database
  'AccountingAPIQueueCustomer',
  'AccountingAPIQueueGL',
  'AccountingAPIQueuePO',
  'AccountingAPIQueueVendor',
  'AccountingClass',
  'AccountingEmployee',
  'AccountingLocation',
  'CustomerFile_Tr',
  'CustomerGroup_Tr',
  'CustomerStatus',
  'InventoryFile',
  // Expected tables from schema
  'Contracts',
  'Rentals',
  'Transactions',
  'Orders',
  'Invoices',
  'tblContract',
  'tblCustomer',
  'tblEquipment',
  'tblTransaction'
];

// Set the correct POR database path
const POR_DB_PATH = 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';

/**
 * API route to execute a query against an MS Access database
 * Uses mdb-reader to read the database and then filters the data based on the query
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { filePath, sql } = body;

    // If no file path is provided, use the default POR database path
    if (!filePath) {
      filePath = process.env.POR_FILE_PATH || POR_DB_PATH;
      console.log(`Using default POR database path: ${filePath}`);
    }

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`MS Access file not found at path: ${filePath}`);
      return NextResponse.json(
        { error: `MS Access file not found at path: ${filePath}` },
        { status: 404 }
      );
    }

    console.log(`Executing query against Access database: ${filePath}`);
    console.log(`SQL: ${sql}`);

    // Read the database file
    const buffer = fs.readFileSync(filePath);
    const reader = new MDBReader(buffer);

    try {
      // Parse the SQL query to extract table name and conditions
      // This is a simplified parser and won't handle complex SQL
      const sqlLower = sql.toLowerCase();
      
      // Check if it's a SELECT query
      if (!sqlLower.startsWith('select')) {
        throw new Error('Only SELECT queries are supported');
      }
      
      // Extract the FROM clause
      const fromIndex = sqlLower.indexOf(' from ');
      if (fromIndex === -1) {
        throw new Error('Invalid SQL query: Could not find FROM clause');
      }
      
      // Extract the table name from the FROM clause
      const fromClause = sqlLower.substring(fromIndex + 6);
      const whereIndex = fromClause.indexOf(' where ');
      
      // Extract the table name
      let tableName = '';
      if (whereIndex === -1) {
        // No WHERE clause, the table name is the rest of the query
        tableName = fromClause.trim().split(' ')[0];
      } else {
        // There is a WHERE clause, extract the table name
        tableName = fromClause.substring(0, whereIndex).trim().split(' ')[0];
      }
      
      // Remove any square brackets around the table name
      tableName = tableName.replace(/^\[|\]$/g, '');
      
      console.log(`Extracted table name: ${tableName}`);
      
      // Check if the table exists in the database
      const tableNames = reader.getTableNames();
      if (!tableNames.includes(tableName)) {
        console.error(`Table '${tableName}' not found in database`);
        
        // Try to find a similar table name (case insensitive)
        const similarTables = tableNames.filter(t => 
          t.toLowerCase() === tableName.toLowerCase() ||
          t.toLowerCase().includes(tableName.toLowerCase()) ||
          // Also try removing trailing 's' for plural table names
          t.toLowerCase().includes(tableName.toLowerCase().replace(/s$/, ''))
        );
        
        // Suggest similar tables if found
        if (similarTables.length > 0) {
          // Try to automatically use the first similar table
          const alternativeTable = similarTables[0];
          console.log(`Automatically trying similar table: ${alternativeTable}`);
          
          // Replace the table name in the SQL query
          const modifiedSql = sql.replace(new RegExp(`\\b${tableName}\\b`, 'i'), alternativeTable);
          console.log(`Modified SQL: ${modifiedSql}`);
          
          // Instead of creating a new request with URL, directly modify the current request
          console.log('Using direct approach with modified SQL');
          body.sql = modifiedSql;
          return POST(req);
        }
        
        return NextResponse.json(
          { 
            error: `Table '${tableName}' not found in database`,
            availableTables: tableNames,
            suggestedTables: similarTables.length > 0 ? similarTables : undefined,
            suggestion: similarTables.length > 0 
              ? `The table '${tableName}' was not found. Did you mean one of these: ${similarTables.join(', ')}?`
              : "The table in your query might not exist. Please use one of the available tables."
          },
          { status: 400 }
        );
      }
      
      // Get the table data
      const table = reader.getTable(tableName);
      const columns = table.getColumnNames();
      const rows = table.getData();
      
      console.log(`Retrieved ${rows.length} rows from table ${tableName}`);
      
      // Extract the WHERE clause if it exists
      let whereClause = '';
      if (whereIndex !== -1) {
        whereClause = sql.substring(fromIndex + 6 + whereIndex + 7).trim();
      }
      
      // Extract the SELECT clause to determine which columns to return
      const selectClause = sql.substring(7, fromIndex).trim();
      
      // Check if it's a COUNT query
      const isCountQuery = selectClause.toLowerCase().includes('count(');
      
      let results: any[] = [];
      
      if (isCountQuery) {
        // Handle COUNT queries
        console.log('Processing COUNT query');
        
        // Apply WHERE clause filtering if it exists
        let filteredRows = rows;
        if (whereClause) {
          filteredRows = filterRowsByWhereClause(rows, whereClause, columns);
        }
        
        // Return the count as value
        results = [{ value: filteredRows.length }];
      } else if (selectClause === '*') {
        // Return all columns
        console.log('Returning all columns');
        
        // Apply WHERE clause filtering if it exists
        let filteredRows = rows;
        if (whereClause) {
          filteredRows = filterRowsByWhereClause(rows, whereClause, columns);
        }
        
        // Convert rows to objects with column names as keys
        results = filteredRows.map((row: any) => {
          const obj: Record<string, any> = {};
          columns.forEach((column: string, index: number) => {
            obj[column] = row[index];
          });
          return obj;
        });
      } else {
        // Return specific columns
        console.log(`Returning specific columns: ${selectClause}`);
        
        // Parse the selected columns
        const selectedColumns = selectClause.split(',').map((col: string) => {
          const trimmed = col.trim();
          // Check if the column has an alias
          const asIndex = trimmed.toLowerCase().indexOf(' as ');
          if (asIndex !== -1) {
            const columnName = trimmed.substring(0, asIndex).trim();
            const alias = trimmed.substring(asIndex + 4).trim();
            return { name: columnName, alias };
          }
          return { name: trimmed, alias: trimmed };
        });
        
        // Apply WHERE clause filtering if it exists
        let filteredRows = rows;
        if (whereClause) {
          filteredRows = filterRowsByWhereClause(rows, whereClause, columns);
        }
        
        // Convert rows to objects with selected column names as keys
        results = filteredRows.map((row: any) => {
          const obj: Record<string, any> = {};
          selectedColumns.forEach((col: { name: string, alias: string }) => {
            // Handle functions like COUNT, SUM, etc.
            if (col.name.toLowerCase().includes('count(')) {
              obj[col.alias] = filteredRows.length;
              return;
            }
            
            // Remove any square brackets around the column name
            const cleanColumnName = col.name.replace(/^\[|\]$/g, '');
            
            // Find the column index (case insensitive)
            const columnIndex = columns.findIndex((c: string) => 
              c.toLowerCase() === cleanColumnName.toLowerCase()
            );
            
            if (columnIndex !== -1) {
              obj[col.alias] = row[columnIndex];
            }
          });
          return obj;
        });
      }
      
      // Process the results to ensure they have a "value" property if needed
      const processedResults = results.map((row: any) => {
        // If the row already has a value property, return it as is
        if ('value' in row) return row;
        
        // Get the first property as the value if it doesn't have a value property
        const keys = Object.keys(row);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = row[firstKey];
          
          // Try to convert string values to numbers if appropriate
          if (typeof firstValue === 'string' && !isNaN(parseFloat(firstValue)) && firstValue.trim() !== '') {
            return { ...row, value: parseFloat(firstValue) };
          }
          
          return { ...row, value: firstValue };
        }
        
        return { ...row, value: null };
      });
      
      return NextResponse.json(processedResults);
    } catch (error) {
      console.error('Error executing query:', error);
      return NextResponse.json(
        { error: `Error executing query: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error executing Access query:', error);
    return NextResponse.json(
      { error: `Error executing Access query: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

/**
 * Helper function to filter rows based on a WHERE clause
 * Handles MS Access/Jet SQL syntax for date functions and conditions
 */
function filterRowsByWhereClause(rows: any[], whereClause: string, columns: string[]): any[] {
  console.log(`Filtering rows by WHERE clause: ${whereClause}`);
  
  // This is a simplified WHERE clause parser for MS Access/Jet SQL
  // It handles basic conditions and some MS Access functions like Month(), Year(), Date()
  
  // Split the WHERE clause by AND to get multiple conditions
  const conditions = whereClause.split(/\s+and\s+/i);
  
  return rows.filter((row: any) => {
    // Check if all conditions are met
    return conditions.every((condition: string) => {
      // Handle special MS Access functions
      if (condition.toLowerCase().includes('month(') || 
          condition.toLowerCase().includes('year(') || 
          condition.toLowerCase().includes('date()')) {
        // This is a simplified implementation
        // For a real implementation, we would need to parse and evaluate these functions
        console.log(`Skipping complex date function in condition: ${condition}`);
        return true; // Skip this condition for now
      }
      
      // Parse the condition
      let operator = '';
      if (condition.includes('=')) {
        operator = '=';
      } else if (condition.includes('>')) {
        operator = '>';
      } else if (condition.includes('<')) {
        operator = '<';
      } else if (condition.includes('>=')) {
        operator = '>=';
      } else if (condition.includes('<=')) {
        operator = '<=';
      } else if (condition.toLowerCase().includes(' like ')) {
        operator = 'like';
      } else {
        console.error(`Unsupported operator in condition: ${condition}`);
        return true; // Skip this condition
      }
      
      // Split the condition by the operator
      const parts = condition.split(operator);
      if (parts.length !== 2) {
        console.error(`Invalid condition format: ${condition}`);
        return true; // Skip this condition
      }
      
      let columnName = parts[0].trim();
      let value = parts[1].trim();
      
      // Remove any square brackets around the column name
      columnName = columnName.replace(/^\[|\]$/g, '');
      
      // Remove quotes from the value if present
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.substring(1, value.length - 1);
      }
      
      // Find the column index (case insensitive)
      const columnIndex = columns.findIndex((c: string) => 
        c.toLowerCase() === columnName.toLowerCase()
      );
      
      if (columnIndex === -1) {
        console.error(`Column not found: ${columnName}`);
        return true; // Skip this condition
      }
      
      // Get the row value
      const rowValue = row[columnIndex];
      
      // Compare based on the operator
      switch (operator) {
        case '=':
          return rowValue == value;
        case '>':
          return rowValue > value;
        case '<':
          return rowValue < value;
        case '>=':
          return rowValue >= value;
        case '<=':
          return rowValue <= value;
        case 'like':
          // Convert LIKE pattern to regex
          const pattern = value.replace(/%/g, '.*').replace(/_/g, '.');
          const regex = new RegExp(`^${pattern}$`, 'i');
          return regex.test(String(rowValue));
        default:
          return true; // Skip this condition
      }
    });
  });
}
