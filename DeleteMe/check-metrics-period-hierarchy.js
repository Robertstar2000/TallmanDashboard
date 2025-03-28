const odbc = require('odbc');

/**
 * Script to check the metrics_period_hierarchy table in P21
 */
async function checkMetricsPeriodHierarchy() {
  console.log('=== P21 metrics_period_hierarchy Table Check ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Check if the table exists
    console.log('\n--- Checking if metrics_period_hierarchy table exists ---');
    const tableCheckQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME = 'metrics_period_hierarchy'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tableCheck = await connection.query(tableCheckQuery);
    
    if (tableCheck.length > 0) {
      console.log(`✅ Table exists in schema: ${tableCheck[0].TABLE_SCHEMA}`);
      
      // Check columns in this table
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${tableCheck[0].TABLE_SCHEMA}' 
          AND TABLE_NAME = 'metrics_period_hierarchy'
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log(`Table has ${columns.length} columns:`);
      columns.forEach(col => {
        console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
      });
      
      // Check if the table has data
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM ${tableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy
      `;
      
      const countResult = await connection.query(countQuery);
      console.log(`Table has ${countResult[0].row_count} rows`);
      
      if (countResult[0].row_count > 0) {
        // Get a sample of data
        const sampleQuery = `
          SELECT TOP 5 *
          FROM ${tableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy
          ORDER BY number_days_past_due
        `;
        
        try {
          const sampleData = await connection.query(sampleQuery);
          console.log('Sample data:');
          sampleData.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        } catch (sampleError) {
          console.error(`Error getting sample data: ${sampleError.message}`);
          
          // Try with specific columns if the general query fails
          console.log('Trying with specific columns...');
          
          // Check if ar_balance and number_days_past_due columns exist
          const specificColumns = columns.filter(col => 
            col.COLUMN_NAME === 'ar_balance' || 
            col.COLUMN_NAME === 'number_days_past_due'
          );
          
          if (specificColumns.length === 2) {
            const specificQuery = `
              SELECT TOP 5 ar_balance, number_days_past_due
              FROM ${tableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy
              ORDER BY number_days_past_due
            `;
            
            try {
              const specificData = await connection.query(specificQuery);
              console.log('Sample data with specific columns:');
              specificData.forEach((row, index) => {
                console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
              });
            } catch (specificError) {
              console.error(`Error getting specific column data: ${specificError.message}`);
            }
          } else {
            console.log(`Missing required columns. Found ${specificColumns.length} of 2 required columns.`);
          }
        }
        
        // Try the actual AR Aging queries
        console.log('\n--- Testing AR Aging Queries ---');
        
        const arAgingQueries = [
          {
            bucket: 'Current',
            query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due = 0"
          },
          {
            bucket: '1-30 Days',
            query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 0 AND number_days_past_due <= 30"
          },
          {
            bucket: '31-60 Days',
            query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 30 AND number_days_past_due <= 60"
          },
          {
            bucket: '61-90 Days',
            query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 60 AND number_days_past_due <= 90"
          },
          {
            bucket: '90+ Days',
            query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 90"
          }
        ];
        
        for (const queryInfo of arAgingQueries) {
          console.log(`\nTesting query for ${queryInfo.bucket}:`);
          console.log(queryInfo.query);
          
          try {
            const result = await connection.query(queryInfo.query);
            console.log(`✅ Query successful! Result:`, JSON.stringify(result[0], null, 2));
          } catch (queryError) {
            console.error(`❌ Query failed: ${queryError.message}`);
          }
        }
      } else {
        console.log('⚠️ Table exists but contains no data');
        
        // Look for alternative tables with similar structure
        console.log('\n--- Looking for alternative tables with similar structure ---');
        
        const alternativeTablesQuery = `
          SELECT 
            t.TABLE_SCHEMA,
            t.TABLE_NAME,
            COUNT(c.COLUMN_NAME) as matching_columns
          FROM INFORMATION_SCHEMA.TABLES t
          JOIN INFORMATION_SCHEMA.COLUMNS c ON 
            t.TABLE_SCHEMA = c.TABLE_SCHEMA AND
            t.TABLE_NAME = c.TABLE_NAME
          WHERE 
            c.COLUMN_NAME IN ('ar_balance', 'number_days_past_due') OR
            c.COLUMN_NAME LIKE '%ar%balance%' OR
            c.COLUMN_NAME LIKE '%days%past%due%'
          GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME
          HAVING COUNT(c.COLUMN_NAME) >= 1
          ORDER BY matching_columns DESC, t.TABLE_SCHEMA, t.TABLE_NAME
        `;
        
        try {
          const alternativeTables = await connection.query(alternativeTablesQuery);
          console.log(`Found ${alternativeTables.length} potential alternative tables:`);
          
          for (const table of alternativeTables) {
            console.log(`- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.matching_columns} matching columns)`);
            
            // Get the matching columns
            const matchingColumnsQuery = `
              SELECT 
                COLUMN_NAME, 
                DATA_TYPE
              FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
                AND TABLE_NAME = '${table.TABLE_NAME}'
                AND (COLUMN_NAME IN ('ar_balance', 'number_days_past_due') OR
                     COLUMN_NAME LIKE '%ar%balance%' OR
                     COLUMN_NAME LIKE '%days%past%due%')
              ORDER BY ORDINAL_POSITION
            `;
            
            const matchingColumns = await connection.query(matchingColumnsQuery);
            console.log('  Matching columns:');
            matchingColumns.forEach(col => {
              console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
            
            // Check if this table has data
            const tableCountQuery = `
              SELECT COUNT(*) as row_count
              FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
            `;
            
            try {
              const tableCountResult = await connection.query(tableCountQuery);
              console.log(`  Table has ${tableCountResult[0].row_count} rows`);
              
              if (tableCountResult[0].row_count > 0) {
                // Get a sample of data
                const tableSampleQuery = `
                  SELECT TOP 5 *
                  FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
                `;
                
                try {
                  const tableSampleData = await connection.query(tableSampleQuery);
                  console.log('  Sample data:');
                  console.log(JSON.stringify(tableSampleData[0], null, 2));
                } catch (tableSampleError) {
                  console.error(`  Error getting sample data: ${tableSampleError.message}`);
                }
              }
            } catch (tableCountError) {
              console.error(`  Error getting row count: ${tableCountError.message}`);
            }
          }
        } catch (alternativeError) {
          console.error(`Error looking for alternative tables: ${alternativeError.message}`);
        }
      }
    } else {
      console.log('❌ Table does not exist');
      
      // Look for tables with similar names
      console.log('\n--- Looking for tables with similar names ---');
      
      const similarTablesQuery = `
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE 
          TABLE_NAME LIKE '%metric%' OR
          TABLE_NAME LIKE '%period%' OR
          TABLE_NAME LIKE '%hierarch%'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;
      
      const similarTables = await connection.query(similarTablesQuery);
      console.log(`Found ${similarTables.length} tables with similar names:`);
      
      for (const table of similarTables) {
        console.log(`- ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== metrics_period_hierarchy Table Check Completed ===');
}

// Run the check
checkMetricsPeriodHierarchy()
  .then(() => {
    console.log('Check completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
