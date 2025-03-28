import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { getServerConfig } from '@/lib/db/connections';
import { validateSql } from '@/lib/db/query-executor';

/**
 * API route for executing P21 queries specifically for the admin spreadsheet
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query, rowId } = body;
    
    if (!query) {
      console.error('ADMIN-P21: No query provided');
      return NextResponse.json({ 
        success: false, 
        message: 'Query is required',
        value: 0
      }, { status: 400 });
    }
    
    console.log(`ADMIN-P21: Executing query for row ${rowId || 'unknown'}:`, query);
    
    // Validate the SQL to prevent injection attacks
    if (!validateSql(query)) {
      console.error(`ADMIN-P21: Invalid SQL detected: ${query}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid SQL query detected',
        value: 0
      }, { status: 400 });
    }
    
    // Format the query to ensure it returns a value column
    let formattedQuery = query;
    const hasValueColumn = query.toUpperCase().includes('AS VALUE') || 
                          query.toUpperCase().includes(' VALUE,') || 
                          query.toUpperCase().includes(' VALUE ') || 
                          query.toUpperCase().includes(' VALUE)');
    
    if (!hasValueColumn) {
      if (query.toUpperCase().includes('COUNT(') || 
          query.toUpperCase().includes('SUM(') || 
          query.toUpperCase().includes('AVG(') || 
          query.toUpperCase().includes('MIN(') || 
          query.toUpperCase().includes('MAX(')) {
        
        // Find the last closing parenthesis of the aggregate function
        const lastParenIndex = query.lastIndexOf(')');
        if (lastParenIndex > 0 && lastParenIndex === query.length - 1) {
          formattedQuery = query.substring(0, lastParenIndex) + ') AS value';
        }
      }
    }
    
    console.log(`ADMIN-P21: Formatted query: ${formattedQuery}`);
    
    // Get the P21 server configuration
    const serverConfig = await getServerConfig('P21');
    if (!serverConfig) {
      console.error('ADMIN-P21: No P21 server configuration found');
      return NextResponse.json({ 
        success: false, 
        message: 'No P21 server configuration found',
        value: 0
      }, { status: 400 });
    }
    
    // Execute the query using the ConnectionManager
    const connectionManager = ConnectionManager.getInstance();
    
    try {
      console.log('ADMIN-P21: Executing query using ConnectionManager');
      // Use the static method for P21 queries which is known to work
      const result = await ConnectionManager.executeQuery(serverConfig, formattedQuery);
      
      console.log(`ADMIN-P21: Query result:`, result);
      
      // Extract the value from the result
      let value = 0;
      
      if (result) {
        if (typeof result === 'object') {
          if (result.value !== undefined) {
            // Direct value result
            value = typeof result.value === 'number' ? result.value : parseFloat(result.value) || 0;
          } else if (Array.isArray(result) && result.length > 0) {
            // Array result
            const firstRow = result[0];
            
            // Check if there's a 'value' column
            if (firstRow.value !== undefined) {
              value = typeof firstRow.value === 'number' ? firstRow.value : parseFloat(firstRow.value) || 0;
            } else {
              // Use the first column
              const firstColumnName = Object.keys(firstRow)[0];
              if (firstColumnName) {
                const columnValue = firstRow[firstColumnName];
                value = typeof columnValue === 'number' ? columnValue : parseFloat(columnValue) || 0;
              }
            }
          }
        } else if (typeof result === 'number') {
          value = result;
        } else if (typeof result === 'string') {
          value = parseFloat(result) || 0;
        }
      }
      
      console.log(`ADMIN-P21: Final extracted value: ${value}`);
      
      // Return the result
      return NextResponse.json({ 
        success: true, 
        value,
        query: {
          original: query,
          formatted: formattedQuery,
          hasValueColumn
        }
      });
    } catch (error: any) {
      console.error('ADMIN-P21: Error executing query:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message || 'An error occurred while executing the query',
        value: 0
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('ADMIN-P21: Error executing query:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred while executing the query',
      value: 0
    }, { status: 500 });
  }
}
