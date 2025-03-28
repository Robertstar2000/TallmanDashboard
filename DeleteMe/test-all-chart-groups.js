const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Helper function to parse number values
function parseNumberValue(value) {
  if (value === null || value === undefined) return 0;
  
  // If it's already a number, return it
  if (typeof value === 'number') return value;
  
  // Try to parse string to number
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(cleanedValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }
  
  return 0;
}

// Get chart data from database
async function getChartData() {
  // Open the database
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'dashboard.db');
  
  console.log(`Using database at: ${dbPath}`);
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Query the chart_data table
    const rows = await db.all(`
      SELECT 
        id,
        chart_group as "chartGroup",
        variable_name as "variableName",
        server_name as "serverName",
        db_table_name as "tableName",
        sql_expression as "sqlExpression",
        production_sql_expression as "productionSqlExpression",
        value,
        transformer,
        last_updated as "lastUpdated"
      FROM chart_data
    `);
    
    await db.close();
    return rows;
  } catch (error) {
    console.error('Error querying database:', error);
    return [];
  }
}

// Main function to test dashboard data mapping
async function testDashboardDataMapping() {
  console.log('Starting chart groups analysis...');
  
  // Get chart data
  const chartData = await getChartData();
  console.log(`Retrieved ${chartData.length} rows of chart data`);
  
  // Group by chart group
  const chartGroups = {};
  chartData.forEach(row => {
    const group = row.chartGroup;
    if (!chartGroups[group]) {
      chartGroups[group] = [];
    }
    chartGroups[group].push(row);
  });
  
  console.log('\nChart groups found:');
  Object.keys(chartGroups).forEach(group => {
    console.log(`- ${group}: ${chartGroups[group].length} rows`);
  });
  
  // Analyze all chart groups
  const results = [];
  results.push('# Dashboard Chart Groups Analysis');
  results.push('');
  
  // Process each chart group
  for (const groupName of Object.keys(chartGroups)) {
    const groupData = chartGroups[groupName];
    results.push(`## ${groupName} (${groupData.length} rows)`);
    results.push('');
    
    // Sort data by ID
    const sortedData = [...groupData].sort((a, b) => {
      const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
      const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
      return idA - idB;
    });
    
    // Group by variable name pattern
    const variableGroups = {};
    sortedData.forEach(row => {
      if (!row.variableName) return;
      
      // Extract the base variable name (without month/day/etc.)
      let baseVariable = row.variableName;
      
      // Remove month names and parentheses
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        baseVariable = baseVariable.replace(new RegExp(`\\(${month}\\)`, 'i'), '');
        baseVariable = baseVariable.replace(new RegExp(`${month}`, 'i'), '');
      });
      
      // Remove days of week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(day => {
        baseVariable = baseVariable.replace(new RegExp(`\\(${day}\\)`, 'i'), '');
        baseVariable = baseVariable.replace(new RegExp(`${day}`, 'i'), '');
      });
      
      // Clean up remaining parentheses and trim
      baseVariable = baseVariable.replace(/\(|\)/g, '').trim();
      
      if (!variableGroups[baseVariable]) {
        variableGroups[baseVariable] = [];
      }
      
      variableGroups[baseVariable].push(row);
    });
    
    // Output variable groups
    results.push('### Variable Groups:');
    Object.keys(variableGroups).forEach(variable => {
      results.push(`- ${variable}: ${variableGroups[variable].length} rows`);
    });
    results.push('');
    
    // Show sample data for each variable group
    for (const variable of Object.keys(variableGroups)) {
      results.push(`### ${variable} Data:`);
      const varData = variableGroups[variable];
      
      // Show first few rows
      const sampleSize = Math.min(5, varData.length);
      for (let i = 0; i < sampleSize; i++) {
        const row = varData[i];
        results.push(`- ID: ${row.id}, Name: "${row.variableName}", Value: ${row.value}`);
      }
      
      if (varData.length > sampleSize) {
        results.push(`- ... and ${varData.length - sampleSize} more rows`);
      }
      
      results.push('');
    }
    
    results.push('---');
    results.push('');
  }
  
  // Write results to file
  fs.writeFileSync('chart-groups-analysis.txt', results.join('\n'));
  console.log('Results written to chart-groups-analysis.txt');
}

// Run the test
testDashboardDataMapping().catch(err => {
  console.error('Error analyzing chart groups:', err);
});
