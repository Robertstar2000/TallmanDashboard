// Script to synchronize the SQLite database with the admin spreadsheet data
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Function to extract data from the initial-data.ts file
function extractInitialData() {
  try {
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    const fileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    // Find the start of the initialSpreadsheetData array
    const startIndex = fileContent.indexOf('export const initialSpreadsheetData: SpreadsheetRow[] = [');
    if (startIndex === -1) {
      throw new Error('Could not find initialSpreadsheetData array in the file');
    }
    
    // Find the end of the array
    let endIndex = startIndex;
    let braceCount = 0;
    let inArray = false;
    
    for (let i = startIndex; i < fileContent.length; i++) {
      const char = fileContent[i];
      if (char === '[') {
        braceCount++;
        inArray = true;
      } else if (char === ']') {
        braceCount--;
        if (inArray && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (endIndex === startIndex) {
      throw new Error('Could not find the end of initialSpreadsheetData array');
    }
    
    // Extract the array content
    const arrayContent = fileContent.substring(startIndex, endIndex);
    
    // Convert the array content to a JavaScript array using eval (careful with this!)
    // We need to replace TypeScript types with JavaScript equivalents
    const jsArrayContent = arrayContent
      .replace('export const initialSpreadsheetData: SpreadsheetRow[] = ', 'return ')
      .replace(/\/\/.*/g, '') // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Use Function constructor to safely evaluate the JavaScript code
    const dataFunction = new Function(jsArrayContent);
    const data = dataFunction();
    
    console.log(`Extracted ${data.length} rows from initial-data.ts`);
    return data;
  } catch (error) {
    console.error('Error extracting initial data:', error);
    return [];
  }
}

// Function to synchronize the database with the initial data
async function syncDatabase(initialData) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Begin transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error beginning transaction:', err.message);
          reject(err);
          return;
        }
        
        // 1. Get all existing rows from the database
        db.all('SELECT id FROM chart_data', (err, existingRows) => {
          if (err) {
            console.error('Error getting existing rows:', err.message);
            db.run('ROLLBACK', () => reject(err));
            return;
          }
          
          const existingIds = existingRows.map(row => row.id);
          console.log(`Found ${existingIds.length} existing rows in the database`);
          
          // 2. Prepare statements for insert/update and delete
          const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO chart_data (
              id, chart_group, variable_name, server_name, db_table_name,
              sql_expression, production_sql_expression, value, transformer, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          // 3. Process each row from the initial data
          const processedIds = new Set();
          let insertCount = 0;
          
          initialData.forEach(row => {
            if (!row.id) {
              console.warn('Skipping row without ID:', row);
              return;
            }
            
            // Skip rows without chart groups
            if (!row.chartGroup) {
              console.warn(`Skipping row ${row.id} without chart group`);
              return;
            }
            
            processedIds.add(row.id);
            
            // Insert or update the row
            insertStmt.run(
              row.id,
              row.chartGroup,
              row.variableName,
              row.serverName,
              row.tableName || '',
              row.sqlExpression || '',
              row.productionSqlExpression || row.sqlExpression || '',
              row.value || '0',
              row.transformer || '',
              row.lastUpdated || new Date().toISOString(),
              (err) => {
                if (err) {
                  console.error(`Error inserting/updating row ${row.id}:`, err.message);
                }
              }
            );
            
            insertCount++;
          });
          
          insertStmt.finalize();
          console.log(`Inserted/updated ${insertCount} rows`);
          
          // 4. Delete rows that don't exist in the initial data
          const idsToDelete = existingIds.filter(id => !processedIds.has(id));
          console.log(`Found ${idsToDelete.length} rows to delete`);
          
          if (idsToDelete.length > 0) {
            const placeholders = idsToDelete.map(() => '?').join(',');
            const deleteQuery = `DELETE FROM chart_data WHERE id IN (${placeholders})`;
            
            db.run(deleteQuery, idsToDelete, function(err) {
              if (err) {
                console.error('Error deleting rows:', err.message);
                db.run('ROLLBACK', () => reject(err));
                return;
              }
              
              console.log(`Deleted ${this.changes} rows`);
              
              // Commit the transaction
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                  db.run('ROLLBACK', () => reject(err));
                  return;
                }
                
                console.log('Database synchronized successfully');
                resolve();
              });
            });
          } else {
            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK', () => reject(err));
                return;
              }
              
              console.log('Database synchronized successfully');
              resolve();
            });
          }
        });
      });
    });
  });
}

// Main function
async function main() {
  try {
    // Extract initial data
    const initialData = extractInitialData();
    
    if (initialData.length === 0) {
      console.error('No initial data found, aborting');
      db.close();
      return;
    }
    
    // Synchronize the database
    await syncDatabase(initialData);
    
    // Create a cache-busting file to force a refresh of the chart data
    const cacheBustFile = path.join(dataDir, 'cache-bust.txt');
    fs.writeFileSync(cacheBustFile, new Date().toISOString());
    console.log(`Created cache-busting file at ${cacheBustFile}`);
    
    // Close the database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  } catch (error) {
    console.error('Error in main function:', error);
    db.close();
  }
}

// Run the main function
main();
