/**
 * Script to thoroughly examine all tables in the dashboard database
 * and write the results to a file in a structured format
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Helper function to open the database
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
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
  // Create output file
  const outputFile = path.join(process.cwd(), 'database-structure.txt');
  let output = '';
  
  // Helper function to append to output
  const append = (text) => {
    output += text + '\n';
    console.log(text);
  };
  
  append('=== DATABASE EXAMINATION RESULTS ===');
  append(`Date: ${new Date().toISOString()}`);
  append('');
  
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
      append(`Error opening database ${path}: ${error.message}`);
    }
  }
  
  if (!db) {
    append('Could not open any database. Exiting.');
    fs.writeFileSync(outputFile, output);
    return;
  }
  
  try {
    append(`Using database at ${dbPath}`);
    
    // Get all tables in the database
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    append(`Tables in database: ${tables.map(t => t.name).join(', ')}`);
    append('');
    
    // For each table, get its schema and sample data
    for (const table of tables) {
      const tableName = table.name;
      append(`=== TABLE: ${tableName} ===`);
      
      // Get table schema
      const schema = await runQuery(db, `PRAGMA table_info(${tableName})`);
      append('--- SCHEMA ---');
      append('Column Name | Type | NotNull | DefaultValue | PK');
      append('------------|------|---------|--------------|----');
      schema.forEach(col => {
        append(`${col.name} | ${col.type} | ${col.notnull} | ${col.dflt_value || 'NULL'} | ${col.pk}`);
      });
      append('');
      
      // Get row count
      const countResult = await runQuery(db, `SELECT COUNT(*) as count FROM ${tableName}`);
      append(`Row count: ${countResult[0].count}`);
      append('');
      
      // Get a sample of data (up to 5 rows)
      if (countResult[0].count > 0) {
        append('--- SAMPLE DATA ---');
        const sampleData = await runQuery(db, `SELECT * FROM ${tableName} LIMIT 5`);
        
        // Get column widths for formatting
        const columnWidths = {};
        schema.forEach(col => {
          columnWidths[col.name] = col.name.length;
        });
        
        sampleData.forEach(row => {
          Object.entries(row).forEach(([key, value]) => {
            if (value !== null) {
              const valueStr = String(value);
              if (valueStr.length > 100) {
                // Truncate long values
                columnWidths[key] = Math.max(columnWidths[key], 100);
              } else {
                columnWidths[key] = Math.max(columnWidths[key], valueStr.length);
              }
            }
          });
        });
        
        // Create header row
        let headerRow = '';
        schema.forEach(col => {
          headerRow += col.name.padEnd(columnWidths[col.name] + 2);
        });
        append(headerRow);
        
        // Create separator row
        let separatorRow = '';
        schema.forEach(col => {
          separatorRow += '-'.repeat(columnWidths[col.name]) + '  ';
        });
        append(separatorRow);
        
        // Create data rows
        sampleData.forEach((row, rowIndex) => {
          let dataRow = '';
          schema.forEach(col => {
            const value = row[col.name];
            let valueStr = value === null ? 'NULL' : String(value);
            if (valueStr.length > 100) {
              valueStr = valueStr.substring(0, 97) + '...';
            }
            dataRow += valueStr.padEnd(columnWidths[col.name] + 2);
          });
          append(dataRow);
        });
        append('');
      }
      
      // Check for SQL-related columns
      const sqlColumns = schema.filter(col => 
        col.name.toLowerCase().includes('sql') || 
        col.name.toLowerCase().includes('query') || 
        col.name.toLowerCase().includes('expression')
      );
      
      if (sqlColumns.length > 0) {
        append('--- SQL-RELATED COLUMNS ---');
        for (const sqlCol of sqlColumns) {
          append(`Column: ${sqlCol.name} (${sqlCol.type})`);
          
          // Get sample of non-empty SQL expressions
          const sqlSamples = await runQuery(db, `
            SELECT * FROM ${tableName} 
            WHERE ${sqlCol.name} IS NOT NULL AND ${sqlCol.name} != '' 
            LIMIT 3
          `);
          
          if (sqlSamples.length > 0) {
            append('Sample SQL expressions:');
            sqlSamples.forEach((row, index) => {
              append(`\nSample ${index + 1}:`);
              // Print the row ID or some identifier
              const idField = schema.find(col => col.pk === 1)?.name || 'rowid';
              append(`ID: ${row[idField]}`);
              
              // Print any name-related fields
              schema.filter(col => col.name.toLowerCase().includes('name')).forEach(nameCol => {
                append(`${nameCol.name}: ${row[nameCol.name]}`);
              });
              
              // Print the SQL expression
              append(`${sqlCol.name}: ${row[sqlCol.name]}`);
              append('---');
            });
          } else {
            append('No non-empty values found');
          }
          append('');
        }
      }
      
      // Check for key metrics related data
      const nameColumns = schema.filter(col => 
        col.name.toLowerCase().includes('name') || 
        col.name.toLowerCase().includes('variable') || 
        col.name.toLowerCase().includes('chart')
      );
      
      if (nameColumns.length > 0) {
        append('--- SEARCHING FOR KEY METRICS DATA ---');
        
        for (const nameCol of nameColumns) {
          append(`Searching for key metrics in ${nameCol.name}:`);
          
          // Search for key metrics
          const keyMetricsRows = await runQuery(db, `
            SELECT * FROM ${tableName} 
            WHERE ${nameCol.name} LIKE '%Key Metrics%' 
               OR ${nameCol.name} LIKE '%Total Orders%'
               OR ${nameCol.name} LIKE '%Open Orders%'
               OR ${nameCol.name} LIKE '%Daily Revenue%'
               OR ${nameCol.name} LIKE '%Open Invoices%'
               OR ${nameCol.name} LIKE '%Orders Backlogged%'
               OR ${nameCol.name} LIKE '%Total Monthly Sales%'
            LIMIT 10
          `);
          
          if (keyMetricsRows.length > 0) {
            append(`Found ${keyMetricsRows.length} potential Key Metrics rows`);
            keyMetricsRows.forEach((row, index) => {
              append(`\n--- Key Metrics Row ${index + 1} ---`);
              // Print all fields for this row
              Object.entries(row).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                  let valueStr = String(value);
                  if (valueStr.length > 200) {
                    valueStr = valueStr.substring(0, 197) + '...';
                  }
                  append(`${key}: ${valueStr}`);
                }
              });
            });
          } else {
            append('No Key Metrics rows found');
          }
          append('');
        }
      }
      
      append(''); // Add extra line between tables
    }
    
    append('Database examination complete.');
    
  } catch (error) {
    append(`Error examining database: ${error}`);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          append(`Error closing database: ${err.message}`);
        } else {
          append('Database connection closed.');
        }
      });
    }
    
    // Write output to file
    fs.writeFileSync(outputFile, output);
    console.log(`\nResults written to ${outputFile}`);
  }
}

// Run the examination
examineDatabase().catch(error => {
  console.error('Unhandled error:', error);
  fs.appendFileSync('database-structure.txt', `\nUnhandled error: ${error}`);
});
