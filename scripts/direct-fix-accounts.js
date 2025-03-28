// Script to directly fix Accounts expressions in the database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Define the values and SQL expressions for each account type and month
const accountData = [
  // Accounts Payable
  { id: '6', name: 'Accounts Payable Jan', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '7', name: 'Accounts Payable Feb', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '8', name: 'Accounts Payable Mar', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '9', name: 'Accounts Payable Apr', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '10', name: 'Accounts Payable May', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '11', name: 'Accounts Payable Jun', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '12', name: 'Accounts Payable Jul', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '13', name: 'Accounts Payable Aug', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '14', name: 'Accounts Payable Sep', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '15', name: 'Accounts Payable Oct', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '16', name: 'Accounts Payable Nov', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '17', name: 'Accounts Payable Dec', value: '639000', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Receivable
  { id: '18', name: 'Accounts Receivable Jan', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '19', name: 'Accounts Receivable Feb', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '20', name: 'Accounts Receivable Mar', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '21', name: 'Accounts Receivable Apr', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '22', name: 'Accounts Receivable May', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '23', name: 'Accounts Receivable Jun', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '24', name: 'Accounts Receivable Jul', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '25', name: 'Accounts Receivable Aug', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '26', name: 'Accounts Receivable Sep', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '27', name: 'Accounts Receivable Oct', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '28', name: 'Accounts Receivable Nov', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '29', name: 'Accounts Receivable Dec', value: '5791860', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Overdue
  { id: '30', name: 'Accounts Overdue Jan', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 1" },
  { id: '31', name: 'Accounts Overdue Feb', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 2" },
  { id: '32', name: 'Accounts Overdue Mar', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 3" },
  { id: '33', name: 'Accounts Overdue Apr', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 4" },
  { id: '34', name: 'Accounts Overdue May', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 5" },
  { id: '35', name: 'Accounts Overdue Jun', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 6" },
  { id: '36', name: 'Accounts Overdue Jul', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 7" },
  { id: '37', name: 'Accounts Overdue Aug', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 8" },
  { id: '38', name: 'Accounts Overdue Sep', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 9" },
  { id: '39', name: 'Accounts Overdue Oct', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 10" },
  { id: '40', name: 'Accounts Overdue Nov', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 11" },
  { id: '41', name: 'Accounts Overdue Dec', value: '638892.6', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 12" }
];

// Function to update the database
async function updateDatabase() {
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each account
    for (const account of accountData) {
      // First, check the current values
      const current = await db.get('SELECT * FROM chart_data WHERE id = ?', account.id);
      
      if (current) {
        console.log(`\nCurrent values for ID ${account.id} (${account.name}):`);
        console.log(`Value: ${current.value}`);
        console.log(`SQL Expression: ${current.production_sql_expression}`);
        
        // Update the values
        await db.run(`
          UPDATE chart_data 
          SET value = ?, 
              production_sql_expression = ?
          WHERE id = ?
        `, [account.value, account.sql, account.id]);
        
        console.log(`Updated ID ${account.id} (${account.name})`);
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
    
    console.log('\nDatabase update completed successfully');
    console.log('Please click the "Load DB" button in the admin panel to see the changes');
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

// Run the function
updateDatabase();
