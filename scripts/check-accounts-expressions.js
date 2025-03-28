// Script to check Accounts expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Function to check Accounts expressions
async function checkAccountsExpressions() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Check Accounts Payable Jan (ID: 6)
    const payableJan = await db.get('SELECT * FROM chart_data WHERE id = ?', '6');
    
    if (payableJan) {
      console.log('\nAccounts Payable Jan (ID: 6):');
      console.log(`DataPoint: ${payableJan.DataPoint}`);
      console.log(`Value: ${payableJan.value}`);
      console.log(`SQL Expression: ${payableJan.production_sql_expression}`);
    } else {
      console.log('\nAccounts Payable Jan (ID: 6) not found in the database');
    }
    
    // Close the database connection
    await db.close();
    
  } catch (error) {
    console.error('Error checking Accounts expressions:', error);
  }
}

// Run the function
checkAccountsExpressions();
