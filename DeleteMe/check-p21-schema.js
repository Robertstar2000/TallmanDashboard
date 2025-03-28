const odbc = require('odbc');

/**
 * Script to check P21 database schema for relevant tables and columns
 */
async function checkP21Schema() {
  console.log('=== Checking P21 Database Schema ===');
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
    
    // Check tables we're interested in
    const tablesToCheck = [
      'customer', 
      'prospect', 
      'ap_open_items', 
      'ar_open_items'
    ];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Checking table: ${tableName} ---`);
      
      try {
        // Check if table exists
        const tableQuery = `
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_NAME = '${tableName}'
        `;
        
        const tableResult = await connection.query(tableQuery);
        
        if (tableResult && tableResult.length > 0) {
          console.log(`✅ Table '${tableName}' exists`);
          
          // Get column information
          const columnQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columnResult = await connection.query(columnQuery);
          
          if (columnResult && columnResult.length > 0) {
            console.log(`Found ${columnResult.length} columns:`);
            
            // Display first 10 columns
            const columnsToShow = Math.min(columnResult.length, 10);
            for (let i = 0; i < columnsToShow; i++) {
              const column = columnResult[i];
              console.log(`  - ${column.COLUMN_NAME} (${column.DATA_TYPE}${column.CHARACTER_MAXIMUM_LENGTH ? `(${column.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
            }
            
            if (columnResult.length > 10) {
              console.log(`  ... and ${columnResult.length - 10} more columns`);
            }
            
            // Check for specific columns we need
            const columnsToFind = [];
            
            if (tableName === 'customer' || tableName === 'prospect') {
              columnsToFind.push('status', 'created_date');
            } else if (tableName === 'ap_open_items' || tableName === 'ar_open_items') {
              columnsToFind.push('status', 'balance', 'due_date');
            }
            
            console.log('\nChecking for required columns:');
            for (const columnName of columnsToFind) {
              const found = columnResult.some(col => col.COLUMN_NAME.toLowerCase() === columnName.toLowerCase());
              console.log(`  - ${columnName}: ${found ? '✅ Found' : '❌ Not found'}`);
            }
          } else {
            console.log(`⚠️ No columns found for table '${tableName}'`);
          }
        } else {
          console.log(`❌ Table '${tableName}' does not exist`);
          
          // Try to find similar table names
          const similarTableQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME LIKE '%${tableName.replace(/_/g, '%')}%'
          `;
          
          const similarTableResult = await connection.query(similarTableQuery);
          
          if (similarTableResult && similarTableResult.length > 0) {
            console.log('Similar tables found:');
            for (const row of similarTableResult) {
              console.log(`  - ${row.TABLE_NAME}`);
            }
          } else {
            console.log('No similar tables found');
          }
        }
      } catch (error) {
        console.error(`❌ Error checking table '${tableName}':`, error.message);
      }
    }
    
    // Try a simple query to get customer count
    console.log('\n--- Testing simple queries ---');
    
    try {
      const customerQuery = `SELECT COUNT(*) as count FROM customer`;
      const customerResult = await connection.query(customerQuery);
      console.log(`Customer count: ${customerResult[0].count}`);
    } catch (error) {
      console.error('❌ Error querying customer table:', error.message);
      
      // Try with schema prefix
      try {
        const schemaCustomerQuery = `SELECT COUNT(*) as count FROM dbo.customer`;
        const schemaCustomerResult = await connection.query(schemaCustomerQuery);
        console.log(`Customer count (with dbo schema): ${schemaCustomerResult[0].count}`);
      } catch (schemaError) {
        console.error('❌ Error querying dbo.customer table:', schemaError.message);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== P21 Database Schema Check Completed ===');
}

// Run the check function
checkP21Schema()
  .then(() => {
    console.log('Schema check completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
