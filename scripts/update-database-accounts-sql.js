/**
 * Script to update the Accounts SQL expressions directly in the database
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

async function updateAccountsSqlExpressions() {
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
      // Get all Accounts data from the database
      const accountsData = await db.all(`
        SELECT 
          id,
          DataPoint,
          chart_group,
          variable_name,
          server_name,
          table_name,
          calculation,
          production_sql_expression,
          value,
          last_updated
        FROM chart_data
        WHERE chart_group = 'Accounts'
        ORDER BY id
      `);
      
      console.log(`Found ${accountsData.length} Accounts data items in the database`);
      
      // Update each Accounts data item with the correct SQL expression
      let updatedCount = 0;
      
      for (const item of accountsData) {
        // Extract month from DataPoint (e.g., "Accounts Payable Jan" -> "Jan")
        const monthName = item.DataPoint.split(' ').pop();
        const monthNumber = monthMap[monthName];
        
        if (!monthNumber) {
          console.log(`Skipping item ${item.id} (${item.DataPoint}) - invalid month: ${monthName}`);
          continue;
        }
        
        console.log(`Processing item ${item.id} (${item.DataPoint}) - month: ${monthName} (${monthNumber})`);
        
        let newSqlExpression;
        let newTableName;
        
        // Determine which SQL expression to use based on the DataPoint
        if (item.DataPoint.includes('Payable')) {
          newSqlExpression = accountsPayableSql(monthNumber);
          newTableName = 'dbo.ap_open_items';
        } else if (item.DataPoint.includes('Receivable')) {
          newSqlExpression = accountsReceivableSql(monthNumber);
          newTableName = 'dbo.ar_open_items';
        } else if (item.DataPoint.includes('Overdue')) {
          newSqlExpression = accountsOverdueSql(monthNumber);
          newTableName = 'dbo.ar_open_items';
        } else {
          console.log(`Skipping item ${item.id} (${item.DataPoint}) - unknown type`);
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
          newTableName,
          newSqlExpression,
          new Date().toISOString(),
          item.id
        ]);
        
        updatedCount++;
      }
      
      console.log(`Updated ${updatedCount} Accounts SQL expressions in the database`);
      
      // Commit all changes
      await db.run('COMMIT');
      console.log('Successfully committed all changes to database');
      
      // Verify the updates
      console.log('\nVerifying updates...');
      
      // Check Accounts Payable Feb specifically (as mentioned by the user)
      const accountsPayableFeb = await db.get('SELECT * FROM chart_data WHERE DataPoint = ?', 'Accounts Payable Feb');
      if (accountsPayableFeb) {
        console.log('\nAccounts Payable Feb:');
        console.log(`ID: ${accountsPayableFeb.id}`);
        console.log(`Table Name: ${accountsPayableFeb.table_name}`);
        console.log(`SQL Expression: ${accountsPayableFeb.production_sql_expression}`);
        
        if (accountsPayableFeb.production_sql_expression === accountsPayableSql(2)) {
          console.log('✅ SQL expression updated successfully');
        } else {
          console.log('❌ SQL expression not updated correctly');
        }
      } else {
        console.log('Accounts Payable Feb not found in the database');
      }
      
      // Close the database connection
      await db.close();
      
      console.log('\nDatabase update completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      console.error('Error during database update, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

// Run the function
updateAccountsSqlExpressions();
