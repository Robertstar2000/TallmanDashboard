const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Historical Data SQL expressions in the SQLite database with working queries
 */
async function updateHistoricalDataQueries() {
  console.log('=== Updating Historical Data SQL Queries in Database ===');
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
    
    // Get the Historical Data rows from the SQLite database
    const historicalDataRows = await db.all(`
      SELECT id, chart_group, variable_name, server_name
      FROM chart_data
      WHERE chart_group = 'Historical Data'
      ORDER BY id
    `);
    
    console.log(`\nFound ${historicalDataRows.length} Historical Data rows in SQLite database`);
    
    // Update SQL expressions for each row
    console.log('\n--- Updating SQL expressions ---');
    
    let updateCount = 0;
    
    for (const row of historicalDataRows) {
      const variableName = row.variable_name.split(' ')[0]; // Get the base variable name (P21, POR, Total)
      let sqlExpression, tableName;
      
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
      
      if (variableName === 'P21') {
        // For P21, use invoice_hdr to get total invoice amounts for the month
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(DATEADD(month, -${monthOffset}, GETDATE())) 
                         AND YEAR(invoice_date) = YEAR(DATEADD(month, -${monthOffset}, GETDATE()))`;
      } else if (variableName === 'POR') {
        // For POR, since we don't have POR tables, use a placeholder that returns 0
        tableName = '';
        sqlExpression = `SELECT 0 as value`;
      } else if (variableName === 'Total') {
        // For Total, use the same query as P21 since we don't have POR data
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(DATEADD(month, -${monthOffset}, GETDATE())) 
                         AND YEAR(invoice_date) = YEAR(DATEADD(month, -${monthOffset}, GETDATE()))`;
      }
      
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
  
  console.log('\n=== Historical Data SQL Queries Update Completed ===');
}

// Run the update function
updateHistoricalDataQueries()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
