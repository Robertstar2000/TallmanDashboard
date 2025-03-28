/**
 * Find Working POR SQL Expressions
 * 
 * This script tests various SQL expressions against the POR database
 * to find ones that return non-zero results for each month.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'working-por-sql-by-month.json')
};

// Month mapping
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

// Define interfaces for type safety
interface SqlResponse {
  success: boolean;
  result?: any;
  error?: string;
}

interface TestResult {
  month: string;
  monthNumber: number;
  metricType: string;
  sql: string;
  value: number;
  nonZero: boolean;
}

async function main() {
  console.log('Find Working POR SQL Expressions');
  console.log('===============================\n');
  
  try {
    // Get available tables
    console.log('Fetching available tables from POR database...');
    const availableTables = await getAvailableTables();
    
    if (!availableTables || availableTables.length === 0) {
      console.error('No tables found in POR database.');
      return;
    }
    
    console.log(`Found ${availableTables.length} tables in POR database.`);
    
    // Filter tables that might be relevant to rentals, orders, or customers
    const relevantTables = availableTables.filter(table => 
      table.toLowerCase().includes('customer') || 
      table.toLowerCase().includes('order') || 
      table.toLowerCase().includes('purchase') ||
      table.toLowerCase().includes('job') ||
      table.toLowerCase().includes('work') ||
      table.toLowerCase().includes('map') ||
      table.toLowerCase().includes('rental') ||
      table.toLowerCase().includes('sales')
    );
    
    console.log(`\nFound ${relevantTables.length} potentially relevant tables:`);
    console.log(relevantTables.join(', '));
    
    // Generate test SQL expressions
    console.log('\nGenerating test SQL expressions...');
    
    const testExpressions: { metricType: string; sqlTemplate: (table: string, month: number) => string }[] = [
      // Simple count queries
      { 
        metricType: "Total Count", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table}` 
      },
      
      // Count by month
      { 
        metricType: "Count by Month", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Month(CreatedDate) = ${month}` 
      },
      { 
        metricType: "Count by Month and Year", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())` 
      },
      
      // Count with status filters
      { 
        metricType: "Active Status", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active'` 
      },
      { 
        metricType: "Open Status", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Open'` 
      },
      { 
        metricType: "Active Status by Month", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active' AND Month(CreatedDate) = ${month}` 
      },
      { 
        metricType: "Open Status by Month", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Open' AND Month(CreatedDate) = ${month}` 
      },
      
      // Web source filter (for MapGPSWorkOrders)
      { 
        metricType: "Web Source", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Source = 'Web'` 
      },
      { 
        metricType: "Web Source by Month", 
        sqlTemplate: (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Source = 'Web' AND Month(CreatedDate) = ${month}` 
      }
    ];
    
    // Test expressions for each month
    const results: TestResult[] = [];
    
    for (const month of MONTHS) {
      console.log(`\nTesting expressions for ${month.name} (month ${month.number})...`);
      
      for (const table of relevantTables) {
        console.log(`\nTesting table: ${table}`);
        
        for (const expr of testExpressions) {
          try {
            const sql = expr.sqlTemplate(table, month.number);
            console.log(`Testing: ${expr.metricType}`);
            console.log(`SQL: ${sql}`);
            
            const response = await testSql(sql);
            
            if (response.success) {
              const value = response.result && response.result.value !== undefined ? response.result.value : 0;
              console.log(`✅ Result: ${value}`);
              
              results.push({
                month: month.name,
                monthNumber: month.number,
                metricType: expr.metricType,
                sql: sql,
                value: value,
                nonZero: value > 0
              });
            } else {
              console.log(`❌ Failed: ${response.error}`);
              
              // Try alternative column names if the error is about column not found
              if (response.error && (
                response.error.includes('column') || 
                response.error.includes('field') || 
                response.error.includes('not found')
              )) {
                // Try with alternative column names
                const alternativeColumns = {
                  'CreatedDate': ['Date', 'OrderDate', 'EntryDate', 'TransactionDate'],
                  'Status': ['State', 'Type', 'OrderStatus', 'CustomerStatus'],
                  'Source': ['Origin', 'Channel', 'Type']
                };
                
                let fixedSql = sql;
                let fixed = false;
                
                for (const [originalCol, alternatives] of Object.entries(alternativeColumns)) {
                  if (sql.includes(originalCol)) {
                    for (const altCol of alternatives) {
                      const altSql = sql.replace(new RegExp(originalCol, 'g'), altCol);
                      console.log(`Trying with alternative column ${altCol}:`);
                      console.log(`SQL: ${altSql}`);
                      
                      const altResponse = await testSql(altSql);
                      
                      if (altResponse.success) {
                        const value = altResponse.result && altResponse.result.value !== undefined ? altResponse.result.value : 0;
                        console.log(`✅ Result with alternative column: ${value}`);
                        
                        results.push({
                          month: month.name,
                          monthNumber: month.number,
                          metricType: `${expr.metricType} (using ${altCol})`,
                          sql: altSql,
                          value: value,
                          nonZero: value > 0
                        });
                        
                        fixed = true;
                        break;
                      } else {
                        console.log(`❌ Failed with alternative column: ${altResponse.error}`);
                      }
                    }
                    
                    if (fixed) break;
                  }
                }
              }
            }
          } catch (error: any) {
            console.error(`Error testing expression: ${error.message}`);
          }
        }
      }
    }
    
    // Save results to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print non-zero results
    const nonZeroResults = results.filter(r => r.nonZero);
    console.log(`\nFound ${nonZeroResults.length} expressions with non-zero results.`);
    
    if (nonZeroResults.length > 0) {
      // Group by month
      const byMonth: Record<string, TestResult[]> = {};
      
      for (const result of nonZeroResults) {
        if (!byMonth[result.month]) {
          byMonth[result.month] = [];
        }
        byMonth[result.month].push(result);
      }
      
      // Print results by month
      console.log('\nNon-zero results by month:');
      
      for (const month of MONTHS) {
        const monthResults = byMonth[month.name] || [];
        
        if (monthResults.length > 0) {
          console.log(`\n${month.name} (${monthResults.length} expressions):`);
          
          // Group by metric type
          const byMetricType: Record<string, TestResult[]> = {};
          
          for (const result of monthResults) {
            if (!byMetricType[result.metricType]) {
              byMetricType[result.metricType] = [];
            }
            byMetricType[result.metricType].push(result);
          }
          
          // Print results by metric type
          for (const [metricType, metricResults] of Object.entries(byMetricType)) {
            console.log(`\n  ${metricType}:`);
            
            for (const result of metricResults) {
              console.log(`    Value: ${result.value}`);
              console.log(`    SQL: ${result.sql}`);
            }
          }
        }
      }
      
      // Print recommended SQL expressions for each month
      console.log('\nRecommended SQL expressions for each month:');
      
      for (const month of MONTHS) {
        const monthResults = byMonth[month.name] || [];
        
        if (monthResults.length > 0) {
          console.log(`\n${month.name}:`);
          
          // Find the best expression for "New Rentals"
          const newRentalsExpr = monthResults.find(r => 
            r.metricType.includes('Count by Month') || 
            r.metricType.includes('Web Source by Month')
          );
          
          if (newRentalsExpr) {
            console.log(`  New Rentals: ${newRentalsExpr.sql}`);
          }
          
          // Find the best expression for "Open Rentals"
          const openRentalsExpr = monthResults.find(r => 
            r.metricType.includes('Active Status') || 
            r.metricType.includes('Open Status')
          );
          
          if (openRentalsExpr) {
            console.log(`  Open Rentals: ${openRentalsExpr.sql}`);
          }
          
          // Find the best expression for "Rental Value"
          const rentalValueExpr = monthResults.find(r => 
            r.metricType.includes('Active Status') || 
            r.metricType.includes('Open Status')
          );
          
          if (rentalValueExpr) {
            console.log(`  Rental Value: ${rentalValueExpr.sql.replace('Count(*)', 'Sum(Amount)')}`);
          }
        } else {
          console.log(`\n${month.name}: No non-zero expressions found.`);
        }
      }
    }
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
