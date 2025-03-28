/**
 * Test Rentals Table Columns
 * 
 * This script tests each column in the Rentals table against the POR database
 * and generates a table of results.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'rentals-column-tests.md')
};

// Rentals table columns to test
const RENTALS_COLUMNS = [
  { name: "ID", dataType: "INTEGER" },
  { name: "Status", dataType: "VARCHAR" },
  { name: "CreatedDate", dataType: "DATE" },
  { name: "CustomerID", dataType: "VARCHAR" },
  { name: "Amount", dataType: "CURRENCY" }
];

// Define interfaces for type safety
interface SqlResponse {
  success: boolean;
  result?: any;
  error?: string;
}

interface ColumnTestResult {
  columnName: string;
  dataType: string;
  sqlQuery: string;
  success: boolean;
  value: any;
  error?: string;
}

async function main() {
  console.log('Test Rentals Table Columns');
  console.log('=========================\n');
  
  try {
    // Get available tables
    console.log('Fetching available tables from POR database...');
    const availableTables = await getAvailableTables();
    
    if (!availableTables || availableTables.length === 0) {
      console.error('No tables found in POR database.');
      return;
    }
    
    console.log(`Found ${availableTables.length} tables in POR database.`);
    
    // Check if Rentals table exists
    const rentalsTableExists = availableTables.includes('Rentals');
    console.log(`Rentals table exists: ${rentalsTableExists}`);
    
    // Test each column
    const results: ColumnTestResult[] = [];
    
    for (const column of RENTALS_COLUMNS) {
      console.log(`\nTesting column: ${column.name} (${column.dataType})`);
      
      // Generate SQL query for this column
      const sqlQuery = `SELECT ${column.name} FROM Rentals`;
      console.log(`SQL Query: ${sqlQuery}`);
      
      // Test the SQL query
      const response = await testSql(sqlQuery);
      
      if (response.success) {
        console.log(`✅ Success! Value: ${JSON.stringify(response.result)}`);
        
        results.push({
          columnName: column.name,
          dataType: column.dataType,
          sqlQuery: sqlQuery,
          success: true,
          value: response.result
        });
      } else {
        console.log(`❌ Failed: ${response.error}`);
        
        results.push({
          columnName: column.name,
          dataType: column.dataType,
          sqlQuery: sqlQuery,
          success: false,
          value: null,
          error: response.error
        });
      }
    }
    
    // Test a simple count query
    console.log('\nTesting count query...');
    const countSql = 'SELECT Count(*) AS value FROM Rentals';
    console.log(`SQL Query: ${countSql}`);
    
    const countResponse = await testSql(countSql);
    
    if (countResponse.success) {
      console.log(`✅ Success! Count: ${JSON.stringify(countResponse.result)}`);
      
      results.push({
        columnName: 'Count(*)',
        dataType: 'INTEGER',
        sqlQuery: countSql,
        success: true,
        value: countResponse.result
      });
    } else {
      console.log(`❌ Failed: ${countResponse.error}`);
      
      results.push({
        columnName: 'Count(*)',
        dataType: 'INTEGER',
        sqlQuery: countSql,
        success: false,
        value: null,
        error: countResponse.error
      });
    }
    
    // Generate a markdown table of results
    let markdownTable = '# Rentals Table Column Tests\n\n';
    markdownTable += 'This table shows the results of testing each column in the Rentals table against the POR database.\n\n';
    markdownTable += '| Column Name | Data Type | SQL Query | Success | Value | Error |\n';
    markdownTable += '|------------|-----------|-----------|---------|-------|-------|\n';
    
    for (const result of results) {
      markdownTable += `| ${result.columnName} | ${result.dataType} | \`${result.sqlQuery}\` | ${result.success ? '✅' : '❌'} | ${result.success ? JSON.stringify(result.value) : ''} | ${result.error || ''} |\n`;
    }
    
    // Save the markdown table to a file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, markdownTable);
    console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful tests: ${results.filter(r => r.success).length}`);
    console.log(`Failed tests: ${results.filter(r => !r.success).length}`);
    
    // Print the markdown table to the console
    console.log('\nResults Table:');
    console.log(markdownTable);
  } catch (error: any) {
    console.error('Error in main function:', error.message);
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

async function testSql(sql: string): Promise<SqlResponse> {
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
