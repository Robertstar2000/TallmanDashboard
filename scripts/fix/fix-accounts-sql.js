/**
 * Fix Accounts SQL Expressions
 * 
 * This script fixes the SQL expressions for the Accounts section
 * to ensure they display correctly in the spreadsheet.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const odbc = require('odbc');

// Get the database path
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// P21 connection settings
const P21_DSN = process.env.P21_DSN || 'P21Play';

// Corrected SQL expressions for Accounts
const accountsSqlFixes = [
  {
    id: '1',
    variableName: 'Amount Due',
    sql: 'SELECT SUM(open_amt) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30'
  },
  {
    id: '2',
    variableName: 'Current',
    sql: 'SELECT SUM(open_amt) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) <= 0'
  },
  {
    id: '3',
    variableName: 'Overdue',
    sql: 'SELECT SUM(open_amt) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) > 0'
  },
  {
    id: '4',
    variableName: 'Payable',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND paid_date IS NULL'
  },
  {
    id: '5',
    variableName: 'Receivable',
    sql: 'SELECT SUM(open_amt) as value FROM dbo.ar_open_items WITH (NOLOCK)'
  }
];

// Helper function to test SQL expression
async function testSqlExpression(sql) {
  console.log(`Testing SQL expression: ${sql}`);
  try {
    // Connect using the DSN that's already configured in Windows
    const connectionString = `DSN=${P21_DSN};Trusted_Connection=Yes;`;
    console.log('ODBC connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('Connected successfully to ODBC data source!');
    
    // Execute the query
    console.log('Executing query...');
    const result = await connection.query(sql);
    console.log('Query executed successfully, result:', result);
    
    // Close the connection
    await connection.close();
    
    return { success: true, result };
  } catch (error) {
    console.error('Error testing SQL expression:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('Fixing Accounts SQL expressions...');
  console.log(`Database path: ${dbPath}`);

  try {
    // Check if the database file exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Database file not found at ${dbPath}`);
      return;
    }

    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Successfully opened SQLite database connection');

    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Fix each SQL expression
      for (const fix of accountsSqlFixes) {
        console.log(`\nFixing SQL expression for ${fix.variableName} (ID: ${fix.id})...`);
        
        // Test the SQL expression first
        const testResult = await testSqlExpression(fix.sql);
        
        if (testResult.success) {
          console.log('SQL expression test successful!');
          console.log('Result:', testResult.result);
          
          // Update the SQL expression in the database
          await db.run(
            `UPDATE chart_data 
             SET sql_expression = ?, 
                 last_updated = ? 
             WHERE id = ? OR (chart_group = 'Accounts' AND variable_name = ?)`,
            [fix.sql, new Date().toISOString(), fix.id, fix.variableName]
          );
          
          console.log(`SQL expression for ${fix.variableName} updated successfully`);
          
          // If the test returned a value, update the value in the database
          if (testResult.result && testResult.result.length > 0 && 'value' in testResult.result[0]) {
            const value = testResult.result[0].value;
            
            // Format as currency
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
            
            await db.run(
              `UPDATE chart_data 
               SET value = ? 
               WHERE id = ? OR (chart_group = 'Accounts' AND variable_name = ?)`,
              [formattedValue, fix.id, fix.variableName]
            );
            
            console.log(`Value for ${fix.variableName} updated to ${formattedValue}`);
          }
        } else {
          console.error('SQL expression test failed:', testResult.error);
          console.log('Skipping update for this expression');
        }
      }
      
      // Commit the transaction
      await db.run('COMMIT');
      console.log('\nAll SQL expressions updated successfully');
      
      // Clear the cache
      console.log('Clearing chart_data cache...');
      await db.run(`UPDATE chart_data SET last_updated = ?`, [new Date().toISOString()]);
      
      // Verify the updates
      console.log('\nVerifying updates...');
      const rows = await db.all(`
        SELECT id, variable_name, sql_expression, value, last_updated
        FROM chart_data
        WHERE chart_group = 'Accounts'
      `);
      
      console.log('Updated rows:');
      rows.forEach(row => {
        console.log(`ID: ${row.id}, Variable: ${row.variable_name}, Value: ${row.value}`);
        console.log(`SQL: ${row.sql_expression}`);
        console.log('---');
      });
    } catch (error) {
      // Rollback the transaction on error
      await db.run('ROLLBACK');
      console.error('Error updating SQL expressions:', error);
    }

    // Close the database connection
    await db.close();
    console.log('Database connection closed');

    console.log('\nAccounts SQL expressions fixed successfully. The spreadsheet should now display the correct data.');
    console.log('Please restart the application to see the changes.');
  } catch (error) {
    console.error('Error fixing Accounts SQL expressions:', error);
  }
}

// Run the main function
main().catch(console.error);

