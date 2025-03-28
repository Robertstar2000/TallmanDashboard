/**
 * Script to examine the structure of the dashboard database and write results to a file
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
  const outputFile = path.join(process.cwd(), 'database-analysis.txt');
  const outputStream = fs.createWriteStream(outputFile, { flags: 'w' });
  
  // Helper function to write to both console and file
  const log = (message) => {
    console.log(message);
    outputStream.write(message + '\n');
  };
  
  log('Starting database examination...');
  
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
      log(`Error opening database ${path}: ${error.message}`);
    }
  }
  
  if (!db) {
    log('Could not open any database. Exiting.');
    outputStream.end();
    return;
  }
  
  try {
    log(`Using database at ${dbPath}`);
    
    // Get all tables in the database
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    log('Tables in database: ' + tables.map(t => t.name).join(', '));
    
    // For each table, get its schema and a sample of data
    for (const table of tables) {
      const tableName = table.name;
      log(`\n=== Table: ${tableName} ===`);
      
      // Get table schema
      const schema = await runQuery(db, `PRAGMA table_info(${tableName})`);
      log('Columns: ' + schema.map(col => `${col.name} (${col.type})`).join(', '));
      
      // Get row count
      const countResult = await runQuery(db, `SELECT COUNT(*) as count FROM ${tableName}`);
      log(`Row count: ${countResult[0].count}`);
      
      // Get a sample of data (up to 3 rows)
      const sampleData = await runQuery(db, `SELECT * FROM ${tableName} LIMIT 3`);
      if (sampleData.length > 0) {
        log('Sample rows:');
        sampleData.forEach((row, index) => {
          log(`\n--- Row ${index + 1} ---`);
          for (const [key, value] of Object.entries(row)) {
            log(`  ${key}: ${value}`);
          }
        });
      } else {
        log('No data in table');
      }
      
      // Check for SQL-related columns
      const sqlColumns = schema.filter(col => 
        col.name.toLowerCase().includes('sql') || 
        col.name.toLowerCase().includes('query') || 
        col.name.toLowerCase().includes('expression')
      );
      
      if (sqlColumns.length > 0) {
        log('\nThis table contains SQL-related columns:');
        sqlColumns.forEach(col => {
          log(`  ${col.name} (${col.type})`);
        });
        
        // Check for rows with SQL expressions
        for (const sqlCol of sqlColumns) {
          log(`\nSample of non-empty values in ${sqlCol.name}:`);
          const sqlSamples = await runQuery(db, `
            SELECT id, ${sqlCol.name} FROM ${tableName} 
            WHERE ${sqlCol.name} IS NOT NULL AND ${sqlCol.name} != '' 
            LIMIT 5
          `);
          
          if (sqlSamples.length > 0) {
            sqlSamples.forEach((row, index) => {
              log(`\n--- Sample ${index + 1} ---`);
              log(`  ID: ${row.id}`);
              log(`  ${sqlCol.name}: ${row[sqlCol.name]}`);
            });
          } else {
            log('  No non-empty values found');
          }
        }
      }
      
      // Check for key metrics related data
      const nameColumns = schema.filter(col => 
        col.name.toLowerCase().includes('name') || 
        col.name.toLowerCase().includes('variable') || 
        col.name.toLowerCase().includes('chart')
      );
      
      if (nameColumns.length > 0) {
        log('\nChecking for Key Metrics related data:');
        
        for (const nameCol of nameColumns) {
          log(`\nSearching for 'Key Metrics' in ${nameCol.name}:`);
          const keyMetricsRows = await runQuery(db, `
            SELECT * FROM ${tableName} 
            WHERE ${nameCol.name} LIKE '%Key Metrics%' OR ${nameCol.name} LIKE '%Total Orders%'
            LIMIT 5
          `);
          
          if (keyMetricsRows.length > 0) {
            log(`Found ${keyMetricsRows.length} potential Key Metrics rows`);
            keyMetricsRows.forEach((row, index) => {
              log(`\n--- Key Metrics Row ${index + 1} ---`);
              for (const [key, value] of Object.entries(row)) {
                log(`  ${key}: ${value}`);
              }
            });
          } else {
            log('  No Key Metrics rows found');
          }
        }
      }
    }
    
    log('\nDatabase examination complete. Results written to: ' + outputFile);
    
  } catch (error) {
    log('Error examining database: ' + error);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          log('Error closing database: ' + err.message);
        } else {
          log('Database connection closed.');
        }
      });
    }
    
    // Close the output stream
    outputStream.end();
  }
}

// Run the examination
examineDatabase().catch(error => {
  console.error('Unhandled error:', error);
  fs.appendFileSync('database-analysis.txt', `\nUnhandled error: ${error}`);
});
