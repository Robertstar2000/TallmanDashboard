const odbc = require('odbc');

/**
 * Script to find AR Aging data in P21
 * This script specifically looks for tables with AR aging information
 */
async function findArAgingData() {
  console.log('=== P21 AR Aging Data Finder ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // First, check if ar_open_items table exists
    console.log('\n--- Checking ar_open_items table ---');
    try {
      const arOpenItemsQuery = `
        SELECT TOP 10 * 
        FROM dbo.ar_open_items WITH (NOLOCK)
        ORDER BY due_date
      `;
      
      const arOpenItems = await connection.query(arOpenItemsQuery);
      if (arOpenItems.length > 0) {
        console.log(`✅ Found ${arOpenItems.length} rows in ar_open_items table`);
        console.log('Sample row:');
        console.log(JSON.stringify(arOpenItems[0], null, 2));
        
        // Check for columns related to amount and days
        const columnsQuery = `
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'ar_open_items'
          ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await connection.query(columnsQuery);
        console.log(`Table has ${columns.length} columns. Looking for balance and aging related columns...`);
        
        const balanceColumns = columns.filter(col => 
          col.COLUMN_NAME.toLowerCase().includes('balance') || 
          col.COLUMN_NAME.toLowerCase().includes('amount') ||
          col.COLUMN_NAME.toLowerCase().includes('amt') ||
          col.COLUMN_NAME.toLowerCase().includes('open')
        );
        
        const daysColumns = columns.filter(col => 
          col.COLUMN_NAME.toLowerCase().includes('day') || 
          col.COLUMN_NAME.toLowerCase().includes('due') ||
          col.COLUMN_NAME.toLowerCase().includes('aging') ||
          col.COLUMN_NAME.toLowerCase().includes('age')
        );
        
        console.log('Balance/Amount columns:');
        balanceColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        console.log('Days/Due date columns:');
        daysColumns.forEach(col => {
          console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Try to calculate days past due using due_date if it exists
        if (daysColumns.some(col => col.COLUMN_NAME.toLowerCase() === 'due_date')) {
          console.log('\n--- Testing AR Aging calculation using due_date ---');
          
          const agingQuery = `
            SELECT 
              CASE 
                WHEN DATEDIFF(day, due_date, GETDATE()) <= 0 THEN 'Current'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30 THEN '1-30 Days'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
                ELSE '90+ Days'
              END as aging_bucket,
              COUNT(*) as record_count,
              SUM(ISNULL(amount_remaining, 0)) as total_amount
            FROM dbo.ar_open_items WITH (NOLOCK)
            WHERE amount_remaining > 0
            GROUP BY 
              CASE 
                WHEN DATEDIFF(day, due_date, GETDATE()) <= 0 THEN 'Current'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30 THEN '1-30 Days'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
                WHEN DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
                ELSE '90+ Days'
              END
            ORDER BY 
              CASE aging_bucket
                WHEN 'Current' THEN 1
                WHEN '1-30 Days' THEN 2
                WHEN '31-60 Days' THEN 3
                WHEN '61-90 Days' THEN 4
                WHEN '90+ Days' THEN 5
                ELSE 6
              END
          `;
          
          try {
            const agingResults = await connection.query(agingQuery);
            console.log('AR Aging results using due_date:');
            agingResults.forEach(row => {
              console.log(`${row.aging_bucket}: ${row.record_count} records, Total: ${row.total_amount}`);
            });
            
            // Generate the AR Aging queries for each bucket
            console.log('\n--- Suggested AR Aging Queries ---');
            
            const buckets = [
              { name: 'Current', condition: 'DATEDIFF(day, due_date, GETDATE()) <= 0' },
              { name: '1-30 Days', condition: 'DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30' },
              { name: '31-60 Days', condition: 'DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60' },
              { name: '61-90 Days', condition: 'DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90' },
              { name: '90+ Days', condition: 'DATEDIFF(day, due_date, GETDATE()) > 90' }
            ];
            
            for (const bucket of buckets) {
              const query = `SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND ${bucket.condition}`;
              console.log(`${bucket.name}:`);
              console.log(query);
              console.log();
            }
          } catch (agingError) {
            console.error(`Error calculating aging: ${agingError.message}`);
          }
        }
      } else {
        console.log('⚠️ ar_open_items table exists but contains no data');
      }
    } catch (arOpenItemsError) {
      console.error(`❌ Error checking ar_open_items table: ${arOpenItemsError.message}`);
      
      // If ar_open_items doesn't exist, look for other tables
      console.log('\n--- Searching for other AR Aging related tables ---');
      
      // Look for tables with "ar" and "aging" in the name
      const arAgingTablesQuery = `
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE 
          (TABLE_NAME LIKE '%ar%aging%' OR 
           TABLE_NAME LIKE '%aging%report%' OR
           TABLE_NAME LIKE '%ar%open%')
          AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;
      
      const arAgingTables = await connection.query(arAgingTablesQuery);
      console.log(`Found ${arAgingTables.length} potential AR aging tables:`);
      
      for (const table of arAgingTables) {
        const fullTableName = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
        console.log(`- ${fullTableName}`);
        
        // Check columns in this table
        const columnsQuery = `
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
            AND TABLE_NAME = '${table.TABLE_NAME}'
          ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await connection.query(columnsQuery);
        console.log(`  Table has ${columns.length} columns`);
        
        // Try to get a sample row
        try {
          const sampleQuery = `SELECT TOP 1 * FROM ${fullTableName}`;
          const sample = await connection.query(sampleQuery);
          
          if (sample.length > 0) {
            console.log(`  Sample row: ${JSON.stringify(sample[0], null, 2)}`);
          } else {
            console.log('  Table exists but contains no data');
          }
        } catch (sampleError) {
          console.error(`  Error getting sample: ${sampleError.message}`);
        }
      }
    }
    
    // Check if there's a view or stored procedure for AR aging
    console.log('\n--- Checking for AR Aging views or stored procedures ---');
    
    const viewsQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE 
        TABLE_NAME LIKE '%ar%aging%' OR 
        TABLE_NAME LIKE '%aging%report%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const views = await connection.query(viewsQuery);
    console.log(`Found ${views.length} potential AR aging views:`);
    
    for (const view of views) {
      const fullViewName = `${view.TABLE_SCHEMA}.${view.TABLE_NAME}`;
      console.log(`- ${fullViewName}`);
      
      // Try to get a sample row
      try {
        const sampleQuery = `SELECT TOP 5 * FROM ${fullViewName}`;
        const sample = await connection.query(sampleQuery);
        
        if (sample.length > 0) {
          console.log(`  Sample row: ${JSON.stringify(sample[0], null, 2)}`);
          
          // Try to identify aging buckets in this view
          const columnsQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${view.TABLE_SCHEMA}' 
              AND TABLE_NAME = '${view.TABLE_NAME}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columns = await connection.query(columnsQuery);
          
          // Look for columns that might represent aging buckets
          const bucketColumns = columns.filter(col => 
            col.COLUMN_NAME.toLowerCase().includes('current') || 
            col.COLUMN_NAME.toLowerCase().includes('30') ||
            col.COLUMN_NAME.toLowerCase().includes('60') ||
            col.COLUMN_NAME.toLowerCase().includes('90') ||
            col.COLUMN_NAME.toLowerCase().includes('bucket') ||
            col.COLUMN_NAME.toLowerCase().includes('aging')
          );
          
          if (bucketColumns.length > 0) {
            console.log('  Potential aging bucket columns:');
            bucketColumns.forEach(col => {
              console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
            
            // Generate sample queries for these columns
            console.log('\n  Suggested AR Aging Queries using this view:');
            
            for (const col of bucketColumns) {
              const query = `SELECT ISNULL(SUM(${col.COLUMN_NAME}), 0) as value FROM ${fullViewName}`;
              console.log(`  ${col.COLUMN_NAME}:`);
              console.log(`  ${query}`);
              console.log();
            }
          }
        } else {
          console.log('  View exists but contains no data');
        }
      } catch (sampleError) {
        console.error(`  Error getting sample from view: ${sampleError.message}`);
      }
    }
    
    // Check for stored procedures
    const procsQuery = `
      SELECT 
        ROUTINE_SCHEMA,
        ROUTINE_NAME
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE 
        ROUTINE_TYPE = 'PROCEDURE' AND
        (ROUTINE_NAME LIKE '%ar%aging%' OR 
         ROUTINE_NAME LIKE '%aging%report%')
      ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME
    `;
    
    const procs = await connection.query(procsQuery);
    console.log(`\nFound ${procs.length} potential AR aging stored procedures:`);
    
    for (const proc of procs) {
      console.log(`- ${proc.ROUTINE_SCHEMA}.${proc.ROUTINE_NAME}`);
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Data Search Completed ===');
}

// Run the search
findArAgingData()
  .then(() => {
    console.log('Search completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
