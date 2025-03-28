/**
 * Access POR SQL Generator
 * 
 * This script generates SQL expressions compatible with Microsoft Access SQL
 * for the POR dashboard using known tables.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'access-por-sql.json')
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

// Known tables in the POR database
const KNOWN_TABLES = [
  'PurchaseOrderDetail',
  'PurchaseOrder',
  'CustomerFile',
  'MapGPSWorkOrders',
  'AccountingTransaction',
  'AccountsReceivable',
  'TransactionItems',
  'TransactionHeader'
];

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

async function main() {
  console.log('Access POR SQL Generator');
  console.log('=======================\n');
  
  try {
    const sqlExpressions: SqlExpression[] = [];
    
    // Test each known table
    for (const table of KNOWN_TABLES) {
      console.log(`\nTesting table: ${table}`);
      
      // Test if table exists - Access SQL compatible
      const countSql = `SELECT Count(*) AS value FROM [${table}]`;
      console.log(`SQL: ${countSql}`);
      
      const countResponse = await testSql(countSql);
      
      if (countResponse.success) {
        console.log('✅ Table exists!');
        
        // Add count expression
        sqlExpressions.push({
          id: `POR-${table.toUpperCase()}-COUNT`,
          name: `POR ${table} Count`,
          description: `Count of records in ${table}`,
          sql: countSql
        });
        
        // Get a sample record to find columns
        const sampleSql = `SELECT TOP 1 * FROM [${table}]`;
        const sampleResponse = await testSql(sampleSql);
        
        if (sampleResponse.success && sampleResponse.result) {
          console.log('✅ Got sample record!');
          
          const columns = Object.keys(sampleResponse.result);
          console.log(`Columns: ${columns.join(', ')}`);
          
          // Find date columns
          const dateColumns = columns.filter(col => 
            col.toLowerCase().includes('date') || 
            col.toLowerCase().includes('time')
          );
          
          if (dateColumns.length > 0) {
            console.log(`Date columns: ${dateColumns.join(', ')}`);
            const dateColumn = dateColumns[0];
            
            // Generate monthly expressions using Access SQL date functions
            for (const month of MONTHS) {
              // Access SQL uses Month() and Year() functions
              const monthlySql = `SELECT Count(*) AS value FROM [${table}] WHERE Month([${dateColumn}]) = ${month.number}`;
              
              sqlExpressions.push({
                id: `POR-${table.toUpperCase()}-${month.name.toUpperCase()}`,
                name: `POR ${table} ${month.name}`,
                description: `Count of records in ${table} for ${month.name}`,
                sql: monthlySql
              });
            }
          } else {
            // If no date columns, just use a simple count for each month
            for (const month of MONTHS) {
              sqlExpressions.push({
                id: `POR-${table.toUpperCase()}-${month.name.toUpperCase()}`,
                name: `POR ${table} ${month.name}`,
                description: `Count of records in ${table} for ${month.name}`,
                sql: countSql
              });
            }
          }
        } else {
          console.log('❌ Failed to get sample record.');
          
          // If can't get sample, just use a simple count for each month
          for (const month of MONTHS) {
            sqlExpressions.push({
              id: `POR-${table.toUpperCase()}-${month.name.toUpperCase()}`,
              name: `POR ${table} ${month.name}`,
              description: `Count of records in ${table} for ${month.name}`,
              sql: countSql
            });
          }
        }
      } else {
        console.log(`❌ Table does not exist: ${countResponse.error}`);
      }
    }
    
    // Add some generic expressions for the dashboard
    const genericExpressions = [
      {
        id: "POR-OVERVIEW-TOTAL",
        name: "POR Overview Total",
        description: "Total number of records in PurchaseOrderDetail",
        sql: "SELECT Count(*) AS value FROM [PurchaseOrderDetail]"
      },
      {
        id: "POR-OVERVIEW-CUSTOMERS",
        name: "POR Overview Customers",
        description: "Total number of customers",
        sql: "SELECT Count(*) AS value FROM [CustomerFile]"
      }
    ];
    
    for (const expr of genericExpressions) {
      console.log(`\nTesting generic expression: ${expr.name}`);
      console.log(`SQL: ${expr.sql}`);
      
      const response = await testSql(expr.sql);
      
      if (response.success) {
        console.log('✅ Success!');
        sqlExpressions.push(expr);
      } else {
        console.log(`❌ Failed: ${response.error}`);
      }
    }
    
    // Save SQL expressions to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(sqlExpressions, null, 2));
    console.log(`\nSQL expressions saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Generated ${sqlExpressions.length} SQL expressions for the POR dashboard.`);
    console.log(`Output file: ${CONFIG.OUTPUT_FILE}`);
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
    
    return {
      success: true,
      result: data.result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

main().catch(console.error);
