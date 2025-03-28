import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getChartData } from '@/lib/db/sqlite';
import { SpreadsheetRow, DashboardData, MetricItem, HistoricalDataPoint, AccountsDataPoint, CustomerMetricPoint, InventoryDataPoint, POROverviewPoint, SiteDistributionPoint, ARAgingPoint, DailyOrderPoint, WebOrderPoint } from '@/lib/types/dashboard';

// Declare the global variable for TypeScript
declare global {
  var chartDataCache: any;
}

export async function GET() {
  // Check for cache-busting file
  let forceRefresh = false;
  
  try {
    const cacheFile = path.join(process.cwd(), 'data', 'cache-refresh.txt');
    if (fs.existsSync(cacheFile)) {
      console.log('Cache-busting file found, clearing chart data cache');
      // Clear any cached data (this will force a fresh fetch from the database)
      global.chartDataCache = null;
      forceRefresh = true;
      
      // Optionally remove the cache-busting file after processing
      try {
        fs.unlinkSync(cacheFile);
        console.log('Removed cache-busting file after processing');
      } catch (unlinkError) {
        console.error('Error removing cache-busting file:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Error checking cache-busting file:', error);
  }

  // Check for another cache-busting file
  try {
    const cacheBustFile = path.join(process.cwd(), 'data', 'cache-bust.txt');
    if (fs.existsSync(cacheBustFile)) {
      console.log('Cache bust file found, clearing chart data cache');
      global.chartDataCache = null;
      forceRefresh = true;
      
      // Optionally remove the cache-busting file after processing
      try {
        fs.unlinkSync(cacheBustFile);
        console.log('Removed cache-bust file after processing');
      } catch (unlinkError) {
        console.error('Error removing cache-bust file:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Error checking cache-bust file:', error);
  }

  try {
    console.log('Starting to fetch chart data');
    // Pass forceRefresh parameter to getChartData
    const chartData = await getChartData(forceRefresh);
    console.log(`Got chart data with ${chartData.length} rows`);

    // Validate chart data before proceeding
    if (!Array.isArray(chartData)) {
      console.error('Invalid chart data format - not an array:', typeof chartData);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid chart data format',
          error: 'Chart data is not an array'
        },
        { status: 500 }
      );
    }

    // Transform chart_data into dashboard format
    let dashboardData: DashboardData = {
      metrics: [],
      historicalData: [],
      accounts: [],
      customerMetrics: [],
      inventory: [],
      porOverview: [],
      siteDistribution: [],
      arAging: [],
      dailyOrders: [],
      webOrders: [],
      status: {}
    };

    // Pre-populate month names for reference
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Department names for inventory
    const departments = ['100', '101', '102', '107'];

    // Group data by chart_group
    const dataByGroup: { [key: string]: SpreadsheetRow[] } = {};
    
    // Filter out rows with empty chart groups
    const validChartData = chartData.filter(row => {
      return row.chartGroup && row.chartGroup.trim() !== '';
    });
    
    console.log(`Filtered chart data: ${validChartData.length} valid rows out of ${chartData.length} total rows`);
    
    validChartData.forEach(row => {
      const group = row.chartGroup || 'Unknown';
      if (!dataByGroup[group]) {
        dataByGroup[group] = [];
      }
      dataByGroup[group].push(row);
    });
    
    console.log('Data grouped by chart_group:', Object.keys(dataByGroup).join(', '));

    // Process Key Metrics - 7 separate metrics
    if (dataByGroup['Key Metrics']) {
      console.log(`Processing Key Metrics (${dataByGroup['Key Metrics'].length} rows)`);
      
      // Define the expected metric names for the dashboard
      const metricNameMap: { [key: string]: string } = {
        'Total Orders': 'total_orders',
        'Open Orders (/day)': 'open_orders',
        'All Open Orders': 'open_orders_2',
        'Daily Revenue': 'daily_revenue',
        'Open Invoices': 'open_invoices',
        'OrdersBackloged': 'orders_backlogged',
        'Total Sales Monthly': 'total_sales_monthly'
      };
      
      // Process each key metric
      dataByGroup['Key Metrics'].forEach(row => {
        // Try to parse value as a number
        let value = parseNumberValue(row.value);
        
        // Get the standardized metric name or fallback to lowercase with underscores
        let metricName = metricNameMap[row.variableName] || row.variableName.toLowerCase().replace(/ /g, '_');
        
        console.log(`Adding metric: ${row.variableName} (${metricName}) with value: ${value}`);
        
        dashboardData.metrics.push({
          id: row.id,
          name: metricName,
          value: value,
          trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral',
          change: 0,
          color: getRandomColor()
        });
      });
    }

    // Process Historical Data - 3 variables (p21, por, total) for 12 months
    if (dataByGroup['Historical Data']) {
      console.log(`Processing Historical Data (${dataByGroup['Historical Data'].length} rows)`);
      
      // Create data points for each month
      for (let i = 0; i < 12; i++) {
        const month = months[i];
        dashboardData.historicalData.push({
          id: `historical-${i+1}`,
          date: month,
          sales: 0,
          orders: 0,
          combined: 0
        });
      }
      
      // Group data by variable type
      const p21Data: SpreadsheetRow[] = [];
      const porData: SpreadsheetRow[] = [];
      const totalData: SpreadsheetRow[] = [];
      
      // Sort data by ID to ensure proper month mapping
      const sortedData = [...dataByGroup['Historical Data']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
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
      
      console.log(`Historical Data groups: P21=${p21Data.length}, POR=${porData.length}, Total=${totalData.length}`);
      
      // Map each data type to months based on position in the sorted array
      for (let i = 0; i < 12 && i < p21Data.length; i++) {
        const value = parseNumberValue(p21Data[i].value);
        dashboardData.historicalData[i].sales = value;
      }
      
      for (let i = 0; i < 12 && i < porData.length; i++) {
        const value = parseNumberValue(porData[i].value);
        dashboardData.historicalData[i].orders = value;
      }
      
      for (let i = 0; i < 12 && i < totalData.length; i++) {
        const value = parseNumberValue(totalData[i].value);
        dashboardData.historicalData[i].combined = value;
      }
    }

    // Process Accounts - 3 variables (payable, receivable, overdue) for 12 months
    if (dataByGroup['Accounts']) {
      console.log(`Processing Accounts (${dataByGroup['Accounts'].length} rows)`);
      
      // Create data points for each month
      for (let i = 0; i < 12; i++) {
        const month = months[i];
        dashboardData.accounts.push({
          id: `account-${i+1}`,
          date: month,
          payable: 0,
          receivable: 0,
          overdue: 0
        });
      }
      
      // Group data by variable type
      const payableData: SpreadsheetRow[] = [];
      const receivableData: SpreadsheetRow[] = [];
      const overdueData: SpreadsheetRow[] = [];
      
      // Sort data by ID to ensure proper month mapping
      const sortedData = [...dataByGroup['Accounts']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
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
      
      console.log(`Accounts groups: Payable=${payableData.length}, Receivable=${receivableData.length}, Overdue=${overdueData.length}`);
      
      // Map each data type to months based on position in the sorted array
      for (let i = 0; i < 12 && i < payableData.length; i++) {
        const value = parseNumberValue(payableData[i].value);
        dashboardData.accounts[i].payable = value;
      }
      
      for (let i = 0; i < 12 && i < receivableData.length; i++) {
        const value = parseNumberValue(receivableData[i].value);
        dashboardData.accounts[i].receivable = value;
      }
      
      for (let i = 0; i < 12 && i < overdueData.length; i++) {
        const value = parseNumberValue(overdueData[i].value);
        dashboardData.accounts[i].overdue = value;
      }
    }

    // Process Customer Metrics - 2 variables (new, prospects) for 12 months
    if (dataByGroup['Customer Metrics']) {
      console.log(`Processing Customer Metrics (${dataByGroup['Customer Metrics'].length} rows)`);
      
      // Create data points for each month
      for (let i = 0; i < 12; i++) {
        const month = months[i];
        dashboardData.customerMetrics.push({
          id: `customer-${i+1}`,
          date: month,
          newCustomers: 0,
          returning: 0
        });
      }
      
      // Group data by variable type
      const newCustomersData: SpreadsheetRow[] = [];
      const prospectsData: SpreadsheetRow[] = [];
      
      // Sort data by ID to ensure proper month mapping
      const sortedData = [...dataByGroup['Customer Metrics']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
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
      
      console.log(`Customer Metrics groups: New=${newCustomersData.length}, Prospects=${prospectsData.length}`);
      
      // Map each data type to months based on position in the sorted array
      for (let i = 0; i < 12 && i < newCustomersData.length; i++) {
        const value = parseNumberValue(newCustomersData[i].value);
        dashboardData.customerMetrics[i].newCustomers = value;
      }
      
      for (let i = 0; i < 12 && i < prospectsData.length; i++) {
        const value = parseNumberValue(prospectsData[i].value);
        dashboardData.customerMetrics[i].returning = value;
      }
    }

    // Process Inventory - 2 variables (inStock, onOrder) for 4 departments
    if (dataByGroup['Inventory']) {
      console.log(`Processing Inventory (${dataByGroup['Inventory'].length} rows)`);
      
      // Default department names
      const departments = ['Department 1', 'Department 2', 'Department 3', 'Department 4'];
      
      // Create data points for each department
      for (let i = 0; i < 4; i++) {
        dashboardData.inventory.push({
          id: `inventory-${i+1}`,
          department: departments[i],
          inStock: 0,
          onOrder: 0
        });
      }
      
      // Group data by variable type
      const inStockData: SpreadsheetRow[] = [];
      const onOrderData: SpreadsheetRow[] = [];
      
      // Sort data by ID to ensure proper department mapping
      const sortedData = [...dataByGroup['Inventory']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      // Group by variable type
      sortedData.forEach(row => {
        if (row.variableName && row.variableName.toLowerCase().includes('in stock')) {
          inStockData.push(row);
        } else if (row.variableName && row.variableName.toLowerCase().includes('on order')) {
          onOrderData.push(row);
        }
      });
      
      console.log(`Inventory groups: In Stock=${inStockData.length}, On Order=${onOrderData.length}`);
      
      // Map each data type to departments based on position in the sorted array
      for (let i = 0; i < 4 && i < inStockData.length; i++) {
        const value = parseNumberValue(inStockData[i].value);
        dashboardData.inventory[i].inStock = value;
      }
      
      for (let i = 0; i < 4 && i < onOrderData.length; i++) {
        const value = parseNumberValue(onOrderData[i].value);
        dashboardData.inventory[i].onOrder = value;
      }
    }

    // Process POR Overview - 3 variables (newRentals, openRentals, rentalValue) for 12 months
    if (dataByGroup['POR Overview']) {
      console.log(`Processing POR Overview (${dataByGroup['POR Overview'].length} rows)`);
      
      // Create data points for each month
      for (let i = 0; i < 12; i++) {
        const month = months[i];
        dashboardData.porOverview.push({
          id: `por-${i+1}`,
          date: month,
          newRentals: 0,
          openRentals: 0,
          rentalValue: 0
        });
      }
      
      // Group data by variable type
      const newRentalsData: SpreadsheetRow[] = [];
      const openRentalsData: SpreadsheetRow[] = [];
      const rentalValueData: SpreadsheetRow[] = [];
      
      // Sort data by ID to ensure proper month mapping
      const sortedData = [...dataByGroup['POR Overview']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      // Group by variable type
      sortedData.forEach(row => {
        if (row.variableName && row.variableName.toLowerCase().includes('new rental')) {
          newRentalsData.push(row);
        } else if (row.variableName && row.variableName.toLowerCase().includes('open rental')) {
          openRentalsData.push(row);
        } else if (row.variableName && row.variableName.toLowerCase().includes('rental value')) {
          rentalValueData.push(row);
        }
      });
      
      console.log(`POR Overview groups: New Rentals=${newRentalsData.length}, Open Rentals=${openRentalsData.length}, Rental Value=${rentalValueData.length}`);
      
      // Map each data type to months based on position in the sorted array
      for (let i = 0; i < 12 && i < newRentalsData.length; i++) {
        const value = parseNumberValue(newRentalsData[i].value);
        dashboardData.porOverview[i].newRentals = value;
      }
      
      for (let i = 0; i < 12 && i < openRentalsData.length; i++) {
        const value = parseNumberValue(openRentalsData[i].value);
        dashboardData.porOverview[i].openRentals = value;
      }
      
      for (let i = 0; i < 12 && i < rentalValueData.length; i++) {
        const value = parseNumberValue(rentalValueData[i].value);
        dashboardData.porOverview[i].rentalValue = value;
      }
    }

    // Process Site Distribution - 1 variable for 3 locations
    if (dataByGroup['Site Distribution']) {
      console.log(`Processing Site Distribution (${dataByGroup['Site Distribution'].length} rows)`);
      
      // Default location names
      const locations = ['Columbus', 'Addison', 'Lake City'];
      
      // Create data points for each location
      for (let i = 0; i < 3; i++) {
        dashboardData.siteDistribution.push({
          id: `site-${i+1}`,
          name: locations[i],
          value: 0
        });
      }
      
      // Sort data by ID to ensure proper location mapping
      const sortedData = [...dataByGroup['Site Distribution']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      console.log(`Site Distribution data: ${sortedData.length} rows`);
      
      // Map data to locations based on position in the sorted array
      for (let i = 0; i < 3 && i < sortedData.length; i++) {
        const value = parseNumberValue(sortedData[i].value);
        dashboardData.siteDistribution[i].value = value;
      }
    }

    // Process AR Aging - 5 buckets with one variable
    if (dataByGroup['AR Aging']) {
      console.log(`Processing AR Aging (${dataByGroup['AR Aging'].length} rows)`);
      
      // Default bucket names
      const buckets = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
      
      // Create data points for each bucket
      for (let i = 0; i < 5; i++) {
        dashboardData.arAging.push({
          id: `ar-${i+1}`,
          range: buckets[i],
          amount: 0 
        });
      }
      
      // Sort data by ID to ensure proper bucket mapping
      const sortedData = [...dataByGroup['AR Aging']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      console.log(`AR Aging data: ${sortedData.length} rows`);
      
      // Map data to buckets based on position in the sorted array
      for (let i = 0; i < 5 && i < sortedData.length; i++) {
        const value = parseNumberValue(sortedData[i].value);
        dashboardData.arAging[i].amount = value; 
      }
      
      console.log('Processed AR Aging data:', JSON.stringify(dashboardData.arAging));
    }

    // Process Daily Orders - 1 variable (Orders) for 7 days
    if (dataByGroup['Daily Orders']) {
      console.log(`Processing Daily Orders (${dataByGroup['Daily Orders'].length} rows)`);
      
      // Create data points for each day
      const days = ['Today', 'Yesterday', 'Day-2', 'Day-3', 'Day-4', 'Day-5', 'Day-6'];
      for (let i = 0; i < 7; i++) {
        const day = days[i];
        dashboardData.dailyOrders.push({
          id: `daily-${i+1}`,
          date: day, 
          orders: 0
        });
      }
      
      // Sort data by ID to ensure proper day mapping
      const sortedData = [...dataByGroup['Daily Orders']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      console.log(`Daily Orders data: ${sortedData.length} rows`);
      
      // Map data to days based on position in the sorted array
      for (let i = 0; i < 7 && i < sortedData.length; i++) {
        const value = parseNumberValue(sortedData[i].value);
        dashboardData.dailyOrders[i].orders = value;
      }
    }

    // Process Web Orders - 1 variable (orders) for 12 months
    if (dataByGroup['Web Orders']) {
      console.log(`Processing Web Orders (${dataByGroup['Web Orders'].length} rows)`);
      
      // Create data points for each month
      for (let i = 0; i < 12; i++) {
        const month = months[i];
        dashboardData.webOrders.push({
          id: `web-${i+1}`,
          date: month,
          orders: 0,
          revenue: 0
        });
      }
      
      // Sort data by ID to ensure proper month mapping
      const sortedData = [...dataByGroup['Web Orders']].sort((a, b) => {
        const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
        return idA - idB;
      });
      
      console.log(`Web Orders data: ${sortedData.length} rows`);
      
      // Map data to months based on position in the sorted array
      for (let i = 0; i < 12 && i < sortedData.length; i++) {
        const value = parseNumberValue(sortedData[i].value);
        dashboardData.webOrders[i].orders = value;
        dashboardData.webOrders[i].revenue = value * 100;
      }
    }

    console.log('Finished processing chart data');
    console.log(`Final dashboard data:
      metrics: ${dashboardData.metrics.length} (expected: 7)
      historicalData: ${dashboardData.historicalData.length} (expected: 12)
      accounts: ${dashboardData.accounts.length} (expected: 12)
      customerMetrics: ${dashboardData.customerMetrics.length} (expected: 12)
      inventory: ${dashboardData.inventory.length} (expected: 4)
      porOverview: ${dashboardData.porOverview.length} (expected: 12)
      siteDistribution: ${dashboardData.siteDistribution.length} (expected: 3)
      arAging: ${dashboardData.arAging.length} (expected: 5)
      dailyOrders: ${dashboardData.dailyOrders.length} (expected: 7)
      webOrders: ${dashboardData.webOrders.length} (expected: 12)
    `);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in dashboard data route:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

// Helper function to parse a value to a number
function parseNumberValue(value: any): number {
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

// Helper function to generate a random color
function getRandomColor(): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
