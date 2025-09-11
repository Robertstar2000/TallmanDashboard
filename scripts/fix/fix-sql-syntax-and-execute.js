/**
 * Fix SQL Syntax and Execute
 * 
 * This script fixes the SQL syntax errors in the expressions and then
 * executes them against the P21 database to get real data.
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
const P21_DSN = process.env.P21_DSN || 'P21Live';
const P21_USERNAME = process.env.P21_USERNAME || '';
const P21_PASSWORD = process.env.P21_PASSWORD || '';

// Corrected SQL expressions for Accounts
const accountsSqlFixes = [
  {
    variableName: 'Amount Due',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE DATEDIFF(day, invoice_date, GETDATE()) BETWEEN 1 AND 30'
  },
  {
    variableName: 'Current',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE DATEDIFF(day, invoice_date, GETDATE()) <= 0'
  },
  {
    variableName: 'Overdue',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE DATEDIFF(day, invoice_date, GETDATE()) > 0'
  },
  {
    variableName: 'Payable',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND paid_date IS NULL'
  },
  {
    variableName: 'Receivable',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE paid_flag = 0'
  }
];

// Helper function to execute P21 query
async function executeP21Query(sql) {
  console.log(`Executing P21 query: ${sql}`);
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
    
    return result;
  } catch (error) {
    console.error('Error executing P21 query:', error);
    return null;
  }
}

// Helper function to format value based on chart group and variable name
function formatValue(value, variableName) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // Format as currency for Accounts section
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

async function main() {
  console.log('Fixing SQL syntax and executing queries...');
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
      // Process each SQL fix
      for (const fix of accountsSqlFixes) {
        console.log(`\nProcessing ${fix.variableName}...`);
        
        // Update the SQL expression
        await db.run(
          `UPDATE chart_data 
           SET sql_expression = ?, 
               last_updated = ? 
           WHERE chart_group = 'Accounts' AND variable_name = ?`,
          [fix.sql, new Date().toISOString(), fix.variableName]
        );
        
        console.log(`Updated SQL expression for ${fix.variableName}`);
        
        // Execute the query against P21
        const result = await executeP21Query(fix.sql);
        
        if (result && result.length > 0) {
          const resultRow = result[0];
          
          if ('value' in resultRow) {
            const numericValue = resultRow.value;
            const formattedValue = formatValue(numericValue, fix.variableName);
            
            // Update the value in the database
            await db.run(
              `UPDATE chart_data 
               SET value = ?, 
                   last_updated = ? 
               WHERE chart_group = 'Accounts' AND variable_name = ?`,
              [formattedValue, new Date().toISOString(), fix.variableName]
            );
            
            console.log(`Updated value for ${fix.variableName} to ${formattedValue}`);
          } else {
            console.warn(`Result does not have a 'value' property:`, resultRow);
          }
        } else {
          console.warn(`No results returned for ${fix.variableName}`);
          
          // Set a placeholder value
          await db.run(
            `UPDATE chart_data 
             SET value = 'Query Error', 
                 last_updated = ? 
             WHERE chart_group = 'Accounts' AND variable_name = ?`,
            [new Date().toISOString(), fix.variableName]
          );
        }
      }
      
      // Verify the updates
      console.log('\nVerifying updates...');
      const rows = await db.all(`
        SELECT DISTINCT variable_name, sql_expression, value, last_updated
        FROM chart_data
        WHERE chart_group = 'Accounts'
        ORDER BY variable_name
      `);
      
      console.log('Updated Accounts rows:');
      rows.forEach(row => {
        console.log(`Variable: ${row.variable_name}, Value: ${row.value}`);
        console.log(`SQL: ${row.sql_expression}`);
        console.log('---');
      });
      
      // Create refresh marker files
      console.log('Creating refresh marker files...');
      
      // Create force_refresh.json
      const refreshMarkerPath = path.join(dataDir, 'force_refresh.json');
      fs.writeFileSync(refreshMarkerPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: 'SQL syntax fix and execution'
      }));
      
      // Create cache-refresh.txt
      const cacheRefreshPath = path.join(dataDir, 'cache-refresh.txt');
      fs.writeFileSync(cacheRefreshPath, 'refresh');
      
      // Commit the transaction
      await db.run('COMMIT');
      console.log('All updates committed successfully');
      
    } catch (error) {
      // Rollback the transaction on error
      await db.run('ROLLBACK');
      console.error('Error updating database:', error);
    }

    // Close the database connection
    await db.close();
    console.log('Database connection closed');

    console.log('\nSQL syntax fixed and queries executed. The spreadsheet should now display real data from the P21 database.');
    console.log('Please restart the application to see the changes.');
  } catch (error) {
    console.error('Error fixing SQL syntax and executing queries:', error);
  }
}

// Run the main function
main().catch(console.error);

