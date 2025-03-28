const odbc = require('odbc');

/**
 * Script to find any tables related to AR aging in the P21 database
 */
async function findAgingTables() {
  console.log('=== Finding AR Aging Tables in P21 ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Search for tables with aging in their name
    console.log('\n--- Searching for tables with "aging" in their name ---');
    
    const agingTablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME LIKE '%aging%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const agingTables = await connection.query(agingTablesQuery);
    console.log(`Found ${agingTables.length} tables with "aging" in their name:`);
    
    for (const table of agingTables) {
      console.log(`\n- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
      
      // Check if this table has data
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
      `;
      
      try {
        const countResult = await connection.query(countQuery);
        console.log(`  Table has ${countResult[0].row_count} rows`);
        
        if (countResult[0].row_count > 0) {
          // Get column information
          const columnsQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
              AND TABLE_NAME = '${table.TABLE_NAME}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columns = await connection.query(columnsQuery);
          
          // Look for key columns related to AR aging
          const keyColumns = columns.filter(col => 
            col.COLUMN_NAME.includes('amount') || 
            col.COLUMN_NAME.includes('balance') ||
            col.COLUMN_NAME.includes('due') ||
            col.COLUMN_NAME.includes('day') ||
            col.COLUMN_NAME.includes('date')
          );
          
          if (keyColumns.length > 0) {
            console.log('  Key columns for AR aging:');
            keyColumns.forEach(col => {
              console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
            });
          }
          
          // Get a sample of data
          const sampleQuery = `
            SELECT TOP 5 *
            FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
          `;
          
          try {
            const sampleData = await connection.query(sampleQuery);
            console.log('  Sample data (first row):');
            console.log(JSON.stringify(sampleData[0], null, 2));
          } catch (sampleError) {
            console.log(`  Error getting sample data: ${sampleError.message}`);
          }
        }
      } catch (countError) {
        console.log(`  Error getting row count: ${countError.message}`);
      }
    }
    
    // Search for tables with receivable in their name
    console.log('\n--- Searching for tables with "receivable" in their name ---');
    
    const receivableTablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME LIKE '%receivable%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const receivableTables = await connection.query(receivableTablesQuery);
    console.log(`Found ${receivableTables.length} tables with "receivable" in their name:`);
    
    for (const table of receivableTables) {
      console.log(`\n- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
      
      // Check if this table has data
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
      `;
      
      try {
        const countResult = await connection.query(countQuery);
        console.log(`  Table has ${countResult[0].row_count} rows`);
        
        if (countResult[0].row_count > 0) {
          // Get column information
          const columnsQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
              AND TABLE_NAME = '${table.TABLE_NAME}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columns = await connection.query(columnsQuery);
          
          // Look for key columns related to AR aging
          const keyColumns = columns.filter(col => 
            col.COLUMN_NAME.includes('amount') || 
            col.COLUMN_NAME.includes('balance') ||
            col.COLUMN_NAME.includes('due') ||
            col.COLUMN_NAME.includes('day') ||
            col.COLUMN_NAME.includes('date')
          );
          
          if (keyColumns.length > 0) {
            console.log('  Key columns for AR aging:');
            keyColumns.forEach(col => {
              console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
            });
          }
          
          // Get a sample of data
          const sampleQuery = `
            SELECT TOP 5 *
            FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
          `;
          
          try {
            const sampleData = await connection.query(sampleQuery);
            console.log('  Sample data (first row):');
            console.log(JSON.stringify(sampleData[0], null, 2));
          } catch (sampleError) {
            console.log(`  Error getting sample data: ${sampleError.message}`);
          }
        }
      } catch (countError) {
        console.log(`  Error getting row count: ${countError.message}`);
      }
    }
    
    // Search for tables with invoice in their name that might have aging data
    console.log('\n--- Searching for tables with "invoice" in their name that might have aging data ---');
    
    const invoiceTablesQuery = `
      SELECT 
        t.TABLE_SCHEMA,
        t.TABLE_NAME,
        t.TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c ON 
        t.TABLE_SCHEMA = c.TABLE_SCHEMA AND
        t.TABLE_NAME = c.TABLE_NAME
      WHERE 
        t.TABLE_NAME LIKE '%invoice%' AND
        (c.COLUMN_NAME LIKE '%due%date%' OR
         c.COLUMN_NAME LIKE '%days%past%' OR
         c.COLUMN_NAME LIKE '%aging%')
      GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME, t.TABLE_TYPE
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `;
    
    const invoiceTables = await connection.query(invoiceTablesQuery);
    console.log(`Found ${invoiceTables.length} invoice tables with aging-related columns:`);
    
    for (const table of invoiceTables) {
      console.log(`\n- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
      
      // Get column information
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
          AND TABLE_NAME = '${table.TABLE_NAME}'
          AND (COLUMN_NAME LIKE '%due%date%' OR
               COLUMN_NAME LIKE '%days%past%' OR
               COLUMN_NAME LIKE '%aging%' OR
               COLUMN_NAME LIKE '%amount%' OR
               COLUMN_NAME LIKE '%balance%')
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log('  Relevant columns:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
      });
      
      // Check if this table has data
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
      `;
      
      try {
        const countResult = await connection.query(countQuery);
        console.log(`  Table has ${countResult[0].row_count} rows`);
        
        if (countResult[0].row_count > 0) {
          // Get a sample of data
          const sampleQuery = `
            SELECT TOP 5 *
            FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
          `;
          
          try {
            const sampleData = await connection.query(sampleQuery);
            console.log('  Sample data (first row):');
            console.log(JSON.stringify(sampleData[0], null, 2));
          } catch (sampleError) {
            console.log(`  Error getting sample data: ${sampleError.message}`);
          }
        }
      } catch (countError) {
        console.log(`  Error getting row count: ${countError.message}`);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Tables Search Completed ===');
}

// Run the search
findAgingTables()
  .then(() => {
    console.log('Search completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
