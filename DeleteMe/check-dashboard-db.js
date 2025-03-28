/**
 * Simple script to check if we can connect to the dashboard.db SQLite database
 * and retrieve SQL expressions.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'dashboard.db');

// Function to get all chart data from the database
async function getChartData() {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to open database at: ${DB_PATH}`);
    
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(`Error opening database: ${err.message}`);
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      console.log('Successfully opened the database');
      
      db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
        if (err) {
          console.error(`Error querying tables: ${err.message}`);
          db.close();
          reject(`Error querying tables: ${err.message}`);
          return;
        }
        
        console.log('Tables in database:', tables);
        
        if (tables.some(t => t.name === 'dashboard_data')) {
          db.all(`SELECT id, chartGroup, variableName, server, sqlExpression, value FROM dashboard_data`, [], (err, rows) => {
            db.close();
            
            if (err) {
              console.error(`Error querying dashboard_data: ${err.message}`);
              reject(`Error querying dashboard_data: ${err.message}`);
              return;
            }
            
            console.log(`Retrieved ${rows.length} rows from dashboard_data`);
            
            // Print the first 3 rows for debugging
            if (rows.length > 0) {
              console.log('First 3 rows:');
              for (let i = 0; i < Math.min(3, rows.length); i++) {
                console.log(`Row ${i+1}:`, rows[i]);
              }
            }
            
            resolve(rows);
          });
        } else {
          console.error('dashboard_data table not found');
          db.close();
          reject('dashboard_data table not found');
        }
      });
    });
  });
}

// Main function
async function main() {
  console.log('Starting database check...');
  
  try {
    const chartData = await getChartData();
    console.log(`Successfully retrieved ${chartData.length} rows of chart data`);
  } catch (error) {
    console.error('Error retrieving chart data:', error);
  }
  
  console.log('Database check completed');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
