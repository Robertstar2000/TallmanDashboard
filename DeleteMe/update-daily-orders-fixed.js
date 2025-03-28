const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Daily Orders SQL expressions in the SQLite database with working queries
 */
async function updateDailyOrdersQueries() {
  console.log('=== Updating Daily Orders SQL Queries in Database ===');
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
    
    // Get the Daily Orders rows from the SQLite database
    const dailyOrdersRows = await db.all(`
      SELECT id, chart_group, variable_name, server_name
      FROM chart_data
      WHERE chart_group = 'Daily Orders'
      ORDER BY id
    `);
    
    console.log(`\nFound ${dailyOrdersRows.length} Daily Orders rows in SQLite database`);
    
    // Update SQL expressions for each row
    console.log('\n--- Updating SQL expressions ---');
    
    let updateCount = 0;
    
    for (const row of dailyOrdersRows) {
      // Extract day offset from variable name if possible
      let dayOffset = 0;
      
      if (row.variable_name.includes('Today')) {
        dayOffset = 0;
      } else if (row.variable_name.includes('Yesterday')) {
        dayOffset = 1;
      } else if (row.variable_name.includes('-2')) {
        dayOffset = 2;
      } else if (row.variable_name.includes('-3')) {
        dayOffset = 3;
      } else if (row.variable_name.includes('-4')) {
        dayOffset = 4;
      } else if (row.variable_name.includes('-5')) {
        dayOffset = 5;
      } else if (row.variable_name.includes('-6')) {
        dayOffset = 6;
      }
      
      // Create SQL expression for counting invoices on a specific day (using invoice_hdr since order_hdr doesn't exist)
      const sqlExpression = `SELECT COUNT(*) as value FROM invoice_hdr WHERE CONVERT(date, invoice_date) = CONVERT(date, DATEADD(day, -${dayOffset}, GETDATE()))`;
      const tableName = 'invoice_hdr';
      
      // Update the database
      await db.run(`
        UPDATE chart_data
        SET sql_expression = ?, production_sql_expression = ?, db_table_name = ?
        WHERE id = ?
      `, [sqlExpression, sqlExpression, tableName, row.id]);
      
      console.log(`✅ Updated row ${row.id} - ${row.variable_name}`);
      updateCount++;
    }
    
    console.log(`\nSuccessfully updated ${updateCount} rows in the database`);
    
    // Close the SQLite connection
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== Daily Orders SQL Queries Update Completed ===');
}

// Run the update function
updateDailyOrdersQueries()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
