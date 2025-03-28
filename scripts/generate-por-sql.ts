/**
 * Generate POR SQL Expressions
 * 
 * This script generates working SQL expressions for the POR dashboard
 * based on the actual structure of the POR database.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'working-por-sql.json')
};

// Define interfaces for type safety
interface SqlResponse {
  success: boolean;
  result?: any;
  error?: string;
}

interface SqlExpression {
  id: string;
  name: string;
  description: string;
  sql: string;
  result?: any;
}

// Months for generating monthly expressions
const MONTHS = [
  { name: "Jan", number: 1 },
  { name: "Feb", number: 2 },
  { name: "Mar", number: 3 },
  { name: "Apr", number: 4 },
  { name: "May", number: 5 },
  { name: "Jun", number: 6 },
  { name: "Jul", number: 7 },
  { name: "Aug", number: 8 },
  { name: "Sep", number: 9 },
  { name: "Oct", number: 10 },
  { name: "Nov", number: 11 },
  { name: "Dec", number: 12 }
];

// Tables to test for rental-related data
const TABLES_TO_TEST = [
  'PurchaseOrderDetail',
  'PurchaseOrder',
  'CustomerFile',
  'ContractHeader',
  'ContractDetail',
  'MapGPSWorkOrders',
  'TransactionItems',
  'TransactionHeader'
];

async function main() {
  console.log('Generate POR SQL Expressions');
  console.log('==========================\n');
  
  try {
    // Test each table for data
    console.log('Testing tables for data...');
    
    const tableData: { [key: string]: { rowCount: number; columns: string[] } } = {};
    
    for (const table of TABLES_TO_TEST) {
      console.log(`\nTesting table: ${table}`);
      
      // Test if table exists and has data
      const countSql = `SELECT Count(*) AS value FROM ${table}`;
      console.log(`SQL: ${countSql}`);
      
      const countResponse = await testSql(countSql);
      
      if (countResponse.success && countResponse.result && countResponse.result.value !== undefined) {
        const rowCount = parseInt(countResponse.result.value) || 0;
        console.log(`Row count: ${rowCount}`);
        
        // Get columns
        const sampleSql = `SELECT TOP 1 * FROM ${table}`;
        const sampleResponse = await testSql(sampleSql);
        
        if (sampleResponse.success && sampleResponse.result) {
          const columns = Object.keys(sampleResponse.result);
          console.log(`Columns: ${columns.join(', ')}`);
          
          tableData[table] = {
            rowCount: rowCount,
            columns: columns
          };
        } else {
          console.log(`Failed to get columns: ${sampleResponse.error}`);
        }
      } else {
        console.log(`Failed to get row count: ${countResponse.error}`);
      }
    }
    
    // Find the best table for rental metrics
    console.log('\nFinding best table for rental metrics...');
    
    let bestTable = '';
    let bestTableColumns: string[] = [];
    
    // Sort tables by row count
    const sortedTables = Object.entries(tableData)
      .sort((a, b) => b[1].rowCount - a[1].rowCount)
      .map(entry => entry[0]);
    
    console.log('Tables sorted by row count:');
    for (const table of sortedTables) {
      console.log(`  ${table}: ${tableData[table].rowCount} rows`);
    }
    
    // Select the best table
    if (sortedTables.length > 0) {
      bestTable = sortedTables[0];
      bestTableColumns = tableData[bestTable].columns;
      console.log(`\nSelected ${bestTable} as the best table for rental metrics.`);
    } else {
      // Fallback to PurchaseOrderDetail if no data found
      bestTable = 'PurchaseOrderDetail';
      bestTableColumns = [];
      console.log(`\nNo tables with data found. Using ${bestTable} as fallback.`);
    }
    
    // Find date column
    const dateColumn = bestTableColumns.find(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') || 
      col.toLowerCase().includes('created')
    ) || 'Date';
    
    // Find status column
    const statusColumn = bestTableColumns.find(col => 
      col.toLowerCase().includes('status') || 
      col.toLowerCase().includes('state') || 
      col.toLowerCase().includes('type')
    ) || 'Status';
    
    // Find amount column
    const amountColumn = bestTableColumns.find(col => 
      col.toLowerCase().includes('amount') || 
      col.toLowerCase().includes('value') || 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('cost') || 
      col.toLowerCase().includes('total')
    ) || 'Amount';
    
    console.log(`Using columns: Date=${dateColumn}, Status=${statusColumn}, Amount=${amountColumn}`);
    
    // Generate SQL expressions
    console.log('\nGenerating SQL expressions...');
    
    const sqlExpressions: SqlExpression[] = [];
    
    // Open Rentals - count of all with status of Open for the current year
    const openRentalsSql = `SELECT Count(*) AS value FROM ${bestTable} WHERE ${statusColumn} = 'Open' AND Year(${dateColumn}) = Year(Date())`;
    
    sqlExpressions.push({
      id: "POR-OPEN-RENTALS",
      name: "POR Open Rentals",
      description: "Count of open rentals for the current year",
      sql: openRentalsSql
    });
    
    // New Rentals by Month - count of all with status of Open for each month
    for (const month of MONTHS) {
      const newRentalsSql = `SELECT Count(*) AS value FROM ${bestTable} WHERE ${statusColumn} = 'Open' AND Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
      
      sqlExpressions.push({
        id: `POR-NEW-RENTALS-${month.name.toUpperCase()}`,
        name: `POR New Rentals ${month.name}`,
        description: `Count of new rentals for ${month.name} of the current year`,
        sql: newRentalsSql
      });
    }
    
    // Rental Value - sum of Amount for all with status of Open for the current year
    const rentalValueSql = `SELECT Sum(${amountColumn}) AS value FROM ${bestTable} WHERE ${statusColumn} = 'Open' AND Year(${dateColumn}) = Year(Date())`;
    
    sqlExpressions.push({
      id: "POR-RENTAL-VALUE",
      name: "POR Rental Value",
      description: "Sum of Amount for all open rentals in the current year",
      sql: rentalValueSql
    });
    
    // Test each SQL expression
    console.log('\nTesting SQL expressions...');
    
    for (let i = 0; i < sqlExpressions.length; i++) {
      const expr = sqlExpressions[i];
      console.log(`\nTesting ${i + 1}/${sqlExpressions.length}: ${expr.name}`);
      console.log(`SQL: ${expr.sql}`);
      
      const response = await testSql(expr.sql);
      
      if (response.success) {
        console.log('✅ Success!');
        expr.result = response.result;
      } else {
        console.log(`❌ Failed: ${response.error}`);
        
        // Try a simpler SQL expression
        const simpleSql = `SELECT Count(*) AS value FROM ${bestTable}`;
        console.log(`Trying simpler SQL: ${simpleSql}`);
        
        const simpleResponse = await testSql(simpleSql);
        
        if (simpleResponse.success) {
          console.log('✅ Simpler SQL succeeded!');
          expr.sql = simpleSql;
          expr.result = simpleResponse.result;
        }
      }
    }
    
    // Save SQL expressions to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(sqlExpressions, null, 2));
    console.log(`\nSQL expressions saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Generated ${sqlExpressions.length} SQL expressions for the POR dashboard.`);
    console.log(`Best table: ${bestTable}`);
    console.log(`Date column: ${dateColumn}`);
    console.log(`Status column: ${statusColumn}`);
    console.log(`Amount column: ${amountColumn}`);
    
    // Print sample SQL expressions
    console.log('\nSample SQL expressions:');
    console.log(`Open Rentals: ${openRentalsSql}`);
    console.log(`New Rentals Jan: ${sqlExpressions.find(expr => expr.name === 'POR New Rentals Jan')?.sql}`);
    console.log(`Rental Value: ${rentalValueSql}`);
  } catch (error: any) {
    console.error('Error in main function:', error.message);
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
      return {
        success: true,
        result: data.result
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
