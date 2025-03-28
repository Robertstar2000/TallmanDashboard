// Script to test database queries and identify SQL errors
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Database path: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`Error: Database file does not exist at ${dbPath}`);
  process.exit(1);
}

// Open the database
try {
  console.log(`Opening database at ${dbPath}`);
  const db = sqlite3(dbPath);
  
  // Test queries that might be failing
  console.log('\n=== Testing Database Queries ===');
  
  // 1. Test the chart_data table query
  try {
    console.log('\n1. Testing chart_data SELECT query:');
    const query = `
      SELECT 
        id,
        DataPoint,
        chart_group as "chartGroup",
        chart_name as "chartName",
        variable_name as "variableName",
        server_name as "serverName",
        table_name as "tableName",
        calculation,
        production_sql_expression as "productionSqlExpression",
        value,
        last_updated as "lastUpdated",
        transformer,
        timeframe
      FROM chart_data
      LIMIT 5
    `;
    
    const rows = db.prepare(query).all();
    console.log(`Query successful, returned ${rows.length} rows`);
    console.log('Sample row:', JSON.stringify(rows[0], null, 2));
  } catch (error) {
    console.error('Error executing chart_data SELECT query:', error);
  }
  
  // 2. Test updating a chart_data row
  try {
    console.log('\n2. Testing chart_data UPDATE query:');
    // First, get a sample row ID
    const sampleId = db.prepare('SELECT id FROM chart_data LIMIT 1').get().id;
    console.log(`Using sample ID: ${sampleId}`);
    
    // Try to update this row
    const updateStmt = db.prepare(`
      UPDATE chart_data
      SET last_updated = ?
      WHERE id = ?
    `);
    
    const result = updateStmt.run(new Date().toISOString(), sampleId);
    console.log(`Update successful, changes: ${result.changes}`);
  } catch (error) {
    console.error('Error executing chart_data UPDATE query:', error);
  }
  
  // 3. Test server_name vs serverName
  try {
    console.log('\n3. Testing server_name column:');
    // Try with snake_case
    try {
      const serverNameRows = db.prepare('SELECT DISTINCT server_name FROM chart_data').all();
      console.log('server_name column exists, values:', serverNameRows.map(r => r.server_name));
    } catch (error) {
      console.error('Error with server_name:', error.message);
      
      // Try with camelCase
      try {
        const serverNameRows = db.prepare('SELECT DISTINCT serverName FROM chart_data').all();
        console.log('serverName column exists, values:', serverNameRows.map(r => r.serverName));
      } catch (error2) {
        console.error('Error with serverName:', error2.message);
      }
    }
  } catch (error) {
    console.error('Error testing server_name column:', error);
  }
  
  // 4. Test table_name vs tableName vs db_table_name
  try {
    console.log('\n4. Testing table name columns:');
    // Try with snake_case
    try {
      const tableNameRows = db.prepare('SELECT DISTINCT table_name FROM chart_data LIMIT 5').all();
      console.log('table_name column exists, sample values:', tableNameRows.map(r => r.table_name));
    } catch (error) {
      console.error('Error with table_name:', error.message);
    }
    
    // Try with camelCase
    try {
      const tableNameRows = db.prepare('SELECT DISTINCT tableName FROM chart_data LIMIT 5').all();
      console.log('tableName column exists, sample values:', tableNameRows.map(r => r.tableName));
    } catch (error) {
      console.error('Error with tableName:', error.message);
    }
    
    // Try with db_table_name
    try {
      const dbTableNameRows = db.prepare('SELECT DISTINCT db_table_name FROM chart_data LIMIT 5').all();
      console.log('db_table_name column exists, sample values:', dbTableNameRows.map(r => r.db_table_name));
    } catch (error) {
      console.error('Error with db_table_name:', error.message);
    }
  } catch (error) {
    console.error('Error testing table name columns:', error);
  }
  
  // 5. Check for null values in critical columns
  try {
    console.log('\n5. Checking for NULL values in critical columns:');
    const nullChecks = [
      { column: 'id', query: 'SELECT COUNT(*) as count FROM chart_data WHERE id IS NULL' },
      { column: 'server_name', query: 'SELECT COUNT(*) as count FROM chart_data WHERE server_name IS NULL' },
      { column: 'table_name', query: 'SELECT COUNT(*) as count FROM chart_data WHERE table_name IS NULL' },
      { column: 'production_sql_expression', query: 'SELECT COUNT(*) as count FROM chart_data WHERE production_sql_expression IS NULL' }
    ];
    
    for (const check of nullChecks) {
      try {
        const result = db.prepare(check.query).get();
        console.log(`${check.column}: ${result.count} NULL values`);
      } catch (error) {
        console.error(`Error checking NULL values for ${check.column}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error checking NULL values:', error);
  }
  
  // Close the database
  db.close();
  console.log('\nDatabase connection closed');
  
} catch (error) {
  console.error('Error opening database:', error);
  process.exit(1);
}
