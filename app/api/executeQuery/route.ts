import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { ServerConfig } from '@/lib/db/connections';
import * as fs from 'fs';

/**
 * API route for executing SQL queries
 * POST /api/executeQuery
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { server, query, tableName, authentication } = body;
    
    console.log(`EXECUTE QUERY: Received request for server ${server} with query: ${query.substring(0, 100)}...`);
    
    // Validate inputs
    if (!server || !query) {
      console.error('EXECUTE QUERY: Missing server or query in request');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing server or query parameter' 
      }, { status: 400 });
    }
    
    // Ensure the query is properly formatted with schema prefixes
    let modifiedQuery = query;
    if (server === 'P21' && !query.includes('dbo.')) {
      // Common P21 table names to add schema prefix to
      const p21Tables = [
        'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
        'customer', 'inv_mast', 'ar_open_items', 'ap_open_items'
      ];
      
      // Add dbo. prefix to each table name
      p21Tables.forEach(tableName => {
        // Use regex to match table names that aren't already prefixed
        const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'g');
        modifiedQuery = modifiedQuery.replace(regex, `dbo.${tableName}`);
      });
      
      console.log(`API: Modified SQL with schema prefixes: ${modifiedQuery}`);
    }
    
    // Verify the query has a date filter if it's a COUNT query on oe_hdr
    if (server === 'P21' && 
        modifiedQuery.toLowerCase().includes('count(*)') && 
        modifiedQuery.toLowerCase().includes('oe_hdr') && 
        !modifiedQuery.toLowerCase().includes('order_date')) {
      console.log(`API: WARNING - COUNT query on oe_hdr without date filter detected!`);
      
      // Add a date filter for safety
      if (!modifiedQuery.toLowerCase().includes('where')) {
        modifiedQuery += ` WHERE order_date >= DATEADD(day, -30, GETDATE())`;
        console.log(`API: Added date filter to query: ${modifiedQuery}`);
      }
    }
    
    let result;
    
    try {
      // Execute query based on server type
      if (server === 'P21') {
        console.log('EXECUTE QUERY: Executing P21 query');
        result = await executeP21Query(modifiedQuery);
      } else if (server === 'POR') {
        console.log('EXECUTE QUERY: Executing POR query');
        result = await executePORQuery(modifiedQuery);
      } else if (server === 'TEST') {
        console.log('EXECUTE QUERY: Executing TEST query');
        result = await executeTestQuery(modifiedQuery);
      } else {
        console.log('EXECUTE QUERY: Executing unknown server query');
        return NextResponse.json({ 
          success: false, 
          error: 'Unsupported server type' 
        }, { status: 400 });
      }
      
      // Normalize the result to ensure consistent structure
      const normalizedResult = normalizeQueryResult(result);
      console.log('EXECUTE QUERY: Normalized result:', JSON.stringify(normalizedResult).substring(0, 200) + '...');
      
      return NextResponse.json({ 
        success: true, 
        data: normalizedResult 
      });
      
    } catch (error) {
      console.error(`EXECUTE QUERY: Error executing query for ${server}:`, error);
      
      // Determine error type for better client-side handling
      let errorType: 'connection' | 'execution' | 'syntax' | 'other' = 'other';
      let errorMessage = error instanceof Error ? error.message : 'Unknown error executing query';
      
      if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
        errorType = 'connection';
      } else if (errorMessage.includes('syntax') || errorMessage.includes('SQL syntax')) {
        errorType = 'syntax';
      } else if (errorMessage.includes('execution') || errorMessage.includes('timeout')) {
        errorType = 'execution';
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        errorType 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('EXECUTE QUERY: Error processing request:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error processing request' 
    }, { status: 500 });
  }
}

/**
 * Normalize query results to ensure a consistent structure
 * This helps the admin client process results consistently regardless of source
 */
function normalizeQueryResult(result: any[]): any[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    console.log('Empty or invalid result array, returning empty array');
    return [];
  }

  console.log('Normalizing query result:', JSON.stringify(result).substring(0, 200) + '...');
  
  return result.map(row => {
    // If the row already has a 'value' property, ensure it's properly formatted
    if ('value' in row) {
      const value = row.value;
      
      // Handle numeric string values - convert to numbers
      if (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '') {
        const numericValue = parseFloat(value);
        console.log(`Converting string value "${value}" to number: ${numericValue}`);
        return { ...row, value: numericValue };
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        console.log('Null or undefined value, setting to null');
        return { ...row, value: null };
      }
      
      // Keep numeric values as is
      if (typeof value === 'number') {
        console.log(`Keeping numeric value: ${value}`);
        return row;
      }
      
      // For other types (like non-numeric strings), keep as is
      console.log(`Keeping non-numeric value: ${value}`);
      return row;
    }
    
    // If the row doesn't have a 'value' property, extract the first property as the value
    const keys = Object.keys(row);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstValue = row[firstKey];
      
      // Try to convert to number if it's a string that looks like a number
      if (typeof firstValue === 'string' && !isNaN(parseFloat(firstValue)) && firstValue.trim() !== '') {
        const numericValue = parseFloat(firstValue);
        console.log(`Extracted numeric value ${numericValue} from first property "${firstKey}"`);
        return { ...row, value: numericValue };
      }
      
      // Handle null/undefined values
      if (firstValue === null || firstValue === undefined) {
        console.log(`First property "${firstKey}" is null or undefined, setting value to null`);
        return { ...row, value: null };
      }
      
      // Keep numeric values as is
      if (typeof firstValue === 'number') {
        console.log(`Using numeric first property "${firstKey}": ${firstValue}`);
        return { ...row, value: firstValue };
      }
      
      // For other types (like non-numeric strings), keep as is
      console.log(`Using non-numeric first property "${firstKey}": ${firstValue}`);
      return { ...row, value: firstValue };
    }
    
    // If the row is empty, return it with a value of null
    console.log('Empty row, setting value to null');
    return { ...row, value: null };
  });
}

