const odbc = require('odbc');

/**
 * Script to find tables specifically related to AR Open Items in the P21 database
 */
async function findArOpenTables() {
  console.log('=== Finding AR Open Items Tables in P21 ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Search for tables specifically related to AR Open Items
    console.log('\n--- Searching for AR Open Items tables ---');
    
    const arOpenTablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME LIKE '%ar_open%' OR
        TABLE_NAME LIKE '%ar%open%' OR
        TABLE_NAME LIKE '%open%item%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arOpenTables = await connection.query(arOpenTablesQuery);
    console.log(`Found ${arOpenTables.length} potential AR Open Items tables:`);
    
    for (const table of arOpenTables) {
      console.log(`\n- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
      
      // Check columns in this table
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
      
      try {
        const columns = await connection.query(columnsQuery);
        console.log(`  Table has ${columns.length} columns:`);
        
        // Look for key columns related to AR aging
        const keyColumns = columns.filter(col => 
          col.COLUMN_NAME.includes('amount') || 
          col.COLUMN_NAME.includes('balance') ||
          col.COLUMN_NAME.includes('due_date') ||
          col.COLUMN_NAME.includes('days_past_due')
        );
        
        if (keyColumns.length > 0) {
          console.log('  Key columns for AR aging:');
          keyColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
        } else {
          console.log('  No key columns for AR aging found');
        }
        
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
      } catch (columnsError) {
        console.log(`  Error getting columns: ${columnsError.message}`);
      }
    }
    
    // Search for views related to AR aging
    console.log('\n--- Searching for AR Aging views ---');
    
    const arAgingViewsQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE 
        TABLE_NAME LIKE '%ar%aging%' OR
        TABLE_NAME LIKE '%aging%report%' OR
        TABLE_NAME LIKE '%account%receiv%aging%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arAgingViews = await connection.query(arAgingViewsQuery);
    console.log(`Found ${arAgingViews.length} potential AR Aging views:`);
    
    for (const view of arAgingViews) {
      console.log(`\n- ${view.TABLE_SCHEMA}.${view.TABLE_NAME}`);
      
      // Check columns in this view
      const viewColumnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${view.TABLE_SCHEMA}' 
          AND TABLE_NAME = '${view.TABLE_NAME}'
        ORDER BY ORDINAL_POSITION
      `;
      
      try {
        const viewColumns = await connection.query(viewColumnsQuery);
        console.log(`  View has ${viewColumns.length} columns:`);
        
        // Look for key columns related to AR aging
        const viewKeyColumns = viewColumns.filter(col => 
          col.COLUMN_NAME.includes('amount') || 
          col.COLUMN_NAME.includes('balance') ||
          col.COLUMN_NAME.includes('due_date') ||
          col.COLUMN_NAME.includes('days_past_due')
        );
        
        if (viewKeyColumns.length > 0) {
          console.log('  Key columns for AR aging:');
          viewKeyColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
        } else {
          console.log('  No key columns for AR aging found');
        }
        
        // Check if this view has data
        const viewCountQuery = `
          SELECT COUNT(*) as row_count
          FROM ${view.TABLE_SCHEMA}.${view.TABLE_NAME}
        `;
        
        try {
          const viewCountResult = await connection.query(viewCountQuery);
          console.log(`  View has ${viewCountResult[0].row_count} rows`);
          
          if (viewCountResult[0].row_count > 0) {
            // Get a sample of data
            const viewSampleQuery = `
              SELECT TOP 5 *
              FROM ${view.TABLE_SCHEMA}.${view.TABLE_NAME}
            `;
            
            try {
              const viewSampleData = await connection.query(viewSampleQuery);
              console.log('  Sample data (first row):');
              console.log(JSON.stringify(viewSampleData[0], null, 2));
            } catch (viewSampleError) {
              console.log(`  Error getting sample data: ${viewSampleError.message}`);
            }
          }
        } catch (viewCountError) {
          console.log(`  Error getting row count: ${viewCountError.message}`);
        }
      } catch (viewColumnsError) {
        console.log(`  Error getting columns: ${viewColumnsError.message}`);
      }
    }
    
    // Search for pub_ar_open_items table specifically
    console.log('\n--- Searching for pub_ar_open_items table ---');
    
    const pubArOpenItemsQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME = 'pub_ar_open_items'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const pubArOpenItems = await connection.query(pubArOpenItemsQuery);
    
    if (pubArOpenItems.length > 0) {
      console.log(`Found ${pubArOpenItems.length} pub_ar_open_items tables:`);
      
      for (const table of pubArOpenItems) {
        console.log(`\n- ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
        
        // Check columns in this table
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
        
        try {
          const columns = await connection.query(columnsQuery);
          console.log(`  Table has ${columns.length} columns:`);
          
          // Look for key columns related to AR aging
          const keyColumns = columns.filter(col => 
            col.COLUMN_NAME.includes('amount') || 
            col.COLUMN_NAME.includes('balance') ||
            col.COLUMN_NAME.includes('due_date') ||
            col.COLUMN_NAME.includes('days_past_due')
          );
          
          if (keyColumns.length > 0) {
            console.log('  Key columns for AR aging:');
            keyColumns.forEach(col => {
              console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
            });
          } else {
            console.log('  No key columns for AR aging found');
          }
          
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
        } catch (columnsError) {
          console.log(`  Error getting columns: ${columnsError.message}`);
        }
      }
    } else {
      console.log('No pub_ar_open_items table found');
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Open Items Tables Search Completed ===');
}

// Run the search
findArOpenTables()
  .then(() => {
    console.log('Search completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
