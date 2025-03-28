/**
 * VERIFY ACCOUNTS SQL
 * 
 * This script checks the current SQL expressions for Accounts data
 * in the database to verify they've been updated correctly.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Main function
async function verifyAccountsSql() {
  console.log('VERIFY ACCOUNTS SQL');
  console.log('==================');
  console.log(`Database path: ${dbPath}`);
  
  try {
    // Connect to the database
    console.log('\nConnecting to database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Get the Accounts data
    console.log('\nRetrieving Accounts data...');
    const accountsData = await db.all(`
      SELECT 
        id,
        DataPoint,
        chart_group,
        variable_name,
        server_name,
        table_name,
        production_sql_expression,
        value
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsData.length} Accounts data rows`);
    
    // Display the Accounts data
    accountsData.forEach(row => {
      console.log(`\nID: ${row.id}`);
      console.log(`DataPoint: ${row.DataPoint}`);
      console.log(`Variable: ${row.variable_name}`);
      console.log(`Table: ${row.table_name}`);
      console.log(`SQL: ${row.production_sql_expression}`);
      console.log(`Value: ${row.value}`);
    });
    
    // Close the database connection
    await db.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run the main function
verifyAccountsSql();
