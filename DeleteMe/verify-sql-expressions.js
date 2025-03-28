const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

try {
  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory at ${dataDir}`);
  }

  // Path to the database
  const dbPath = path.resolve(dataDir, 'dashboard.db');
  console.log(`Database path: ${dbPath}`);

  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Database file does not exist at ${dbPath}`);
    process.exit(1);
  }

  // Create or open the database
  console.log(`Opening database at ${dbPath}`);
  const db = sqlite3(dbPath);

  // Function to verify SQL expressions in the database
  function verifySpreadsheetRows() {
    console.log('Verifying spreadsheet rows and SQL expressions...');
    
    try {
      // Check if the chart_data table exists
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'").get();
      if (!tableExists) {
        console.error('Error: chart_data table does not exist');
        return;
      }
      
      // Get the table schema
      console.log('\nChart data table schema:');
      const schema = db.prepare("PRAGMA table_info(chart_data)").all();
      schema.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      // Check if production_sql_expression column exists
      const hasProductionSqlExpression = schema.some(col => col.name === 'production_sql_expression');
      console.log(`\nProduction SQL Expression column exists: ${hasProductionSqlExpression}`);
      
      // Get a sample of rows from the chart_data table
      console.log('\nSample rows from chart_data table:');
      const rows = db.prepare("SELECT id, chart_name, variable_name, server_name, production_sql_expression FROM chart_data LIMIT 5").all();
      
      if (rows.length === 0) {
        console.log('No rows found in chart_data table');
      } else {
        rows.forEach((row, index) => {
          console.log(`\nRow ${index + 1}:`);
          console.log(`- ID: ${row.id}`);
          console.log(`- Chart: ${row.chart_name}`);
          console.log(`- Variable: ${row.variable_name}`);
          console.log(`- Server: ${row.server_name}`);
          console.log(`- Production SQL Expression: ${row.production_sql_expression ? row.production_sql_expression.substring(0, 100) + '...' : 'NULL'}`);
        });
      }
      
      // Count rows with missing production_sql_expression
      const missingCount = db.prepare("SELECT COUNT(*) as count FROM chart_data WHERE production_sql_expression IS NULL OR production_sql_expression = ''").get();
      console.log(`\nRows with missing production_sql_expression: ${missingCount.count}`);
      
      // List all tables in the database
      console.log('\nAll tables in the database:');
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      tables.forEach(table => {
        console.log(`- ${table.name}`);
      });
      
      // Check if test_data_mapping table exists
      const testTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'").get();
      console.log(`\nTest data mapping table exists: ${!!testTableExists}`);
      
      if (testTableExists) {
        // Get a sample of test data mappings
        console.log('\nSample rows from test_data_mapping table:');
        const testRows = db.prepare("SELECT * FROM test_data_mapping LIMIT 5").all();
        
        if (testRows.length === 0) {
          console.log('No rows found in test_data_mapping table');
        } else {
          testRows.forEach((row, index) => {
            console.log(`\nTest Row ${index + 1}:`);
            console.log(`- ID: ${row.id}`);
            console.log(`- Test Value: ${row.test_value}`);
          });
        }
      }
    } catch (error) {
      console.error('Error verifying spreadsheet rows:', error);
    }
  }

  // Execute the verification
  verifySpreadsheetRows();

  // Close the database connection
  db.close();
  console.log('\nVerification complete');
} catch (error) {
  console.error('Fatal error:', error);
}
