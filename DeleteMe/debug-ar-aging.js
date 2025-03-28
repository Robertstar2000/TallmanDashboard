const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const odbc = require('odbc');

/**
 * Script to debug AR Aging data in the dashboard
 */
async function debugArAging() {
  console.log('=== Debugging AR Aging Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // First, check the SQLite database to see what's stored there
    console.log('\n--- Checking AR Aging data in SQLite database ---');
    
    // Open the SQLite database
    const db = await open({
      filename: './tallman-dashboard.db',
      driver: sqlite3.Database
    });
    
    // First, check what tables exist in the database
    console.log('Checking available tables in SQLite database...');
    const tablesQuery = `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    const tables = await db.all(tablesQuery);
    console.log('Available tables:', tables.map(t => t.name).join(', '));
    
    // Find a table that might contain our data
    let targetTable = '';
    for (const table of tables) {
      // Try to get schema for each table
      const schemaQuery = `PRAGMA table_info(${table.name})`;
      const columns = await db.all(schemaQuery);
      
      console.log(`Table ${table.name} columns:`, columns.map(c => c.name).join(', '));
      
      // Look for tables with chart_group or similar columns
      const hasChartGroup = columns.some(c => 
        c.name.toLowerCase().includes('chart') || 
        c.name.toLowerCase().includes('group') ||
        c.name.toLowerCase().includes('aging')
      );
      
      if (hasChartGroup) {
        console.log(`Found potential target table: ${table.name}`);
        targetTable = table.name;
        break;
      }
    }
    
    if (!targetTable) {
      console.log('Could not find a table with chart data. Checking all tables for AR Aging data...');
      
      // Try to find any table with data that might be related to AR Aging
      for (const table of tables) {
        try {
          const sampleQuery = `SELECT * FROM ${table.name} LIMIT 5`;
          const sampleData = await db.all(sampleQuery);
          console.log(`Sample data from ${table.name}:`, JSON.stringify(sampleData, null, 2));
        } catch (error) {
          console.log(`Error querying ${table.name}:`, error.message);
        }
      }
    } else {
      // Get all rows with chart_group = 'AR Aging' or similar
      const sqliteQuery = `
        SELECT * FROM ${targetTable}
        WHERE chart_group = 'AR Aging' 
           OR chart_name LIKE '%aging%' 
           OR variable_name LIKE '%aging%'
        ORDER BY id
      `;
      
      try {
        const sqliteRows = await db.all(sqliteQuery);
        console.log(`Found ${sqliteRows.length} AR Aging rows in SQLite database (table: ${targetTable}):`);
        
        for (const row of sqliteRows) {
          console.log(`- Row:`, JSON.stringify(row, null, 2));
        }
      } catch (error) {
        console.log(`Error querying ${targetTable} for AR Aging data:`, error.message);
        
        // Try a more generic query
        console.log('Trying a more generic query...');
        const genericQuery = `SELECT * FROM ${targetTable} LIMIT 10`;
        const genericRows = await db.all(genericQuery);
        console.log(`Sample data from ${targetTable}:`, JSON.stringify(genericRows, null, 2));
      }
    }
    
    // Close the SQLite database
    await db.close();
    
    // Now, check the P21 database to see what data is available
    console.log('\n--- Checking AR Aging data in P21 database ---');
    
    // Connect to the P21 database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Test each AR Aging query
    console.log('\n--- Testing AR Aging Queries ---');
    
    // Current
    const currentQuery = "SELECT COALESCE(SUM(current_due), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const currentResult = await connection.query(currentQuery);
    console.log(`Current: $${currentResult[0].value.toFixed(2)}`);
    
    // 1-30 Days
    const days1To30Query = "SELECT COALESCE(SUM(past_due_1_30), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days1To30Result = await connection.query(days1To30Query);
    console.log(`1-30 Days: $${days1To30Result[0].value.toFixed(2)}`);
    
    // 31-60 Days
    const days31To60Query = "SELECT COALESCE(SUM(past_due_30_60), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days31To60Result = await connection.query(days31To60Query);
    console.log(`31-60 Days: $${days31To60Result[0].value.toFixed(2)}`);
    
    // 61-90 Days
    const days61To90Query = "SELECT COALESCE(SUM(past_due_60_90), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days61To90Result = await connection.query(days61To90Query);
    console.log(`61-90 Days: $${days61To90Result[0].value.toFixed(2)}`);
    
    // 90+ Days
    const days90PlusQuery = "SELECT COALESCE(SUM(past_due_over90), 0) as value FROM dbo.p21_view_asst_customer_aging";
    const days90PlusResult = await connection.query(days90PlusQuery);
    console.log(`90+ Days: $${days90PlusResult[0].value.toFixed(2)}`);
    
    // Close the P21 connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Debug Completed ===');
}

// Run the debug function
debugArAging()
  .then(() => {
    console.log('Debug completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
