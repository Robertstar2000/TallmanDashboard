// Script to create test values for all rows in the chart_data table
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Creating test values in database at: ${dbPath}`);

function main() {
  try {
    // Open the database
    const db = sqlite3(dbPath);
    
    // Create test_data_mapping table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT NOT NULL
      )
    `);
    
    // Get all rows from chart_data
    const rows = db.prepare(`
      SELECT id, chart_name, variable_name, server_name
      FROM chart_data
    `).all();
    
    console.log(`Found ${rows.length} rows in chart_data table`);
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    // Clear existing test data
    db.prepare('DELETE FROM test_data_mapping').run();
    console.log('Cleared existing test data');
    
    // Insert test values for each row
    const insertStmt = db.prepare(`
      INSERT INTO test_data_mapping (id, test_value) VALUES (?, ?)
    `);
    
    let insertCount = 0;
    for (const row of rows) {
      // Generate a test value based on the row ID
      const seed = parseInt(row.id.replace(/\\D/g, '')) || 1;
      const testValue = (seed % 900) + 100; // Generate a value between 100-999
      
      // Insert the test value mapping
      insertStmt.run(row.id, testValue.toString());
      insertCount++;
      
      if (insertCount % 10 === 0) {
        console.log(`Created test values for ${insertCount}/${rows.length} rows`);
      }
    }
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log(`Test data creation complete. Created ${insertCount} test data mappings.`);
    
    // Verify the test data
    const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    console.log(`Verification: ${testCount} test values in test_data_mapping table`);
    
    // Show a few sample test values
    const samples = db.prepare('SELECT id, test_value FROM test_data_mapping LIMIT 5').all();
    console.log('Sample test values:');
    samples.forEach(sample => {
      console.log(`- Row ${sample.id}: ${sample.test_value}`);
    });
    
    db.close();
  } catch (error) {
    console.error('Error creating test values:', error);
  }
}

main();
