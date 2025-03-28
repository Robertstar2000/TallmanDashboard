// Script to completely rebuild the database from the initial-data.ts file
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Path to initial-data.ts
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
console.log(`Initial data path: ${initialDataPath}`);

// Create a backup of the existing database
const backupPath = `${dbPath}.backup-${Date.now()}`;
try {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Created backup of database at ${backupPath}`);
  }
} catch (err) {
  console.error('Error creating database backup:', err.message);
}

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Read the initial-data.ts file
fs.readFile(initialDataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading initial-data.ts:', err.message);
    closeDb();
    return;
  }
  
  console.log('Successfully read initial-data.ts');
  
  // Extract the initialSpreadsheetData array from the file
  const chartDataMatch = data.match(/export const initialSpreadsheetData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
  if (!chartDataMatch) {
    console.error('Could not find initialSpreadsheetData array in initial-data.ts');
    closeDb();
    return;
  }
  
  // Parse the initialSpreadsheetData array
  let chartData;
  try {
    // Replace TypeScript types with empty objects to make it valid JSON
    const jsonString = chartDataMatch[1]
      .replace(/SpreadsheetRow/g, '')
      .replace(/ServerName/g, '')
      .replace(/as/g, '')
      .replace(/'/g, '"');
    
    // Use Function constructor to safely evaluate the JSON
    chartData = new Function(`return ${jsonString}`)();
    console.log(`Successfully parsed ${chartData.length} chart data rows`);
  } catch (err) {
    console.error('Error parsing chartData:', err.message);
    closeDb();
    return;
  }
  
  // Start rebuilding the database
  console.log('Rebuilding database...');
  
  // Drop and recreate the chart_data table
  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS chart_data', (err) => {
      if (err) {
        console.error('Error dropping chart_data table:', err.message);
        closeDb();
        return;
      }
      
      console.log('Dropped chart_data table');
      
      // Create the chart_data table
      db.run(`
        CREATE TABLE chart_data (
          id TEXT PRIMARY KEY,
          chart_group TEXT,
          variable_name TEXT,
          server_name TEXT,
          db_table_name TEXT,
          sql_expression TEXT,
          production_sql_expression TEXT,
          value TEXT,
          transformer TEXT,
          last_updated TEXT,
          error TEXT,
          error_type TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating chart_data table:', err.message);
          closeDb();
          return;
        }
        
        console.log('Created chart_data table');
        
        // Begin a transaction
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error('Error beginning transaction:', err.message);
            closeDb();
            return;
          }
          
          // Insert each row into the chart_data table
          const stmt = db.prepare(`
            INSERT INTO chart_data (
              id,
              chart_group,
              variable_name,
              server_name,
              db_table_name,
              sql_expression,
              production_sql_expression,
              value,
              transformer,
              last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          // Process each row
          chartData.forEach((row, index) => {
            // Ensure the ID is in the correct format
            // Use the existing ID if it's already in the correct format
            let id = row.id;
            if (!id || !id.match(/^row_\d+$/)) {
              id = `row_${String(index + 1).padStart(3, '0')}`;
            }
            
            stmt.run(
              id,
              row.chartGroup,
              row.variableName,
              row.serverName,
              row.tableName || '',
              row.sqlExpression || '',
              row.productionSqlExpression || row.sqlExpression || '',
              row.value || '0',
              row.transformer || '',
              new Date().toISOString(),
              (err) => {
                if (err) {
                  console.error(`Error inserting row ${id}:`, err.message);
                }
              }
            );
          });
          
          stmt.finalize();
          
          // Commit the transaction
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK');
              closeDb();
              return;
            }
            
            console.log('Transaction committed. Database rebuilt successfully.');
            
            // Verify the database
            db.all('SELECT id, chart_group, variable_name FROM chart_data ORDER BY id', (err, rows) => {
              if (err) {
                console.error('Error verifying database:', err.message);
                closeDb();
                return;
              }
              
              console.log(`Verification: Found ${rows.length} rows in the rebuilt database`);
              
              // Print the first 10 rows to verify
              console.log('\nFirst 10 rows:');
              rows.slice(0, 10).forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
              });
              
              closeDb();
            });
          });
        });
      });
    });
  });
});

// Function to close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
