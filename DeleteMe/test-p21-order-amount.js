const odbc = require('odbc');

async function findOrderAmountSolution() {
  console.log('=== Finding Alternative for Order Amount Query ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // 1. Check for related tables that might have order amount information
    console.log('\n--- Checking for related order tables ---');
    const relatedTables = [
      'oe_hdr', 'oe_line', 'oe_dtl', 'order_hdr', 'order_line', 'invoice_hdr', 'invoice_line'
    ];
    
    for (const tableName of relatedTables) {
      try {
        const tableCheck = await connection.query(`
          SELECT CASE 
            WHEN OBJECT_ID('${tableName}') IS NOT NULL THEN 'exists' 
            ELSE 'not found' 
          END as table_status
        `);
        console.log(`   - Table ${tableName}: ${tableCheck[0].table_status}`);
        
        if (tableCheck[0].table_status === 'exists') {
          // Check for amount-related columns
          try {
            const columnCheck = await connection.query(`
              SELECT COLUMN_NAME, DATA_TYPE 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = '${tableName}'
              AND (COLUMN_NAME LIKE '%amt%' OR COLUMN_NAME LIKE '%amount%' OR COLUMN_NAME LIKE '%total%' OR COLUMN_NAME LIKE '%price%')
            `);
            
            if (columnCheck.length > 0) {
              console.log(`     Found potential amount columns in ${tableName}:`);
              columnCheck.forEach(col => console.log(`       - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`));
            } else {
              console.log(`     No amount-related columns found in ${tableName}`);
            }
          } catch (colError) {
            console.error(`     Error checking columns: ${colError.message}`);
          }
        }
      } catch (tableError) {
        console.error(`   - Error checking table ${tableName}: ${tableError.message}`);
      }
    }
    
    // 2. Check for relationships between oe_hdr and other tables
    console.log('\n--- Checking for relationships with oe_hdr ---');
    try {
      const keyColumns = await connection.query(`
        SELECT 
          COL.COLUMN_NAME
        FROM 
          INFORMATION_SCHEMA.COLUMNS COL
        WHERE 
          COL.TABLE_NAME = 'oe_hdr' 
          AND (COL.COLUMN_NAME LIKE '%id%' OR COL.COLUMN_NAME LIKE '%no%' OR COL.COLUMN_NAME LIKE '%key%' OR COL.COLUMN_NAME LIKE '%uid%')
        ORDER BY COL.COLUMN_NAME
      `);
      
      console.log('   Potential key columns in oe_hdr:');
      keyColumns.forEach(col => console.log(`     - ${col.COLUMN_NAME}`));
    } catch (error) {
      console.error('   Error finding key columns:', error.message);
    }
    
    // 3. Test some alternative queries
    console.log('\n--- Testing alternative queries for daily order amounts ---');
    
    // Try oe_line table if it exists
    console.log('\n   Testing oe_line table:');
    try {
      const oeLine = await connection.query(`
        SELECT TOP 1 * FROM oe_line
      `);
      console.log('   ✅ oe_line table exists');
      
      // Try to join oe_hdr and oe_line
      try {
        const joinQuery = await connection.query(`
          SELECT TOP 5 h.order_no, h.order_date, l.* 
          FROM oe_hdr h
          JOIN oe_line l ON h.order_no = l.order_no
          WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
        `);
        console.log('   ✅ Successfully joined oe_hdr and oe_line');
        console.log('   Sample result:', joinQuery.length > 0 ? 'Data found' : 'No data for today');
        
        // Look for amount columns in the result
        if (joinQuery.length > 0) {
          const sampleRow = joinQuery[0];
          const amountColumns = Object.keys(sampleRow).filter(key => 
            key.includes('amt') || key.includes('price') || key.includes('total') || key.includes('cost')
          );
          console.log('   Potential amount columns in joined result:', amountColumns);
        }
      } catch (joinError) {
        console.error('   ❌ Join error:', joinError.message);
      }
      
      // Try to get sum of extended_price from oe_line for today's orders
      try {
        const sumQuery = await connection.query(`
          SELECT ISNULL(SUM(l.extended_price), 0) as daily_total
          FROM oe_hdr h
          JOIN oe_line l ON h.order_no = l.order_no
          WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
        `);
        console.log('   ✅ Sum query result:', sumQuery[0].daily_total);
      } catch (sumError) {
        console.error('   ❌ Sum query error:', sumError.message);
        
        // Try alternative column names
        try {
          const altSumQuery = await connection.query(`
            SELECT ISNULL(SUM(l.price), 0) as daily_total
            FROM oe_hdr h
            JOIN oe_line l ON h.order_no = l.order_no
            WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
          `);
          console.log('   ✅ Alternative sum query result:', altSumQuery[0].daily_total);
        } catch (altSumError) {
          console.error('   ❌ Alternative sum query error:', altSumError.message);
        }
      }
    } catch (oeLineError) {
      console.error('   ❌ oe_line table error:', oeLineError.message);
    }
    
    // Try invoice_hdr table if it exists
    console.log('\n   Testing invoice_hdr table:');
    try {
      const invoiceHdr = await connection.query(`
        SELECT TOP 1 * FROM invoice_hdr
      `);
      console.log('   ✅ invoice_hdr table exists');
      
      // Check for amount columns
      const invoiceColumns = Object.keys(invoiceHdr[0]).filter(key => 
        key.includes('amt') || key.includes('price') || key.includes('total') || key.includes('cost')
      );
      console.log('   Potential amount columns in invoice_hdr:', invoiceColumns);
      
      // Try to get sum of invoice amounts for today
      try {
        const invoiceSumQuery = await connection.query(`
          SELECT ISNULL(SUM(invoice_amt), 0) as daily_total
          FROM invoice_hdr
          WHERE CONVERT(date, invoice_date) = CONVERT(date, GETDATE())
        `);
        console.log('   ✅ Invoice sum query result:', invoiceSumQuery[0].daily_total);
      } catch (invoiceSumError) {
        console.error('   ❌ Invoice sum query error:', invoiceSumError.message);
      }
    } catch (invoiceHdrError) {
      console.error('   ❌ invoice_hdr table error:', invoiceHdrError.message);
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n=== Test completed at', new Date().toISOString(), '===');
}

// Run the test
findOrderAmountSolution()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
