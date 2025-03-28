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
    // Check if it's a formatted currency string (e.g., "$1,168")
    if (value.includes('$') || value.includes(',')) {
      // Remove currency symbols and commas
      const cleanedValue = value.replace(/[$,]/g, '');
      const parsedValue = parseFloat(cleanedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    }
    
    // Regular number parsing
    const parsedValue = parseFloat(value);
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

// Test Accounts data mapping
async function testAccountsData(accountsData) {
  const results = [];
  results.push('# Accounts Data Analysis');
  
  if (!accountsData || accountsData.length === 0) {
    results.push('No Accounts data found!');
    return results;
  }
  
  results.push(`Found ${accountsData.length} rows for Accounts`);
  
  // Group data by variable type
  const payableData = [];
  const receivableData = [];
  const overdueData = [];
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...accountsData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group by variable type
  sortedData.forEach(row => {
    if (row.variableName && row.variableName.toLowerCase().includes('payable')) {
      payableData.push(row);
    } else if (row.variableName && row.variableName.toLowerCase().includes('receivable') && !row.variableName.toLowerCase().includes('overdue')) {
      receivableData.push(row);
    } else if (row.variableName && row.variableName.toLowerCase().includes('overdue')) {
      overdueData.push(row);
    }
  });
  
  results.push(`\nAccounts groups: Payable=${payableData.length}, Receivable=${receivableData.length}, Overdue=${overdueData.length}`);
  
  // Show data for each type
  results.push('\n## Payable Data:');
  payableData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  results.push('\n## Receivable Data:');
  receivableData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  results.push('\n## Overdue Data:');
  overdueData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  // Map to months
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
  results.push('\n## Monthly Mapping:');
  months.forEach(month => {
    const data = monthlyData[month];
    results.push(`${month}: Payable=${data.payable}, Receivable=${data.receivable}, Overdue=${data.overdue}`);
  });
  
  return results;
}

// Test Historical Data mapping
async function testHistoricalData(historicalData) {
  const results = [];
  results.push('# Historical Data Analysis');
  
  if (!historicalData || historicalData.length === 0) {
    results.push('No Historical Data found!');
    return results;
  }
  
  results.push(`Found ${historicalData.length} rows for Historical Data`);
  
  // Group data by variable type
  const p21Data = [];
  const porData = [];
  const totalData = [];
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...historicalData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group by variable type
  sortedData.forEach(row => {
    if (row.variableName && row.variableName.toLowerCase().includes('p21')) {
      p21Data.push(row);
    } else if (row.variableName && row.variableName.toLowerCase().includes('por') && !row.variableName.toLowerCase().includes('total')) {
      porData.push(row);
    } else if (row.variableName && row.variableName.toLowerCase().includes('total')) {
      totalData.push(row);
    }
  });
  
  results.push(`\nHistorical Data groups: P21=${p21Data.length}, POR=${porData.length}, Total=${totalData.length}`);
  
  // Show data for each type
  results.push('\n## P21 Data:');
  p21Data.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  results.push('\n## POR Data:');
  porData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  results.push('\n## Total Data:');
  totalData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  // Map to months
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
  results.push('\n## Monthly Mapping:');
  months.forEach(month => {
    const data = monthlyData[month];
    results.push(`${month}: P21 (sales)=${data.sales}, POR (orders)=${data.orders}, Total (combined)=${data.combined}`);
  });
  
  return results;
}

// Test Customer Metrics mapping
async function testCustomerMetrics(customerMetricsData) {
  const results = [];
  results.push('# Customer Metrics Analysis');
  
  if (!customerMetricsData || customerMetricsData.length === 0) {
    results.push('No Customer Metrics data found!');
    return results;
  }
  
  results.push(`Found ${customerMetricsData.length} rows for Customer Metrics`);
  
  // Group data by variable type
  const newCustomersData = [];
  const prospectsData = [];
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...customerMetricsData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group by variable type
  sortedData.forEach(row => {
    if (row.variableName && row.variableName.toLowerCase().includes('new')) {
      newCustomersData.push(row);
    } else if (row.variableName && row.variableName.toLowerCase().includes('prospects')) {
      prospectsData.push(row);
    }
  });
  
  results.push(`\nCustomer Metrics groups: New=${newCustomersData.length}, Prospects=${prospectsData.length}`);
  
  // Show data for each type
  results.push('\n## New Customers Data:');
  newCustomersData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  results.push('\n## Prospects Data:');
  prospectsData.forEach(row => {
    results.push(`ID: ${row.id}, Name: "${row.variableName}", Value: ${parseNumberValue(row.value)}`);
  });
  
  // Map to months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      newCustomers: 0,
      prospects: 0
    };
  });
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < newCustomersData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(newCustomersData[i].value);
    monthlyData[month].newCustomers = value;
  }
  
  for (let i = 0; i < 12 && i < prospectsData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(prospectsData[i].value);
    monthlyData[month].prospects = value;
  }
  
  // Show the monthly mapping
  results.push('\n## Monthly Mapping:');
  months.forEach(month => {
    const data = monthlyData[month];
    results.push(`${month}: New Customers=${data.newCustomers}, Prospects=${data.prospects}`);
  });
  
  return results;
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
  
  // Test each chart group
  const accountsResults = await testAccountsData(chartGroups['Accounts'] || []);
  const historicalResults = await testHistoricalData(chartGroups['Historical Data'] || []);
  const customerResults = await testCustomerMetrics(chartGroups['Customer Metrics'] || []);
  
  // Write results to file
  fs.writeFileSync('accounts-mapping-results.txt', accountsResults.join('\n'));
  fs.writeFileSync('historical-data-mapping-results.txt', historicalResults.join('\n'));
  fs.writeFileSync('customer-metrics-results.txt', customerResults.join('\n'));
  
  console.log('Results written to:');
  console.log('- accounts-mapping-results.txt');
  console.log('- historical-data-mapping-results.txt');
  console.log('- customer-metrics-results.txt');
}

// Run the test
testDashboardDataMapping().catch(err => {
  console.error('Error testing dashboard data mapping:', err);
});
