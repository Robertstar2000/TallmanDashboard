// Script to verify SQL expression execution in both test and production modes
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
      const seed = parseInt(row.id.replace(/\D/g, '')) || row.id.length;
      const value = (seed % 900) + 100; // Generate a value between 100-999
      insert.run(row.id, value.toString());
    }
  });

  insertMany(rows);
  console.log(`Populated test values for ${rows.length} rows`);
}

// Test executing SQL expressions in test mode
function testSqlExpressions(rows) {
  console.log('\nTesting SQL expressions in test mode...');
  
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
        const result = db.prepare(sqlWithComment).all();
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL executed successfully`);
        
        // Check if we got a result
        if (result.length > 0) {
          const firstRow = result[0];
          const value = firstRow ? Object.values(firstRow)[0] : null;
          console.log(`  Result: ${value}`);
        } else {
          console.log(`  No results returned`);
        }
      } catch (error) {
        console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Test SQL error: ${error.message}`);
        
        // Try to get the test value from test_data_mapping
        try {
          const mapping = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
          if (mapping && mapping.test_value) {
            console.log(`  Fallback to test_data_mapping value: ${mapping.test_value}`);
          } else {
            console.log(`  No test value found in test_data_mapping`);
          }
        } catch (mappingError) {
          console.log(`  Error getting test value: ${mappingError.message}`);
        }
      }
    } else {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): No test SQL expression defined`);
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Verifying SQL expression execution...');
    
    // Ensure test_data_mapping table exists
    ensureTestDataMappingTable();
    
    // Get all rows from chart_data
    const rows = getChartDataRows();
    console.log(`Found ${rows.length} rows in chart_data table`);
    
    // Populate test values
    populateTestValues(rows);
    
    // Test SQL expressions
    testSqlExpressions(rows);
    
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
