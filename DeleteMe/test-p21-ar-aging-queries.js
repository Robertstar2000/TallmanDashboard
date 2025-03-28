const odbc = require('odbc');

/**
 * Script to test the AR Aging queries from the dashboard
 * This script will:
 * 1. Connect to P21 using the DSN
 * 2. Test each AR Aging query from the initial-data.ts file
 * 3. Identify any issues with the queries
 * 4. Suggest corrections if needed
 */
async function testArAgingQueries() {
  console.log('=== P21 AR Aging Query Tester ===');
  console.log('Starting at', new Date().toISOString());
  
  // The AR Aging queries from initial-data.ts
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
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // First, check if metrics_period_hierarchy table exists
    console.log('\n--- Verifying metrics_period_hierarchy table ---');
    try {
      const tableCheck = await connection.query(`
        SELECT TOP 1 * 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'metrics_period_hierarchy'
      `);
      
      if (tableCheck.length > 0) {
        console.log(`✅ Found metrics_period_hierarchy table in schema: ${tableCheck[0].TABLE_SCHEMA}`);
        
        // Check columns in this table
        const columnsQuery = `
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${tableCheck[0].TABLE_SCHEMA}' 
            AND TABLE_NAME = 'metrics_period_hierarchy'
            AND (COLUMN_NAME = 'ar_balance' OR COLUMN_NAME = 'number_days_past_due')
          ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await connection.query(columnsQuery);
        if (columns.length === 2) {
          console.log(`✅ Found both required columns: ar_balance and number_days_past_due`);
          columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
        } else {
          console.log(`❌ Missing one or more required columns. Found ${columns.length} of 2 required columns:`);
          columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
          
          // If columns are missing, check for similar columns
          const similarColumnsQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${tableCheck[0].TABLE_SCHEMA}' 
              AND TABLE_NAME = 'metrics_period_hierarchy'
              AND (COLUMN_NAME LIKE '%ar%' OR COLUMN_NAME LIKE '%balance%' OR COLUMN_NAME LIKE '%day%' OR COLUMN_NAME LIKE '%due%')
            ORDER BY COLUMN_NAME
          `;
          
          const similarColumns = await connection.query(similarColumnsQuery);
          console.log(`Found ${similarColumns.length} similar columns that might be used instead:`);
          similarColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
          });
        }
      } else {
        console.log('❌ metrics_period_hierarchy table not found');
        
        // Look for similar tables
        const similarTablesQuery = `
          SELECT 
            TABLE_SCHEMA,
            TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME LIKE '%metric%' OR TABLE_NAME LIKE '%period%' OR TABLE_NAME LIKE '%hierarchy%'
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `;
        
        const similarTables = await connection.query(similarTablesQuery);
        console.log(`Found ${similarTables.length} similar tables that might be used instead:`);
        similarTables.forEach(table => {
          console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
        });
      }
    } catch (error) {
      console.error(`❌ Error checking metrics_period_hierarchy table: ${error.message}`);
    }
    
    // Now test each AR Aging query
    console.log('\n--- Testing AR Aging Queries ---');
    for (const queryInfo of arAgingQueries) {
      console.log(`\nTesting query for ${queryInfo.bucket}:`);
      console.log(queryInfo.query);
      
      try {
        const result = await connection.query(queryInfo.query);
        console.log(`✅ Query successful! Result: ${JSON.stringify(result[0])}`);
      } catch (error) {
        console.error(`❌ Query failed: ${error.message}`);
        
        // Try to identify the issue
        if (error.message.includes('Invalid object name')) {
          console.log('   Issue: Table or view not found');
          
          // Extract the table name from the error message
          const tableMatch = error.message.match(/Invalid object name '([^']+)'/);
          if (tableMatch && tableMatch[1]) {
            const tableName = tableMatch[1];
            console.log(`   Looking for similar tables to: ${tableName}`);
            
            // Look for similar tables
            const similarTablesQuery = `
              SELECT 
                TABLE_SCHEMA,
                TABLE_NAME
              FROM INFORMATION_SCHEMA.TABLES
              WHERE TABLE_NAME LIKE '%${tableName.replace(/^dbo\./, '').split('.').pop().replace(/[^a-zA-Z0-9]/g, '%')}%'
              ORDER BY TABLE_SCHEMA, TABLE_NAME
            `;
            
            try {
              const similarTables = await connection.query(similarTablesQuery);
              console.log(`   Found ${similarTables.length} similar tables:`);
              similarTables.forEach(table => {
                console.log(`     - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
              });
            } catch (innerError) {
              console.error(`   Error searching for similar tables: ${innerError.message}`);
            }
          }
        } else if (error.message.includes('Invalid column name')) {
          console.log('   Issue: Column not found');
          
          // Extract the column name from the error message
          const columnMatch = error.message.match(/Invalid column name '([^']+)'/);
          if (columnMatch && columnMatch[1]) {
            const columnName = columnMatch[1];
            console.log(`   Looking for similar columns to: ${columnName}`);
            
            // Extract the table name from the query
            const tableMatch = queryInfo.query.match(/FROM\s+([^\s]+)/i);
            if (tableMatch && tableMatch[1]) {
              const tableName = tableMatch[1].replace(/WITH\s*\([^)]*\)/i, '').trim();
              console.log(`   In table: ${tableName}`);
              
              // Look for similar columns in the table
              const similarColumnsQuery = `
                SELECT 
                  COLUMN_NAME, 
                  DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '${tableName.replace(/^dbo\./, '').split('.').pop()}'
                ORDER BY COLUMN_NAME
              `;
              
              try {
                const similarColumns = await connection.query(similarColumnsQuery);
                console.log(`   Found ${similarColumns.length} columns in the table:`);
                similarColumns.forEach(col => {
                  console.log(`     - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
                });
              } catch (innerError) {
                console.error(`   Error searching for columns: ${innerError.message}`);
              }
            }
          }
        } else {
          console.log(`   Issue: ${error.message}`);
        }
        
        // Try a modified query with different column names
        console.log('\n   Attempting alternative query...');
        
        // Try to find the correct column names
        const alternativeQuery = queryInfo.query
          .replace(/ar_balance/g, 'ar_amt')  // Try ar_amt instead of ar_balance
          .replace(/number_days_past_due/g, 'days_past_due');  // Try days_past_due instead of number_days_past_due
        
        console.log(`   Alternative query: ${alternativeQuery}`);
        
        try {
          const alternativeResult = await connection.query(alternativeQuery);
          console.log(`   ✅ Alternative query successful! Result: ${JSON.stringify(alternativeResult[0])}`);
          console.log(`   ✅ Use this column name instead!`);
        } catch (alternativeError) {
          console.error(`   ❌ Alternative query also failed: ${alternativeError.message}`);
        }
      }
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
  
  console.log('\n=== AR Aging Query Tests Completed ===');
}

// Run the tests
testArAgingQueries()
  .then(() => {
    console.log('Tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