async function executeP21Query(query: string) {
  try {
    // Import ODBC directly in the route handler to avoid webpack issues
    const odbc = await import('odbc');
    
    // Get DSN and credentials from environment variables
    const dsn = process.env.P21_DSN || 'P21Play';
    const username = process.env.P21_USERNAME;
    const password = process.env.P21_PASSWORD;
    
    // Build connection string
    let connectionString = `DSN=${dsn};`;
    
    // Add authentication details if provided
    if (username && password) {
      connectionString += `UID=${username};PWD=${password};`;
      console.log('Using SQL Server Authentication with ODBC');
    } else {
      // Use Windows Authentication
      connectionString += 'Trusted_Connection=Yes;';
      console.log('Using Windows Authentication with ODBC');
    }
    
    console.log(`Creating ODBC connection with DSN: ${dsn}`);
    
    // Create a new connection
    const connection = await odbc.connect(connectionString);
    
    try {
      // Execute the query
      const queryResult = await connection.query(query);
      console.log(`P21 query result:`, JSON.stringify(queryResult));
      return queryResult;
    } catch (error: any) {
      console.error('Error executing P21 query:', error);
      throw error;
    } finally {
      // Always close the connection
      await connection.close();
      console.log('ODBC connection closed');
    }
  } catch (error: any) {
    console.error('Error executing P21 query with ODBC:', error);
    throw error;
  }
}

async function executePORQuery(query: string) {
  try {
    // Check if POR file path is configured
    const porFilePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';
    if (!porFilePath) {
      throw new Error('POR database file path is not configured. Please set POR_FILE_PATH in .env.local');
    }

    // Check if file exists
    if (!fs.existsSync(porFilePath)) {
      throw new Error(`POR database file not found at configured path: ${porFilePath}`);
    }

    console.log(`Executing POR query against file: ${porFilePath}`);
    console.log(`Query: ${query}`);

    // Use the executeAccessQuery API endpoint directly with better error handling
    try {
      // Instead of using fetch which doesn't work well with relative URLs in server context,
      // directly import and use the ConnectionManager's executeAccessQuery method
      const result = await ConnectionManager.executeAccessQuery(
        { type: 'POR', filePath: porFilePath },
        query
      );
      
      console.log(`POR query executed successfully, result:`, JSON.stringify(result).substring(0, 200));
      return result;
    } catch (error) {
      console.error('Error executing POR query:', error);
      
      // Try an alternative approach if the direct method fails
      console.log('Attempting direct file access as fallback...');
      
      // Make a direct call to the executeAccessQuery function
      const { default: MDBReader } = await import('mdb-reader');
      
      // Read the MDB file
      const buffer = fs.readFileSync(porFilePath);
      const reader = new MDBReader(buffer);
      
      // Extract the table name from the SQL query
      const tableNameMatch = query.match(/FROM\s+([^\s,;()]+)/i);
      if (!tableNameMatch || !tableNameMatch[1]) {
        throw new Error('Could not extract table name from SQL query');
      }
      
      const tableName = tableNameMatch[1].trim();
      console.log(`Extracted table name from SQL: ${tableName}`);
      
      // Check if the table exists
      const tables = reader.getTableNames();
      if (!tables.includes(tableName)) {
        console.log(`Table '${tableName}' not found. Available tables: ${tables.join(', ')}`);
        
        // Try to find similar table names
        const similarTables = tables.filter(t => 
          t.toLowerCase().includes(tableName.toLowerCase()) || 
          tableName.toLowerCase().includes(t.toLowerCase())
        );
        
        if (similarTables.length > 0) {
          console.log(`Found similar tables: ${similarTables.join(', ')}`);
          const alternativeTable = similarTables[0];
          console.log(`Using alternative table: ${alternativeTable}`);
          
          // Read the data from the alternative table
          const data = reader.getTable(alternativeTable).getData();
          return data;
        }
        
        throw new Error(`Table '${tableName}' not found in the database`);
      }
      
      // Read the data from the table
      const data = reader.getTable(tableName).getData();
      console.log(`Direct file access successful, retrieved ${data.length} rows`);
      
      return data;
    }
  } catch (error: any) {
    console.error('Error executing POR query:', error);
    throw error;
  }
}

async function executeTestQuery(query: string) {
  try {
    console.log('Executing query in TEST mode');
    
    // In test mode, we'll use a more sophisticated approach than just random values
    // We'll parse the SQL query to determine what kind of data to return
    
    // Import the test database executor
    const { executeTestQuery } = await import('@/lib/db/test-db');
    
    // Execute the query against our test database
    const testResult = await executeTestQuery(query);
    console.log('Test query execution result:', testResult);
    
    return testResult;
  } catch (error: any) {
    console.error('Error executing TEST query:', error);
    throw error;
  }
}
