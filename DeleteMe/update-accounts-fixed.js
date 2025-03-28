const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Accounts SQL expressions in the SQLite database with corrected schema
 */
async function updateAccountsQueries() {
  console.log('=== Updating Accounts SQL Queries in Database ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
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
      SELECT id, chart_group, variable_name, server_name
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Update SQL expressions for each row
    console.log('\n--- Updating SQL expressions ---');
    
    let updateCount = 0;
    
    for (const row of accountsRows) {
      const variableName = row.variable_name.split(' ')[0]; // Get the base variable name (Payable, Receivable, Overdue)
      
      // Determine the SQL expression based on variable name
      let sqlExpression, tableName;
      
      if (variableName === 'Payable') {
        // For Payable, we'll use the ap_hdr table to get accounts payable data
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM ap_hdr WHERE paid_flag = 'N'`;
        tableName = 'ap_hdr';
      } else if (variableName === 'Receivable') {
        // For Receivable, we'll use the ar_hdr table to get accounts receivable data
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM ar_hdr WHERE paid_flag = 'N'`;
        tableName = 'ar_hdr';
      } else if (variableName === 'Overdue') {
        // For Overdue, we'll use the ar_hdr table with a due date condition
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM ar_hdr WHERE paid_flag = 'N' AND due_date < GETDATE()`;
        tableName = 'ar_hdr';
      }
      
      if (sqlExpression) {
        // Update the database
        await db.run(`
          UPDATE chart_data
          SET sql_expression = ?, production_sql_expression = ?, db_table_name = ?
          WHERE id = ?
        `, [sqlExpression, sqlExpression, tableName, row.id]);
        
        console.log(`✅ Updated row ${row.id} - ${row.variable_name}`);
        updateCount++;
      } else {
        console.log(`⚠️ Skipped row ${row.id} - ${row.variable_name} (unknown variable type)`);
      }
    }
    
    console.log(`\nSuccessfully updated ${updateCount} rows in the database`);
    
    // Close the SQLite connection
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== Accounts SQL Queries Update Completed ===');
}

// Run the update function
updateAccountsQueries()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
