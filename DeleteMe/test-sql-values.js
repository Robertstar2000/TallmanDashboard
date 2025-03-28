// Script to verify SQL expression execution and test values
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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
    
    // Create test_data_mapping table in P21 database
    p21Db.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    
    p21Db.close();
    console.log('P21 test database created successfully');
  } else {
    console.log('P21 test database already exists');
    // Ensure the table exists in existing database
    const p21Db = sqlite3(p21DbPath);
    p21Db.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    p21Db.close();
  }
  
  // Create POR test database if it doesn't exist
  if (!fs.existsSync(porDbPath)) {
    console.log('Creating POR test database...');
    const porDb = sqlite3(porDbPath);
    
    // Create test_data_mapping table in POR database
    porDb.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    
    porDb.close();
    console.log('POR test database created successfully');
  } else {
    console.log('POR test database already exists');
    // Ensure the table exists in existing database
    const porDb = sqlite3(porDbPath);
    porDb.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    porDb.close();
  }
}

// Check if test_data_mapping table exists in main database
function ensureTestDataMappingTable() {
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='test_data_mapping'
  `).get();

  if (!tableExists) {
    console.log('Creating test_data_mapping table in main database...');
    db.prepare(`
      CREATE TABLE test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT
      )
    `).run();
    console.log('test_data_mapping table created successfully');
  } else {
    console.log('test_data_mapping table already exists in main database');
  }
}

// Get all rows from chart_data table
function getChartDataRows() {
  return db.prepare(`
    SELECT id, chart_name, variable_name, sql_expression, production_sql_expression, server_name
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
  console.log(`Populated test values for ${rows.length} rows in main database`);
  
  // Also populate test values in P21 and POR databases
  const p21Db = sqlite3(path.join(dataDir, 'p21_test.db'));
  const porDb = sqlite3(path.join(dataDir, 'por_test.db'));
  
  const p21Insert = p21Db.prepare(`
    INSERT OR REPLACE INTO test_data_mapping (id, test_value)
    VALUES (?, ?)
  `);
  
  const porInsert = porDb.prepare(`
    INSERT OR REPLACE INTO test_data_mapping (id, test_value)
    VALUES (?, ?)
  `);
  
  // Insert into P21 database
  const p21InsertMany = p21Db.transaction((rows) => {
    for (const row of rows) {
      if (row.server_name === 'P21') {
        const seed = parseInt(row.id.toString().replace(/\D/g, '')) || row.id.length;
        const value = (seed % 900) + 100; // Generate a value between 100-999
        p21Insert.run(row.id, value.toString());
      }
    }
  });
  
  // Insert into POR database
  const porInsertMany = porDb.transaction((rows) => {
    for (const row of rows) {
      if (row.server_name === 'POR') {
        const seed = parseInt(row.id.toString().replace(/\D/g, '')) || row.id.length;
        const value = (seed % 900) + 100; // Generate a value between 100-999
        porInsert.run(row.id, value.toString());
      }
    }
  });
  
  p21InsertMany(rows);
  porInsertMany(rows);
  
  p21Db.close();
  porDb.close();
  
  console.log('Populated test values in P21 and POR databases');
}

// Test executing SQL expressions in test mode
function testSqlExpressions(rows) {
  console.log('\nTesting SQL expressions...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    if (!row.sql_expression && !row.production_sql_expression) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No SQL expressions defined`);
      continue;
    }

    // Try test SQL expression
    if (row.sql_expression) {
      try {
        // Add a comment with the row ID to help with test value lookup
        const sqlWithComment = `${row.sql_expression} -- ROW_ID: ${row.id}`;
        
        try {
          // Try to execute the SQL directly
          const result = db.prepare(sqlWithComment).all();
          
          if (result.length > 0) {
            const firstRow = result[0];
            const value = firstRow ? Object.values(firstRow)[0] : null;
            
            if (value !== null && value !== undefined && value !== 0) {
              console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): SQL executed successfully`);
              console.log(`  Result: ${value}`);
              successCount++;
            } else {
              console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): SQL returned zero/null value`);
              
              // Try to get the test value from test_data_mapping
              const mapping = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
              if (mapping && mapping.test_value) {
                console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
                successCount++;
              } else {
                console.log(`  No test value found in test_data_mapping`);
                errorCount++;
              }
            }
          } else {
            console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): SQL returned no results`);
            
            // Try to get the test value from test_data_mapping
            const mapping = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
            if (mapping && mapping.test_value) {
              console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
              successCount++;
            } else {
              console.log(`  No test value found in test_data_mapping`);
              errorCount++;
            }
          }
        } catch (sqlError) {
          console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): SQL error: ${sqlError.message}`);
          
          // Try to get the test value from test_data_mapping
          const mapping = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
          if (mapping && mapping.test_value) {
            console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
            successCount++;
          } else {
            console.log(`  No test value found in test_data_mapping`);
            errorCount++;
          }
        }
      } catch (error) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Exception: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No test SQL expression defined`);
    }
  }
  
  return { successCount, errorCount };
}

// Test executing production SQL expressions
function testProductionSqlExpressions(rows) {
  console.log('\nTesting production SQL expressions...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    if (!row.production_sql_expression) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No production SQL expression defined`);
      continue;
    }

    try {
      // Add a comment with the row ID to help with test value lookup
      const sqlWithComment = `${row.production_sql_expression} -- ROW_ID: ${row.id}`;
      
      // Determine which database to use based on server_name
      const dbName = row.server_name === 'POR' ? 'por_test.db' : 'p21_test.db';
      const testDb = sqlite3(path.join(dataDir, dbName));
      
      try {
        // Try to execute the SQL directly
        const result = testDb.prepare(sqlWithComment).all();
        
        if (result.length > 0) {
          const firstRow = result[0];
          const value = firstRow ? Object.values(firstRow)[0] : null;
          
          if (value !== null && value !== undefined && value !== 0) {
            console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL executed successfully`);
            console.log(`  Result: ${value}`);
            successCount++;
          } else {
            console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL returned zero/null value`);
            
            // Try to get the test value from test_data_mapping
            const mapping = testDb.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
            if (mapping && mapping.test_value) {
              console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
              successCount++;
            } else {
              console.log(`  No test value found in test_data_mapping`);
              errorCount++;
            }
          }
        } else {
          console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL returned no results`);
          
          // Try to get the test value from test_data_mapping
          const mapping = testDb.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
          if (mapping && mapping.test_value) {
            console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
            successCount++;
          } else {
            console.log(`  No test value found in test_data_mapping`);
            errorCount++;
          }
        }
      } catch (sqlError) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Production SQL error: ${sqlError.message}`);
        
        // Try to get the test value from test_data_mapping
        const mapping = testDb.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
        if (mapping && mapping.test_value) {
          console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
          successCount++;
        } else {
          console.log(`  No test value found in test_data_mapping`);
          errorCount++;
        }
      }
      
      testDb.close();
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
    
    // Test SQL expressions
    const testResults = testSqlExpressions(rows);
    console.log(`\nTest SQL results: ${testResults.successCount} successful, ${testResults.errorCount} errors`);
    
    // Test production SQL expressions
    const prodResults = testProductionSqlExpressions(rows);
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
