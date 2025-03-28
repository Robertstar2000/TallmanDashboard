const odbc = require('odbc');

/**
 * Focused script to find the correct tables and columns for AR Aging queries
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
    
    // First, check if metrics_period_hierarchy exists (from the previous output)
    console.log('\n--- Checking for metrics_period_hierarchy table ---');
    try {
      const metricsTableCheck = await connection.query(`
        SELECT TOP 1 * 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'metrics_period_hierarchy'
      `);
      
      if (metricsTableCheck.length > 0) {
        console.log(`✅ Found metrics_period_hierarchy table in schema: ${metricsTableCheck[0].TABLE_SCHEMA}`);
        
        // Check columns in this table
        const columnsQuery = `
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${metricsTableCheck[0].TABLE_SCHEMA}' 
            AND TABLE_NAME = 'metrics_period_hierarchy'
          ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await connection.query(columnsQuery);
        console.log(`Table has ${columns.length} columns. Relevant columns:`);
        
        // Filter to show only relevant columns
        const relevantColumns = columns.filter(col => 
          col.COLUMN_NAME.toLowerCase().includes('ar') ||
          col.COLUMN_NAME.toLowerCase().includes('days') ||
          col.COLUMN_NAME.toLowerCase().includes('aging') ||
          col.COLUMN_NAME.toLowerCase().includes('due') ||
          col.COLUMN_NAME.toLowerCase().includes('balance')
        );
        
        relevantColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
        });
        
        // Test queries for each aging bucket
        console.log('\n--- Testing AR Aging queries ---');
        
        // Based on the previous output, try ar_balance and number_days_past_due
        const testQueries = [
          {
            name: 'Current',
            query: `SELECT ISNULL(SUM(ar_balance), 0) as value FROM ${metricsTableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due = 0`
          },
          {
            name: '1-30 Days',
            query: `SELECT ISNULL(SUM(ar_balance), 0) as value FROM ${metricsTableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 0 AND number_days_past_due <= 30`
          },
          {
            name: '31-60 Days',
            query: `SELECT ISNULL(SUM(ar_balance), 0) as value FROM ${metricsTableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 30 AND number_days_past_due <= 60`
          },
          {
            name: '61-90 Days',
            query: `SELECT ISNULL(SUM(ar_balance), 0) as value FROM ${metricsTableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 60 AND number_days_past_due <= 90`
          },
          {
            name: '90+ Days',
            query: `SELECT ISNULL(SUM(ar_balance), 0) as value FROM ${metricsTableCheck[0].TABLE_SCHEMA}.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 90`
          }
        ];
        
        const results = {};
        
        for (const test of testQueries) {
          try {
            console.log(`\nTesting query for ${test.name}:`);
            console.log(test.query);
            
            const result = await connection.query(test.query);
            console.log(`✅ Query successful! Result: ${JSON.stringify(result[0])}`);
            results[test.name] = result[0].value;
          } catch (error) {
            console.error(`❌ Query failed: ${error.message}`);
          }
        }
        
        // If we got here, summarize the results
        console.log('\n--- AR Aging Query Results Summary ---');
        for (const [bucket, value] of Object.entries(results)) {
          console.log(`${bucket}: ${value}`);
        }
        
        // Generate the corrected SQL for all buckets
        console.log('\n--- Corrected SQL for AR Aging ---');
        const correctedSql = {};
        
        for (const test of testQueries) {
          correctedSql[test.name] = test.query;
          console.log(`\n${test.name}:`);
          console.log(test.query);
        }
        
        return {
          success: true,
          table: 'metrics_period_hierarchy',
          schema: metricsTableCheck[0].TABLE_SCHEMA,
          daysColumn: 'number_days_past_due',
          amountColumn: 'ar_balance',
          correctedSql,
          results
        };
      } else {
        console.log('❌ metrics_period_hierarchy table not found');
      }
    } catch (error) {
      console.error(`❌ Error checking metrics_period_hierarchy: ${error.message}`);
    }
    
    // Check for ar_open_items table (the one in the original queries)
    console.log('\n--- Checking for ar_open_items table ---');
    try {
      const arOpenItemsCheck = await connection.query(`
        SELECT TOP 1 * 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'ar_open_items'
      `);
      
      if (arOpenItemsCheck.length > 0) {
        console.log(`✅ Found ar_open_items table in schema: ${arOpenItemsCheck[0].TABLE_SCHEMA}`);
        
        // Check columns in this table
        const columnsQuery = `
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${arOpenItemsCheck[0].TABLE_SCHEMA}' 
            AND TABLE_NAME = 'ar_open_items'
          ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await connection.query(columnsQuery);
        console.log(`Table has ${columns.length} columns. Relevant columns:`);
        
        // Filter to show only relevant columns
        const relevantColumns = columns.filter(col => 
          col.COLUMN_NAME.toLowerCase().includes('amount') ||
          col.COLUMN_NAME.toLowerCase().includes('days') ||
          col.COLUMN_NAME.toLowerCase().includes('aging') ||
          col.COLUMN_NAME.toLowerCase().includes('due') ||
          col.COLUMN_NAME.toLowerCase().includes('balance')
        );
        
        relevantColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
        });
        
        // If we found days_past_due and amount_open columns, test queries
        const daysColumn = relevantColumns.find(col => col.COLUMN_NAME.toLowerCase().includes('days'));
        const amountColumn = relevantColumns.find(col => 
          col.COLUMN_NAME.toLowerCase().includes('amount') || 
          col.COLUMN_NAME.toLowerCase().includes('balance')
        );
        
        if (daysColumn && amountColumn) {
          console.log(`\nFound potential columns: ${daysColumn.COLUMN_NAME} and ${amountColumn.COLUMN_NAME}`);
          
          // Test a query
          try {
            const testQuery = `
              SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value 
              FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK)
              WHERE ${daysColumn.COLUMN_NAME} = 0
            `;
            console.log(`\nTesting query for Current bucket:`);
            console.log(testQuery);
            
            const result = await connection.query(testQuery);
            console.log(`✅ Query successful! Result: ${JSON.stringify(result[0])}`);
            
            // If successful, this is likely our table
            console.log(`\n✅ Found working table and columns: ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items`);
            console.log(`Days column: ${daysColumn.COLUMN_NAME}`);
            console.log(`Amount column: ${amountColumn.COLUMN_NAME}`);
            
            // Generate corrected SQL for all buckets
            console.log('\n--- Corrected SQL for AR Aging ---');
            const correctedSql = {
              'Current': `SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK) WHERE ${daysColumn.COLUMN_NAME} = 0`,
              '1-30 Days': `SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK) WHERE ${daysColumn.COLUMN_NAME} > 0 AND ${daysColumn.COLUMN_NAME} <= 30`,
              '31-60 Days': `SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK) WHERE ${daysColumn.COLUMN_NAME} > 30 AND ${daysColumn.COLUMN_NAME} <= 60`,
              '61-90 Days': `SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK) WHERE ${daysColumn.COLUMN_NAME} > 60 AND ${daysColumn.COLUMN_NAME} <= 90`,
              '90+ Days': `SELECT ISNULL(SUM(${amountColumn.COLUMN_NAME}), 0) as value FROM ${arOpenItemsCheck[0].TABLE_SCHEMA}.ar_open_items WITH (NOLOCK) WHERE ${daysColumn.COLUMN_NAME} > 90`
            };
            
            for (const [bucket, sql] of Object.entries(correctedSql)) {
              console.log(`\n${bucket}:`);
              console.log(sql);
            }
            
            return {
              success: true,
              table: 'ar_open_items',
              schema: arOpenItemsCheck[0].TABLE_SCHEMA,
              daysColumn: daysColumn.COLUMN_NAME,
              amountColumn: amountColumn.COLUMN_NAME,
              correctedSql
            };
          } catch (error) {
            console.log(`❌ Query failed: ${error.message}`);
          }
        }
      } else {
        console.log('❌ ar_open_items table not found');
      }
    } catch (error) {
      console.error(`❌ Error checking ar_open_items: ${error.message}`);
    }
    
    // As a last resort, look for any table with aging-related columns
    console.log('\n--- Looking for any table with aging-related columns ---');
    try {
      const agingColumnsQuery = `
        SELECT TOP 20
          c.TABLE_SCHEMA,
          c.TABLE_NAME,
          c.COLUMN_NAME,
          c.DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS c
        JOIN INFORMATION_SCHEMA.TABLES t ON c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE 
          (c.COLUMN_NAME LIKE '%days%past%due%' OR c.COLUMN_NAME LIKE '%aging%' OR c.COLUMN_NAME LIKE '%age%days%')
          AND t.TABLE_TYPE = 'BASE TABLE'
        ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME
      `;
      
      const agingColumns = await connection.query(agingColumnsQuery);
      console.log(`Found ${agingColumns.length} tables with aging-related columns:`);
      agingColumns.forEach(col => {
        console.log(`   - ${col.TABLE_SCHEMA}.${col.TABLE_NAME}.${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } catch (error) {
      console.error(`❌ Error searching for aging columns: ${error.message}`);
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
    return {
      success: false,
      message: 'Could not find a working table/column combination for AR Aging'
    };
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return {
      success: false,
      message: `Critical error: ${error.message}`
    };
  }
}

// Run the diagnostics
findArAgingTables()
  .then(result => {
    console.log('\n=== AR Aging Table Finder Results ===');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n=== NEXT STEPS ===');
      console.log('1. Update the AR Aging queries in the dashboard with the corrected SQL');
      console.log('2. Test the dashboard to ensure the AR Aging chart displays correctly');
    } else {
      console.log('\n=== NEXT STEPS ===');
      console.log('1. Review the diagnostic output to identify potential tables manually');
      console.log('2. Consult with P21 database administrator for the correct table structure');
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
