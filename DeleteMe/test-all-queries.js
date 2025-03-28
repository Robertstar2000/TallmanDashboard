const odbc = require('odbc');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to test all updated SQL queries against the P21 database
 * to verify they return non-zero results
 */
async function testAllQueries() {
  console.log('=== Testing All SQL Queries Against P21 Database ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Connect to the P21 database
    console.log('\n--- Connecting to P21 database ---');
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21 database');
    
    // Get all chart groups
    const chartGroups = await db.all(`
      SELECT DISTINCT chart_group
      FROM chart_data
      ORDER BY chart_group
    `);
    
    console.log(`\nFound ${chartGroups.length} chart groups in SQLite database`);
    
    // Test queries for each chart group
    for (const group of chartGroups) {
      const chartGroup = group.chart_group;
      console.log(`\n=== Testing ${chartGroup} Queries ===`);
      
      // Get sample rows from the chart group
      const sampleRows = await db.all(`
        SELECT id, chart_group, variable_name, sql_expression, db_table_name
        FROM chart_data
        WHERE chart_group = ?
        LIMIT 3
      `, [chartGroup]);
      
      if (sampleRows.length === 0) {
        console.log(`No rows found for chart group: ${chartGroup}`);
        continue;
      }
      
      // Test each sample row
      for (const row of sampleRows) {
        console.log(`\nTesting: ${row.variable_name} (ID: ${row.id})`);
        console.log(`SQL: ${row.sql_expression}`);
        
        try {
          // Execute the query
          const result = await connection.query(row.sql_expression);
          
          // Display the result
          if (result && result.length > 0) {
            const value = result[0].value !== null ? result[0].value : 0;
            console.log(`Result: ${value}`);
            
            if (value > 0) {
              console.log('✅ Query returns non-zero result');
            } else {
              console.log('⚠️ Query returns zero result');
            }
          } else {
            console.log('⚠️ Query returned no results');
          }
        } catch (error) {
          console.error(`❌ Error executing query:`, error.message);
        }
      }
    }
    
    // Close the connections
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
    await db.close();
    console.log('✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== SQL Queries Testing Completed ===');
}

// Run the test function
testAllQueries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
