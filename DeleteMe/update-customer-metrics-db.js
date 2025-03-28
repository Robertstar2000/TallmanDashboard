const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to update the Customer Metrics SQL expressions in the SQLite database
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
      const tableName = variableName === 'New' ? 'customer' : 'prospect';
      
      // Extract month from variable name if it exists
      let monthOffset = 0;
      if (row.variable_name.includes('(')) {
        const monthName = row.variable_name.match(/\((.*?)\)/)[1];
        const monthMap = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
          'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        const currentMonth = new Date().getMonth();
        const targetMonth = monthMap[monthName];
        
        if (targetMonth !== undefined) {
          // Calculate how many months back we need to go
          monthOffset = (currentMonth - targetMonth + 12) % 12;
        }
      }
      
      // Create the SQL expression
      const sqlExpression = monthOffset === 0 
        ? `SELECT COUNT(*) as value FROM dbo.${tableName} WHERE status = 'A' AND MONTH(created_date) = MONTH(GETDATE()) AND YEAR(created_date) = YEAR(GETDATE())`
        : `SELECT COUNT(*) as value FROM dbo.${tableName} WHERE status = 'A' AND MONTH(created_date) = MONTH(DATEADD(month, -${monthOffset}, GETDATE())) AND YEAR(created_date) = YEAR(DATEADD(month, -${monthOffset}, GETDATE()))`;
      
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
