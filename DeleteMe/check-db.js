// Check the current database state
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Make sure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Data directory does not exist, creating it...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.log('Database file does not exist. Please run init-db.js first.');
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Check tables
db.serialize(() => {
  // Get list of tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      closeDb();
      return;
    }
    
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });
    
    // Check chart_data table count
    if (tables.some(t => t.name === 'chart_data')) {
      db.get('SELECT COUNT(*) as count FROM chart_data', (err, row) => {
        if (err) {
          console.error('Error counting chart_data rows:', err.message);
          closeDb();
          return;
        }
        
        console.log(`chart_data table has ${row.count} rows`);
        
        // Get detailed schema information for chart_data table
        db.all('PRAGMA table_info(chart_data)', (err, columns) => {
          if (err) {
            console.error('Error getting chart_data schema:', err.message);
            closeDb();
            return;
          }
          
          console.log('\nChart Data Table Schema:');
          columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
          });
          
          // Check for server_name vs serverName inconsistency
          const hasServerName = columns.some(col => col.name === 'server_name');
          const hasServerNameCamel = columns.some(col => col.name === 'serverName');
          
          if (hasServerName) {
            console.log('\nUsing server_name column (snake_case)');
          } else if (hasServerNameCamel) {
            console.log('\nUsing serverName column (camelCase)');
          } else {
            console.log('\nWARNING: Neither server_name nor serverName column found!');
          }
          
          // Check for table_name vs tableName inconsistency
          const hasTableName = columns.some(col => col.name === 'table_name');
          const hasTableNameCamel = columns.some(col => col.name === 'tableName');
          const hasDbTableName = columns.some(col => col.name === 'db_table_name');
          
          if (hasTableName) {
            console.log('Using table_name column (snake_case)');
          } else if (hasTableNameCamel) {
            console.log('Using tableName column (camelCase)');
          } else if (hasDbTableName) {
            console.log('Using db_table_name column');
          } else {
            console.log('WARNING: No table name column found!');
          }
          
          // Sample data
          db.all('SELECT id, chart_name, variable_name, server_name FROM chart_data LIMIT 5', (err, rows) => {
            if (err) {
              console.error('Error getting sample data:', err.message);
              closeDb();
              return;
            }
            
            console.log('\nSample data:');
            rows.forEach(row => {
              console.log(`- ${row.id}: ${row.chart_name} / ${row.variable_name} (${row.server_name})`);
            });
            
            // Check P21 and POR entries
            db.get('SELECT COUNT(*) as count FROM chart_data WHERE id BETWEEN 1 AND 126', (err, p21Count) => {
              if (err) {
                console.error('Error counting P21 entries:', err.message);
                closeDb();
                return;
              }
              
              db.get('SELECT COUNT(*) as count FROM chart_data WHERE id BETWEEN 127 AND 174', (err, porCount) => {
                if (err) {
                  console.error('Error counting POR entries:', err.message);
                  closeDb();
                  return;
                }
                
                console.log(`\nP21 entries (ID 1-126): ${p21Count.count}`);
                console.log(`POR entries (ID 127-174): ${porCount.count}`);
                
                // Check server_name values
                db.all('SELECT DISTINCT server_name, COUNT(*) as count FROM chart_data GROUP BY server_name', (err, serverCounts) => {
                  if (err) {
                    // Try with camelCase if snake_case fails
                    db.all('SELECT DISTINCT serverName, COUNT(*) as count FROM chart_data GROUP BY serverName', (err2, serverCounts2) => {
                      if (err2) {
                        console.error('Error counting by server name:', err.message, err2.message);
                        closeDb();
                        return;
                      }
                      
                      console.log('\nServer name distribution (camelCase):');
                      serverCounts2.forEach(sc => {
                        console.log(`- ${sc.serverName || 'NULL'}: ${sc.count} entries`);
                      });
                      closeDb();
                    });
                  } else {
                    console.log('\nServer name distribution (snake_case):');
                    serverCounts.forEach(sc => {
                      console.log(`- ${sc.server_name || 'NULL'}: ${sc.count} entries`);
                    });
                    closeDb();
                  }
                });
              });
            });
          });
        });
      });
    } else {
      console.log('chart_data table does not exist');
      closeDb();
    }
  });
});

function closeDb() {
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}
