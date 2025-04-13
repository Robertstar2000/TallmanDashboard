// Script to verify SQL expression execution in both test and production modes
// This script tests our fixes for SQL execution issues
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { executeQuery } = require('../lib/db/query-executor');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the main database
const db = sqlite3(path.join(dataDir, 'dashboard.db'));

// Create test database files if they don't exist
function ensureTestDatabases() {
  const p21DbPath = path.join(dataDir, 'p21_test.db');
  const porDbPath = path.join(dataDir, 'por_test.db');
  
  // Create P21 test database if it doesn't exist
  if (!fs.existsSync(p21DbPath)) {
    console.log('Creating P21 test database...');
    const p21Db = sqlite3(p21DbPath);
    p21Db.close();
    console.log('P21 test database created successfully');
  } else {
    console.log('P21 test database already exists');
  }
  
  // Create POR test database if it doesn't exist
  if (!fs.existsSync(porDbPath)) {
    console.log('Creating POR test database...');
    const porDb = sqlite3(porDbPath);
    porDb.close();
    console.log('POR test database created successfully');
  } else {
    console.log('POR test database already exists');
  }
}

// Check if test_data_mapping table exists
function ensureTestDataMappingTable() {
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='test_data_mapping'
  `).get();

  if (!tableExists) {
    console.log('Creating test_data_mapping table...');
    db.prepare(`
      CREATE TABLE test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    console.log('test_data_mapping table created successfully');
  } else {
    console.log('test_data_mapping table already exists');
  }
}

// Get all rows from chart_data table
function getChartDataRows() {
  return db.prepare(`
    SELECT id, chart_name, variable_name, sql_expression, sql_expression, server_name
    FROM chart_data
  `).all();
}

// Create test values for each row
function populateTestValues(rows) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO test_data_mapping (id, test_value)
    VALUES (?, ?)
  `);

  // Begin transaction
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const seed = parseInt(row.id.toString().replace(/\D/g, '')) || row.id.length;
      const value = (seed % 900) + 100; // Generate a value between 100-999
      insert.run(row.id, value.toString());
    }
  });

  insertMany(rows);
  console.log(`Populated test values for ${rows.length} rows`);
}

// Test executing SQL expressions in test mode
async function testSqlExpressions(rows) {
  console.log('\nTesting SQL expressions in test mode...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    if (!row.sql_expression && !row.sql_expression) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No SQL expressions defined`);
      continue;
    }

    // Try test SQL expression
    if (row.sql_expression) {
      try {
        // Test using our executeQuery function
        const result = await executeQuery({
          server: row.server_name || 'P21',
          sql: row.sql_expression,
          rowId: row.id,
          testMode: true
        });
        
        if (result.success && result.value !== undefined && result.value !== null && result.value !== 0) {
          console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL executed successfully`);
          console.log(`  Result: ${result.value}`);
          successCount++;
        } else if (result.success && (result.value === 0 || result.value === null || result.value === undefined)) {
          console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL returned zero/null value`);
          console.log(`  Result: ${result.value}`);
          errorCount++;
        } else {
          console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL error: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL exception: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No test SQL expression defined`);
    }
  }
  
  return { successCount, errorCount };
}

// Test executing production SQL expressions
async function testsqlExpressions(rows) {
  console.log('\nTesting production SQL expressions...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    if (!row.sql_expression) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No production SQL expression defined`);
      continue;
    }

    try {
      // Test using our executeQuery function
      const result = await executeQuery({
        server: row.server_name || 'P21',
        sql: row.sql_expression,
        rowId: row.id,
        testMode: false
      });
      
      if (result.success && result.value !== undefined && result.value !== null && result.value !== 0) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL executed successfully`);
        console.log(`  Result: ${result.value}`);
        successCount++;
      } else if (result.success && (result.value === 0 || result.value === null || result.value === undefined)) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL returned zero/null value`);
        console.log(`  Result: ${result.value}`);
        errorCount++;
      } else {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL error: ${result.error}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL exception: ${error.message}`);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Main function
async function main() {
  try {
    console.log('Verifying SQL expression execution...');
    
    // Ensure test databases exist
    ensureTestDatabases();
    
    // Ensure test_data_mapping table exists
    ensureTestDataMappingTable();
    
    // Get all rows from chart_data
    const rows = getChartDataRows();
    console.log(`Found ${rows.length} rows in chart_data table`);
    
    // Populate test values
    populateTestValues(rows);
    
    // Test SQL expressions in test mode
    const testResults = await testSqlExpressions(rows);
    console.log(`\nTest SQL results: ${testResults.successCount} successful, ${testResults.errorCount} errors`);
    
    // Test production SQL expressions
    const prodResults = await testsqlExpressions(rows);
    console.log(`\nProduction SQL results: ${prodResults.successCount} successful, ${prodResults.errorCount} errors`);
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the main function
main();

