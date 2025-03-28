const odbc = require('odbc');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to verify that all chart group SQL queries return non-zero results from P21
 */
async function verifyQueries() {
  console.log('=== Verifying All SQL Queries Return Non-Zero Results ===');
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
    
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    
    // Test one sample query from each chart group
    for (const group of chartGroups) {
      const chartGroup = group.chart_group;
      console.log(`\n=== Testing ${chartGroup} Query ===`);
      
      // Get a sample row from the chart group
      const sampleRow = await db.get(`
        SELECT id, chart_group, variable_name, sql_expression, db_table_name
        FROM chart_data
        WHERE chart_group = ?
        LIMIT 1
      `, [chartGroup]);
      
      if (!sampleRow) {
        console.log(`No rows found for chart group: ${chartGroup}`);
        continue;
      }
      
      console.log(`Testing: ${sampleRow.variable_name} (ID: ${sampleRow.id})`);
      console.log(`SQL: ${sampleRow.sql_expression}`);
      
      try {
        // Execute the query
        const result = await connection.query(sampleRow.sql_expression);
        
        // Display the result
        if (result && result.length > 0) {
          const value = result[0].value !== null ? result[0].value : 0;
          console.log(`Result: ${value}`);
          
          if (value > 0) {
            console.log('✅ Query returns non-zero result');
            totalSuccessCount++;
          } else {
            console.log('⚠️ Query returns zero result');
            totalFailureCount++;
          }
        } else {
          console.log('⚠️ Query returned no results');
          totalFailureCount++;
        }
      } catch (error) {
        console.error(`❌ Error executing query:`, error.message);
        totalFailureCount++;
      }
    }
    
    console.log(`\n=== Verification Summary ===`);
    console.log(`Total chart groups: ${chartGroups.length}`);
    console.log(`Successful queries (non-zero results): ${totalSuccessCount}`);
    console.log(`Failed queries (zero results or errors): ${totalFailureCount}`);
    
    if (totalSuccessCount === chartGroups.length) {
      console.log('\n✅ All chart groups have queries that return non-zero results!');
    } else {
      console.log(`\n⚠️ ${totalFailureCount} chart groups have queries that need further adjustment.`);
    }
    
    // Close the connections
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
    await db.close();
    console.log('✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== SQL Queries Verification Completed ===');
}

// Run the verification function
verifyQueries()
  .then(() => {
    console.log('Verification completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
