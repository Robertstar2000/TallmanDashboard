const odbc = require('odbc');

/**
 * Script to find alternative tables for AR Aging data in P21
 */
async function findArAgingTables() {
  console.log('=== P21 AR Aging Table Finder ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Search for tables related to AR Aging
    console.log('\n--- Searching for AR Aging related tables ---');
    const tableSearchQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        (TABLE_NAME LIKE '%ar%' OR 
         TABLE_NAME LIKE '%aging%' OR 
         TABLE_NAME LIKE '%receivable%' OR
         TABLE_NAME LIKE '%invoice%' OR
         TABLE_NAME LIKE '%open_item%')
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tables = await connection.query(tableSearchQuery);
    console.log(`Found ${tables.length} potential tables:`);
    
    // Create a list of promising tables to check
    const tablesToCheck = [];
    
    for (const table of tables) {
      const fullTableName = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
      console.log(`- ${fullTableName}`);
      
      // Add tables that look particularly promising to our check list
      if (
        table.TABLE_NAME.toLowerCase().includes('aging') || 
        table.TABLE_NAME.toLowerCase().includes('ar_open') ||
        table.TABLE_NAME.toLowerCase().includes('receivable')
      ) {
        tablesToCheck.push(fullTableName);
      }
    }
    
    console.log(`\nSelected ${tablesToCheck.length} promising tables for detailed analysis:`);
    
    // Check each promising table for columns related to aging or days past due
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Analyzing table: ${tableName} ---`);
      
      // Get column information
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${tableName.split('.')[0]}' 
          AND TABLE_NAME = '${tableName.split('.')[1]}'
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log(`Table has ${columns.length} columns. Looking for balance and aging related columns...`);
      
      // Find columns related to balance, amount, or days
      const balanceColumns = columns.filter(col => 
        col.COLUMN_NAME.toLowerCase().includes('balance') || 
        col.COLUMN_NAME.toLowerCase().includes('amount') ||
        col.COLUMN_NAME.toLowerCase().includes('amt')
      );
      
      const daysColumns = columns.filter(col => 
        col.COLUMN_NAME.toLowerCase().includes('day') || 
        col.COLUMN_NAME.toLowerCase().includes('due') ||
        col.COLUMN_NAME.toLowerCase().includes('aging') ||
        col.COLUMN_NAME.toLowerCase().includes('age')
      );
      
      if (balanceColumns.length > 0 && daysColumns.length > 0) {
        console.log(`✅ PROMISING TABLE! Found both balance and days columns`);
        console.log('Balance columns:');
        balanceColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
        });
        
        console.log('Days/Aging columns:');
        daysColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
        });
        
        // Try to get a sample of data from this table
        try {
          const sampleQuery = `
            SELECT TOP 5 
              ${balanceColumns.map(col => col.COLUMN_NAME).join(', ')},
              ${daysColumns.map(col => col.COLUMN_NAME).join(', ')}
            FROM ${tableName}
            ORDER BY ${daysColumns[0].COLUMN_NAME}
          `;
          
          console.log(`Executing sample query: ${sampleQuery}`);
          const sampleData = await connection.query(sampleQuery);
          
          if (sampleData.length > 0) {
            console.log(`Found ${sampleData.length} sample rows:`);
            sampleData.forEach((row, index) => {
              console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
            });
            
            // Try a count query for different aging buckets
            console.log('\nTesting aging buckets:');
            
            // Use the first balance column and first days column for our test
            const balanceCol = balanceColumns[0].COLUMN_NAME;
            const daysCol = daysColumns[0].COLUMN_NAME;
            
            const agingBuckets = [
              { name: 'Current', condition: `${daysCol} = 0` },
              { name: '1-30 Days', condition: `${daysCol} > 0 AND ${daysCol} <= 30` },
              { name: '31-60 Days', condition: `${daysCol} > 30 AND ${daysCol} <= 60` },
              { name: '61-90 Days', condition: `${daysCol} > 60 AND ${daysCol} <= 90` },
              { name: '90+ Days', condition: `${daysCol} > 90` }
            ];
            
            for (const bucket of agingBuckets) {
              const bucketQuery = `
                SELECT 
                  COUNT(*) as count,
                  ISNULL(SUM(${balanceCol}), 0) as total
                FROM ${tableName}
                WHERE ${bucket.condition}
              `;
              
              try {
                const bucketResult = await connection.query(bucketQuery);
                console.log(`${bucket.name}: ${bucketResult[0].count} records, Total: ${bucketResult[0].total}`);
                
                // If we found records, this is a good candidate table
                if (bucketResult[0].count > 0) {
                  console.log(`✅ FOUND DATA! This table has ${bucketResult[0].count} records in the ${bucket.name} bucket`);
                  
                  // Generate the AR Aging query for this bucket
                  const arAgingQuery = `
                    SELECT ISNULL(SUM(${balanceCol}), 0) as value 
                    FROM ${tableName} 
                    WHERE ${bucket.condition}
                  `;
                  
                  console.log(`Suggested query for ${bucket.name}:`);
                  console.log(arAgingQuery);
                }
              } catch (bucketError) {
                console.error(`Error testing bucket ${bucket.name}: ${bucketError.message}`);
              }
            }
          } else {
            console.log('Table exists but contains no data');
          }
        } catch (sampleError) {
          console.error(`Error getting sample data: ${sampleError.message}`);
        }
      } else {
        if (balanceColumns.length > 0) {
          console.log(`Found ${balanceColumns.length} balance columns but no days columns`);
        } else if (daysColumns.length > 0) {
          console.log(`Found ${daysColumns.length} days columns but no balance columns`);
        } else {
          console.log('No relevant columns found');
        }
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Table Search Completed ===');
}

// Run the search
findArAgingTables()
  .then(() => {
    console.log('Search completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
