/**
 * Improved SQL Expression Fixer
 * 
 * This script analyzes and fixes SQL expressions for both P21 and POR databases.
 * It uses the chart group name and variable name to establish requirements for
 * the SQL expression design and identifies the correct tables and columns.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Database path
const DB_PATH = path.join(__dirname, 'dashboard.db');

// P21 Database Tables and Columns (based on DBTables.txt and our database check)
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
  'customer_mst': [
    'cust_id', 'cust_name', 'cust_type', 'bill_to_addr', 'ship_to_addr', 
    'credit_limit', 'terms'
  ],
  'invoice_hdr': [
    'invoice_num', 'cust_id', 'invoice_date', 'due_date', 'total_amt', 
    'tax_amt', 'status', 'paid_amt', 'balance'
  ],
  'item_warehouse': [
    'item_id', 'warehouse_id', 'qty_on_hand', 'qty_on_order', 'qty_allocated'
  ],
  'prospect': [
    'prospect_id', 'name', 'created_date', 'status'
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
    },
    'Net Profit': {
      description: 'Net profit calculation',
      p21Tables: ['oe_hdr'],
      p21Columns: ['net_total'],
      porTables: ['Rentals'],
      porColumns: ['RentalValue']
    },
    'Average Order Value': {
      description: 'Average order value',
      p21Tables: ['oe_hdr'],
      p21Columns: ['order_total', 'order_num'],
      porTables: ['Rentals'],
      porColumns: ['RentalValue', 'RentalID']
    },
    'Return Rate': {
      description: 'Rate of returns',
      p21Tables: ['oe_hdr'],
      p21Columns: ['order_status'],
      porTables: ['Rentals'],
      porColumns: ['Status']
    },
    'Inventory Value': {
      description: 'Total inventory value',
      p21Tables: ['inv_mast', 'item_warehouse'],
      p21Columns: ['qty_on_hand', 'cost'],
      porTables: ['Products'],
      porColumns: ['Price', 'Cost']
    },
    'Backorder Value': {
      description: 'Value of items on backorder',
      p21Tables: ['oe_hdr', 'item_warehouse'],
      p21Columns: ['order_status', 'qty_on_order'],
      porTables: ['Rentals'],
      porColumns: ['Status']
    }
  },
  'Site Distribution': {
    'Addison Inventory': {
      description: 'Inventory at Addison site',
      p21Tables: ['item_warehouse'],
      p21Columns: ['warehouse_id', 'qty_on_hand'],
      porTables: [],
      porColumns: []
    },
    'Chicago Inventory': {
      description: 'Inventory at Chicago site',
      p21Tables: ['item_warehouse'],
      p21Columns: ['warehouse_id', 'qty_on_hand'],
      porTables: [],
      porColumns: []
    },
    'Dallas Inventory': {
      description: 'Inventory at Dallas site',
      p21Tables: ['item_warehouse'],
      p21Columns: ['warehouse_id', 'qty_on_hand'],
      porTables: [],
      porColumns: []
    }
  },
  'Accounts': {
    'Payable': {
      description: 'Accounts payable by month',
      p21Tables: ['ap_open_items'],
      p21Columns: ['balance', 'invoice_date'],
      porTables: [],
      porColumns: []
    },
    'Receivable': {
      description: 'Accounts receivable by month',
      p21Tables: ['ar_open_items'],
      p21Columns: ['balance', 'invoice_date'],
      porTables: [],
      porColumns: []
    },
    'Overdue': {
      description: 'Overdue accounts by month',
      p21Tables: ['ar_open_items'],
      p21Columns: ['balance', 'due_date', 'invoice_date'],
      porTables: [],
      porColumns: []
    }
  },
  'Customer Metrics': {
    'New Customers': {
      description: 'New customers by month',
      p21Tables: ['customer'],
      p21Columns: ['cust_id', 'created_date'],
      porTables: ['Customers'],
      porColumns: ['CustomerID', 'CreatedDate']
    },
    'Repeat Customers': {
      description: 'Repeat customers by month',
      p21Tables: ['oe_hdr', 'customer'],
      p21Columns: ['cust_id', 'order_date'],
      porTables: ['Rentals', 'Customers'],
      porColumns: ['CustomerID', 'CreatedDate']
    }
  },
  'AR Aging': {
    'Current': {
      description: 'Current AR',
      p21Tables: ['ar_open_items'],
      p21Columns: ['amount_due', 'aging_bucket'],
      porTables: [],
      porColumns: []
    },
    '1-30 Days': {
      description: 'AR 1-30 days',
      p21Tables: ['ar_open_items'],
      p21Columns: ['amount_due', 'aging_bucket'],
      porTables: [],
      porColumns: []
    },
    '31-60 Days': {
      description: 'AR 31-60 days',
      p21Tables: ['ar_open_items'],
      p21Columns: ['amount_due', 'aging_bucket'],
      porTables: [],
      porColumns: []
    },
    '61-90 Days': {
      description: 'AR 61-90 days',
      p21Tables: ['ar_open_items'],
      p21Columns: ['amount_due', 'aging_bucket'],
      porTables: [],
      porColumns: []
    },
    '90+ Days': {
      description: 'AR 90+ days',
      p21Tables: ['ar_open_items'],
      p21Columns: ['amount_due', 'aging_bucket'],
      porTables: [],
      porColumns: []
    }
  }
};

// Function to get all chart data from the database
async function getChartData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      db.all('SELECT * FROM chart_data', [], (err, rows) => {
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
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`,
        errorType: 'http'
      };
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.message || 'Unknown error',
        errorType: 'other'
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
      hasData: true
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
  console.log(`Attempting to fix P21 SQL expression for ${chartGroup} - ${variableName}`);
  
  // Get the requirements for this chart group and variable
  const requirements = CHART_REQUIREMENTS[chartGroup]?.[variableName];
  
  if (!requirements) {
    console.log(`No requirements found for ${chartGroup} - ${variableName}`);
    return sqlExpression;
  }
  
  // Basic fixes for P21 SQL expressions
  let fixedSQL = sqlExpression;
  
  // 1. Ensure schema prefix for tables
  for (const table of requirements.p21Tables) {
    const tableRegex = new RegExp(`\\b${table}\\b(?!\\.)`, 'gi');
    fixedSQL = fixedSQL.replace(tableRegex, `dbo.${table}`);
  }
  
  // 2. Ensure WITH (NOLOCK) hint for tables
  for (const table of requirements.p21Tables) {
    const tableWithSchemaRegex = new RegExp(`dbo\\.${table}\\b(?!\\s+WITH\\s*\\(NOLOCK\\))`, 'gi');
    fixedSQL = fixedSQL.replace(tableWithSchemaRegex, `dbo.${table} WITH (NOLOCK)`);
  }
  
  // 3. Ensure correct date functions (GETDATE, DATEADD, DATEDIFF)
  fixedSQL = fixedSQL.replace(/\bDate\(\)/gi, 'GETDATE()');
  fixedSQL = fixedSQL.replace(/\bDateAdd\((['"])([^'"]+)(['"])/gi, 'DATEADD($2');
  fixedSQL = fixedSQL.replace(/\bDateDiff\((['"])([^'"]+)(['"])/gi, 'DATEDIFF($2');
  
  // 4. Ensure 'value' alias for the result
  if (!fixedSQL.toLowerCase().includes(' as value')) {
    // If there's a SELECT without an alias, add 'as value'
    fixedSQL = fixedSQL.replace(/SELECT\s+([^,]+)(?!\s+as\s+)/i, 'SELECT $1 as value');
  }
  
  // 5. Replace non-existent tables with appropriate alternatives
  if (fixedSQL.includes('payable_accounts')) {
    fixedSQL = fixedSQL.replace(/payable_accounts/gi, 'ap_open_items');
  }
  
  if (fixedSQL.includes('receivable_accounts')) {
    fixedSQL = fixedSQL.replace(/receivable_accounts/gi, 'ar_open_items');
  }
  
  if (fixedSQL.includes('overdue_accounts')) {
    fixedSQL = fixedSQL.replace(/overdue_accounts/gi, 'ar_open_items');
    
    // Add condition for overdue accounts if not already present
    if (!fixedSQL.toLowerCase().includes('due_date')) {
      fixedSQL = fixedSQL.replace(/WHERE/i, 'WHERE due_date < GETDATE() AND');
    }
  }
  
  // 6. Special case for AR Aging
  if (chartGroup === 'AR Aging') {
    // Ensure we're using the aging_bucket column for AR aging
    if (variableName === 'Current' && !fixedSQL.includes('aging_bucket')) {
      fixedSQL = `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 'Current'`;
    } else if (variableName === '1-30 Days' && !fixedSQL.includes('aging_bucket')) {
      fixedSQL = `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '1-30 Days'`;
    } else if (variableName === '31-60 Days' && !fixedSQL.includes('aging_bucket')) {
      fixedSQL = `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '31-60 Days'`;
    } else if (variableName === '61-90 Days' && !fixedSQL.includes('aging_bucket')) {
      fixedSQL = `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '61-90 Days'`;
    } else if (variableName === '90+ Days' && !fixedSQL.includes('aging_bucket')) {
      fixedSQL = `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '90+ Days'`;
    }
  }
  
  // 7. Special case for Site Distribution
  if (chartGroup === 'Site Distribution') {
    if (variableName === 'Addison Inventory' && !fixedSQL.includes('warehouse_id')) {
      fixedSQL = `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = 'ADD'`;
    } else if (variableName === 'Chicago Inventory' && !fixedSQL.includes('warehouse_id')) {
      fixedSQL = `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = 'CHI'`;
    } else if (variableName === 'Dallas Inventory' && !fixedSQL.includes('warehouse_id')) {
      fixedSQL = `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = 'DAL'`;
    }
  }
  
  console.log(`Fixed P21 SQL expression: ${fixedSQL}`);
  return fixedSQL;
}

// Function to fix POR SQL expressions
function fixPORSQLExpression(sqlExpression, chartGroup, variableName) {
  console.log(`Attempting to fix POR SQL expression for ${chartGroup} - ${variableName}`);
  
  // Get the requirements for this chart group and variable
  const requirements = CHART_REQUIREMENTS[chartGroup]?.[variableName];
  
  if (!requirements) {
    console.log(`No requirements found for ${chartGroup} - ${variableName}`);
    return sqlExpression;
  }
  
  // Basic fixes for POR SQL expressions
  let fixedSQL = sqlExpression;
  
  // 1. Remove schema prefixes
  fixedSQL = fixedSQL.replace(/dbo\./gi, '');
  
  // 2. Remove WITH (NOLOCK) hints
  fixedSQL = fixedSQL.replace(/\s+WITH\s*\(NOLOCK\)/gi, '');
  
  // 3. Ensure correct date functions (Date, DateAdd, DateDiff)
  fixedSQL = fixedSQL.replace(/\bGETDATE\(\)/gi, 'Date()');
  fixedSQL = fixedSQL.replace(/\bDATEADD\(([^,'"]+)/gi, "DateAdd('$1'");
  fixedSQL = fixedSQL.replace(/\bDATEDIFF\(([^,'"]+)/gi, "DateDiff('$1'");
  
  // 4. Add Nz() for NULL handling
  if (fixedSQL.includes('SUM(') && !fixedSQL.includes('Nz(')) {
    fixedSQL = fixedSQL.replace(/SUM\(([^)]+)\)/gi, 'Sum(Nz($1,0))');
  }
  
  // 5. Ensure 'value' alias for the result
  if (!fixedSQL.toLowerCase().includes(' as value')) {
    // If there's a SELECT without an alias, add 'as value'
    fixedSQL = fixedSQL.replace(/SELECT\s+([^,]+)(?!\s+as\s+)/i, 'SELECT $1 as value');
  }
  
  // 6. Special case for POR Overview
  if (chartGroup === 'POR Overview') {
    if (variableName === 'Orders' && !fixedSQL.includes('Count(*)')) {
      fixedSQL = `SELECT Count(*) as value FROM Rentals WHERE Status = 'Open'`;
    } else if (variableName === 'Revenue' && !fixedSQL.includes('Sum(')) {
      fixedSQL = `SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Status = 'Open'`;
    } else if (variableName === 'Profit' && !fixedSQL.includes('Sum(')) {
      fixedSQL = `SELECT Sum(Nz(RentalValue,0)) * 0.3 as value FROM Rentals WHERE Status = 'Open'`;
    }
  }
  
  console.log(`Fixed POR SQL expression: ${fixedSQL}`);
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
      
      db.run(
        'UPDATE chart_data SET sql_expression = ?, production_sql_expression = ? WHERE id = ?',
        [sqlExpression, sqlExpression, id],
        function(err) {
          db.close();
          
          if (err) {
            reject(`Error updating database: ${err.message}`);
            return;
          }
          
          resolve(this.changes);
        }
      );
    });
  });
}

// Main function
async function main() {
  console.log('Fixing Dashboard SQL Expressions...');
  
  // Check if the server is running
  console.log('\nChecking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      console.log('❌ Server is not running. Please start the server with "npm run dev" and try again.');
      return;
    }
    console.log('✅ Server is running.');
  } catch (error) {
    console.log(`❌ Error checking server status: ${error.message}`);
    console.log('Please make sure the server is running with "npm run dev" and try again.');
    return;
  }
  
  // Get all chart data
  let chartData;
  try {
    chartData = await getChartData();
    console.log(`✅ Retrieved ${chartData.length} chart data rows.`);
  } catch (error) {
    console.log(`❌ Error getting chart data: ${error}`);
    return;
  }
  
  // Initialize counters
  const stats = {
    totalExpressions: chartData.length,
    testedExpressions: 0,
    errorExpressions: 0,
    zeroDataExpressions: 0,
    fixedExpressions: 0
  };
  
  // Initialize arrays for errors and fixes
  const errors = [];
  const fixes = [];
  
  // Process each chart data row
  for (const row of chartData) {
    const { id, chart_group, variable_name, server, sql_expression } = row;
    
    console.log(`\nProcessing expression ${id}: ${chart_group} - ${variable_name} (${server})`);
    
    // Test the SQL expression
    const testResult = await testSQLExpression(sql_expression, server);
    stats.testedExpressions++;
    
    if (!testResult.success) {
      console.log(`❌ Error executing SQL expression: ${testResult.error}`);
      stats.errorExpressions++;
      errors.push({
        id,
        name: `Expression ${id}`,
        server,
        sql: sql_expression,
        error: JSON.stringify(testResult)
      });
      
      console.log('Attempting to fix expression (reason: error)...');
      
      // Fix the SQL expression based on server type
      let fixedSQL;
      if (server === 'P21') {
        fixedSQL = fixP21SQLExpression(sql_expression, chart_group, variable_name);
      } else if (server === 'POR') {
        fixedSQL = fixPORSQLExpression(sql_expression, chart_group, variable_name);
      } else {
        console.log(`⚠️ Unknown server type: ${server}`);
        continue;
      }
      
      // If the SQL expression was changed, test the fixed version
      if (fixedSQL !== sql_expression) {
        console.log(`Testing fixed SQL expression: ${fixedSQL}`);
        
        const fixedTestResult = await testSQLExpression(fixedSQL, server);
        
        if (fixedTestResult.success && fixedTestResult.hasData) {
          console.log('✅ Fixed SQL expression works and returns data!');
          
          // Update the SQL expression in the database
          try {
            await updateSQLExpression(id, fixedSQL);
            console.log('✅ Updated SQL expression in database.');
            
            stats.fixedExpressions++;
            fixes.push({
              id,
              name: `Expression ${id}`,
              server,
              originalSql: sql_expression,
              fixedSql: fixedSQL,
              reason: 'error'
            });
          } catch (error) {
            console.log(`❌ Error updating SQL expression in database: ${error}`);
          }
        } else if (fixedTestResult.success) {
          console.log('⚠️ Fixed SQL expression works but returns no data.');
        } else {
          console.log(`❌ Fixed SQL expression still has errors: ${fixedTestResult.error}`);
        }
      } else {
        console.log('⚠️ No fixes applied or no changes needed.');
      }
    } else if (!testResult.hasData) {
      console.log('⚠️ SQL expression works but returns no data.');
      stats.zeroDataExpressions++;
      
      console.log('Attempting to fix expression (reason: zero_data)...');
      
      // Fix the SQL expression based on server type
      let fixedSQL;
      if (server === 'P21') {
        fixedSQL = fixP21SQLExpression(sql_expression, chart_group, variable_name);
      } else if (server === 'POR') {
        fixedSQL = fixPORSQLExpression(sql_expression, chart_group, variable_name);
      } else {
        console.log(`⚠️ Unknown server type: ${server}`);
        continue;
      }
      
      // If the SQL expression was changed, test the fixed version
      if (fixedSQL !== sql_expression) {
        console.log(`Testing fixed SQL expression: ${fixedSQL}`);
        
        const fixedTestResult = await testSQLExpression(fixedSQL, server);
        
        if (fixedTestResult.success && fixedTestResult.hasData) {
          console.log('✅ Fixed SQL expression works and returns data!');
          
          // Update the SQL expression in the database
          try {
            await updateSQLExpression(id, fixedSQL);
            console.log('✅ Updated SQL expression in database.');
            
            stats.fixedExpressions++;
            fixes.push({
              id,
              name: `Expression ${id}`,
              server,
              originalSql: sql_expression,
              fixedSql: fixedSQL,
              reason: 'zero_data'
            });
          } catch (error) {
            console.log(`❌ Error updating SQL expression in database: ${error}`);
          }
        } else if (fixedTestResult.success) {
          console.log('⚠️ Fixed SQL expression works but still returns no data.');
        } else {
          console.log(`❌ Fixed SQL expression has errors: ${fixedTestResult.error}`);
        }
      } else {
        console.log('⚠️ No fixes applied or no changes needed.');
      }
    } else {
      console.log('✅ SQL expression works and returns data.');
    }
  }
  
  // Save results to a file
  const results = {
    timestamp: new Date().toISOString(),
    ...stats,
    errors,
    fixes
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'sql-expressions-improved-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Print summary
  console.log('\nSummary:');
  console.log(`- Total expressions: ${stats.totalExpressions}`);
  console.log(`- Tested expressions: ${stats.testedExpressions}`);
  console.log(`- Error expressions: ${stats.errorExpressions}`);
  console.log(`- Zero data expressions: ${stats.zeroDataExpressions}`);
  console.log(`- Fixed expressions: ${stats.fixedExpressions}`);
  console.log(`\nResults saved to: ${path.join(__dirname, 'sql-expressions-improved-results.json')}`);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
