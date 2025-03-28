/**
 * Script to check the DashboardVariables table for SQL expressions
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'dashboard.db');

// Function to get dashboard variables from the database
async function getDashboardVariables() {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to open database at: ${DB_PATH}`);
    
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(`Error opening database: ${err.message}`);
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      console.log('Successfully opened the database');
      
      // Get the column names for DashboardVariables table
      db.all(`PRAGMA table_info(DashboardVariables)`, [], (err, columns) => {
        if (err) {
          console.error(`Error getting column info: ${err.message}`);
          db.close();
          reject(`Error getting column info: ${err.message}`);
          return;
        }
        
        console.log('Columns in DashboardVariables table:', columns.map(c => c.name));
        
        // Query all rows from DashboardVariables
        db.all(`SELECT * FROM DashboardVariables`, [], (err, rows) => {
          db.close();
          
          if (err) {
            console.error(`Error querying DashboardVariables: ${err.message}`);
            reject(`Error querying DashboardVariables: ${err.message}`);
            return;
          }
          
          console.log(`Retrieved ${rows.length} rows from DashboardVariables`);
          
          // Print the first 3 rows for debugging
          if (rows.length > 0) {
            console.log('First 3 rows:');
            for (let i = 0; i < Math.min(3, rows.length); i++) {
              console.log(`Row ${i+1}:`, rows[i]);
            }
          }
          
          resolve(rows);
        });
      });
    });
  });
}

// Also check chart_data table
async function getChartData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(`Error opening database: ${err.message}`);
        reject(`Error opening database: ${err.message}`);
        return;
      }
      
      // Get the column names for chart_data table
      db.all(`PRAGMA table_info(chart_data)`, [], (err, columns) => {
        if (err) {
          console.error(`Error getting column info: ${err.message}`);
          db.close();
          reject(`Error getting column info: ${err.message}`);
          return;
        }
        
        console.log('\nColumns in chart_data table:', columns.map(c => c.name));
        
        // Query all rows from chart_data
        db.all(`SELECT * FROM chart_data`, [], (err, rows) => {
          db.close();
          
          if (err) {
            console.error(`Error querying chart_data: ${err.message}`);
            reject(`Error querying chart_data: ${err.message}`);
            return;
          }
          
          console.log(`Retrieved ${rows.length} rows from chart_data`);
          
          // Print the first 3 rows for debugging
          if (rows.length > 0) {
            console.log('First 3 rows:');
            for (let i = 0; i < Math.min(3, rows.length); i++) {
              console.log(`Row ${i+1}:`, rows[i]);
            }
          }
          
          resolve(rows);
        });
      });
    });
  });
}

// Main function
async function main() {
  console.log('Starting database check...');
  
  try {
    const variables = await getDashboardVariables();
    console.log(`Successfully retrieved ${variables.length} rows from DashboardVariables`);
    
    const chartData = await getChartData();
    console.log(`Successfully retrieved ${chartData.length} rows from chart_data`);
  } catch (error) {
    console.error('Error retrieving data:', error);
  }
  
  console.log('Database check completed');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
