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

// Test Accounts chart data mapping
async function testAccounts(accountsData) {
  const results = [];
  results.push('--- Testing Accounts Data Mapping ---');
  
  if (!accountsData || accountsData.length === 0) {
    results.push('No Accounts data found!');
    return results;
  }
  
  results.push(`Found ${accountsData.length} rows for Accounts`);
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...accountsData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group data by type (Payable, Receivable, Overdue)
  const payableData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('payable'));
  const receivableData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('receivable'));
  const overdueData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('overdue'));
  
  results.push(`Payable data: ${payableData.length} rows`);
  results.push(`Receivable data: ${receivableData.length} rows`);
  results.push(`Overdue data: ${overdueData.length} rows`);
  
  // Log all entries for inspection
  results.push('\nAll Payable data:');
  payableData.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  results.push('\nAll Receivable data:');
  receivableData.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  results.push('\nAll Overdue data:');
  overdueData.forEach(row => results.push(`ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      payable: 0,
      receivable: 0,
      overdue: 0
    };
  });
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < payableData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(payableData[i].value);
    monthlyData[month].payable = value;
  }
  
  for (let i = 0; i < 12 && i < receivableData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(receivableData[i].value);
    monthlyData[month].receivable = value;
  }
  
  for (let i = 0; i < 12 && i < overdueData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(overdueData[i].value);
    monthlyData[month].overdue = value;
  }
  
  // Show the monthly mapping
  results.push('\nMonthly data mapping:');
  months.forEach(month => {
    const data = monthlyData[month];
    results.push(`${month}: Payable=${data.payable}, Receivable=${data.receivable}, Overdue=${data.overdue}`);
  });
  
  return results;
}

// Main function to test dashboard data mapping
async function testDashboardDataMapping() {
  console.log('Starting Accounts data mapping test...');
  
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
  
  // Test Accounts data
  const accountsResults = await testAccounts(chartGroups['Accounts'] || []);
  
  // Write results to file
  fs.writeFileSync('accounts-mapping-results.txt', accountsResults.join('\n'));
  console.log('Results written to accounts-mapping-results.txt');
}

// Run the test
testDashboardDataMapping().catch(err => {
  console.error('Error testing dashboard data mapping:', err);
});
