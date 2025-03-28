// Test script to verify dashboard data mapping from spreadsheet rows to chart components
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Mock the getChartData function since we can't directly import TypeScript modules in Node.js
async function getChartData(forceRefresh = false) {
  // Open the SQLite database
  const db = await open({
    filename: path.join(process.cwd(), 'data', 'dashboard.db'),
    driver: sqlite3.Database
  });
  
  // Query all rows from the chart_data table with the correct field mappings
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
  
  // Process rows to ensure values are valid (similar to the actual implementation)
  const processedRows = rows.map((row) => {
    // Ensure value is a valid number or string when parsed
    let numericValue = null;
    
    if (typeof row.value === 'string' && row.value.trim() !== '') {
      // Check if the value is a formatted currency string (e.g., "$1,168")
      if (row.value.includes('$') || row.value.includes(',')) {
        // Keep the original formatted string value
        return row;
      }
      
      // Try to parse as a number
      numericValue = parseFloat(row.value);
      if (isNaN(numericValue)) numericValue = null;
    } else if (typeof row.value === 'number') {
      numericValue = row.value;
    }
    
    // Only generate a test value if the value is null or undefined
    if (numericValue === null || numericValue === undefined) {
      // For AR Aging data, we want to respect zero values
      if (row.chartGroup === 'AR Aging') {
        numericValue = 0;
        row.value = '$0';
      } else {
        // For other chart groups, generate a test value
        const seed = parseInt(row.id.toString().replace(/\D/g, '')) || 1;
        numericValue = (seed % 900) + 100; // Generate a value between 100-999
        row.value = String(numericValue);
      }
    } else {
      // Ensure the value is stored as a string
      row.value = String(numericValue);
    }
    
    return row;
  });
  
  // Close the database connection
  await db.close();
  
  return processedRows;
}

// Helper function to parse number values (copied from route.ts)
function parseNumberValue(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Handle currency formatted strings (e.g., "$9,568,728")
    if (value.includes('$') || value.includes(',')) {
      // Remove currency symbol and commas
      const cleanedValue = value.replace(/[$,]/g, '');
      return parseFloat(cleanedValue) || 0;
    }
    return parseFloat(value) || 0;
  }
  
  return 0;
}

