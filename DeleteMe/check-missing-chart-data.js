// Script to identify missing chart groups and rows
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
};

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database: ${dbPath}`);
});

// Function to get all chart groups with their counts
function getChartGroupCounts() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT chart_group, COUNT(*) as count 
      FROM chart_data 
      WHERE chart_group IS NOT NULL AND chart_group != "" 
      GROUP BY chart_group 
      ORDER BY chart_group
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Main function to check for missing chart data
async function checkMissingChartData() {
  try {
    // Get all chart groups with their counts
    const chartGroupCounts = await getChartGroupCounts();
    
    console.log('Chart Group Analysis:');
    console.log('====================');
    
    // Convert to an object for easier comparison
    const actualCounts = {};
    chartGroupCounts.forEach(row => {
      actualCounts[row.chart_group] = row.count;
    });
    
    // Check for missing chart groups
    const missingGroups = [];
    for (const group in expectedCounts) {
      if (!actualCounts[group]) {
        missingGroups.push(group);
      }
    }
    
    // Check for unexpected chart groups
    const unexpectedGroups = [];
    for (const group in actualCounts) {
      if (!expectedCounts[group]) {
        unexpectedGroups.push(group);
      }
    }
    
    // Check for mismatched counts
    const mismatchedGroups = [];
    for (const group in actualCounts) {
      if (expectedCounts[group] && actualCounts[group] !== expectedCounts[group]) {
        mismatchedGroups.push({
          group,
          actual: actualCounts[group],
          expected: expectedCounts[group],
          difference: actualCounts[group] - expectedCounts[group]
        });
      }
    }
    
    // Print results
    console.log('\nChart Group Counts:');
    console.log('------------------');
    for (const group in expectedCounts) {
      const actual = actualCounts[group] || 0;
      const expected = expectedCounts[group];
      const status = actual === 0 ? 'MISSING' : 
                    actual === expected ? 'OK' : 
                    actual < expected ? `MISSING ${expected - actual} ROWS` : 
                    `EXTRA ${actual - expected} ROWS`;
      
      console.log(`${group.padEnd(20)}: ${actual.toString().padStart(3)}/${expected.toString().padStart(3)} - ${status}`);
    }
    
    // Summary
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Total expected chart groups: ${Object.keys(expectedCounts).length}`);
    console.log(`Total actual chart groups: ${Object.keys(actualCounts).length}`);
    console.log(`Missing chart groups: ${missingGroups.length}`);
    console.log(`Unexpected chart groups: ${unexpectedGroups.length}`);
    console.log(`Mismatched row counts: ${mismatchedGroups.length}`);
    
    // Total row counts
    const totalExpected = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
    const totalActual = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal expected rows: ${totalExpected}`);
    console.log(`Total actual rows: ${totalActual}`);
    console.log(`Difference: ${totalActual - totalExpected} rows`);
    
    // Details for missing groups
    if (missingGroups.length > 0) {
      console.log('\nMissing Chart Groups:');
      console.log('--------------------');
      missingGroups.forEach(group => {
        console.log(`${group.padEnd(20)}: Expected ${expectedCounts[group]} rows`);
      });
    }
    
    // Details for unexpected groups
    if (unexpectedGroups.length > 0) {
      console.log('\nUnexpected Chart Groups:');
      console.log('----------------------');
      unexpectedGroups.forEach(group => {
        console.log(`${group.padEnd(20)}: ${actualCounts[group]} rows`);
      });
    }
    
    // Details for mismatched counts
    if (mismatchedGroups.length > 0) {
      console.log('\nMismatched Row Counts:');
      console.log('--------------------');
      mismatchedGroups.forEach(({ group, actual, expected, difference }) => {
        console.log(`${group.padEnd(20)}: ${actual} rows (Expected: ${expected}, Difference: ${difference > 0 ? '+' : ''}${difference})`);
      });
      
      // For each mismatched group, get details about the variables
      console.log('\nDetails for Mismatched Groups:');
      console.log('----------------------------');
      
      for (const { group } of mismatchedGroups) {
        console.log(`\n${group}:`);
        
        // Get variable names and counts
        const variables = await new Promise((resolve, reject) => {
          db.all(`
            SELECT variable_name, COUNT(*) as count 
            FROM chart_data 
            WHERE chart_group = ? 
            GROUP BY variable_name 
            ORDER BY variable_name
          `, [group], (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(rows);
          });
        });
        
        console.log(`  Variables (${variables.length}):`);
        variables.forEach(v => {
          console.log(`    ${v.variable_name?.padEnd(30) || 'NULL'}: ${v.count} rows`);
        });
        
        // Get sample rows
        const sampleRows = await new Promise((resolve, reject) => {
          db.all(`
            SELECT id, chart_group, variable_name, serverName, value, sql_expression 
            FROM chart_data 
            WHERE chart_group = ? 
            LIMIT 2
          `, [group], (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(rows);
          });
        });
        
        console.log(`  Sample rows (${sampleRows.length}):`);
        sampleRows.forEach(row => {
          console.log(`    ID: ${row.id}, Variable: ${row.variable_name}, Server: ${row.serverName}, Value: ${row.value}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking missing chart data:', error);
  } finally {
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

// Run the check
checkMissingChartData();
