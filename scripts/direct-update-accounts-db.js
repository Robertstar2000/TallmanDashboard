/**
 * Script to directly update the Accounts SQL expressions in the database
 * and verify they are properly stored
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Define the correct SQL expressions for Accounts data
const accountsPayableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsReceivableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsOverdueSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND DATEDIFF(day, due_date, GETDATE()) > 30`;

// Map month names to numbers
const monthMap = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

async function directUpdateAccountsDb() {
  try {
    console.log(`Opening database at: ${dbPath}`);
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
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
      
      // Update each Accounts data item with the correct SQL expression
      let updatedCount = 0;
      
      for (const item of accountsData) {
        console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
        
        let sqlExpression;
        let tableName;
        
        // Determine which SQL expression to use based on the type
        if (item.type === 'Payable') {
          sqlExpression = accountsPayableSql(item.month);
          tableName = 'dbo.ap_open_items';
        } else if (item.type === 'Receivable') {
          sqlExpression = accountsReceivableSql(item.month);
          tableName = 'dbo.ar_open_items';
        } else if (item.type === 'Overdue') {
          sqlExpression = accountsOverdueSql(item.month);
          tableName = 'dbo.ar_open_items';
        } else {
          console.log(`Skipping item ${item.id} (${item.name}) - unknown type`);
          continue;
        }
        
        // Update the database with the new SQL expression
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
      
      console.log(`Updated ${updatedCount} Accounts SQL expressions in the database`);
      
      // Commit all changes
      await db.run('COMMIT');
      console.log('Successfully committed all changes to database');
      
      // Verify the updates in the database
      console.log('\nVerifying database updates...');
      
      // Check Accounts Payable Feb specifically (as mentioned by the user)
      const accountsPayableFeb = await db.get('SELECT * FROM chart_data WHERE id = ?', '7');
      if (accountsPayableFeb) {
        console.log('\nAccounts Payable Feb in database:');
        console.log(`ID: ${accountsPayableFeb.id}`);
        console.log(`Table Name: ${accountsPayableFeb.table_name}`);
        console.log(`SQL Expression: ${accountsPayableFeb.production_sql_expression}`);
        
        if (accountsPayableFeb.production_sql_expression === accountsPayableSql(2)) {
          console.log('✅ SQL expression updated successfully in database');
        } else {
          console.log('❌ SQL expression not updated correctly in database');
          console.log('Expected:', accountsPayableSql(2));
          console.log('Actual:', accountsPayableFeb.production_sql_expression);
        }
      } else {
        console.log('Accounts Payable Feb not found in the database');
      }
      
      // Close the database connection
      await db.close();
      
      console.log('\nDirect update completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      console.error('Error during direct update, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
directUpdateAccountsDb();
