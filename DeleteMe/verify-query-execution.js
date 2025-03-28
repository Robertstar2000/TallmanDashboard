// Script to verify query execution in both test and production modes
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

// Mock the executeQuery function for testing
async function mockExecuteQuery(params) {
  const { server, sql, testMode } = params;
  
  console.log(`Executing query in ${testMode === false ? 'PRODUCTION' : 'TEST'} mode`);
  console.log(`Server: ${server}, SQL: ${sql}`);
  
  // For test mode, extract row ID from SQL comment and get test value
  if (testMode !== false) {
    const rowIdMatch = sql.match(/-- ROW_ID: ([a-zA-Z0-9_-]+)/);
    const rowId = rowIdMatch ? rowIdMatch[1] : null;
    
    if (rowId) {
      console.log(`Found row ID in SQL comment: ${rowId}`);
      const testValue = await getTestValueForRowId(rowId);
      console.log(`Test value for row ${rowId}: ${testValue}`);
      return { success: true, value: testValue };
    }
    
    console.log('No row ID found in SQL comment, returning default test value');
    return { success: true, value: 123 };
  }
  
  // For production mode, just return a mock value
  console.log('Production mode, returning mock value');
  return { success: true, value: 456 };
}

// Get test value for a row ID
async function getTestValueForRowId(rowId) {
  try {
    const db = sqlite3(dbPath);
    
    // Check if the row exists in test_data_mapping
    const row = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(rowId);
    
    if (row) {
      const value = parseFloat(row.test_value);
      console.log(`Found stored test value for row ${rowId}: ${value}`);
      db.close();
      return value;
    }
    
    // If not found, generate a value
    console.log(`No stored test value found for row ${rowId}, generating default`);
    db.close();
    return 789;
  } catch (error) {
    console.error(`Error getting test value for row ${rowId}:`, error);
    return 0;
  }
}

// Mock the background worker's executeQueryForRow function
async function executeQueryForRow(row, isProduction) {
  let value = 0;
  
  try {
    // Get the SQL expression based on the mode (test or production)
    const sql = isProduction ? row.productionSqlExpression?.trim() : row.sqlExpression?.trim();
    if (!sql) {
      console.log(`No SQL expression for row ${row.id} in ${isProduction ? 'production' : 'test'} mode`);
      return { value };
    }
    
    // Get the server name
    const serverName = row.serverName?.toUpperCase();
    if (!serverName || (serverName !== 'P21' && serverName !== 'POR')) {
      console.log(`Invalid server name for row ${row.id}: ${serverName}`);
      return { value };
    }
    
    const upperServerName = serverName.toUpperCase();
    
    // Add row ID as a SQL comment for test value generation
    const sqlWithRowId = `${sql} -- ROW_ID: ${row.id}`;
    
    // Execute the query
    const result = await mockExecuteQuery({
      server: upperServerName,
      sql: sqlWithRowId,
      tableName: row.tableName,
      testMode: !isProduction // Set test mode based on isProduction flag
    });
    
    console.log(`Query result:`, result);
    
    if (result && result.value !== undefined) {
      value = typeof result.value === 'number' ? result.value : 0;
      console.log(`Final value for ${row.chartName || 'Unknown Chart'} - ${row.variableName || 'Unknown Variable'}: ${value}`);
    } else {
      console.log(`No result for ${row.chartName || 'Unknown Chart'} - ${row.variableName || 'Unknown Variable'}, using default value 0`);
      value = 0;
    }
  } catch (error) {
    console.error(`Error executing query for ${row.serverName}:`, error);
    value = 0;
  }
  
  return { value };
}

async function main() {
  try {
    const db = sqlite3(dbPath);
    
    // Get a few sample rows from the database
    const rows = db.prepare(`
      SELECT 
        id, 
        chart_name as "chartName", 
        variable_name as "variableName", 
        server_name as "serverName", 
        db_table_name as "tableName", 
        sql_expression as "sqlExpression", 
        production_sql_expression as "productionSqlExpression", 
        value, 
        transformer
      FROM chart_data 
      LIMIT 3
    `).all();
    
    console.log(`\nFound ${rows.length} sample rows`);
    
    // Test each row in both test and production modes
    for (const row of rows) {
      console.log(`\n=== Testing row ${row.id}: ${row.chartName} - ${row.variableName} ===`);
      
      console.log(`SQL Expression: ${row.sqlExpression}`);
      console.log(`Production SQL Expression: ${row.productionSqlExpression}`);
      
      // Test in test mode
      console.log(`\nTesting in TEST mode:`);
      const testResult = await executeQueryForRow(row, false);
      console.log(`Test mode result: ${testResult.value}`);
      
      // Test in production mode
      console.log(`\nTesting in PRODUCTION mode:`);
      const prodResult = await executeQueryForRow(row, true);
      console.log(`Production mode result: ${prodResult.value}`);
    }
    
    // Check test_data_mapping table
    const testDataCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    console.log(`\nTest data mapping table has ${testDataCount} entries`);
    
    // Sample test data
    const testData = db.prepare('SELECT id, test_value FROM test_data_mapping LIMIT 5').all();
    console.log('\nSample test data:');
    testData.forEach(row => {
      console.log(`- ${row.id}: ${row.test_value}`);
    });
    
    db.close();
    console.log('\nVerification completed');
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

main();
