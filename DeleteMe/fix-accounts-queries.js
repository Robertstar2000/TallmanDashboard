const odbc = require('odbc');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to test and fix the SQL queries for the Accounts group
 * This will test both the test and production SQL queries against the P21 database
 * and update the SQLite database with the correct queries
 */
async function fixAccountsQueries() {
  console.log('=== Testing and Fixing Accounts SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the P21 database
    console.log('\n--- Connecting to P21 database ---');
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21 database');
    
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
             server_name, db_table_name
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRows.forEach(row => {
      if (!rowsByVariable[row.variable_name]) {
        rowsByVariable[row.variable_name] = [];
      }
      rowsByVariable[row.variable_name].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Define the month names for the past 12 months
    const monthNames = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'long' });
      monthNames.push(monthName);
    }
    
    console.log('\n--- Month names for the past 12 months ---');
    console.log(monthNames.join(', '));
    
    // Test queries for each variable type
    console.log('\n--- Testing SQL queries for each variable type ---');
    
    // Define the working SQL queries for each variable type
    const workingQueries = {
      'Payable': {
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'",
        tableName: "ap_open_items"
      },
      'Receivable': {
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'",
        tableName: "ar_open_items"
      },
      'Overdue': {
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()",
        tableName: "ar_open_items"
      }
    };
    
    // Test the base queries
    console.log('\n--- Testing base queries ---');
    
    for (const [variableName, query] of Object.entries(workingQueries)) {
      console.log(`\nTesting base query for ${variableName}`);
      console.log(`Test SQL: ${query.testSql}`);
      
      try {
        const result = await connection.query(query.testSql);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
          
          // Store the result for later use
          workingQueries[variableName].result = result[0].value;
        } else {
          console.log('⚠️ Query executed but returned no results');
          workingQueries[variableName].result = 0;
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
        console.log('Trying alternative query format...');
        
        // Try an alternative query format
        const alternativeQuery = query.testSql.replace('COALESCE', 'ISNULL');
        console.log(`Alternative SQL: ${alternativeQuery}`);
        
        try {
          const result = await connection.query(alternativeQuery);
          
          if (result && result.length > 0) {
            console.log('✅ Alternative query executed successfully with result:', result[0].value);
            
            // Update the working query with the alternative that works
            workingQueries[variableName].testSql = alternativeQuery;
            workingQueries[variableName].result = result[0].value;
          } else {
            console.log('⚠️ Alternative query executed but returned no results');
            workingQueries[variableName].result = 0;
          }
        } catch (alternativeError) {
          console.error('❌ Error executing alternative query:', alternativeError.message);
          workingQueries[variableName].result = 0;
        }
      }
    }
    
    // Now create monthly queries for each variable
    console.log('\n--- Creating monthly queries ---');
    
    const monthlyQueries = {};
    
    for (const [variableName, baseQuery] of Object.entries(workingQueries)) {
      monthlyQueries[variableName] = [];
      
      for (let i = 0; i < 12; i++) {
        const monthName = monthNames[i];
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth() + 1; // JavaScript months are 0-indexed
        const year = d.getFullYear();
        
        // Create the monthly query
        const monthlyTestSql = baseQuery.testSql.replace(
          "WHERE status = 'O'", 
          `WHERE status = 'O' AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
        );
        
        const monthlyProductionSql = baseQuery.productionSql.replace(
          "WHERE status = 'O'", 
          `WHERE status = 'O' AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
        );
        
        // For Overdue, we need a different approach
        if (variableName === 'Overdue') {
          const monthlyOverdueTestSql = baseQuery.testSql.replace(
            "WHERE status = 'O' AND due_date < GETDATE()", 
            `WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
          );
          
          const monthlyOverdueProductionSql = baseQuery.productionSql.replace(
            "WHERE status = 'O' AND due_date < GETDATE()", 
            `WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = ${year}`
          );
          
          monthlyQueries[variableName].push({
            month: i,
            monthName,
            testSql: monthlyOverdueTestSql,
            productionSql: monthlyOverdueProductionSql,
            tableName: baseQuery.tableName
          });
        } else {
          monthlyQueries[variableName].push({
            month: i,
            monthName,
            testSql: monthlyTestSql,
            productionSql: monthlyProductionSql,
            tableName: baseQuery.tableName
          });
        }
      }
    }
    
    // Test a sample of the monthly queries
    console.log('\n--- Testing sample monthly queries ---');
    
    for (const [variableName, queries] of Object.entries(monthlyQueries)) {
      // Test the current month query
      const currentMonthQuery = queries[0];
      
      console.log(`\nTesting ${variableName} query for ${currentMonthQuery.monthName}`);
      console.log(`Test SQL: ${currentMonthQuery.testSql}`);
      
      try {
        const result = await connection.query(currentMonthQuery.testSql);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
          currentMonthQuery.result = result[0].value;
        } else {
          console.log('⚠️ Query executed but returned no results');
          currentMonthQuery.result = 0;
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
        currentMonthQuery.result = 0;
      }
    }
    
    // Update the SQLite database with the new queries
    console.log('\n--- Updating SQLite database with new queries ---');
    
    // Prepare the updates
    const updates = [];
    
    for (const [variableName, rows] of Object.entries(rowsByVariable)) {
      const monthlyQueriesForVariable = monthlyQueries[variableName];
      
      if (!monthlyQueriesForVariable) {
        console.log(`⚠️ No monthly queries found for ${variableName}, skipping updates`);
        continue;
      }
      
      // Ensure we have exactly 12 rows for each variable
      if (rows.length !== 12) {
        console.log(`⚠️ Expected 12 rows for ${variableName}, but found ${rows.length}`);
        console.log('Will update only the available rows');
      }
      
      // Update each row with the corresponding monthly query
      for (let i = 0; i < Math.min(rows.length, 12); i++) {
        const row = rows[i];
        const monthlyQuery = monthlyQueriesForVariable[i];
        
        if (!monthlyQuery) {
          console.log(`⚠️ No monthly query found for ${variableName} month ${i}, skipping update`);
          continue;
        }
        
        // Update the row with the new query
        updates.push({
          id: row.id,
          variable_name: `${variableName} (${monthlyQuery.monthName})`,
          sql_expression: monthlyQuery.testSql,
          production_sql_expression: monthlyQuery.productionSql,
          db_table_name: monthlyQuery.tableName
        });
      }
    }
    
    // Execute the updates
    console.log(`\nPrepared ${updates.length} updates`);
    
    for (const update of updates) {
      console.log(`\nUpdating row ${update.id} (${update.variable_name})`);
      
      try {
        await db.run(`
          UPDATE chart_data
          SET variable_name = ?,
              sql_expression = ?,
              production_sql_expression = ?,
              db_table_name = ?,
              last_updated = ?
          WHERE id = ?
        `, [
          update.variable_name,
          update.sql_expression,
          update.production_sql_expression,
          update.db_table_name,
          new Date().toISOString(),
          update.id
        ]);
        
        console.log('✅ Update successful');
      } catch (error) {
        console.error('❌ Error updating row:', error.message);
      }
    }
    
    // Create a cache-busting file to force the dashboard to reload data
    const timestamp = new Date().toISOString();
    const cacheDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(cacheDir, 'cache-refresh.txt');
    
    fs.writeFileSync(cacheFile, timestamp);
    console.log(`\nCreated cache-busting file at ${cacheFile} with timestamp ${timestamp}`);
    
    // Close connections
    console.log('\n--- Closing connections ---');
    await connection.close();
    console.log('✅ P21 Connection closed successfully');
    
    await db.close();
    console.log('✅ SQLite Connection closed successfully');
    
    console.log('\n=== Accounts SQL Queries Fix Completed ===');
    console.log('\nTo see the updated Accounts data:');
    console.log('1. Refresh the dashboard in your browser: http://localhost:3000');
    console.log('2. The dashboard should now display the correct Accounts data');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the fix function
fixAccountsQueries()
  .then(() => {
    console.log('Fix completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
