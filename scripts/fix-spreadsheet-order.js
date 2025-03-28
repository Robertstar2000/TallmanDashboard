/**
 * FIX SPREADSHEET ORDER
 * 
 * This script repairs the spreadsheet order and ensures that
 * the accounts data is properly updated without corrupting the structure.
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to create a cache-busting file
const cacheBustPath = path.join(process.cwd(), 'data', 'cache-bust.txt');

// Define the working SQL expressions for Accounts data
const accountsPayableSql = (month) => `SELECT SUM(open_balance) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE())`;
const accountsReceivableSql = (month) => `SELECT SUM(open_balance) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE())`;
const accountsOverdueSql = (month) => `SELECT SUM(open_balance) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, due_date, GETDATE()) > 30`;

// Main function
async function fixSpreadsheetOrder() {
  console.log('FIX SPREADSHEET ORDER');
  console.log('====================');
  console.log(`Database path: ${dbPath}`);
  
  try {
    // Step 1: Connect to the database
    console.log('\nStep 1: Connecting to database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Step 2: Begin transaction
    console.log('\nStep 2: Beginning transaction...');
    await db.run('BEGIN TRANSACTION');
    
    // Step 3: Get the original order of the rows
    console.log('\nStep 3: Retrieving original row order...');
    const originalRows = await db.all(`
      SELECT 
        id,
        DataPoint,
        chart_group,
        chart_name,
        variable_name,
        server_name,
        table_name,
        calculation,
        production_sql_expression,
        value,
        last_updated
      FROM chart_data
      ORDER BY id
    `);
    console.log(`Retrieved ${originalRows.length} rows from database in original order`);
    
    // Step 4: Update the SQL expressions for Accounts data
    console.log('\nStep 4: Updating SQL expressions for Accounts data...');
    
    // Define the accounts data to update
    const accountsData = [
      // Accounts Payable
      { id: '6', name: 'Accounts Payable Jan', month: 1, type: 'Payable' },
      { id: '7', name: 'Accounts Payable Feb', month: 2, type: 'Payable' },
      { id: '8', name: 'Accounts Payable Mar', month: 3, type: 'Payable' },
      { id: '9', name: 'Accounts Payable Apr', month: 4, type: 'Payable' },
      { id: '10', name: 'Accounts Payable May', month: 5, type: 'Payable' },
      { id: '11', name: 'Accounts Payable Jun', month: 6, type: 'Payable' },
      { id: '12', name: 'Accounts Payable Jul', month: 7, type: 'Payable' },
      { id: '13', name: 'Accounts Payable Aug', month: 8, type: 'Payable' },
      { id: '14', name: 'Accounts Payable Sep', month: 9, type: 'Payable' },
      { id: '15', name: 'Accounts Payable Oct', month: 10, type: 'Payable' },
      { id: '16', name: 'Accounts Payable Nov', month: 11, type: 'Payable' },
      { id: '17', name: 'Accounts Payable Dec', month: 12, type: 'Payable' },
      
      // Accounts Receivable
      { id: '18', name: 'Accounts Receivable Jan', month: 1, type: 'Receivable' },
      { id: '19', name: 'Accounts Receivable Feb', month: 2, type: 'Receivable' },
      { id: '20', name: 'Accounts Receivable Mar', month: 3, type: 'Receivable' },
      { id: '21', name: 'Accounts Receivable Apr', month: 4, type: 'Receivable' },
      { id: '22', name: 'Accounts Receivable May', month: 5, type: 'Receivable' },
      { id: '23', name: 'Accounts Receivable Jun', month: 6, type: 'Receivable' },
      { id: '24', name: 'Accounts Receivable Jul', month: 7, type: 'Receivable' },
      { id: '25', name: 'Accounts Receivable Aug', month: 8, type: 'Receivable' },
      { id: '26', name: 'Accounts Receivable Sep', month: 9, type: 'Receivable' },
      { id: '27', name: 'Accounts Receivable Oct', month: 10, type: 'Receivable' },
      { id: '28', name: 'Accounts Receivable Nov', month: 11, type: 'Receivable' },
      { id: '29', name: 'Accounts Receivable Dec', month: 12, type: 'Receivable' },
      
      // Accounts Overdue
      { id: '30', name: 'Accounts Overdue Jan', month: 1, type: 'Overdue' },
      { id: '31', name: 'Accounts Overdue Feb', month: 2, type: 'Overdue' },
      { id: '32', name: 'Accounts Overdue Mar', month: 3, type: 'Overdue' },
      { id: '33', name: 'Accounts Overdue Apr', month: 4, type: 'Overdue' },
      { id: '34', name: 'Accounts Overdue May', month: 5, type: 'Overdue' },
      { id: '35', name: 'Accounts Overdue Jun', month: 6, type: 'Overdue' },
      { id: '36', name: 'Accounts Overdue Jul', month: 7, type: 'Overdue' },
      { id: '37', name: 'Accounts Overdue Aug', month: 8, type: 'Overdue' },
      { id: '38', name: 'Accounts Overdue Sep', month: 9, type: 'Overdue' },
      { id: '39', name: 'Accounts Overdue Oct', month: 10, type: 'Overdue' },
      { id: '40', name: 'Accounts Overdue Nov', month: 11, type: 'Overdue' },
      { id: '41', name: 'Accounts Overdue Dec', month: 12, type: 'Overdue' }
    ];
    
    // Update each Accounts data item with the working SQL expression
    let updatedCount = 0;
    
    for (const item of accountsData) {
      console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
      
      let sqlExpression;
      let tableName;
      
      // Determine which SQL expression to use based on the type
      if (item.type === 'Payable') {
        sqlExpression = accountsPayableSql(item.month);
        tableName = 'dbo.ap_hdr';
      } else if (item.type === 'Receivable') {
        sqlExpression = accountsReceivableSql(item.month);
        tableName = 'dbo.ar_hdr';
      } else if (item.type === 'Overdue') {
        sqlExpression = accountsOverdueSql(item.month);
        tableName = 'dbo.ar_hdr';
      } else {
        console.log(`Skipping item ${item.id} (${item.name}) - unknown type`);
        continue;
      }
      
      // Update the database with the working SQL expression
      await db.run(`
        UPDATE chart_data
        SET 
          table_name = ?,
          production_sql_expression = ?,
          last_updated = ?
        WHERE id = ?
      `, [
        tableName,
        sqlExpression,
        new Date().toISOString(),
        item.id
      ]);
      
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} Accounts SQL expressions in the database with working expressions`);
    
    // Step 5: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 5: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, new Date().toISOString());
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 6: Commit the transaction
    console.log('\nStep 6: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 7: Close the database connection
    console.log('\nStep 7: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    console.log('\nFix spreadsheet order completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the Next.js server with "npm run dev"');
    console.log('2. Open the dashboard to verify the data is displayed correctly');
    console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during fix spreadsheet order:', error);
    
    // Try to rollback the transaction if an error occurred
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      await db.run('ROLLBACK');
      await db.close();
      console.log('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  }
}

// Run the main function
fixSpreadsheetOrder();
