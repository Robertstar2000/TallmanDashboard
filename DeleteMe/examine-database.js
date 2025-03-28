/**
 * Script to examine the structure of the dashboard database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Helper function to open the database
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Connected to database: ${dbPath}`);
        resolve(db);
      }
    });
  });
}

// Helper function to run a query
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main function to examine the database
async function examineDatabase() {
  console.log('Starting database examination...');
  
  // Try different possible database paths
  const possiblePaths = [
    './dashboard.db',
    './data/dashboard.db',
    './tallman.db',
    './data/tallman.db'
  ];
  
  let db = null;
  let dbPath = null;
  
  // Try to open each database until we find one that works
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        db = await openDatabase(path);
        dbPath = path;
        break;
      }
    } catch (error) {
      console.error(`Error opening database ${path}:`, error.message);
    }
  }
  
  if (!db) {
    console.error('Could not open any database. Exiting.');
    return;
  }
  
  try {
    console.log(`Using database at ${dbPath}`);
    
    // Get all tables in the database
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name).join(', '));
    
    // For each table, get its schema and a sample of data
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nTable: ${tableName}`);
      
      // Get table schema
      const schema = await runQuery(db, `PRAGMA table_info(${tableName})`);
      console.log('Columns:', schema.map(col => `${col.name} (${col.type})`).join(', '));
      
      // Get a sample of data
      const sampleData = await runQuery(db, `SELECT * FROM ${tableName} LIMIT 1`);
      if (sampleData.length > 0) {
        console.log('Sample row:');
        const sampleRow = sampleData[0];
        for (const [key, value] of Object.entries(sampleRow)) {
          console.log(`  ${key}: ${value}`);
        }
      } else {
        console.log('No data in table');
      }
      
      // If this table looks like it might contain the admin spreadsheet data,
      // check for rows with SQL expressions
      const hasSqlColumns = schema.some(col => 
        col.name.toLowerCase().includes('sql') || 
        col.name.toLowerCase().includes('query') || 
        col.name.toLowerCase().includes('expression')
      );
      
      if (hasSqlColumns) {
        console.log('\nThis table might contain SQL expressions. Checking for Key Metrics rows...');
        
        // Try to find rows that might be Key Metrics
        const keyMetricsRows = await runQuery(db, `
          SELECT * FROM ${tableName} 
          WHERE ${schema.some(col => col.name.toLowerCase().includes('chart')) 
            ? `${schema.find(col => col.name.toLowerCase().includes('chart')).name} LIKE '%Key Metrics%'` 
            : '1=1'}
          LIMIT 5
        `);
        
        if (keyMetricsRows.length > 0) {
          console.log(`Found ${keyMetricsRows.length} potential Key Metrics rows`);
          console.log('First row:');
          const firstRow = keyMetricsRows[0];
          for (const [key, value] of Object.entries(firstRow)) {
            console.log(`  ${key}: ${value}`);
          }
        } else {
          console.log('No Key Metrics rows found');
        }
      }
    }
    
  } catch (error) {
    console.error('Error examining database:', error);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    }
  }
}

// Run the examination
examineDatabase().catch(error => {
  console.error('Unhandled error:', error);
});
