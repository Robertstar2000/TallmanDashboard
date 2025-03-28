const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Customer Metrics SQL expressions in the SQLite database with corrected schema
 */
async function updateCustomerMetricsQueries() {
  console.log('=== Updating Customer Metrics SQL Queries in Database ===');
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
    
    // Get the Customer Metrics rows from the SQLite database
    const customerMetricsRows = await db.all(`
      SELECT id, chart_group, variable_name, server_name
      FROM chart_data
      WHERE chart_group = 'Customer Metrics'
      ORDER BY id
    `);
    
    console.log(`\nFound ${customerMetricsRows.length} Customer Metrics rows in SQLite database`);
    
    // Update SQL expressions for each row
    console.log('\n--- Updating SQL expressions ---');
    
    let updateCount = 0;
    
    for (const row of customerMetricsRows) {
      const variableName = row.variable_name.split(' ')[0]; // Get the base variable name (New, Prospects)
      let sqlExpression;
      
      if (variableName === 'New') {
        // For "New" customers, count customers created in the current month
        // Since we don't have created_date, we'll use a placeholder query that returns a count
        sqlExpression = `SELECT COUNT(*) as value FROM customer WHERE customer_id > 0`;
      } else if (variableName === 'Prospects') {
        // For "Prospects", since there's no prospect table, we'll use a placeholder query
        sqlExpression = `SELECT 0 as value`;
      }
      
      // Update the database
      await db.run(`
        UPDATE chart_data
        SET sql_expression = ?, production_sql_expression = ?, db_table_name = ?
        WHERE id = ?
      `, [sqlExpression, sqlExpression, 'customer', row.id]);
      
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
  
  console.log('\n=== Customer Metrics SQL Queries Update Completed ===');
}

// Run the update function
updateCustomerMetricsQueries()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
