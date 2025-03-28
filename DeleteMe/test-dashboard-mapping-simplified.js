const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

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

// Mock implementation of getChartData
async function getChartData() {
  // Open the database
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'dashboard.db');
  
  console.log(`Using database at: ${dbPath}`);
  
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
}

// Main function to test dashboard data mapping
async function testDashboardDataMapping() {
  console.log('Starting dashboard data mapping test...');
  
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
  
  // Test key chart groups that had issues
  await testHistoricalData(chartGroups['Historical Data'] || []);
  await testAccounts(chartGroups['Accounts'] || []);
  await testCustomerMetrics(chartGroups['Customer Metrics'] || []);
}

// Test Historical Data chart mapping
async function testHistoricalData(historicalData) {
  console.log('\n--- Testing Historical Data Mapping ---');
  if (!historicalData || historicalData.length === 0) {
    console.log('No Historical Data found!');
    return;
  }
  
  console.log(`Found ${historicalData.length} rows for Historical Data`);
  
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
  
  console.log(`  P21 data: ${p21Data.length} rows`);
  console.log(`  POR data: ${porData.length} rows`);
  console.log(`  Total data: ${totalData.length} rows`);
  
  // Log the first few entries of each type for inspection
  console.log('\n  Sample P21 data:');
  p21Data.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  console.log('\n  Sample POR data:');
  porData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  console.log('\n  Sample Total data:');
  totalData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
}

// Test Accounts chart data mapping
async function testAccounts(accountsData) {
  console.log('\n--- Testing Accounts Data Mapping ---');
  if (!accountsData || accountsData.length === 0) {
    console.log('No Accounts data found!');
    return;
  }
  
  console.log(`Found ${accountsData.length} rows for Accounts`);
  
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
  
  console.log(`  Payable data: ${payableData.length} rows`);
  console.log(`  Receivable data: ${receivableData.length} rows`);
  console.log(`  Overdue data: ${overdueData.length} rows`);
  
  // Log the first few entries of each type for inspection
  console.log('\n  Sample Payable data:');
  payableData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  console.log('\n  Sample Receivable data:');
  receivableData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  console.log('\n  Sample Overdue data:');
  overdueData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
}

// Test Customer Metrics chart mapping
async function testCustomerMetrics(customerData) {
  console.log('\n--- Testing Customer Metrics Mapping ---');
  if (!customerData || customerData.length === 0) {
    console.log('No Customer Metrics data found!');
    return;
  }
  
  console.log(`Found ${customerData.length} rows for Customer Metrics`);
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...customerData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group data by type (New Customers, Prospects/Returning)
  const newCustomersData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('new'));
  const returningData = sortedData.filter(row => row.variableName && (row.variableName.toLowerCase().includes('prospects') || row.variableName.toLowerCase().includes('returning')));
  
  console.log(`  New Customers data: ${newCustomersData.length} rows`);
  console.log(`  Prospects/Returning data: ${returningData.length} rows`);
  
  // Log the first few entries of each type for inspection
  console.log('\n  Sample New Customers data:');
  newCustomersData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
  
  console.log('\n  Sample Prospects/Returning data:');
  returningData.slice(0, 3).forEach(row => console.log(`    ID: ${row.id}, Name: ${row.variableName}, Value: ${row.value}`));
}

// Run the test
testDashboardDataMapping().catch(err => {
  console.error('Error testing dashboard data mapping:', err);
});
