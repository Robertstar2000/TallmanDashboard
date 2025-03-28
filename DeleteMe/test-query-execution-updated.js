// Test script to verify query execution with productionSqlExpression
const path = require('path');
const sqlite3 = require('better-sqlite3');

// Initialize database connection
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const db = sqlite3(dbPath);

async function testQueryExecution() {
  try {
    console.log('Testing query execution with updated field names...');
    
    // Get a sample row from the chart_data table
    const row = db.prepare(`
      SELECT id, chart_name, variable_name, server_name, 
             sql_expression, production_sql_expression 
      FROM chart_data 
      WHERE production_sql_expression IS NOT NULL 
      LIMIT 1
    `).get();
    
    if (!row) {
      console.error('No rows found with production_sql_expression');
      return;
    }
    
    console.log(`\nSample row:`);
    console.log(`- ID: ${row.id}`);
    console.log(`- Chart: ${row.chart_name}`);
    console.log(`- Variable: ${row.variable_name}`);
    console.log(`- Server: ${row.server_name}`);
    console.log(`- Test SQL: ${row.sql_expression ? row.sql_expression.substring(0, 100) + '...' : 'NULL'}`);
    console.log(`- Production SQL: ${row.production_sql_expression ? row.production_sql_expression.substring(0, 100) + '...' : 'NULL'}`);
    
    // Simulate test mode query execution
    console.log('\nSimulating test mode query execution...');
    const testSql = row.sql_expression;
    if (testSql) {
      console.log(`Using test SQL: ${testSql.substring(0, 100)}...`);
      
      // Add a test row ID comment for test value generation
      const testSqlWithRowId = `${testSql} -- ROW_ID: ${row.id}`;
      console.log(`Test SQL with Row ID: ${testSqlWithRowId.substring(0, 100)}...`);
      
      // Create test_data_mapping entry for this row
      const testValue = Math.floor(Math.random() * 1000);
      try {
        db.prepare('INSERT OR REPLACE INTO test_data_mapping (id, test_value) VALUES (?, ?)').run(row.id, testValue.toString());
        console.log(`Set test value for ${row.id}: ${testValue}`);
      } catch (error) {
        console.error('Error setting test value:', error.message);
      }
    } else {
      console.log('No test SQL expression available');
    }
    
    // Simulate production mode query execution
    console.log('\nSimulating production mode query execution...');
    const prodSql = row.production_sql_expression;
    if (prodSql) {
      console.log(`Using production SQL: ${prodSql.substring(0, 100)}...`);
      
      // In production, we would connect to the real database
      // For this test, we'll just log the SQL that would be executed
      console.log(`Would execute against ${row.server_name} server: ${prodSql.substring(0, 100)}...`);
    } else {
      console.log('No production SQL expression available');
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the test
testQueryExecution().catch(console.error);
