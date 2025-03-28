const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the Key Metrics SQL expressions in the SQLite database with working queries
 */
async function updateKeyMetricsQueries() {
  console.log('=== Updating Key Metrics SQL Queries in Database ===');
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
    
    // Get the Key Metrics rows from the SQLite database
    const keyMetricsRows = await db.all(`
      SELECT id, chart_group, variable_name, server_name
      FROM chart_data
      WHERE chart_group = 'Key Metrics'
      ORDER BY id
    `);
    
    console.log(`\nFound ${keyMetricsRows.length} Key Metrics rows in SQLite database`);
    
    // Update SQL expressions for each row
    console.log('\n--- Updating SQL expressions ---');
    
    let updateCount = 0;
    
    for (const row of keyMetricsRows) {
      const variableName = row.variable_name;
      let sqlExpression, tableName;
      
      // Create SQL expressions based on the variable name
      if (variableName.includes('Total Orders')) {
        // Total Orders: Count of invoices in the current month
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COUNT(*) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                         AND YEAR(invoice_date) = YEAR(GETDATE())`;
      } else if (variableName.includes('Total Sales')) {
        // Total Sales: Sum of invoice amounts in the current month
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                         AND YEAR(invoice_date) = YEAR(GETDATE())`;
      } else if (variableName.includes('Average Order')) {
        // Average Order: Average invoice amount in the current month
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COALESCE(AVG(invoice_amt), 0) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                         AND YEAR(invoice_date) = YEAR(GETDATE())`;
      } else if (variableName.includes('Active Customers')) {
        // Active Customers: Count of distinct customers with invoices in the current month
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COUNT(DISTINCT customer_id) as value FROM invoice_hdr 
                         WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                         AND YEAR(invoice_date) = YEAR(GETDATE())`;
      } else if (variableName.includes('New Customers')) {
        // New Customers: Count of customers
        tableName = 'customer';
        sqlExpression = `SELECT COUNT(*) as value FROM customer WHERE customer_id > 0`;
      } else if (variableName.includes('Total Items')) {
        // Total Items: Count of distinct items in invoice lines
        tableName = 'invoice_line';
        sqlExpression = `SELECT COUNT(DISTINCT item_id) as value FROM invoice_line`;
      } else if (variableName.includes('Total Inventory')) {
        // Total Inventory: Sum of quantities shipped in the current month
        tableName = 'invoice_line';
        sqlExpression = `SELECT COALESCE(SUM(qty_shipped), 0) as value FROM invoice_line 
                         WHERE invoice_no IN (
                           SELECT invoice_no FROM invoice_hdr 
                           WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                           AND YEAR(invoice_date) = YEAR(GETDATE())
                         )`;
      } else {
        // Default case if none of the above match
        tableName = 'invoice_hdr';
        sqlExpression = `SELECT COUNT(*) as value FROM invoice_hdr`;
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
  
  console.log('\n=== Key Metrics SQL Queries Update Completed ===');
}

// Run the update function
updateKeyMetricsQueries()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
