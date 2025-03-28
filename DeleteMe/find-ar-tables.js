const odbc = require('odbc');

/**
 * Script to find all tables related to accounts receivable in the P21 database
 */
async function findArTables() {
  console.log('=== Finding AR Tables in P21 ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Search for tables related to accounts receivable
    console.log('\n--- Searching for AR tables ---');
    
    const arTablesQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME LIKE '%ar%' OR
        TABLE_NAME LIKE '%account%receiv%' OR
        TABLE_NAME LIKE '%aging%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arTables = await connection.query(arTablesQuery);
    console.log(`Found ${arTables.length} potential AR tables:`);
    
    for (const table of arTables) {
      console.log(`- ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
      
      // Check if this table has columns related to aging or balances
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${table.TABLE_SCHEMA}' 
          AND TABLE_NAME = '${table.TABLE_NAME}'
          AND (
            COLUMN_NAME LIKE '%amount%' OR
            COLUMN_NAME LIKE '%balance%' OR
            COLUMN_NAME LIKE '%due%' OR
            COLUMN_NAME LIKE '%aging%' OR
            COLUMN_NAME LIKE '%day%' OR
            COLUMN_NAME LIKE '%date%'
          )
        ORDER BY ORDINAL_POSITION
      `;
      
      try {
        const columns = await connection.query(columnsQuery);
        if (columns.length > 0) {
          console.log(`  Found ${columns.length} relevant columns:`);
          columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
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
        } else {
          console.log('  No relevant columns found');
        }
      } catch (columnsError) {
        console.log(`  Error getting columns: ${columnsError.message}`);
      }
      
      console.log(''); // Add a blank line for readability
    }
    
    // Search for views related to accounts receivable
    console.log('\n--- Searching for AR views ---');
    
    const arViewsQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE 
        TABLE_NAME LIKE '%ar%' OR
        TABLE_NAME LIKE '%account%receiv%' OR
        TABLE_NAME LIKE '%aging%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const arViews = await connection.query(arViewsQuery);
    console.log(`Found ${arViews.length} potential AR views:`);
    
    for (const view of arViews) {
      console.log(`- ${view.TABLE_SCHEMA}.${view.TABLE_NAME}`);
      
      // Check if this view has columns related to aging or balances
      const viewColumnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${view.TABLE_SCHEMA}' 
          AND TABLE_NAME = '${view.TABLE_NAME}'
          AND (
            COLUMN_NAME LIKE '%amount%' OR
            COLUMN_NAME LIKE '%balance%' OR
            COLUMN_NAME LIKE '%due%' OR
            COLUMN_NAME LIKE '%aging%' OR
            COLUMN_NAME LIKE '%day%' OR
            COLUMN_NAME LIKE '%date%'
          )
        ORDER BY ORDINAL_POSITION
      `;
      
      try {
        const viewColumns = await connection.query(viewColumnsQuery);
        if (viewColumns.length > 0) {
          console.log(`  Found ${viewColumns.length} relevant columns:`);
          viewColumns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
          });
          
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
        } else {
          console.log('  No relevant columns found');
        }
      } catch (viewColumnsError) {
        console.log(`  Error getting columns: ${viewColumnsError.message}`);
      }
      
      console.log(''); // Add a blank line for readability
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Tables Search Completed ===');
}

// Run the search
findArTables()
  .then(() => {
    console.log('Search completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
