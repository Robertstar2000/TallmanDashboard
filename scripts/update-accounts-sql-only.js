// Script to update only the SQL expressions in the database without changing the values
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Define the SQL expressions for each account type and month
const accountSqlExpressions = [
  // Accounts Payable
  { id: '6', name: 'Accounts Payable Jan', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '7', name: 'Accounts Payable Feb', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '8', name: 'Accounts Payable Mar', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '9', name: 'Accounts Payable Apr', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '10', name: 'Accounts Payable May', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '11', name: 'Accounts Payable Jun', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '12', name: 'Accounts Payable Jul', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '13', name: 'Accounts Payable Aug', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '14', name: 'Accounts Payable Sep', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '15', name: 'Accounts Payable Oct', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '16', name: 'Accounts Payable Nov', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '17', name: 'Accounts Payable Dec', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Receivable
  { id: '18', name: 'Accounts Receivable Jan', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '19', name: 'Accounts Receivable Feb', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '20', name: 'Accounts Receivable Mar', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '21', name: 'Accounts Receivable Apr', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '22', name: 'Accounts Receivable May', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '23', name: 'Accounts Receivable Jun', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '24', name: 'Accounts Receivable Jul', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '25', name: 'Accounts Receivable Aug', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '26', name: 'Accounts Receivable Sep', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '27', name: 'Accounts Receivable Oct', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '28', name: 'Accounts Receivable Nov', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '29', name: 'Accounts Receivable Dec', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Overdue
  { id: '30', name: 'Accounts Overdue Jan', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 1" },
  { id: '31', name: 'Accounts Overdue Feb', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 2" },
  { id: '32', name: 'Accounts Overdue Mar', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 3" },
  { id: '33', name: 'Accounts Overdue Apr', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 4" },
  { id: '34', name: 'Accounts Overdue May', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 5" },
  { id: '35', name: 'Accounts Overdue Jun', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 6" },
  { id: '36', name: 'Accounts Overdue Jul', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 7" },
  { id: '37', name: 'Accounts Overdue Aug', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 8" },
  { id: '38', name: 'Accounts Overdue Sep', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 9" },
  { id: '39', name: 'Accounts Overdue Oct', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 10" },
  { id: '40', name: 'Accounts Overdue Nov', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 11" },
  { id: '41', name: 'Accounts Overdue Dec', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 12" }
];

// Function to update only the SQL expressions in the database
async function updateSqlExpressionsOnly() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each account's SQL expression
    for (const account of accountSqlExpressions) {
      // First, check the current values
      const current = await db.get('SELECT * FROM chart_data WHERE id = ?', account.id);
      
      if (current) {
        console.log(`\nCurrent values for ID ${account.id} (${account.name}):`);
        console.log(`Value: ${current.value}`);
        console.log(`SQL Expression: ${current.production_sql_expression}`);
        
        // Update only the SQL expression, preserving the value
        await db.run(`
          UPDATE chart_data 
          SET production_sql_expression = ?
          WHERE id = ?
        `, [account.sql, account.id]);
        
        console.log(`Updated SQL expression for ID ${account.id} (${account.name})`);
      } else {
        console.log(`ID ${account.id} (${account.name}) not found in the database`);
      }
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Verify the updates
    console.log('\nVerifying updates...');
    
    const payableJan = await db.get('SELECT * FROM chart_data WHERE id = ?', '6');
    
    if (payableJan) {
      console.log('\nUpdated Accounts Payable Jan (ID: 6):');
      console.log(`Value: ${payableJan.value}`);
      console.log(`SQL Expression: ${payableJan.production_sql_expression}`);
    }
    
    // Close the database connection
    await db.close();
    
    console.log('\nSQL expressions update completed successfully');
    console.log('Please restart the application to see the changes');
  } catch (error) {
    console.error('Error updating SQL expressions:', error);
  }
}

// Run the function
updateSqlExpressionsOnly();
