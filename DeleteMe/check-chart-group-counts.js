// Script to check the row counts for each chart group in the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database: ${dbPath}`);
});

// Function to get the total row count
function getTotalRowCount() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM chart_data', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row.count);
    });
  });
}

// Function to get all chart groups
function getChartGroups() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT chart_group FROM chart_data WHERE chart_group IS NOT NULL AND chart_group != ""', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map(row => row.chart_group));
    });
  });
}

// Function to get row count for a specific chart group
function getChartGroupRowCount(chartGroup) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM chart_data WHERE chart_group = ?', [chartGroup], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ chartGroup, count: row.count });
    });
  });
}

// Function to get variable names for a specific chart group
function getVariableNames(chartGroup) {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT variable_name FROM chart_data WHERE chart_group = ? ORDER BY variable_name', [chartGroup], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map(row => row.variable_name));
    });
  });
}

// Main function to analyze the database
async function analyzeDatabase() {
  try {
    // Get total row count
    const totalRowCount = await getTotalRowCount();
    console.log(`Total rows in chart_data table: ${totalRowCount}`);
    
    // Get all chart groups
    const chartGroups = await getChartGroups();
    console.log(`\nFound ${chartGroups.length} chart groups:`);
    
    // Get row count for each chart group
    const chartGroupCounts = await Promise.all(chartGroups.map(chartGroup => getChartGroupRowCount(chartGroup)));
    
    // Sort chart groups by count (descending)
    chartGroupCounts.sort((a, b) => b.count - a.count);
    
    // Display row counts for each chart group
    console.log('\nRow counts by chart group:');
    console.log('-------------------------');
    let totalCountedRows = 0;
    
    for (const { chartGroup, count } of chartGroupCounts) {
      console.log(`${chartGroup.padEnd(20)}: ${count.toString().padStart(3)} rows`);
      totalCountedRows += count;
      
      // Get variable names for this chart group
      const variableNames = await getVariableNames(chartGroup);
      if (variableNames.length <= 5) {
        console.log(`  Variables (${variableNames.length}): ${variableNames.join(', ')}`);
      } else {
        console.log(`  Variables (${variableNames.length}): ${variableNames.slice(0, 5).join(', ')}... and ${variableNames.length - 5} more`);
      }
    }
    
    console.log('\nSummary:');
    console.log('-------------------------');
    console.log(`Total rows in database: ${totalRowCount}`);
    console.log(`Total rows in chart groups: ${totalCountedRows}`);
    
    if (totalRowCount !== totalCountedRows) {
      console.log(`Missing rows: ${totalRowCount - totalCountedRows} (rows without a chart group)`);
      
      // Check for rows without a chart group
      db.all('SELECT * FROM chart_data WHERE chart_group IS NULL OR chart_group = ""', (err, rows) => {
        if (err) {
          console.error('Error checking for rows without chart group:', err.message);
          return;
        }
        
        console.log(`\nFound ${rows.length} rows without a chart group:`);
        rows.forEach(row => {
          console.log(`  ID: ${row.id}, Variable: ${row.variable_name}, Server: ${row.serverName}`);
        });
        
        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            return;
          }
          console.log('\nDatabase connection closed');
        });
      });
    } else {
      // Close the database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          return;
        }
        console.log('\nDatabase connection closed');
      });
    }
  } catch (error) {
    console.error('Error analyzing database:', error);
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        return;
      }
      console.log('\nDatabase connection closed');
    });
  }
}

// Run the analysis
analyzeDatabase();