// Main test function
async function testDashboardDataMapping() {
  console.log('Starting dashboard data mapping test...');
  
  try {
    // Force a fresh fetch from the database
    const chartData = await getChartData(true);
    console.log(`Retrieved ${chartData.length} rows of chart data`);
    
    // Group data by chart_group
    const dataByGroup = {};
    chartData.forEach(row => {
      const group = row.chartGroup || 'Unknown';
      if (!dataByGroup[group]) {
        dataByGroup[group] = [];
      }
      dataByGroup[group].push(row);
    });
    
    console.log('\nChart groups found:');
    Object.keys(dataByGroup).forEach(group => {
      console.log(`- ${group}: ${dataByGroup[group].length} rows`);
    });
    
    // Test each chart group mapping
    await testAccounts(dataByGroup['Accounts']);
    await testHistoricalData(dataByGroup['Historical Data']);
    await testCustomerMetrics(dataByGroup['Customer Metrics']);
    await testInventory(dataByGroup['Inventory']);
    await testPOROverview(dataByGroup['POR Overview']);
    await testSiteDistribution(dataByGroup['Site Distribution']);
    await testARAging(dataByGroup['AR Aging']);
    await testDailyOrders(dataByGroup['Daily Orders']);
    await testWebOrders(dataByGroup['Web Orders']);
    await testKeyMetrics(dataByGroup['Key Metrics']);
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Test Accounts chart data mapping
async function testAccounts(accountsData) {
  console.log('\n--- Testing Accounts Data Mapping ---');
  if (!accountsData || accountsData.length === 0) {
    console.log('No Accounts data found!');
    return;
  }
  
  console.log(`Found ${accountsData.length} rows for Accounts`);
  
  // Expected structure in ChartsSection.tsx:
  // accounts: { id: string; date: string; payable: number; receivable: number; overdue: number; }[]
  
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
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < payableData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(payableData[i].value);
    monthlyData[month].payable = value;
    console.log(`  Mapped ${month} Payable: ${value}`);
  }
  
  for (let i = 0; i < 12 && i < receivableData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(receivableData[i].value);
    monthlyData[month].receivable = value;
    console.log(`  Mapped ${month} Receivable: ${value}`);
  }
  
  for (let i = 0; i < 12 && i < overdueData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(overdueData[i].value);
    monthlyData[month].overdue = value;
    console.log(`  Mapped ${month} Overdue: ${value}`);
  }
  
  // Verify all months have data
  let missingData = false;
  months.forEach(month => {
    const data = monthlyData[month];
    if (data.payable === 0 && data.receivable === 0 && data.overdue === 0) {
      console.log(`  Warning: No data for month ${month}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All months have Accounts data');
  }
}

// Test Historical Data chart mapping
async function testHistoricalData(historicalData) {
  console.log('\n--- Testing Historical Data Mapping ---');
  if (!historicalData || historicalData.length === 0) {
    console.log('No Historical Data found!');
    return;
  }
  
  console.log(`Found ${historicalData.length} rows for Historical Data`);
  
  // Expected structure in ChartsSection.tsx:
  // historicalData: { id: string; date: string; sales?: number; orders?: number; combined?: number; }[]
  
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
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < p21Data.length; i++) {
    const month = months[i];
    const value = parseNumberValue(p21Data[i].value);
    monthlyData[month].sales = value;
    console.log(`  Mapped ${month} P21 (sales): ${value}`);
  }
  
  for (let i = 0; i < 12 && i < porData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(porData[i].value);
    monthlyData[month].orders = value;
    console.log(`  Mapped ${month} POR (orders): ${value}`);
  }
  
  for (let i = 0; i < 12 && i < totalData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(totalData[i].value);
    monthlyData[month].combined = value;
    console.log(`  Mapped ${month} Total (combined): ${value}`);
  }
  
  // Verify all months have data
  let missingData = false;
  months.forEach(month => {
    const data = monthlyData[month];
    if (data.sales === 0 && data.orders === 0 && data.combined === 0) {
      console.log(`  Warning: No data for month ${month}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All months have Historical data');
  }
}

// Test Customer Metrics chart mapping
async function testCustomerMetrics(customerData) {
  console.log('\n--- Testing Customer Metrics Mapping ---');
  if (!customerData || customerData.length === 0) {
    console.log('No Customer Metrics data found!');
    return;
  }
  
  console.log(`Found ${customerData.length} rows for Customer Metrics`);
  
  // Expected structure in ChartsSection.tsx:
  // customerMetrics: { id: string; date: string; newCustomers: number; returning: number; }[]
  
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      newCustomers: 0,
      returning: 0
    };
  });
  
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
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < newCustomersData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(newCustomersData[i].value);
    monthlyData[month].newCustomers = value;
    console.log(`  Mapped ${month} New Customers: ${value}`);
  }
  
  for (let i = 0; i < 12 && i < returningData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(returningData[i].value);
    monthlyData[month].returning = value;
    console.log(`  Mapped ${month} Prospects/Returning: ${value}`);
  }
  
  // Verify all months have data
  let missingData = false;
  months.forEach(month => {
    const data = monthlyData[month];
    if (data.newCustomers === 0 && data.returning === 0) {
      console.log(`  Warning: No data for month ${month}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All months have Customer Metrics data');
  }
}

// Test Inventory chart mapping
async function testInventory(inventoryData) {
  console.log('\n--- Testing Inventory Mapping ---');
  if (!inventoryData || inventoryData.length === 0) {
    console.log('No Inventory data found!');
    return;
  }
  
  console.log(`Found ${inventoryData.length} rows for Inventory`);
  
  // Expected structure in ChartsSection.tsx:
  // inventory: { id: string; department: string; inStock: number; onOrder: number; }[]
  
  // Group by department
  const departments = ['Department 1', 'Department 2', 'Department 3', 'Department 4'];
  const departmentData = {};
  
  // Initialize department data
  departments.forEach(dept => {
    departmentData[dept] = {
      inStock: 0,
      onOrder: 0
    };
  });
  
  // Process each row
  let deptIndex = 0;
  inventoryData.forEach(row => {
    const value = parseNumberValue(row.value);
    const dept = departments[deptIndex % departments.length];
    
    // Update the appropriate field
    if (row.variableName.toLowerCase().includes('in stock')) {
      departmentData[dept].inStock = value;
      console.log(`  Mapped ${dept} In Stock: ${value}`);
    } else if (row.variableName.toLowerCase().includes('on order')) {
      departmentData[dept].onOrder = value;
      console.log(`  Mapped ${dept} On Order: ${value}`);
      deptIndex++; // Move to next department after processing "on order"
    }
  });
}

// Test POR Overview chart mapping
async function testPOROverview(porData) {
  console.log('\n--- Testing POR Overview Mapping ---');
  if (!porData || porData.length === 0) {
    console.log('No POR Overview data found!');
    return;
  }
  
  console.log(`Found ${porData.length} rows for POR Overview`);
  
  // Expected structure in ChartsSection.tsx:
  // porOverview: { id: string; date: string; newRentals: number; openRentals: number; rentalValue: number; }[]
  
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      newRentals: 0,
      openRentals: 0,
      rentalValue: 0
    };
  });
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...porData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Group data by type (New Rentals, Open Rentals, Rental Value)
  const newRentalsData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('new rentals'));
  const openRentalsData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('open rentals'));
  const rentalValueData = sortedData.filter(row => row.variableName && row.variableName.toLowerCase().includes('rental value'));
  
  console.log(`  New Rentals data: ${newRentalsData.length} rows`);
  console.log(`  Open Rentals data: ${openRentalsData.length} rows`);
  console.log(`  Rental Value data: ${rentalValueData.length} rows`);
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < newRentalsData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(newRentalsData[i].value);
    monthlyData[month].newRentals = value;
    console.log(`  Mapped ${month} New Rentals: ${value}`);
  }
  
  for (let i = 0; i < 12 && i < openRentalsData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(openRentalsData[i].value);
    monthlyData[month].openRentals = value;
    console.log(`  Mapped ${month} Open Rentals: ${value}`);
  }
  
  for (let i = 0; i < 12 && i < rentalValueData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(rentalValueData[i].value);
    monthlyData[month].rentalValue = value;
    console.log(`  Mapped ${month} Rental Value: ${value}`);
  }
  
  // Verify all months have data
  let missingData = false;
  months.forEach(month => {
    const data = monthlyData[month];
    if (data.newRentals === 0 && data.openRentals === 0 && data.rentalValue === 0) {
      console.log(`  Warning: No data for month ${month}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All months have POR Overview data');
  }
}

// Test Site Distribution chart mapping
async function testSiteDistribution(siteData) {
  console.log('\n--- Testing Site Distribution Mapping ---');
  if (!siteData || siteData.length === 0) {
    console.log('No Site Distribution data found!');
    return;
  }
  
  console.log(`Found ${siteData.length} rows for Site Distribution`);
  
  // Expected structure in ChartsSection.tsx:
  // siteDistribution: { id: string; name: string; value: number; }[]
  
  // Default site names
  const defaultSiteNames = ['Columbus', 'Addison', 'Lake City'];
  const siteValues = {};
  
  // Initialize site data
  defaultSiteNames.forEach(site => {
    siteValues[site] = 0;
  });
  
  // Process each row
  siteData.forEach(row => {
    const value = parseNumberValue(row.value);
    
    if (row.variableName) {
      // Find the matching site in our data
      const siteName = row.variableName;
      const siteIndex = defaultSiteNames.findIndex(name => 
        siteName.toLowerCase().includes(name.toLowerCase())
      );
      
      if (siteIndex !== -1) {
        const site = defaultSiteNames[siteIndex];
        siteValues[site] = value;
        console.log(`  Mapped ${site}: ${value}`);
      } else {
        console.log(`  Warning: Could not match site name: ${siteName}`);
      }
    }
  });
}

// Test AR Aging chart mapping
async function testARAging(arData) {
  console.log('\n--- Testing AR Aging Mapping ---');
  if (!arData || arData.length === 0) {
    console.log('No AR Aging data found!');
    return;
  }
  
  console.log(`Found ${arData.length} rows for AR Aging`);
  
  // Expected structure in ChartsSection.tsx:
  // arAging: { id: string; range: string; amount: number; }[]
  
  // Default aging ranges
  const defaultRanges = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
  const rangeValues = {};
  
  // Initialize range data
  defaultRanges.forEach(range => {
    rangeValues[range] = 0;
  });
  
  // Process each row
  arData.forEach(row => {
    const value = parseNumberValue(row.value);
    
    if (row.variableName) {
      // Find the matching range in our data
      const rangeIndex = defaultRanges.findIndex(range => 
        row.variableName.toLowerCase().includes(range.toLowerCase())
      );
      
      if (rangeIndex !== -1) {
        const range = defaultRanges[rangeIndex];
        rangeValues[range] = value;
        console.log(`  Mapped ${range}: ${value}`);
      } else {
        console.log(`  Warning: Could not match aging range: ${row.variableName}`);
      }
    }
  });
}

// Test Daily Orders chart mapping
async function testDailyOrders(dailyData) {
  console.log('\n--- Testing Daily Orders Mapping ---');
  if (!dailyData || dailyData.length === 0) {
    console.log('No Daily Orders data found!');
    return;
  }
  
  console.log(`Found ${dailyData.length} rows for Daily Orders`);
  
  // Expected structure in ChartsSection.tsx:
  // dailyOrders: { id: string; date: string; orders: number; }[]
  
  // Default day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayValues = {};
  
  // Initialize day data
  dayNames.forEach(day => {
    dayValues[day] = 0;
  });
  
  // Sort data by ID to ensure proper day mapping
  const sortedData = [...dailyData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  console.log(`  Daily Orders data: ${sortedData.length} rows`);
  
  // Map each data row to days based on position in the sorted array
  for (let i = 0; i < 7 && i < sortedData.length; i++) {
    const day = dayNames[i];
    const value = parseNumberValue(sortedData[i].value);
    dayValues[day] = value;
    console.log(`  Mapped ${day}: ${value}`);
  }
  
  // Verify all days have data
  let missingData = false;
  dayNames.forEach(day => {
    if (dayValues[day] === 0) {
      console.log(`  Warning: No data for ${day}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All days have Daily Orders data');
  }
}

// Test Web Orders chart mapping
async function testWebOrders(webData) {
  console.log('\n--- Testing Web Orders Mapping ---');
  if (!webData || webData.length === 0) {
    console.log('No Web Orders data found!');
    return;
  }
  
  console.log(`Found ${webData.length} rows for Web Orders`);
  
  // Expected structure in ChartsSection.tsx:
  // webOrders: { id: string; date: string; orders: number; revenue: number; }[]
  
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};
  
  // Initialize monthly data
  months.forEach(month => {
    monthlyData[month] = {
      orders: 0,
      revenue: 0
    };
  });
  
  // Sort data by ID to ensure proper month mapping
  const sortedData = [...webData].sort((a, b) => {
    const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
    return idA - idB;
  });
  
  // Web Orders typically only has the Orders variable
  console.log(`  Web Orders data: ${sortedData.length} rows`);
  
  // Map each data type to months based on position in the sorted array
  for (let i = 0; i < 12 && i < sortedData.length; i++) {
    const month = months[i];
    const value = parseNumberValue(sortedData[i].value);
    monthlyData[month].orders = value;
    // Set a placeholder revenue value based on orders
    monthlyData[month].revenue = value * 100; // Just a placeholder calculation
    console.log(`  Mapped ${month} Orders: ${value}, Revenue: ${value * 100}`);
  }
  
  // Verify all months have data
  let missingData = false;
  months.forEach(month => {
    const data = monthlyData[month];
    if (data.orders === 0) {
      console.log(`  Warning: No data for month ${month}`);
      missingData = true;
    }
  });
  
  if (!missingData) {
    console.log('  All months have Web Orders data');
  }
}

// Test Key Metrics chart mapping
async function testKeyMetrics(metricsData) {
  console.log('\n--- Testing Key Metrics Mapping ---');
  if (!metricsData || metricsData.length === 0) {
    console.log('No Key Metrics data found!');
    return;
  }
  
  console.log(`Found ${metricsData.length} rows for Key Metrics`);
  
  // Expected structure:
  // metrics: { id: string; name: string; value: number; trend: string; change: number; color: string; }[]
  
  // Process each row
  metricsData.forEach(row => {
    const value = parseNumberValue(row.value);
    
    // Convert the variableName to the format expected by the MetricsSection component
    const metricName = row.variableName.toLowerCase().replace(/ /g, '_');
    console.log(`  Mapped metric: ${row.variableName} (${metricName}) with value: ${value}`);
  });
}

// Run the test
testDashboardDataMapping().catch(console.error);
