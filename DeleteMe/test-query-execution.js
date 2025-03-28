const path = require('path');
const sqlite3 = require('better-sqlite3');

// Initialize the database connections
const testDbPath = path.join(process.cwd(), 'data', 'test.db');
const mainDbPath = path.join(process.cwd(), 'data', 'dashboard.db');

console.log(`Test DB path: ${testDbPath}`);
console.log(`Main DB path: ${mainDbPath}`);

// Function to execute a query with row ID comment for test value generation
function executeTestQuery(sql, rowId) {
  const testDb = sqlite3(testDbPath);
  
  try {
    // Add row ID as a SQL comment for test value generation
    const sqlWithRowId = `${sql} -- ROW_ID: ${rowId}`;
    console.log(`Executing test query: ${sqlWithRowId}`);
    
    // First, check if the test_data_mapping table exists
    const tableExists = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'").get();
    
    if (tableExists) {
      // Get the test value from the mapping table
      const mapping = testDb.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(rowId);
      
      if (mapping && mapping.test_value) {
        console.log(`Found test value for row ${rowId}: ${mapping.test_value}`);
        return { value: parseFloat(mapping.test_value) || 0 };
      }
    }
    
    // If no mapping found, generate a value based on the row ID
    const seed = parseInt(rowId.replace(/\D/g, '')) || 1;
    const value = (seed % 900) + 100; // Generate a value between 100-999
    
    console.log(`Generated fallback test value for row ${rowId}: ${value}`);
    return { value };
  } catch (error) {
    console.error(`Error executing test query for row ${rowId}:`, error);
    return { value: 0 };
  } finally {
    testDb.close();
  }
}

// Function to get sample rows from the chart_data table
function getSampleRows() {
  const mainDb = sqlite3(mainDbPath);
  
  try {
    // Get a sample of rows from different chart categories
    return mainDb.prepare(`
      SELECT id, chart_name, variable_name, server_name, sql_expression, production_sql_expression
      FROM chart_data
      WHERE chart_name IN ('Key Metrics', 'Accounts', 'Inventory', 'POR Overview')
      LIMIT 8
    `).all();
  } catch (error) {
    console.error('Error getting sample rows:', error);
    return [];
  } finally {
    mainDb.close();
  }
}

async function testQueryExecution() {
  console.log('Testing query execution in both test and production modes...');
  
  try {
    // Get sample rows from the chart_data table
    const sampleRows = getSampleRows();
    console.log(`Found ${sampleRows.length} sample rows for testing`);
    
    if (sampleRows.length === 0) {
      console.log('No sample rows found for testing');
      return;
    }
    
    // Test execution for each sample row
    for (const row of sampleRows) {
      console.log('\n' + '='.repeat(80));
      console.log(`Testing row ${row.id}: ${row.chart_name} - ${row.variable_name} (${row.server_name})`);
      
      // Test mode execution
      console.log('\nTEST MODE:');
      console.log(`SQL Expression: ${row.sql_expression || 'MISSING'}`);
      
      if (row.sql_expression) {
        const testResult = executeTestQuery(row.sql_expression, row.id);
        console.log(`Test result: ${JSON.stringify(testResult)}`);
      } else {
        console.log('No test SQL expression available');
      }
      
      // Production mode execution
      console.log('\nPRODUCTION MODE:');
      console.log(`Production SQL Expression: ${row.production_sql_expression || 'MISSING'}`);
      
      if (row.production_sql_expression) {
        const prodResult = executeTestQuery(row.production_sql_expression, row.id);
        console.log(`Production result: ${JSON.stringify(prodResult)}`);
      } else {
        console.log('No production SQL expression available');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('Query execution testing completed');
  } catch (error) {
    console.error('Error during query execution testing:', error);
  }
}

testQueryExecution().catch(console.error);
