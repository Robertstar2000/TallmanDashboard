// Test script to verify database initialization
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Database file path
const dbPath = path.join(dataDir, 'dashboard.db');

// Delete existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log(`Removing existing database file: ${dbPath}`);
  fs.unlinkSync(dbPath);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database: ${dbPath}`);
});

// Create the chart_data table
db.serialize(() => {
  console.log('Creating chart_data table...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS chart_data (
      id TEXT PRIMARY KEY,
      chart_group TEXT NOT NULL,
      variable_name TEXT,
      serverName TEXT,
      db_table_name TEXT,
      sql_expression TEXT,
      production_sql_expression TEXT,
      value TEXT,
      transformer TEXT,
      last_updated TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating chart_data table:', err.message);
      return;
    }
    console.log('Chart data table created successfully');
    
    // Insert a test row
    const testRow = {
      id: 'test1',
      chart_group: 'Test Group',
      variable_name: 'Test Variable',
      serverName: 'P21',
      db_table_name: 'test_table',
      sql_expression: 'SELECT 1 as value',
      production_sql_expression: 'SELECT 1 as value',
      value: '0',
      transformer: 'number',
      last_updated: new Date().toISOString()
    };
    
    db.run(
      `INSERT INTO chart_data (id, chart_group, variable_name, serverName, db_table_name, sql_expression, production_sql_expression, value, transformer, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testRow.id,
        testRow.chart_group,
        testRow.variable_name,
        testRow.serverName,
        testRow.db_table_name,
        testRow.sql_expression,
        testRow.production_sql_expression,
        testRow.value,
        testRow.transformer,
        testRow.last_updated
      ],
      function(err) {
        if (err) {
          console.error('Error inserting test row:', err.message);
          return;
        }
        console.log(`Test row inserted with ID: ${testRow.id}`);
        
        // Verify the data was inserted
        db.get('SELECT COUNT(*) as count FROM chart_data', (err, row) => {
          if (err) {
            console.error('Error counting rows:', err.message);
            return;
          }
          console.log(`Chart data table has ${row.count} rows`);
          
          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
              return;
            }
            console.log('Database connection closed');
          });
        });
      }
    );
  });
});
