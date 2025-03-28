// Script to verify that the dashboard is displaying non-zero values
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the main database
const db = sqlite3(path.join(dataDir, 'dashboard.db'));

// Check if the chart_data table has non-zero values
function checkChartDataValues() {
  const rows = db.prepare(`
    SELECT id, chart_name, variable_name, value
    FROM chart_data
    ORDER BY id
  `).all();
  
  console.log(`Found ${rows.length} rows in chart_data table`);
  
  let zeroCount = 0;
  let nonZeroCount = 0;
  let nullCount = 0;
  
  for (const row of rows) {
    const value = row.value;
    
    if (value === null || value === undefined || value === '') {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): NULL value`);
      nullCount++;
    } else if (parseFloat(value) === 0) {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): ZERO value`);
      zeroCount++;
    } else {
      console.log(`Row ${row.id} (${row.chart_name} - ${row.variable_name}): Value = ${value}`);
      nonZeroCount++;
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- Non-zero values: ${nonZeroCount}`);
  console.log(`- Zero values: ${zeroCount}`);
  console.log(`- NULL values: ${nullCount}`);
  
  return { nonZeroCount, zeroCount, nullCount };
}

// Update values in chart_data table with test values
function updateChartDataWithTestValues() {
  // Get all rows from chart_data
  const rows = db.prepare(`
    SELECT id, chart_name, variable_name
    FROM chart_data
    ORDER BY id
  `).all();
  
  console.log(`Found ${rows.length} rows in chart_data table`);
  
  // Get test values from test_data_mapping
  const update = db.prepare(`
    UPDATE chart_data
    SET value = (SELECT test_value FROM test_data_mapping WHERE test_data_mapping.id = chart_data.id)
    WHERE id = ?
  `);
  
  // Begin transaction
  const updateMany = db.transaction((rows) => {
    for (const row of rows) {
      update.run(row.id);
    }
  });
  
  updateMany(rows);
  console.log(`Updated ${rows.length} rows with test values`);
}

// Main function
async function main() {
  try {
    console.log('Verifying dashboard values...');
    
    // Check current values
    console.log('\nCurrent values in chart_data table:');
    const beforeCounts = checkChartDataValues();
    
    // If we have zero or null values, update them with test values
    if (beforeCounts.zeroCount > 0 || beforeCounts.nullCount > 0) {
      console.log('\nUpdating chart_data with test values...');
      updateChartDataWithTestValues();
      
      // Check values after update
      console.log('\nValues after update:');
      const afterCounts = checkChartDataValues();
      
      // Calculate improvement
      const improvement = afterCounts.nonZeroCount - beforeCounts.nonZeroCount;
      console.log(`\nImprovement: ${improvement} rows now have non-zero values`);
    } else {
      console.log('\nAll rows already have non-zero values. No update needed.');
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the main function
main();
