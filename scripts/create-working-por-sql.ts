/**
 * Create Working POR SQL Expressions
 * 
 * This script creates and tests SQL expressions for the POR database
 * using the actual tables available in the database.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'working-por-sql-expressions.json')
};

// SQL expressions to test based on available tables
const SQL_EXPRESSIONS = [
  // Open rentals - using CustomerFile table
  {
    name: 'Open Rentals',
    description: 'Count of open rentals since the start of the current year',
    sql: "SELECT Count(*) AS value FROM CustomerFile WHERE CustomerStatus = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
  },
  
  // New rentals by month - using CustomerFile table
  {
    name: 'New Rentals Jan',
    description: 'Count of new rentals for January of the current year',
    sql: "SELECT Count(*) AS value FROM CustomerFile WHERE CustomerStatus = 'Open' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())"
  },
  {
    name: 'New Rentals Feb',
    description: 'Count of new rentals for February of the current year',
    sql: "SELECT Count(*) AS value FROM CustomerFile WHERE CustomerStatus = 'Open' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())"
  },
  {
    name: 'New Rentals Mar',
    description: 'Count of new rentals for March of the current year',
    sql: "SELECT Count(*) AS value FROM CustomerFile WHERE CustomerStatus = 'Open' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
  },
  
  // Rental value - using PurchaseOrder table
  {
    name: 'Rental Value',
    description: 'Sum of Amount for all open rentals in the current year',
    sql: "SELECT Sum(Amount) AS value FROM PurchaseOrder WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
  },
  
  // Historical OPOR value - using PurchaseOrder table
  {
    name: 'Historical OPOR Value',
    description: 'Sum of Amount for all open rentals in the current year (historical data)',
    sql: "SELECT Sum(Amount) AS value FROM PurchaseOrder WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
  },
  
  // Alternative expressions using MapGPSWorkOrders table
  {
    name: 'Open Work Orders',
    description: 'Count of open work orders since the start of the current year',
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
  },
  
  // Alternative expressions using CustomerJobSite table
  {
    name: 'Active Job Sites',
    description: 'Count of active job sites',
    sql: "SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active'"
  }
];

// Alternative column names to try
const ALTERNATIVE_COLUMNS = {
  'Status': ['Status', 'CustomerStatus', 'OrderStatus', 'State', 'Type'],
  'CreatedDate': ['CreatedDate', 'Date', 'OrderDate', 'EntryDate', 'TransactionDate'],
  'Amount': ['Amount', 'Total', 'Price', 'Cost', 'Value']
};

async function main() {
  console.log('Create Working POR SQL Expressions');
  console.log('=================================\n');

  // Get available tables
  console.log('Fetching available tables from POR database...');
  const availableTables = await getAvailableTables();
  
  if (!availableTables || availableTables.length === 0) {
    console.error('No tables found in POR database.');
    return;
  }
  
  console.log(`Found ${availableTables.length} tables in POR database.`);
  
  // Test SQL expressions
  console.log('\nTesting SQL expressions...');
  
  const results = [];
  
  for (const expr of SQL_EXPRESSIONS) {
    console.log(`\nTesting: ${expr.name}`);
    console.log(`Original SQL: ${expr.sql}`);
    
    let success = false;
    let result = null;
    let finalSql = expr.sql;
    let error = '';
    
    // Try with original SQL first
    try {
      const response = await testSql(expr.sql);
      
      if (response.success) {
        console.log(`✅ Success! Result: ${JSON.stringify(response.result)}`);
        success = true;
        result = response.result;
      } else {
        console.log(`❌ Failed: ${response.error}`);
        error = response.error || 'Unknown error';
        
        // Extract table and column names from the SQL
        const tableMatch = expr.sql.match(/FROM\s+([^\s,;()]+)/i);
        const tableName = tableMatch ? tableMatch[1] : '';
        
        // Check if the table exists
        if (tableName && !availableTables.includes(tableName)) {
          console.log(`Table '${tableName}' not found in database.`);
          
          // Try alternative tables
          console.log('\nTrying with alternative tables...');
          
          // Find similar tables
          const similarTables = availableTables.filter(table => 
            table.toLowerCase().includes('customer') || 
            table.toLowerCase().includes('order') || 
            table.toLowerCase().includes('purchase') ||
            table.toLowerCase().includes('job') ||
            table.toLowerCase().includes('work')
          );
          
          for (const table of similarTables) {
            if (success) break;
            
            // Replace the table name
            const altSql = expr.sql.replace(new RegExp(`FROM\\s+${tableName}`, 'i'), `FROM ${table}`);
            console.log(`\nTrying with table ${table}:`);
            console.log(`SQL: ${altSql}`);
            
            const altResponse = await testSql(altSql);
            
            if (altResponse.success) {
              console.log(`✅ Success with alternative table! Result: ${JSON.stringify(altResponse.result)}`);
              success = true;
              result = altResponse.result;
              finalSql = altSql;
              break;
            } else {
              console.log(`❌ Failed with alternative table: ${altResponse.error}`);
              
              // Try with alternative column names
              for (const [originalCol, alternativeCols] of Object.entries(ALTERNATIVE_COLUMNS)) {
                if (success) break;
                
                for (const altCol of alternativeCols) {
                  if (success) break;
                  
                  // Skip if it's the same column
                  if (originalCol === altCol) continue;
                  
                  // Replace the column name
                  const altColSql = altSql.replace(new RegExp(`${originalCol}\\s*=`, 'gi'), `${altCol} =`);
                  
                  // Skip if the SQL didn't change
                  if (altColSql === altSql) continue;
                  
                  console.log(`\nTrying with alternative column ${altCol}:`);
                  console.log(`SQL: ${altColSql}`);
                  
                  const altColResponse = await testSql(altColSql);
                  
                  if (altColResponse.success) {
                    console.log(`✅ Success with alternative column! Result: ${JSON.stringify(altColResponse.result)}`);
                    success = true;
                    result = altColResponse.result;
                    finalSql = altColSql;
                    break;
                  } else {
                    console.log(`❌ Failed with alternative column: ${altColResponse.error}`);
                  }
                }
              }
            }
          }
        }
        
        // If still not successful, try a simple count query
        if (!success) {
          console.log('\nTrying simple count queries on potential tables...');
          
          const potentialTables = availableTables.filter(table => 
            table.toLowerCase().includes('customer') || 
            table.toLowerCase().includes('order') || 
            table.toLowerCase().includes('purchase') ||
            table.toLowerCase().includes('job') ||
            table.toLowerCase().includes('work')
          );
          
          for (const table of potentialTables) {
            if (success) break;
            
            const simpleSql = `SELECT Count(*) AS value FROM ${table}`;
            console.log(`\nTrying simple count on ${table}:`);
            console.log(`SQL: ${simpleSql}`);
            
            const simpleResponse = await testSql(simpleSql);
            
            if (simpleResponse.success) {
              console.log(`✅ Success with simple count! Result: ${JSON.stringify(simpleResponse.result)}`);
              success = true;
              result = simpleResponse.result;
              finalSql = simpleSql;
              
              // Try to add a WHERE clause if this is a count query
              if (expr.name.toLowerCase().includes('open') || expr.name.toLowerCase().includes('active')) {
                const whereClauseSql = `${simpleSql} WHERE Status = 'Open'`;
                console.log(`\nTrying with WHERE clause:`);
                console.log(`SQL: ${whereClauseSql}`);
                
                const whereClauseResponse = await testSql(whereClauseSql);
                
                if (whereClauseResponse.success) {
                  console.log(`✅ Success with WHERE clause! Result: ${JSON.stringify(whereClauseResponse.result)}`);
                  result = whereClauseResponse.result;
                  finalSql = whereClauseSql;
                }
              }
            } else {
              console.log(`❌ Failed with simple count: ${simpleResponse.error}`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`Error testing SQL expression: ${error.message}`);
      error = error.message;
    }
    
    results.push({
      name: expr.name,
      description: expr.description,
      originalSql: expr.sql,
      finalSql: finalSql,
      success: success,
      result: result,
      error: error
    });
  }
  
  // Save results to file
  fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`Total expressions: ${results.length}`);
  console.log(`Successful expressions: ${results.filter(r => r.success).length}`);
  console.log(`Failed expressions: ${results.filter(r => !r.success).length}`);
  
  // Print successful expressions
  if (results.filter(r => r.success).length > 0) {
    console.log('\nSuccessful SQL Expressions:');
    results.filter(r => r.success).forEach(r => {
      console.log(`\n${r.name}:`);
      console.log(`SQL: ${r.finalSql}`);
      console.log(`Result: ${JSON.stringify(r.result)}`);
    });
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
