const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to verify the Accounts data in the SQLite database
 * This will check that the SQL queries have been properly updated
 */
async function verifyAccountsData() {
  console.log('=== Verifying Accounts Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Get the Accounts rows from the SQLite database
    const accountsRows = await db.all(`
      SELECT id, chart_group, variable_name, value, 
             sql_expression, production_sql_expression,
             server_name, db_table_name, last_updated
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRows.forEach(row => {
      const baseVariableName = row.variable_name.split(' (')[0];
      
      if (!rowsByVariable[baseVariableName]) {
        rowsByVariable[baseVariableName] = [];
      }
      rowsByVariable[baseVariableName].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Verify each variable group has exactly 12 rows
    let allValid = true;
    
    for (const [variableName, rows] of Object.entries(rowsByVariable)) {
      if (rows.length !== 12) {
        console.log(`❌ Variable ${variableName} has ${rows.length} rows, expected 12`);
        allValid = false;
      } else {
        console.log(`✅ Variable ${variableName} has the correct number of rows (12)`);
      }
    }
    
    // Verify each row has a valid SQL expression
    console.log('\n--- Checking SQL expressions ---');
    
    for (const row of accountsRows) {
      const baseVariableName = row.variable_name.split(' (')[0];
      const monthName = row.variable_name.match(/\((.*?)\)/)?.[1] || 'Unknown';
      
      // Check if the SQL expression is valid
      const hasValidSql = row.sql_expression && 
                          !row.sql_expression.includes('Default SQL') &&
                          row.sql_expression.includes('SELECT') &&
                          row.sql_expression.includes('FROM');
      
      // Check if the production SQL expression is valid
      const hasValidProductionSql = row.production_sql_expression && 
                                   !row.production_sql_expression.includes('Default SQL') &&
                                   row.production_sql_expression.includes('SELECT') &&
                                   row.production_sql_expression.includes('FROM');
      
      // Check if the table name is set
      const hasTableName = row.db_table_name && row.db_table_name.length > 0;
      
      if (hasValidSql && hasValidProductionSql && hasTableName) {
        console.log(`✅ Row ${row.id} (${baseVariableName} - ${monthName}) has valid SQL expressions and table name`);
      } else {
        console.log(`❌ Row ${row.id} (${baseVariableName} - ${monthName}) has invalid SQL expressions or table name`);
        
        if (!hasValidSql) {
          console.log(`   - Invalid SQL expression: ${row.sql_expression}`);
        }
        
        if (!hasValidProductionSql) {
          console.log(`   - Invalid production SQL expression: ${row.production_sql_expression}`);
        }
        
        if (!hasTableName) {
          console.log(`   - Missing table name`);
        }
        
        allValid = false;
      }
    }
    
    // Final verdict
    console.log('\n--- Final verification result ---');
    
    if (allValid) {
      console.log('✅ All Accounts data is valid and properly configured');
    } else {
      console.log('❌ Some Accounts data is invalid or improperly configured');
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Accounts Data Verification Completed ===');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the verification function
verifyAccountsData()
  .then(() => {
    console.log('Verification completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
