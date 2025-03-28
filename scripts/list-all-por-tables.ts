/**
 * List All POR Tables
 * 
 * This script retrieves and displays all available tables in the POR database.
 */

import fetch from 'node-fetch';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004'
};

async function main() {
  console.log('POR Database Table Lister');
  console.log('=========================\n');
  
  try {
    // Get available tables
    console.log('Fetching available tables from POR database...');
    const tables = await getAvailableTables();
    
    if (!tables || tables.length === 0) {
      console.error('No tables found in POR database.');
      return;
    }
    
    console.log(`\nFound ${tables.length} tables in POR database:`);
    
    // Display tables in a formatted way
    const sortedTables = [...tables].sort();
    
    // Calculate column width for nice formatting
    const maxTableNameLength = Math.max(...sortedTables.map(t => t.length));
    const columns = Math.max(1, Math.floor(80 / (maxTableNameLength + 4)));
    
    // Print in columns
    for (let i = 0; i < sortedTables.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        if (i + j < sortedTables.length) {
          const tableName = sortedTables[i + j];
          row.push(tableName.padEnd(maxTableNameLength + 2));
        }
      }
      console.log(row.join(''));
    }
    
    // Now let's try to get column information for a few tables
    console.log('\nFetching column information for sample tables...');
    
    // Take first 5 tables as samples
    const sampleTables = sortedTables.slice(0, 5);
    
    for (const table of sampleTables) {
      console.log(`\nColumns for table ${table}:`);
      
      try {
        // Test a simple query to get column information
        const sql = `SELECT TOP 1 * FROM ${table}`;
        const result = await testSql(sql);
        
        if (result.success && result.result) {
          // Extract column names from the result
          const columns = Object.keys(result.result);
          console.log(columns.join(', '));
        } else {
          console.log(`Could not retrieve columns: ${result.error}`);
        }
      } catch (error: any) {
        console.log(`Error retrieving columns: ${error.message}`);
      }
    }
    
    // Look for tables that might be related to rentals, orders, or customers
    console.log('\nSearching for tables related to rentals, orders, or customers:');
    
    const rentalRelatedTables = sortedTables.filter(table => 
      table.toLowerCase().includes('rent') || 
      table.toLowerCase().includes('order') || 
      table.toLowerCase().includes('customer') ||
      table.toLowerCase().includes('sale') ||
      table.toLowerCase().includes('invoice')
    );
    
    if (rentalRelatedTables.length > 0) {
      console.log(`Found ${rentalRelatedTables.length} potentially relevant tables:`);
      console.log(rentalRelatedTables.join(', '));
      
      // For these tables, try to get more information
      for (const table of rentalRelatedTables) {
        console.log(`\nExamining table ${table}:`);
        
        try {
          // Test a count query
          const countSql = `SELECT Count(*) AS value FROM ${table}`;
          const countResult = await testSql(countSql);
          
          if (countResult.success && countResult.result) {
            console.log(`Row count: ${countResult.result.value || 'unknown'}`);
            
            // Test a simple query to get column information
            const sql = `SELECT TOP 1 * FROM ${table}`;
            const result = await testSql(sql);
            
            if (result.success && result.result) {
              // Extract column names from the result
              const columns = Object.keys(result.result);
              console.log(`Columns: ${columns.join(', ')}`);
              
              // Check for status-like columns
              const statusColumns = columns.filter(col => 
                col.toLowerCase().includes('status') || 
                col.toLowerCase().includes('state') || 
                col.toLowerCase().includes('type')
              );
              
              if (statusColumns.length > 0) {
                console.log(`Status-like columns: ${statusColumns.join(', ')}`);
                
                // Try to get distinct values for the first status column
                const statusCol = statusColumns[0];
                const statusSql = `SELECT DISTINCT ${statusCol} FROM ${table}`;
                const statusResult = await testSql(statusSql);
                
                if (statusResult.success && statusResult.result) {
                  console.log(`Distinct values for ${statusCol}: ${JSON.stringify(statusResult.result)}`);
                }
              }
              
              // Check for date columns
              const dateColumns = columns.filter(col => 
                col.toLowerCase().includes('date') || 
                col.toLowerCase().includes('time') || 
                col.toLowerCase().includes('created') ||
                col.toLowerCase().includes('modified')
              );
              
              if (dateColumns.length > 0) {
                console.log(`Date-like columns: ${dateColumns.join(', ')}`);
              }
              
              // Check for amount columns
              const amountColumns = columns.filter(col => 
                col.toLowerCase().includes('amount') || 
                col.toLowerCase().includes('price') || 
                col.toLowerCase().includes('cost') ||
                col.toLowerCase().includes('value') ||
                col.toLowerCase().includes('total')
              );
              
              if (amountColumns.length > 0) {
                console.log(`Amount-like columns: ${amountColumns.join(', ')}`);
              }
            }
          } else {
            console.log(`Could not get row count: ${countResult.error}`);
          }
        } catch (error: any) {
          console.log(`Error examining table: ${error.message}`);
        }
      }
    } else {
      console.log('No tables found that appear to be related to rentals, orders, or customers.');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

async function getAvailableTables(): Promise<string[]> {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/test-por-sql`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.availableTables || [];
  } catch (error: any) {
    console.error('Error fetching available tables:', error.message);
    return [];
  }
}

async function testSql(sql: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/test-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sqlExpression: sql, 
        serverType: 'POR' 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error (${response.status}): ${errorText}`
      };
    }
    
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error: data.error
      };
    }
    
    if (data.result) {
      // Handle array or single result
      const result = Array.isArray(data.result) ? data.result[0] : data.result;
      return {
        success: true,
        result: result
      };
    }
    
    return {
      success: false,
      error: 'No results returned'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

main().catch(console.error);
