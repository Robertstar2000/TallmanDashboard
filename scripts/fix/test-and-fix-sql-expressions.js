/**
 * Test and Fix SQL Expressions Script
 * This script checks all SQL expressions in the dashboard database and fixes any that are reporting execution errors.
 * It uses the /api/executeQuery endpoint to test expressions against both P21 and POR databases.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Path to the database file
const dbPath = path.join(__dirname, 'data', 'dashboard.db');

// Function to test a SQL expression against the appropriate database
async function testSqlExpression(id, name, server, sql) {
  console.log(`\nTesting: ${name} (ID: ${id})`);
  console.log(`Server: ${server}`);
  console.log(`SQL: ${sql}`);
  
  try {
    const requestBody = {
      query: sql,
      server: server
    };
    
    // Add filePath for POR queries
    if (server === 'POR') {
      requestBody.filePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';
    }
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = 'Could not retrieve error text';
      }
      
      console.log(`❌ Query failed: ${errorText}`);
      return { success: false, error: errorText };
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Query failed: ${result.message || 'Unknown error'}`);
      return { success: false, error: result.message || 'Unknown error' };
    }
    
    console.log(`✅ Query successful`);
    if (result.data && result.data.length > 0) {
      console.log(`Result: ${JSON.stringify(result.data[0])}`);
      return { success: true, data: result.data[0] };
    } else {
      console.log(`No data returned`);
      return { success: true, data: null };
    }
  } catch (error) {
    console.log(`❌ Error executing query: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to fix P21 SQL expressions
function fixP21SqlExpression(sql, error) {
  let fixedSql = sql;
  let fixes = [];
  
  // Fix 1: Add schema prefix (dbo.) to table names
  if (error.includes("Invalid object name") || error.includes("Invalid column name")) {
    const tableNames = ['oe_hdr', 'invoice_hdr', 'inv_mast', 'customer', 'ar_open_items', 'ap_open_items', 'order_hdr', 'customer_mst', 'location_mst'];
    
    tableNames.forEach(tableName => {
      const regex = new RegExp(`\\bFROM\\s+${tableName}\\b`, 'gi');
      if (regex.test(fixedSql) && !fixedSql.includes(`FROM dbo.${tableName}`)) {
        fixedSql = fixedSql.replace(regex, `FROM dbo.${tableName}`);
        fixes.push(`Added 'dbo.' prefix to ${tableName}`);
      }
      
      const joinRegex = new RegExp(`\\bJOIN\\s+${tableName}\\b`, 'gi');
      if (joinRegex.test(fixedSql) && !fixedSql.includes(`JOIN dbo.${tableName}`)) {
        fixedSql = fixedSql.replace(joinRegex, `JOIN dbo.${tableName}`);
        fixes.push(`Added 'dbo.' prefix to ${tableName} in JOIN clause`);
      }
    });
  }
  
  // Fix 2: Add NOLOCK hint
  if (!fixedSql.includes('WITH (NOLOCK)')) {
    const tableRegex = /FROM\s+dbo\.([^\s]+)/g;
    fixedSql = fixedSql.replace(tableRegex, 'FROM dbo.$1 WITH (NOLOCK)');
    
    const joinRegex = /JOIN\s+dbo\.([^\s]+)/g;
    fixedSql = fixedSql.replace(joinRegex, 'JOIN dbo.$1 WITH (NOLOCK)');
    
    if (fixedSql !== sql) {
      fixes.push('Added WITH (NOLOCK) hint to tables');
    }
  }
  
  // Fix 3: Fix date functions
  if (error.includes("datetime") || error.includes("date") || error.includes("strftime")) {
    const dateReplacements = [
      { from: /strftime\('%Y-%m', date\)/g, to: "FORMAT(date, 'yyyy-MM')" },
      { from: /strftime\('%Y-%m', 'now'\)/g, to: "FORMAT(GETDATE(), 'yyyy-MM')" },
      { from: /date\('now'\)/g, to: 'GETDATE()' },
      { from: /date\(date\)/g, to: 'CONVERT(date, date)' },
      { from: /current_date/gi, to: 'GETDATE()' },
      { from: /current_timestamp/gi, to: 'GETDATE()' }
    ];
    
    dateReplacements.forEach(({ from, to }) => {
      if (from.test(fixedSql)) {
        fixedSql = fixedSql.replace(from, to);
        fixes.push(`Replaced ${from} with ${to}`);
      }
    });
  }
  
  // Fix 4: Fix FORMAT function if not supported
  if (error.includes("FORMAT")) {
    const formatReplacements = [
      { from: /FORMAT\(([^,]+), 'yyyy-MM'\)/g, to: "CONVERT(varchar(7), $1, 120)" },
      { from: /FORMAT\(GETDATE\(\), 'yyyy-MM'\)/g, to: "CONVERT(varchar(7), GETDATE(), 120)" }
    ];
    
    formatReplacements.forEach(({ from, to }) => {
      if (from.test(fixedSql)) {
        fixedSql = fixedSql.replace(from, to);
        fixes.push(`Replaced ${from} with ${to}`);
      }
    });
  }
  
  // Fix 5: Ensure 'value' alias is present
  if (!fixedSql.toLowerCase().includes(' as value') && !fixedSql.toLowerCase().includes(' value ')) {
    const countPattern = /SELECT\s+COUNT\(\*\)/i;
    if (countPattern.test(fixedSql)) {
      fixedSql = fixedSql.replace(countPattern, 'SELECT COUNT(*) as value');
      fixes.push('Added missing "as value" alias to COUNT(*)');
    }
  }
  
  return { fixedSql, fixes };
}

// Function to fix POR SQL expressions
function fixPORSqlExpression(sql, error) {
  let fixedSql = sql;
  let fixes = [];
  
  // Fix 1: Remove schema prefixes (dbo.)
  if (fixedSql.includes('dbo.')) {
    fixedSql = fixedSql.replace(/dbo\./g, '');
    fixes.push('Removed dbo. schema prefix');
  }
  
  // Fix 2: Remove NOLOCK hints
  if (fixedSql.includes('WITH (NOLOCK)')) {
    fixedSql = fixedSql.replace(/WITH \(NOLOCK\)/g, '');
    fixes.push('Removed WITH (NOLOCK) hints');
  }
  
  // Fix 3: Fix date functions
  if (error.includes("datetime") || error.includes("date") || error.includes("GETDATE")) {
    const dateReplacements = [
      { from: /GETDATE\(\)/g, to: "Date()" },
      { from: /DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, to: "DateAdd(\"$1\", $2, $3)" },
      { from: /DATEDIFF\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, to: "DateDiff(\"$1\", $2, $3)" },
      { from: /FORMAT\(([^,]+),\s*'([^']+)'\)/gi, to: "Format($1, \"$2\")" },
      { from: /CONVERT\(varchar\(\d+\),\s*([^,]+),\s*\d+\)/gi, to: "Format($1, \"yyyy-mm\")" }
    ];
    
    dateReplacements.forEach(({ from, to }) => {
      if (from.test(fixedSql)) {
        fixedSql = fixedSql.replace(from, to);
        fixes.push(`Replaced ${from} with ${to}`);
      }
    });
  }
  
  // Fix 4: Fix NULL handling
  if (error.includes("NULL") || error.includes("null")) {
    const nullReplacements = [
      { from: /ISNULL\(([^,]+),\s*([^)]+)\)/gi, to: "Nz($1, $2)" },
      { from: /COALESCE\(([^)]+)\)/gi, to: "Nz($1)" }
    ];
    
    nullReplacements.forEach(({ from, to }) => {
      if (from.test(fixedSql)) {
        fixedSql = fixedSql.replace(from, to);
        fixes.push(`Replaced ${from} with ${to}`);
      }
    });
  }
  
  // Fix 5: Ensure 'value' alias is present
  if (!fixedSql.toLowerCase().includes(' as value') && !fixedSql.toLowerCase().includes(' value ')) {
    const countPattern = /SELECT\s+Count\(\*\)/i;
    if (countPattern.test(fixedSql)) {
      fixedSql = fixedSql.replace(countPattern, 'SELECT Count(*) as value');
      fixes.push('Added missing "as value" alias to Count(*)');
    }
  }
  
  return { fixedSql, fixes };
}

// Function to update SQL expression in the database
async function updateSqlExpression(id, newSql) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Error opening database: ${err.message}`));
        return;
      }
      
      db.run('UPDATE chart_data SET sql_expression = ? WHERE id = ?', [newSql, id], function(err) {
        db.close();
        
        if (err) {
          reject(new Error(`Error updating SQL expression: ${err.message}`));
          return;
        }
        
        resolve({ success: true, changes: this.changes });
      });
    });
  });
}

// Function to get all SQL expressions from the database
async function getAllSqlExpressions() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Error opening database: ${err.message}`));
        return;
      }
      
      db.all('SELECT id, chart_name, variable_name, server, sql_expression FROM chart_data', [], (err, rows) => {
        db.close();
        
        if (err) {
          reject(new Error(`Error getting SQL expressions: ${err.message}`));
          return;
        }
        
        resolve(rows);
      });
    });
  });
}

// Main function
async function main() {
  console.log('Testing and fixing SQL expressions...');
  
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
  
  try {
    // Get all SQL expressions from the database
    const expressions = await getAllSqlExpressions();
    console.log(`Found ${expressions.length} SQL expressions in the database.`);
    
    // Results tracking
    const results = {
      timestamp: new Date().toISOString(),
      totalExpressions: expressions.length,
      testedExpressions: 0,
      errorExpressions: 0,
      fixedExpressions: 0,
      errors: [],
      fixes: []
    };
    
    // Test and fix each expression
    for (const expr of expressions) {
      results.testedExpressions++;
      
      // Test the expression
      const testResult = await testSqlExpression(expr.id, `${expr.chart_name} - ${expr.variable_name}`, expr.server, expr.sql_expression);
      
      if (!testResult.success) {
        results.errorExpressions++;
        console.log(`Attempting to fix expression...`);
        
        // Try to fix the expression based on the server type
        let fixResult;
        if (expr.server === 'P21') {
          fixResult = fixP21SqlExpression(expr.sql_expression, testResult.error);
        } else if (expr.server === 'POR') {
          fixResult = fixPORSqlExpression(expr.sql_expression, testResult.error);
        } else {
          console.log(`⚠️ Unknown server type: ${expr.server}`);
          continue;
        }
        
        if (fixResult.fixes.length > 0 && fixResult.fixedSql !== expr.sql_expression) {
          console.log(`Applied fixes: ${fixResult.fixes.join(', ')}`);
          console.log(`Fixed SQL: ${fixResult.fixedSql}`);
          
          // Test the fixed expression
          const fixedTestResult = await testSqlExpression(expr.id, `${expr.chart_name} - ${expr.variable_name} (FIXED)`, expr.server, fixResult.fixedSql);
          
          if (fixedTestResult.success) {
            // Update the expression in the database
            const updateResult = await updateSqlExpression(expr.id, fixResult.fixedSql);
            
            if (updateResult.success) {
              console.log(`✅ Successfully updated SQL expression in the database`);
              results.fixedExpressions++;
              
              results.fixes.push({
                id: expr.id,
                chartName: expr.chart_name,
                variableName: expr.variable_name,
                server: expr.server,
                originalSql: expr.sql_expression,
                fixedSql: fixResult.fixedSql,
                fixes: fixResult.fixes
              });
            } else {
              console.log(`❌ Failed to update SQL expression in the database: ${updateResult.error}`);
            }
          } else {
            console.log(`❌ Fixed SQL expression still fails: ${fixedTestResult.error}`);
          }
        } else {
          console.log(`⚠️ No fixes applied or no changes needed`);
        }
        
        results.errors.push({
          id: expr.id,
          chartName: expr.chart_name,
          variableName: expr.variable_name,
          server: expr.server,
          sql: expr.sql_expression,
          error: testResult.error
        });
      }
    }
    
    // Save results to JSON file
    const jsonFile = path.join(__dirname, 'sql-expressions-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
    // Print summary
    console.log(`\nSummary:`);
    console.log(`- Total expressions: ${results.totalExpressions}`);
    console.log(`- Tested expressions: ${results.testedExpressions}`);
    console.log(`- Error expressions: ${results.errorExpressions}`);
    console.log(`- Fixed expressions: ${results.fixedExpressions}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
