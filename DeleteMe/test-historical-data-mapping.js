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

// Test Historical Data chart mapping
async function testHistoricalData(historicalData) {
  const results = [];
  results.push('--- Testing Historical Data Mapping ---');
  
  if (!historicalData || historicalData.length === 0) {
    results.push('No Historical Data found!');
    return results;
  }
  
  results.push(`Found ${historicalData.length} rows for Historical Data`);
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...historicalData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group data by type (P21, POR, Total)
  const p21Data = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('p21'));
  const porData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('por') && !row.variableName.toLowerCase().includes('total'));
  const totalData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('total'));
  
  results.push(`P21 data: ${p21Data.length} rows`);
  results.push(`POR data: ${porData.length} rows`);
  results.push(`Total data: ${totalData.length} rows`);
  
  // Log all entries for inspection
  results.push('\nAll P21 data:');
  p21Data.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  results.push('\nAll POR data:');
  porData.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  results.push('\nAll Total data:');
  totalData.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      sales: 0,
      orders: 0,
      combined: 0
    };
  });
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < p21Data.length; i++) {
    const month = months[i];
    const value = parseNumberValue(p21Data[i].value);
    monthlyData[month].sales = value;
  }
  
  for (let i = 0; i < 12 && i < porData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(porData[i].value);
    monthlyData[month].orders = value;
  }
  
  for (let i = 0; i < 12 && i < totalData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(totalData[i].value);
    monthlyData[month].combined = value;
  }
  
  // Show the monthly mapping
  results.push('\nMonthly data mapping:');
  months.forEach(month => {
    const data = monthlyData[month];
    results.push(`${month}: P21 (sales)=${data.sales}, POR (orders)=${data.orders}, Total (combined)=${data.combined}`);
  });
  
  return results;
}

// Main function to test dashboard data mapping
async function testDashboardDataMapping() {
  console.log('Starting Historical Data mapping test...');
  
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
  
  // Test Historical Data
  const historicalResults = await testHistoricalData(chartGroups['Historical Data'] || []);
  
  // Write results to file
  fs.writeFileSync('historical-data-mapping-results.txt', historicalResults.join('\n'));
  console.log('Results written to historical-data-mapping-results.txt');
}

// Run the test
testDashboardDataMapping().catch(err => {
  console.error('Error testing dashboard data mapping:', err);
});
