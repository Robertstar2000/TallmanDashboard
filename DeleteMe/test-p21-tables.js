const odbc = require('odbc');

/**
 * Script to test various P21 tables to find ones that return data
 */
async function testP21Tables() {
  console.log('=== Testing P21 Tables for Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the P21 database
    console.log('\n--- Connecting to P21 database ---');
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21 database');
    
    // List of tables to test
    const tablesToTest = [
      'customer',
      'order_hdr',
      'order_line',
      'invoice_hdr',
      'invoice_line',
      'ap_hdr',
      'ar_hdr',
      'inventory',
      'item_entity',
      'item_warehouse',
      'salesperson'
    ];
    
    // Test each table
    console.log('\n--- Testing tables for data ---');
    
    for (const table of tablesToTest) {
      try {
        console.log(`\nTesting table: ${table}`);
        
        // Test if table exists
        const tableExistsQuery = `
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${table}'
        `;
        
        const tableExistsResult = await connection.query(tableExistsQuery);
        
        if (tableExistsResult[0].count === 0) {
          console.log(`❌ Table '${table}' does not exist`);
          continue;
        }
        
        // Count rows in the table
        const countQuery = `SELECT COUNT(*) as count FROM ${table}`;
        const countResult = await connection.query(countQuery);
        
        console.log(`Total rows: ${countResult[0].count}`);
        
        if (countResult[0].count > 0) {
          // Get a sample row
          const sampleQuery = `SELECT TOP 1 * FROM ${table}`;
          const sampleResult = await connection.query(sampleQuery);
          
          console.log('Sample row columns:');
          const columns = Object.keys(sampleResult[0]);
          for (let i = 0; i < Math.min(columns.length, 10); i++) {
            const column = columns[i];
            console.log(`  - ${column}: ${sampleResult[0][column]}`);
          }
          
          if (columns.length > 10) {
            console.log(`  ... and ${columns.length - 10} more columns`);
          }
          
          // Try some specific queries based on the table
          if (table === 'customer') {
            // Test a query that might be useful for Customer Metrics
            const activeCustomersQuery = `SELECT COUNT(*) as count FROM customer WHERE customer_id > 0`;
            const activeCustomersResult = await connection.query(activeCustomersQuery);
            console.log(`Active customers: ${activeCustomersResult[0].count}`);
          } else if (table === 'order_hdr') {
            // Test a query that might be useful for Daily Orders
            const recentOrdersQuery = `SELECT COUNT(*) as count FROM order_hdr WHERE order_date >= DATEADD(day, -7, GETDATE())`;
            const recentOrdersResult = await connection.query(recentOrdersQuery);
            console.log(`Orders in the last 7 days: ${recentOrdersResult[0].count}`);
          } else if (table === 'ap_hdr') {
            // Test a query that might be useful for Accounts Payable
            const openPayablesQuery = `SELECT COUNT(*) as count, SUM(invoice_amt) as total FROM ap_hdr WHERE paid_flag = 'N'`;
            const openPayablesResult = await connection.query(openPayablesQuery);
            console.log(`Open payables: ${openPayablesResult[0].count} invoices, total: ${openPayablesResult[0].total}`);
          } else if (table === 'ar_hdr') {
            // Test a query that might be useful for Accounts Receivable
            const openReceivablesQuery = `SELECT COUNT(*) as count, SUM(invoice_amt) as total FROM ar_hdr WHERE paid_flag = 'N'`;
            const openReceivablesResult = await connection.query(openReceivablesQuery);
            console.log(`Open receivables: ${openReceivablesResult[0].count} invoices, total: ${openReceivablesResult[0].total}`);
          } else if (table === 'inventory' || table === 'item_entity' || table === 'item_warehouse') {
            // Test a query that might be useful for Inventory
            const inventoryQuery = `SELECT COUNT(*) as count FROM ${table} WHERE qty_on_hand > 0`;
            const inventoryResult = await connection.query(inventoryQuery);
            console.log(`Items with stock: ${inventoryResult[0].count}`);
          }
        } else {
          console.log('⚠️ Table exists but contains no data');
        }
      } catch (error) {
        console.error(`❌ Error testing table '${table}':`, error.message);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== P21 Tables Testing Completed ===');
}

// Run the test function
testP21Tables()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
