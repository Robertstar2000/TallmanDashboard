const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to check the remaining chart groups in the SQLite database
 */
async function checkRemainingGroups() {
  console.log('=== Checking Remaining Chart Groups ===');
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
    
    // Get all chart groups from the SQLite database
    const chartGroups = await db.all(`
      SELECT DISTINCT chart_group
      FROM chart_data
      ORDER BY chart_group
    `);
    
    console.log(`\nFound ${chartGroups.length} chart groups in SQLite database:`);
    chartGroups.forEach(group => {
      console.log(`- ${group.chart_group}`);
    });
    
    // Get count of rows for each chart group
    console.log('\n--- Row counts by chart group ---');
    
    for (const group of chartGroups) {
      const count = await db.get(`
        SELECT COUNT(*) as count
        FROM chart_data
        WHERE chart_group = ?
      `, [group.chart_group]);
      
      console.log(`${group.chart_group}: ${count.count} rows`);
    }
    
    // Check for default SQL expressions in each group
    console.log('\n--- Checking for default SQL expressions ---');
    
    for (const group of chartGroups) {
      // Skip the groups we've already updated
      if (group.chart_group === 'Accounts' || group.chart_group === 'Customer Metrics') {
        console.log(`${group.chart_group}: Already updated`);
        continue;
      }
      
      const defaultSqlCount = await db.get(`
        SELECT COUNT(*) as count
        FROM chart_data
        WHERE chart_group = ?
        AND (
          sql_expression LIKE 'SELECT 0%'
          OR sql_expression = ''
          OR sql_expression IS NULL
        )
      `, [group.chart_group]);
      
      const totalCount = await db.get(`
        SELECT COUNT(*) as count
        FROM chart_data
        WHERE chart_group = ?
      `, [group.chart_group]);
      
      console.log(`${group.chart_group}: ${defaultSqlCount.count} out of ${totalCount.count} rows have default SQL expressions`);
      
      // If all rows have default SQL expressions, show a sample row
      if (defaultSqlCount.count > 0) {
        const sampleRow = await db.get(`
          SELECT id, chart_group, variable_name, server_name, sql_expression
          FROM chart_data
          WHERE chart_group = ?
          AND (
            sql_expression LIKE 'SELECT 0%'
            OR sql_expression = ''
            OR sql_expression IS NULL
          )
          LIMIT 1
        `, [group.chart_group]);
        
        console.log(`  Sample row (ID: ${sampleRow.id}): ${sampleRow.variable_name}`);
        console.log(`  SQL: ${sampleRow.sql_expression}`);
      }
    }
    
    // Close the SQLite connection
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== Chart Groups Check Completed ===');
}

// Run the check function
checkRemainingGroups()
  .then(() => {
    console.log('Check completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
