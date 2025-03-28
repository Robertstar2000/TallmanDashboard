const odbc = require('odbc');

/**
 * Script to diagnose and fix AR Aging queries in the Tallman Dashboard
 * This script will:
 * 1. Connect to P21 using the DSN
 * 2. Search for tables related to AR aging/open items
 * 3. Examine the structure of those tables
 * 4. Test different query syntaxes to find working queries
 * 5. Generate corrected SQL for the dashboard
 */
async function diagnoseArAging() {
  console.log('=== P21 AR Aging Diagnostics ===');
  console.log('Starting diagnostics at', new Date().toISOString());
  
  try {
    // 1. Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // 2. Find tables related to AR aging
    console.log('\n--- Finding AR-related tables ---');
    const arTableQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%ar%' OR TABLE_NAME LIKE '%aging%' OR TABLE_NAME LIKE '%open%item%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arTables = await connection.query(arTableQuery);
    console.log(`Found ${arTables.length} potentially relevant tables:`);
    arTables.forEach(table => {
      console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    // 3. Check specifically for ar_open_items table
    console.log('\n--- Checking for ar_open_items table ---');
    const specificTableQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'ar_open_items'
    `;
    
    const specificTable = await connection.query(specificTableQuery);
    if (specificTable.length > 0) {
      console.log(`✅ Found ar_open_items table in schema: ${specificTable[0].TABLE_SCHEMA}`);
    } else {
      console.log('❌ ar_open_items table not found, searching for alternatives...');
    }
    
    // 4. Look for tables with similar structure to what we need
    console.log('\n--- Looking for tables with days_past_due column ---');
    const daysPastDueQuery = `
      SELECT 
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
    
    const daysPastDueTables = await connection.query(daysPastDueQuery);
    console.log(`Found ${daysPastDueTables.length} tables with potential aging columns:`);
    daysPastDueTables.forEach(col => {
      console.log(`   - ${col.TABLE_SCHEMA}.${col.TABLE_NAME}.${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
    // 5. Look for tables with amount columns
    console.log('\n--- Looking for tables with amount columns ---');
    const amountQuery = `
      SELECT 
        c.TABLE_SCHEMA,
        c.TABLE_NAME,
        c.COLUMN_NAME,
        c.DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS c
      JOIN INFORMATION_SCHEMA.TABLES t ON c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
      WHERE 
        c.COLUMN_NAME LIKE '%amount%open%' OR c.COLUMN_NAME LIKE '%open%amount%' OR c.COLUMN_NAME LIKE '%balance%'
        AND t.TABLE_TYPE = 'BASE TABLE'
        AND (t.TABLE_NAME LIKE '%ar%' OR t.TABLE_NAME LIKE '%aging%' OR t.TABLE_NAME LIKE '%open%item%')
      ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME
    `;
    
    const amountTables = await connection.query(amountQuery);
    console.log(`Found ${amountTables.length} tables with potential amount columns:`);
    amountTables.forEach(col => {
      console.log(`   - ${col.TABLE_SCHEMA}.${col.TABLE_NAME}.${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
    // 6. Based on findings, identify the most promising tables
    console.log('\n--- Identifying most promising tables ---');
    const candidateTables = [];
    
    // Combine results from days past due and amount queries to find tables with both
    const daysPastDueTableMap = {};
    daysPastDueTables.forEach(col => {
      const key = `${col.TABLE_SCHEMA}.${col.TABLE_NAME}`;
      if (!daysPastDueTableMap[key]) {
        daysPastDueTableMap[key] = [];
      }
      daysPastDueTableMap[key].push(col.COLUMN_NAME);
    });
    
    const amountTableMap = {};
    amountTables.forEach(col => {
      const key = `${col.TABLE_SCHEMA}.${col.TABLE_NAME}`;
      if (!amountTableMap[key]) {
        amountTableMap[key] = [];
      }
      amountTableMap[key].push(col.COLUMN_NAME);
    });
    
    // Find tables that have both types of columns
    for (const tableKey in daysPastDueTableMap) {
      if (amountTableMap[tableKey]) {
        const [schema, tableName] = tableKey.split('.');
        candidateTables.push({
          schema,
          tableName,
          daysPastDueColumns: daysPastDueTableMap[tableKey],
          amountColumns: amountTableMap[tableKey]
        });
      }
    }
    
    console.log(`Found ${candidateTables.length} candidate tables with both aging and amount columns:`);
    candidateTables.forEach(table => {
      console.log(`   - ${table.schema}.${table.tableName}`);
      console.log(`     Days past due columns: ${table.daysPastDueColumns.join(', ')}`);
      console.log(`     Amount columns: ${table.amountColumns.join(', ')}`);
    });
    
    // 7. For each candidate table, examine its structure in detail
    console.log('\n--- Examining candidate tables in detail ---');
    for (const table of candidateTables) {
      console.log(`\nExamining table: ${table.schema}.${table.tableName}`);
      
      // Get all columns
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${table.schema}' AND TABLE_NAME = '${table.tableName}'
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log(`Table has ${columns.length} columns. Key columns:`);
      
      // Filter to show only relevant columns
      const relevantColumns = columns.filter(col => 
        col.COLUMN_NAME.toLowerCase().includes('amount') ||
        col.COLUMN_NAME.toLowerCase().includes('balance') ||
        col.COLUMN_NAME.toLowerCase().includes('days') ||
        col.COLUMN_NAME.toLowerCase().includes('aging') ||
        col.COLUMN_NAME.toLowerCase().includes('due')
      );
      
      relevantColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // 8. Test a sample query on each candidate table
      console.log(`\nTesting sample queries on ${table.schema}.${table.tableName}:`);
      
      // For each days past due column
      for (const daysCol of table.daysPastDueColumns) {
        // For each amount column
        for (const amountCol of table.amountColumns) {
          // Test current bucket
          try {
            const currentQuery = `
              SELECT ISNULL(SUM(${amountCol}), 0) as value 
              FROM ${table.schema}.${table.tableName} WITH (NOLOCK)
              WHERE ${daysCol} = 0
            `;
            console.log(`\nTesting query for Current bucket:`);
            console.log(currentQuery);
            
            const currentResult = await connection.query(currentQuery);
            console.log(`✅ Query successful! Result: ${JSON.stringify(currentResult[0])}`);
            
            // If successful, test 1-30 days bucket
            const days1to30Query = `
              SELECT ISNULL(SUM(${amountCol}), 0) as value 
              FROM ${table.schema}.${table.tableName} WITH (NOLOCK)
              WHERE ${daysCol} > 0 AND ${daysCol} <= 30
            `;
            console.log(`\nTesting query for 1-30 Days bucket:`);
            console.log(days1to30Query);
            
            const days1to30Result = await connection.query(days1to30Query);
            console.log(`✅ Query successful! Result: ${JSON.stringify(days1to30Result[0])}`);
            
            // If both queries are successful, this is likely our table
            console.log(`\n✅✅✅ FOUND WORKING TABLE AND COLUMNS: ${table.schema}.${table.tableName}`);
            console.log(`Days past due column: ${daysCol}`);
            console.log(`Amount column: ${amountCol}`);
            
            // Generate corrected SQL for all AR Aging buckets
            console.log('\n--- Generated Corrected SQL for AR Aging ---');
            
            const correctedSql = {
              'Current': `SELECT ISNULL(SUM(${amountCol}), 0) as value FROM ${table.schema}.${table.tableName} WITH (NOLOCK) WHERE ${daysCol} = 0`,
              '1-30 Days': `SELECT ISNULL(SUM(${amountCol}), 0) as value FROM ${table.schema}.${table.tableName} WITH (NOLOCK) WHERE ${daysCol} > 0 AND ${daysCol} <= 30`,
              '31-60 Days': `SELECT ISNULL(SUM(${amountCol}), 0) as value FROM ${table.schema}.${table.tableName} WITH (NOLOCK) WHERE ${daysCol} > 30 AND ${daysCol} <= 60`,
              '61-90 Days': `SELECT ISNULL(SUM(${amountCol}), 0) as value FROM ${table.schema}.${table.tableName} WITH (NOLOCK) WHERE ${daysCol} > 60 AND ${daysCol} <= 90`,
              '90+ Days': `SELECT ISNULL(SUM(${amountCol}), 0) as value FROM ${table.schema}.${table.tableName} WITH (NOLOCK) WHERE ${daysCol} > 90`
            };
            
            for (const [bucket, sql] of Object.entries(correctedSql)) {
              console.log(`\n${bucket}:`);
              console.log(sql);
            }
            
            // Return the corrected SQL
            return {
              success: true,
              tableName: table.tableName,
              schema: table.schema,
              daysColumn: daysCol,
              amountColumn: amountCol,
              correctedSql
            };
          } catch (error) {
            console.log(`❌ Query failed: ${error.message}`);
          }
        }
      }
    }
    
    // If we get here, we didn't find a working table/column combination
    console.log('\n❌ Could not find a working table/column combination for AR Aging');
    
    // 9. As a fallback, try to find any AR-related views that might have the data
    console.log('\n--- Checking for AR-related views ---');
    const arViewQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE TABLE_NAME LIKE '%ar%' OR TABLE_NAME LIKE '%aging%' OR TABLE_NAME LIKE '%receivable%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arViews = await connection.query(arViewQuery);
    console.log(`Found ${arViews.length} potentially relevant views:`);
    arViews.forEach(view => {
      console.log(`   - ${view.TABLE_SCHEMA}.${view.TABLE_NAME}`);
    });
    
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
diagnoseArAging()
  .then(result => {
    console.log('\n=== AR Aging Diagnostics Results ===');
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
    console.error('Unexpected error in diagnostics:', error);
    process.exit(1);
  });
