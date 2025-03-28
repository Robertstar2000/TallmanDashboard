// Script to analyze chart data counts and compare with expected counts
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// Expected counts based on requirements
const expectedCounts = {
  'AR Aging': 5, // 5 buckets with one variable
  'Accounts': 36, // 3 variables for 12 months
  'Customer Metrics': 24, // 2 variables for 12 months
  'Daily Orders': 7, // 1 variable for 7 days
  'Historical Data': 36, // 3 variables for 12 months
  'Inventory': 8, // 2 variables for 4 departments
  'Key Metrics': 7, // 7 separate metrics
  'Site Distribution': 3, // 1 value for 3 locations
  'POR Overview': 36, // 3 variables for 12 months
  'Web Orders': 12, // 1 variable for 12 months
  'Purchase Orders': 24, // 2 variables (counts and totals) for 12 months
  // Total expected: 174 rows
};

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
    db.all('SELECT DISTINCT chart_group FROM chart_data WHERE chart_group IS NOT NULL AND chart_group != "" ORDER BY chart_group', (err, rows) => {
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

// Function to get sample rows for a chart group
function getSampleRows(chartGroup, limit = 3) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, chart_group, variable_name, serverName, value
      FROM chart_data 
      WHERE chart_group = ? 
      LIMIT ?
    `, [chartGroup, limit], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
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
    
    // Calculate total expected rows
    const totalExpectedRows = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
    
    // Display row counts for each chart group and compare with expected
    console.log('\nRow counts by chart group (Actual vs Expected):');
    console.log('------------------------------------------');
    let totalCountedRows = 0;
    let missingGroups = [];
    let unexpectedGroups = [];
    let mismatchedGroups = [];
    
    // Check for missing chart groups
    for (const expectedGroup in expectedCounts) {
      if (!chartGroups.includes(expectedGroup)) {
        missingGroups.push(expectedGroup);
      }
    }
    
    // Check actual chart groups
    for (const { chartGroup, count } of chartGroupCounts) {
      totalCountedRows += count;
      
      const expected = expectedCounts[chartGroup] || 'Not expected';
      const status = expected === 'Not expected' ? 'UNEXPECTED' : 
                    count === expected ? 'OK' : 
                    count < expected ? `MISSING ${expected - count} ROWS` : 
                    `EXTRA ${count - expected} ROWS`;
      
      console.log(`${chartGroup.padEnd(20)}: ${count.toString().padStart(3)} rows (Expected: ${expected.toString().padStart(3)}) - ${status}`);
      
      // Get variable names for this chart group
      const variableNames = await getVariableNames(chartGroup);
      if (variableNames.length <= 5) {
        console.log(`  Variables (${variableNames.length}): ${variableNames.join(', ')}`);
      } else {
        console.log(`  Variables (${variableNames.length}): ${variableNames.slice(0, 5).join(', ')}... and ${variableNames.length - 5} more`);
      }
      
      // Get sample rows
      const sampleRows = await getSampleRows(chartGroup);
      console.log(`  Sample rows: ${JSON.stringify(sampleRows[0], null, 2).substring(0, 100)}...`);
      
      // Track unexpected and mismatched groups
      if (expected === 'Not expected') {
        unexpectedGroups.push(chartGroup);
      } else if (count !== expected) {
        mismatchedGroups.push({ chartGroup, actual: count, expected });
      }
    }
    
    console.log('\nSummary:');
    console.log('-------------------------');
    console.log(`Total rows in database: ${totalRowCount}`);
    console.log(`Total rows in chart groups: ${totalCountedRows}`);
    console.log(`Total expected rows: ${totalExpectedRows}`);
    
    if (missingGroups.length > 0) {
      console.log(`\nMissing chart groups: ${missingGroups.join(', ')}`);
    }
    
    if (unexpectedGroups.length > 0) {
      console.log(`\nUnexpected chart groups: ${unexpectedGroups.join(', ')}`);
    }
    
    if (mismatchedGroups.length > 0) {
      console.log('\nMismatched row counts:');
      for (const { chartGroup, actual, expected } of mismatchedGroups) {
        console.log(`  ${chartGroup}: ${actual} rows (Expected: ${expected})`);
      }
    }
    
    if (totalRowCount !== totalCountedRows) {
      console.log(`\nMissing rows: ${totalRowCount - totalCountedRows} (rows without a chart group)`);
      
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
