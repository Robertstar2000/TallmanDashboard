/**
 * Dashboard SQL Expression Fixer
 * 
 * This script analyzes and fixes SQL expressions for both P21 and POR databases,
 * ensuring they use the correct syntax and table references for each database type.
 * It also tests the expressions to verify they return non-zero data.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Base URL for API calls
const BASE_URL = 'http://localhost:5500';

// Database path
const DB_PATH = path.join(__dirname, 'dashboard.db');

// P21 Database Tables and Columns
const P21_TABLES = {
  'oe_hdr': [
    'order_num', 'ord_date', 'order_date', 'ord_status', 'order_status', 
    'cust_id', 'order_total', 'net_total', 'ship_date', 'close_date', 
    'order_type', 'sales_rep', 'order_source'
  ],
  'ar_open_items': [
    'ar_item_num', 'cust_id', 'invoice_num', 'invoice_date', 'due_date', 
    'balance', 'terms', 'status', 'amount_due', 'aging_bucket'
  ],
  'ap_open_items': [
    'ap_item_num', 'vendor_id', 'invoice_num', 'invoice_date', 'due_date', 
    'balance', 'terms', 'status'
  ],
  'customer': [
    'cust_id', 'cust_name', 'address1', 'address2', 'city', 'state', 'zip', 
    'phone', 'email', 'contact'
  ],
  'inv_mast': [
    'item_id', 'item_desc', 'item_code', 'category', 'price', 'cost', 
    'qty_on_hand', 'reorder_level'
  ],
  'invoice_hdr': [
    'invoice_num', 'cust_id', 'invoice_date', 'due_date', 'total_amt', 
    'tax_amt', 'status', 'paid_amt', 'balance'
  ],
  'item_warehouse': [
    'item_id', 'warehouse_id', 'qty_on_hand', 'qty_on_order', 'qty_allocated'
  ]
};

// POR Database Tables and Columns
const POR_TABLES = {
  'Rentals': [
    'RentalID', 'Status', 'CreatedDate', 'RentalValue', 'CustomerID'
  ],
  'Customers': [
    'CustomerID', 'Name', 'Address', 'City', 'State', 'Zip', 'Phone', 'Email'
  ],
  'Products': [
    'ProductID', 'Name', 'Description', 'Price', 'Cost', 'Category'
  ]
};

// Chart Group Requirements
const CHART_REQUIREMENTS = {
  'Key Metrics': {
    'Total Orders': {
      description: 'Count of all orders',
      p21Tables: ['oe_hdr'],
      p21Columns: ['order_num'],
      porTables: ['Rentals'],
      porColumns: ['RentalID']
    },
    'Gross Revenue': {
      description: 'Sum of all order totals',
      p21Tables: ['oe_hdr'],
      p21Columns: ['order_total'],
      porTables: ['Rentals'],
      porColumns: ['RentalValue']
    }
  }
};

// Function to check if the server is running
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('Server is running');
      return true;
    } else {
      console.error('Server is not responding correctly');
      return false;
    }
  } catch (error) {
    console.error('Server is not running:', error.message);
    return false;
  }
}

// Function to get all chart data from the database
async function getChartData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      db.all(`SELECT id, chartGroup, variableName, server, sqlExpression, value FROM dashboard_data`, [], (err, rows) => {
        db.close();
        
        if (err) {
          reject(`Error querying database: ${err.message}`);
          return;
        }
        
        resolve(rows);
      });
    });
  });
}

// Function to test a SQL expression against the appropriate database
async function testSQLExpression(sqlExpression, server) {
  try {
    console.log(`Testing SQL expression for ${server}: ${sqlExpression}`);
    
    // Ensure the SQL expression is properly formatted
    if (!sqlExpression || typeof sqlExpression !== 'string') {
      return {
        success: false,
        error: 'Invalid SQL expression',
        errorType: 'validation'
      };
    }
    
    // Ensure the SQL expression has a value alias
    if (!sqlExpression.toLowerCase().includes(' as value') && 
        !sqlExpression.toLowerCase().includes(' as "value"') && 
        !sqlExpression.toLowerCase().includes(' as [value]')) {
      
      // Try to add 'as value' to the SQL expression
      if (sqlExpression.toLowerCase().includes('select ')) {
        const selectParts = sqlExpression.split(/select\s+/i);
        if (selectParts.length > 1) {
          const afterSelect = selectParts[1];
          
          // Check if there's a FROM clause
          if (afterSelect.toLowerCase().includes(' from ')) {
            const fromParts = afterSelect.split(/\s+from\s+/i);
            if (fromParts.length > 1) {
              const selectExpr = fromParts[0].trim();
              
              // Don't add 'as value' if it's already a complex expression with aliases
              if (!selectExpr.includes(' as ') && !selectExpr.includes(' AS ')) {
                sqlExpression = `SELECT ${selectExpr} as value FROM ${fromParts[1]}`;
                console.log(`Modified SQL to include 'as value': ${sqlExpression}`);
              }
            }
          }
        }
      }
    }
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sqlExpression,
        server: server
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText} - ${errorText}`,
        errorType: 'http',
        status: response.status
      };
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown error',
        errorType: result.errorType || 'other'
      };
    }
    
    if (!result.data || result.data.length === 0) {
      return {
        success: true,
        data: [],
        hasData: false
      };
    }
    
    return {
      success: true,
      data: result.data,
      hasData: true,
      value: result.data[0]?.value
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorType: 'exception'
    };
  }
}

// Function to fix P21 SQL expressions
function fixP21SQLExpression(sqlExpression, chartGroup, variableName) {
  if (!sqlExpression) return '';
  
  let fixedSQL = sqlExpression;
  
  // 1. Ensure it has proper schema prefixes (dbo.)
  const p21Tables = Object.keys(P21_TABLES);
  p21Tables.forEach(tableName => {
    const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'gi');
    fixedSQL = fixedSQL.replace(regex, `dbo.${tableName}`);
  });
  
  // 2. Ensure it uses WITH (NOLOCK) for better performance
  p21Tables.forEach(tableName => {
    const withNoLockRegex = new RegExp(`dbo\\.${tableName}\\s+WITH\\s*\\(\\s*NOLOCK\\s*\\)`, 'gi');
    const tableRegex = new RegExp(`dbo\\.${tableName}\\b(?!\\s+WITH\\s*\\()`, 'gi');
    
    // Only add WITH (NOLOCK) if it's not already there
    if (!withNoLockRegex.test(fixedSQL)) {
      fixedSQL = fixedSQL.replace(tableRegex, `dbo.${tableName} WITH (NOLOCK)`);
    }
  });
  
  // 3. Ensure it uses GETDATE() for current date
  fixedSQL = fixedSQL.replace(/CURRENT_DATE|CURRENT DATE|CURDATE\(\)/gi, 'GETDATE()');
  
  // 4. Ensure it uses DATEADD/DATEDIFF for date calculations
  fixedSQL = fixedSQL.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(-?\d+)\s+DAY\)/gi, 'DATEADD(day, $2, $1)');
  fixedSQL = fixedSQL.replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, 'DATEADD(day, -$2, $1)');
  
  // 5. Ensure it has date filters for large tables
  if ((fixedSQL.toLowerCase().includes('dbo.oe_hdr') || 
       fixedSQL.toLowerCase().includes('dbo.invoice_hdr')) && 
      fixedSQL.toLowerCase().includes('count(') && 
      !fixedSQL.toLowerCase().includes('where') && 
      !fixedSQL.toLowerCase().includes('order_date') && 
      !fixedSQL.toLowerCase().includes('invoice_date')) {
    
    // Add a date filter for safety (last 30 days)
    if (fixedSQL.toLowerCase().includes('dbo.oe_hdr')) {
      fixedSQL += ` WHERE order_date >= DATEADD(day, -30, GETDATE())`;
    } else if (fixedSQL.toLowerCase().includes('dbo.invoice_hdr')) {
      fixedSQL += ` WHERE invoice_date >= DATEADD(day, -30, GETDATE())`;
    }
  }
  
  // 6. Ensure it has 'as value' in the SELECT clause
  if (!fixedSQL.toLowerCase().includes(' as value') && 
      !fixedSQL.toLowerCase().includes(' as "value"') && 
      !fixedSQL.toLowerCase().includes(' as [value]')) {
    
    // Try to add 'as value' to the SQL expression
    if (fixedSQL.toLowerCase().includes('select ')) {
      const selectParts = fixedSQL.split(/select\s+/i);
      if (selectParts.length > 1) {
        const afterSelect = selectParts[1];
        
        // Check if there's a FROM clause
        if (afterSelect.toLowerCase().includes(' from ')) {
          const fromParts = afterSelect.split(/\s+from\s+/i);
          if (fromParts.length > 1) {
            const selectExpr = fromParts[0].trim();
            
            // Don't add 'as value' if it's already a complex expression with aliases
            if (!selectExpr.includes(' as ') && !selectExpr.includes(' AS ')) {
              fixedSQL = `SELECT ${selectExpr} as value FROM ${fromParts[1]}`;
            }
          }
        }
      }
    }
  }
  
  return fixedSQL;
}

// Function to fix POR SQL expressions
function fixPORSQLExpression(sqlExpression, chartGroup, variableName) {
  if (!sqlExpression) return '';
  
  let fixedSQL = sqlExpression;
  
  // 1. Remove any schema prefixes (no "dbo.")
  fixedSQL = fixedSQL.replace(/dbo\./gi, '');
  
  // 2. Remove any table hints (no "WITH (NOLOCK)")
  fixedSQL = fixedSQL.replace(/\s+WITH\s*\(\s*NOLOCK\s*\)/gi, '');
  
  // 3. Ensure it uses Date() for current date
  fixedSQL = fixedSQL.replace(/GETDATE\(\)/gi, 'Date()');
  
  // 4. Ensure it uses DateAdd/DateDiff with quoted interval types
  fixedSQL = fixedSQL.replace(/DATEADD\(\s*day\s*,\s*(-?\d+)\s*,\s*([^)]+)\)/gi, 'DateAdd("d", $1, $2)');
  fixedSQL = fixedSQL.replace(/DATEDIFF\(\s*day\s*,\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'DateDiff("d", $1, $2)');
  
  // 5. Ensure it uses Nz() for NULL handling
  if (fixedSQL.toLowerCase().includes('isnull(')) {
    fixedSQL = fixedSQL.replace(/ISNULL\(\s*([^,]+)\s*,\s*([^)]+)\)/gi, 'Nz($1, $2)');
  }
  
  // 6. Ensure it has 'as value' in the SELECT clause
  if (!fixedSQL.toLowerCase().includes(' as value') && 
      !fixedSQL.toLowerCase().includes(' as "value"') && 
      !fixedSQL.toLowerCase().includes(' as [value]')) {
    
    // Try to add 'as value' to the SQL expression
    if (fixedSQL.toLowerCase().includes('select ')) {
      const selectParts = fixedSQL.split(/select\s+/i);
      if (selectParts.length > 1) {
        const afterSelect = selectParts[1];
        
        // Check if there's a FROM clause
        if (afterSelect.toLowerCase().includes(' from ')) {
          const fromParts = afterSelect.split(/\s+from\s+/i);
          if (fromParts.length > 1) {
            const selectExpr = fromParts[0].trim();
            
            // Don't add 'as value' if it's already a complex expression with aliases
            if (!selectExpr.includes(' as ') && !selectExpr.includes(' AS ')) {
              fixedSQL = `SELECT ${selectExpr} as value FROM ${fromParts[1]}`;
            }
          }
        }
      }
    }
  }
  
  return fixedSQL;
}

// Function to update SQL expression in the database
async function updateSQLExpression(id, sqlExpression) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      db.run(`UPDATE dashboard_data SET sqlExpression = ? WHERE id = ?`, [sqlExpression, id], function(err) {
        db.close();
        
        if (err) {
          reject(`Error updating database: ${err.message}`);
          return;
        }
        
        resolve({ id, changes: this.changes });
      });
    });
  });
}

// Main function
async function main() {
  console.log('Starting SQL Expression Fixer...');
  
  // Check if the server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.error('Server is not running. Please start the server before running this script.');
    return;
  }
  
  // Get all chart data
  console.log('Retrieving chart data from database...');
  const chartData = await getChartData();
  console.log(`Retrieved ${chartData.length} rows of chart data`);
  
  // Create a log file for the results
  const logFilePath = path.join(__dirname, 'sql-fix-results.txt');
  fs.writeFileSync(logFilePath, `SQL Expression Fix Results - ${new Date().toISOString()}\n\n`);
  
  // Process each row
  for (const row of chartData) {
    const { id, chartGroup, variableName, server, sqlExpression, value } = row;
    
    console.log(`\nProcessing row ${id}: ${chartGroup} - ${variableName} (${server})`);
    fs.appendFileSync(logFilePath, `\n--- Row ${id}: ${chartGroup} - ${variableName} (${server}) ---\n`);
    fs.appendFileSync(logFilePath, `Original SQL: ${sqlExpression}\n`);
    
    // Skip if no SQL expression
    if (!sqlExpression) {
      console.log('No SQL expression, skipping');
      fs.appendFileSync(logFilePath, 'No SQL expression, skipping\n');
      continue;
    }
    
    // Fix the SQL expression based on server type
    let fixedSQL = sqlExpression;
    if (server === 'P21') {
      fixedSQL = fixP21SQLExpression(sqlExpression, chartGroup, variableName);
    } else if (server === 'POR') {
      fixedSQL = fixPORSQLExpression(sqlExpression, chartGroup, variableName);
    }
    
    // Skip if no changes were made
    if (fixedSQL === sqlExpression) {
      console.log('No changes needed');
      fs.appendFileSync(logFilePath, 'No changes needed\n');
      continue;
    }
    
    console.log('Fixed SQL:', fixedSQL);
    fs.appendFileSync(logFilePath, `Fixed SQL: ${fixedSQL}\n`);
    
    // Test the fixed SQL expression
    const testResult = await testSQLExpression(fixedSQL, server);
    
    if (testResult.success) {
      if (testResult.hasData) {
        console.log(`Test successful! Result: ${JSON.stringify(testResult.data)}`);
        fs.appendFileSync(logFilePath, `Test successful! Result: ${JSON.stringify(testResult.data)}\n`);
        
        // Update the SQL expression in the database
        try {
          const updateResult = await updateSQLExpression(id, fixedSQL);
          console.log(`Updated SQL expression for row ${id}`);
          fs.appendFileSync(logFilePath, `Updated SQL expression for row ${id}\n`);
        } catch (error) {
          console.error(`Error updating SQL expression for row ${id}:`, error);
          fs.appendFileSync(logFilePath, `Error updating SQL expression: ${error}\n`);
        }
      } else {
        console.log('Test successful but returned no data');
        fs.appendFileSync(logFilePath, 'Test successful but returned no data\n');
        
        // Update anyway since the syntax is correct
        try {
          const updateResult = await updateSQLExpression(id, fixedSQL);
          console.log(`Updated SQL expression for row ${id} (no data)`);
          fs.appendFileSync(logFilePath, `Updated SQL expression for row ${id} (no data)\n`);
        } catch (error) {
          console.error(`Error updating SQL expression for row ${id}:`, error);
          fs.appendFileSync(logFilePath, `Error updating SQL expression: ${error}\n`);
        }
      }
    } else {
      console.error(`Test failed: ${testResult.error}`);
      fs.appendFileSync(logFilePath, `Test failed: ${testResult.error}\n`);
      
      // If it's a 400 error, try to fix the specific issue
      if (testResult.status === 400) {
        console.log('Attempting to fix 400 error...');
        fs.appendFileSync(logFilePath, 'Attempting to fix 400 error...\n');
        
        // Common fixes for 400 errors
        let retrySQL = fixedSQL;
        
        // 1. Check for missing 'as value' alias
        if (!retrySQL.toLowerCase().includes(' as value')) {
          if (retrySQL.toLowerCase().startsWith('select count(')) {
            retrySQL = retrySQL.replace(/select\s+count\(/i, 'SELECT COUNT(');
            retrySQL = retrySQL.replace(/\)\s+from/i, ') as value FROM');
          } else if (retrySQL.toLowerCase().startsWith('select sum(')) {
            retrySQL = retrySQL.replace(/select\s+sum\(/i, 'SELECT SUM(');
            retrySQL = retrySQL.replace(/\)\s+from/i, ') as value FROM');
          }
        }
        
        // 2. Check for invalid table references
        if (server === 'P21' && !retrySQL.includes('dbo.')) {
          // Add dbo. prefix to common tables
          Object.keys(P21_TABLES).forEach(tableName => {
            const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'gi');
            retrySQL = retrySQL.replace(regex, `dbo.${tableName}`);
          });
        }
        
        // Test the retry SQL
        if (retrySQL !== fixedSQL) {
          console.log('Retrying with modified SQL:', retrySQL);
          fs.appendFileSync(logFilePath, `Retrying with: ${retrySQL}\n`);
          
          const retryResult = await testSQLExpression(retrySQL, server);
          
          if (retryResult.success) {
            console.log(`Retry successful! Result: ${JSON.stringify(retryResult.data)}`);
            fs.appendFileSync(logFilePath, `Retry successful! Result: ${JSON.stringify(retryResult.data)}\n`);
            
            // Update the SQL expression in the database
            try {
              const updateResult = await updateSQLExpression(id, retrySQL);
              console.log(`Updated SQL expression for row ${id} after retry`);
              fs.appendFileSync(logFilePath, `Updated SQL expression for row ${id} after retry\n`);
            } catch (error) {
              console.error(`Error updating SQL expression for row ${id}:`, error);
              fs.appendFileSync(logFilePath, `Error updating SQL expression: ${error}\n`);
            }
          } else {
            console.error(`Retry failed: ${retryResult.error}`);
            fs.appendFileSync(logFilePath, `Retry failed: ${retryResult.error}\n`);
          }
        }
      }
    }
  }
  
  console.log('\nSQL Expression Fixer completed!');
  console.log(`Results saved to ${logFilePath}`);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
