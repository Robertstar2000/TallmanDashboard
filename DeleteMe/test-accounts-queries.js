const odbc = require('odbc');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to test the SQL queries for the Accounts group
 * This will test both the test and production SQL queries against the P21 database
 */
async function testAccountsQueries() {
  console.log('=== Testing Accounts SQL Queries ===');
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
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, 
             sql_expression as sqlExpression, production_sql_expression as productionSqlExpression,
             server_name as serverName, db_table_name as tableName
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRows.forEach(row => {
      if (!rowsByVariable[row.variableName]) {
        rowsByVariable[row.variableName] = [];
      }
      rowsByVariable[row.variableName].push(row);
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
    
    // Test queries for Accounts Payable
    console.log('\n=== Testing Accounts Payable queries ===');
    
    // Define test queries for Accounts Payable
    const payableQueries = [
      {
        name: "Current Payable Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'"
      },
      {
        name: "Monthly Payable Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O' AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O' AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())"
      }
    ];
    
    for (const query of payableQueries) {
      console.log(`\nTesting: ${query.name}`);
      console.log(`Test SQL: ${query.testSql}`);
      
      try {
        const result = await connection.query(query.testSql);
        console.log('Result:', result);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
        } else {
          console.log('⚠️ Query executed but returned no results');
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
      }
    }
    
    // Test queries for Accounts Receivable
    console.log('\n=== Testing Accounts Receivable queries ===');
    
    // Define test queries for Accounts Receivable
    const receivableQueries = [
      {
        name: "Current Receivable Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'"
      },
      {
        name: "Monthly Receivable Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())"
      }
    ];
    
    for (const query of receivableQueries) {
      console.log(`\nTesting: ${query.name}`);
      console.log(`Test SQL: ${query.testSql}`);
      
      try {
        const result = await connection.query(query.testSql);
        console.log('Result:', result);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
        } else {
          console.log('⚠️ Query executed but returned no results');
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
      }
    }
    
    // Test queries for Accounts Overdue
    console.log('\n=== Testing Accounts Overdue queries ===');
    
    // Define test queries for Accounts Overdue
    const overdueQueries = [
      {
        name: "Current Overdue Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE()"
      },
      {
        name: "Monthly Overdue Test",
        testSql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())",
        productionSql: "SELECT ISNULL(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O' AND due_date < GETDATE() AND MONTH(invoice_date) = MONTH(GETDATE()) AND YEAR(invoice_date) = YEAR(GETDATE())"
      }
    ];
    
    for (const query of overdueQueries) {
      console.log(`\nTesting: ${query.name}`);
      console.log(`Test SQL: ${query.testSql}`);
      
      try {
        const result = await connection.query(query.testSql);
        console.log('Result:', result);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
        } else {
          console.log('⚠️ Query executed but returned no results');
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
      }
    }
    
    // Close connections
    console.log('\n--- Closing connections ---');
    await connection.close();
    console.log('✅ P21 Connection closed successfully');
    
    await db.close();
    console.log('✅ SQLite Connection closed successfully');
    
    console.log('\n=== Accounts SQL Queries Testing Completed ===');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the test function
testAccountsQueries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
