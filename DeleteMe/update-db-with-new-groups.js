const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to the database at ${dbPath}`);
});

// Function to update the database with the new chart groups
async function updateDatabase() {
  return new Promise((resolve, reject) => {
    // Begin transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return reject(err);
      }

      // First, clear the chart_data table
      db.run('DELETE FROM chart_data', (err) => {
        if (err) {
          db.run('ROLLBACK', () => {
            return reject(err);
          });
        }

        // Import the initial data
        const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
        const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

        // Extract the initialSpreadsheetData array
        const dataStartRegex = /export const initialSpreadsheetData: SpreadsheetRow\[] = \[/;
        const dataEndRegex = /\];(\r?\n\r?\n\/\/ Chart group settings)/;

        const dataStartMatch = initialDataContent.match(dataStartRegex);
        const dataEndMatch = initialDataContent.match(dataEndRegex);

        if (!dataStartMatch || !dataEndMatch) {
          db.run('ROLLBACK', () => {
            return reject(new Error('Could not find initialSpreadsheetData array in the file'));
          });
        }

        const dataStartIndex = dataStartMatch.index + dataStartMatch[0].length;
        const dataEndIndex = dataEndMatch.index;

        // Extract the data array as a string
        const dataArrayString = initialDataContent.substring(dataStartIndex, dataEndIndex);

        // Create a temporary file with the data array
        const tempFilePath = path.join(process.cwd(), 'temp-data-array.js');
        fs.writeFileSync(tempFilePath, 'module.exports = [' + dataArrayString + '];');

        // Require the temporary file
        const initialSpreadsheetData = require('./temp-data-array.js');

        // Delete the temporary file
        fs.unlinkSync(tempFilePath);

        console.log(`Loaded ${initialSpreadsheetData.length} rows from initial-data.ts`);

        // Prepare the insert statement
        const insertStmt = db.prepare(`
          INSERT INTO chart_data (
            id, chart_group, variable_name, server_name, db_table_name, 
            sql_expression, production_sql_expression, value, transformer, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Insert each row
        let insertedCount = 0;
        let errorCount = 0;

        initialSpreadsheetData.forEach((row, index) => {
          insertStmt.run(
            row.id,
            row.chartGroup || '',
            row.variableName || '',
            row.serverName || 'P21',
            row.tableName || '',
            row.sqlExpression || `SELECT 0 /* Default SQL for ${row.chartGroup} - ${row.variableName} */`,
            row.productionSqlExpression || row.sqlExpression || `SELECT 0 /* Default SQL for ${row.chartGroup} - ${row.variableName} */`,
            row.value || '0',
            row.calculation || 'number',
            row.lastUpdated || new Date().toISOString(),
            function(err) {
              if (err) {
                console.error(`Error inserting row ${row.id}: ${err.message}`);
                errorCount++;
              } else {
                insertedCount++;
              }

              // Check if all inserts are done
              if (insertedCount + errorCount === initialSpreadsheetData.length) {
                insertStmt.finalize();
                
                // Commit transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK', () => {
                      return reject(err);
                    });
                  }
                  
                  console.log(`Successfully inserted ${insertedCount} rows into chart_data table`);
                  console.log(`Failed to insert ${errorCount} rows`);
                  
                  // Close the database connection
                  db.close((err) => {
                    if (err) {
                      return reject(err);
                    }
                    console.log('Database connection closed');
                    resolve();
                  });
                });
              }
            }
          );
        });
      });
    });
  });
}

// Run the update
updateDatabase()
  .then(() => {
    console.log('Database update completed successfully');
  })
  .catch((err) => {
    console.error(`Error updating database: ${err.message}`);
    // Close the database connection on error
    db.close();
  });
