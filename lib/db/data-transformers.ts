'use client';

import type {
  RawDashboardData,
  RawHistoricalData,
  RawAccountsPayableData,
  RawCustomersData,
  RawInventoryData,
  RawSiteDistributionData,
  RawProductData,
  AdminVariable,
  DashboardData,
  HistoricalDataPoint,
  SiteDistribution,
  Products,
  DailyShipment,
  RawMetricData,
  Metric,
  AccountsDataPoint,
  CustomerMetricPoint,
  InventoryDataPoint,
  POROverviewPoint,
  SiteDistributionPoint,
  ARAgingPoint,
  DailyOrderPoint,
  WebOrderPoint,
  MetricItem,
  Product,
  RawARAgingData,
  SpreadsheetRow
} from '../types/dashboard';

// Type guards
function isMetricData(item: any): item is RawMetricData {
  return item.chartGroup === 'Metrics';
}

function isProductData(item: any): item is RawProductData {
  return 'value' in item && item.chartGroup !== 'Metrics';
}

function isHistoricalData(item: any): item is RawHistoricalData {
  return 'historicalDate' in item;
}

function isAccountsPayableData(item: any): item is RawAccountsPayableData {
  return 'accountsPayableDate' in item;
}

function isCustomersData(item: any): item is RawCustomersData {
  return 'customersDate' in item;
}

function isInventoryData(item: any): item is RawInventoryData {
  return 'inventoryValueDate' in item;
}

function isSiteDistributionData(item: any): item is RawSiteDistributionData {
  return 'historicalDate' in item && 'columbus' in item;
}

// Helper function to clean up SQL expressions with embedded newlines and brackets
function cleanSqlExpression(sql: string): string {
  if (!sql) return '';
  
  // Replace newlines and extra spaces
  let cleanedSql = sql.replace(/\s+/g, ' ').trim();
  
  // Fix MS Access date functions that might be split across lines
  cleanedSql = cleanedSql.replace(/DatePart\(\s*'m'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('m', [RentalDate])");
  cleanedSql = cleanedSql.replace(/DatePart\(\s*'yyyy'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('yyyy', [RentalDate])");
  
  return cleanedSql;
}

// Helper function to get chart name from either chartName field or chartGroup field
function getChartName(item: any): string {
  if (item.chartName) {
    return item.chartName;
  }
  return item.chartGroup || '';
}

// Helper function to parse DataPoint into variable name and time component
function parseDataPoint(dataPoint: string): { variableName: string, timeComponent: string } {
  if (!dataPoint) return { variableName: '', timeComponent: '' };
  
  // Check if DataPoint contains a comma
  if (dataPoint.includes(',')) {
    const [variableName, timeComponent] = dataPoint.split(',').map(part => part.trim());
    return { variableName, timeComponent };
  }
  
  // If no comma, try to extract month or time component
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const month of months) {
    if (dataPoint.includes(month)) {
      const variableName = dataPoint.substring(0, dataPoint.indexOf(month)).trim();
      const timeComponent = month;
      return { variableName, timeComponent };
    }
  }
  
  // Try to extract numeric time components (e.g., "1-30 Days")
  const timePatterns = [
    /(\d+-\d+\s+Days)/i,
    /(\d+\+\s+Days)/i,
    /Today-(\d+)/i,
    /(\d+\s+Days)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = dataPoint.match(pattern);
    if (match) {
      const timeComponent = match[0];
      const variableName = dataPoint.replace(timeComponent, '').trim();
      return { variableName, timeComponent };
    }
  }
  
  // Default case: just return the whole string as variable name
  return { variableName: dataPoint, timeComponent: '' };
}

// Function to transform raw data into spreadsheet rows
function transformToSpreadsheetRows(rawData: any[]): AdminVariable[] {
  return rawData.map(item => {
    // Base properties that all items have
    const base: AdminVariable = {
      id: item.id || '',
      name: item.name || item.DataPoint || '',
      chartGroup: item.chartGroup || '',
      chartName: item.chartName || '',
      category: item.category || item.chartGroup || '',
      variableName: item.variableName || '',
      server: item.server || '',
      productionSqlExpression: cleanSqlExpression(item.sqlExpression) || '',
      tableName: item.tableName || '',
      value: item.value || 0
    };

    // Add specific properties based on the item type
    if (isHistoricalData(item)) {
      return {
        ...base,
        historicalDate: item.historicalDate,
      };
    } else if (isAccountsPayableData(item)) {
      return {
        ...base,
        accountsPayableDate: item.accountsPayableDate,
      };
    } else if (isCustomersData(item)) {
      return {
        ...base,
        customersDate: item.customersDate,
      };
    } else if (isInventoryData(item)) {
      return {
        ...base,
        inventoryValueDate: item.inventoryValueDate,
      };
    } else if (isSiteDistributionData(item)) {
      return {
        ...base,
        historicalDate: item.historicalDate,
      };
    } else if (isMetricData(item)) {
      return {
        ...base,
        metricType: item.metricType
      };
    } else if (isProductData(item)) {
      return {
        ...base,
        category: item.category
      };
    }

    // Default case
    return base;
  });
}

// Add a new function to get a transformer by name
function getTransformer(name: string): ((value: number) => number) | null {
  const transformers: Record<string, (value: number) => number> = {
    'double': (value: number) => value * 2,
    'triple': (value: number) => value * 3,
    'percentage': (value: number) => value / 100,
    'inverse': (value: number) => -value,
    'square': (value: number) => value * value,
  };

  return transformers[name] || null;
}

// Transform functions for dashboard data
function transformHistoricalData(rawData: any[]): HistoricalDataPoint[] {
  const filteredData = rawData.filter(item => {
    if (!item) return false;
    const chartName = getChartName(item);
    return (chartName === 'Historical Data' || chartName === 'Monthly Sales' || 
           item.chartGroup === 'Historical Data' || item.chartGroup === 'Monthly Sales');
  });

  if (!filteredData.length) {
    console.warn('No historical data found');
    return [];
  }

  console.log(`Found ${filteredData.length} historical data items`);

  // Group data by month
  const monthlyData: Record<string, any> = {};

  filteredData.forEach(item => {
    // Extract month from DataPoint or variable name if possible
    let month = '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (item.DataPoint) {
      const { timeComponent } = parseDataPoint(item.DataPoint);
      if (months.includes(timeComponent)) {
        month = timeComponent;
      }
    }
    
    if (!month && item.variableName) {
      for (const m of months) {
        if (item.variableName.includes(m)) {
          month = m;
          break;
        }
      }
    }

    // If no month found, try to extract from ID or use a default
    if (!month && item.id) {
      const idNum = parseInt(item.id);
      if (!isNaN(idNum) && idNum >= 1 && idNum <= 12) {
        month = months[idNum - 1];
      } else {
        month = 'Jan'; // Default
      }
    }

    if (!monthlyData[month]) {
      monthlyData[month] = {
        id: `historical-${month}`,
        date: month,
        sales: 0,
        orders: 0
      };
    }

    // Update the appropriate field based on server
    if (item.serverName === 'P21') {
      monthlyData[month].sales = parseFloat(item.value) || 0;
    } else if (item.serverName === 'POR') {
      monthlyData[month].orders = parseFloat(item.value) || 0;
    }
  });

  return Object.values(monthlyData);
}

// MODIFIED: Ensure values are directly used from the admin spreadsheet
function transformMetrics(rawData: any[]): MetricItem[] {
  const metricItems = rawData.filter(item => {
    if (!item) return false;
    const chartName = getChartName(item);
    return chartName === 'Key Metrics' || item.chartGroup === 'Key Metrics';
  });
  
  return metricItems.map(item => ({
    id: item.id || `metric-${item.variableName}`,
    name: item.variableName?.toLowerCase().replace(/ /g, '_') || '',
    // Directly use the value from the spreadsheet without additional processing
    value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : (item.value || 0),
    change: 0, // Default to 0 since change is not in RawMetricData
    trend: 'neutral',
    color: 'blue' // Default color
  }));
}

function transformAccountsPayable(rawData: any[]): AccountsDataPoint[] {
  const filteredData = rawData.filter(item => {
    if (!item) return false;
    const chartName = getChartName(item);
    return (chartName === 'Accounts' || chartName === 'Accounts Payable' ||
           item.chartGroup === 'Accounts' || item.chartGroup === 'Accounts Payable');
  });

  if (!filteredData.length) {
    console.warn('No accounts payable data found');
    return [];
  }

  console.log(`Found ${filteredData.length} accounts payable data items`);

  // Group by date
  const dateData: Record<string, any> = {};
  
  filteredData.forEach(item => {
    const date = item.accountsPayableDate || new Date().toISOString().split('T')[0];
    
    if (!dateData[date]) {
      dateData[date] = {
        id: `accounts-${date}`,
        date: date,
        payable: 0,
        receivable: 0,
        overdue: 0
      };
    }
    
    // Update based on variable name
    if (item.variableName === 'Current') {
      dateData[date].receivable = parseFloat(item.value) || 0;
    } else if (item.variableName === '30 Days') {
      dateData[date].payable = parseFloat(item.value) || 0;
    } else if (item.variableName === '60 Days' || item.variableName === '90 Days') {
      dateData[date].overdue += parseFloat(item.value) || 0;
    }
  });
  
  return Object.values(dateData);
}

function transformCustomers(rawData: any[]): CustomerMetricPoint[] {
  const filteredData = rawData.filter(item => item && item.chartGroup === 'Customer Metrics');
  
  return filteredData.map(item => ({
    id: item.id || `customer-${item.variableName}`,
    date: new Date().toISOString().split('T')[0],
    newCustomers: parseFloat(item.value) || 0
  }));
}

function transformDailyShipments(rawData: any[]): DailyOrderPoint[] {
  const filteredData = rawData.filter(item => item && item.chartGroup === 'Daily Orders');
  
  return filteredData.map(item => ({
    id: item.id || `daily-${item.variableName}`,
    date: item.variableName,
    orders: parseFloat(item.value) || 0
  }));
}

function transformProducts(rawData: any[]): Product[] {
  const filteredData = rawData.filter(item => item && item.chartGroup === 'Products');
  
  return filteredData.map(item => ({
    id: item.id || `product-${item.variableName}`,
    category: item.variableName || '',
    inStock: parseFloat(item.value) || 0,
    onOrder: 0
  }));
}

function transformSiteDistribution(rawData: any[]): SiteDistributionPoint[] {
  // First, try to find items with the chart name "Site Distribution"
  let filteredData = rawData.filter(item => {
    if (!item) return false;
    const chartName = getChartName(item);
    return chartName === 'Site Distribution' || item.chartGroup === 'Site Distribution';
  });
  
  // If no items found, try to find items with site distribution data
  if (!filteredData.length) {
    filteredData = rawData.filter(item => {
      if (!item) return false;
      return isSiteDistributionData(item);
    });
  }
  
  if (!filteredData.length) {
    console.warn('No site distribution data found');
    return [];
  }
  
  console.log(`Found ${filteredData.length} site distribution data items`);
  
  // Transform the data
  const result = filteredData.map(item => ({
    id: item.id || `site-${item.variableName}`,
    name: item.variableName || '',
    value: parseFloat(item.value) || 0
  }));
  
  // Calculate total for percentages
  const total = result.reduce((sum, item) => sum + item.value, 0);
  
  // No need to add percentage property as it's not in the interface
  
  return result;
}

function transformInventory(rawData: any[]): InventoryDataPoint[] {
  const filteredData = rawData.filter(item => {
    if (!item) return false;
    return item.chartGroup === 'Inventory';
  });
  
  if (!filteredData.length) {
    console.warn('No inventory data found');
    return [];
  }
  
  console.log(`Found ${filteredData.length} inventory data items`);
  
  // Transform the data
  return filteredData.map(item => {
    const value = parseFloat(item.value) || 0;
    
    return {
      id: item.id || `inventory-${item.variableName}`,
      inStock: value,
      onOrder: 0
    };
  });
}

function transformPOROverview(rawData: any[]): POROverviewPoint[] {
  const filteredData = rawData.filter(item => item && item.chartGroup === 'POR Overview');
  
  return filteredData.map(item => ({
    id: item.id || `por-${item.variableName}`,
    date: new Date().toISOString().split('T')[0],
    newRentals: parseFloat(item.value) || 0,
    openRentals: 0,
    rentalValue: 0
  }));
}

function transformARData(rawData: any[]): ARAgingPoint[] {
  // First, try to find items with the chart name "AR Aging"
  let filteredData = rawData.filter(item => {
    if (!item) return false;
    const chartName = getChartName(item);
    return (chartName === 'AR Aging' || chartName === 'Accounts Receivable Aging' ||
           item.chartGroup === 'AR Aging' || item.chartGroup === 'Accounts Receivable Aging');
  });
  
  if (!filteredData.length) {
    console.warn('No AR aging data found');
    return [];
  }
  
  console.log(`Found ${filteredData.length} AR aging data items`);
  
  // Group by aging category
  const agingData: Record<string, ARAgingPoint> = {};
  
  filteredData.forEach(item => {
    let range = '';
    
    // Determine range based on variable name
    if (item.variableName === 'Current') {
      range = 'Current';
    } else if (item.variableName === '30 Days') {
      range = '1-30 Days';
    } else if (item.variableName === '60 Days') {
      range = '31-60 Days';
    } else if (item.variableName === '90 Days') {
      range = '61-90 Days';
    } else if (item.variableName === '120 Days') {
      range = '90+ Days';
    } else {
      range = item.variableName || 'Unknown';
    }
    
    if (!agingData[range]) {
      agingData[range] = {
        id: `ar-${range}`,
        range: range,
        amount: 0
      };
    }
    
    // Add value to the appropriate category
    agingData[range].amount += parseFloat(item.value) || 0;
  });
  
  return Object.values(agingData);
}

function transformDailyOrders(rawData: any[]): DailyOrderPoint[] {
  const filteredData = rawData.filter(item => {
    if (!item) return false;
    return item.chartGroup === 'Daily Orders';
  });

  if (!filteredData.length) {
    console.warn('No daily orders data found');
    return [];
  }

  console.log(`Found ${filteredData.length} daily orders data items`);
  
  // Map day names to numbers
  const dayMap: Record<string, string> = {
    'sunday': '1',
    'monday': '2',
    'tuesday': '3',
    'wednesday': '4',
    'thursday': '5',
    'friday': '6',
    'saturday': '7',
    'sun': '1',
    'mon': '2',
    'tue': '3',
    'wed': '4',
    'thu': '5',
    'fri': '6',
    'sat': '7'
  };
  
  // Transform the data
  return filteredData.map(item => {
    let day = '';
    
    // Try to determine day from variable name
    if (item.variableName) {
      const lowerVar = item.variableName.toLowerCase();
      
      // Check if it's a number 1-7
      if (/^[1-7]$/.test(lowerVar)) {
        day = lowerVar;
      } 
      // Check if it's a day name
      else {
        for (const [dayName, dayNum] of Object.entries(dayMap)) {
          if (lowerVar.includes(dayName)) {
            day = dayNum;
            break;
          }
        }
      }
    }
    
    // Default to Sunday if no day found
    if (!day) {
      day = '1';
    }
    
    return {
      id: item.id || `daily-${day}`,
      date: day,
      orders: parseFloat(item.value) || 0
    };
  });
}

function transformWebOrders(rawData: any[]): WebOrderPoint[] {
  const filteredData = rawData.filter(item => {
    if (!item) return false;
    return item.chartGroup === 'Web Orders';
  });

  if (!filteredData.length) {
    console.warn('No web orders data found');
    return [];
  }

  console.log(`Found ${filteredData.length} web orders data items`);
  
  // Group by month
  const monthlyData: Record<string, WebOrderPoint> = {};
  const currentYear = new Date().getFullYear();
  
  // Pre-populate with empty data for all months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  months.forEach((month, index) => {
    const date = `${month} ${currentYear}`;
    monthlyData[date] = {
      id: `web-${index + 1}`,
      date: date,
      orders: 0,
      revenue: 0
    };
  });
  
  // Fill in actual data
  filteredData.forEach(item => {
    let monthName = '';
    
    // Try to extract month from variable name
    if (item.variableName) {
      for (const month of months) {
        if (item.variableName.includes(month)) {
          monthName = month;
          break;
        }
      }
    }
    
    // If no month found, use current month
    if (!monthName) {
      monthName = months[new Date().getMonth()];
    }
    
    const date = `${monthName} ${currentYear}`;
    
    // Update orders or revenue based on variable name and DataPoint
    let isRevenue = false;
    
    if (item.DataPoint) {
      const { variableName } = parseDataPoint(item.DataPoint);
      isRevenue = variableName.toLowerCase().includes('revenue');
    } else if (item.variableName) {
      isRevenue = item.variableName.toLowerCase().includes('revenue');
    }
    
    if (!monthlyData[date]) {
      monthlyData[date] = {
        id: `weborder-${date}`,
        date,
        orders: 0,
        revenue: 0
      };
    }
    
    if (isRevenue) {
      monthlyData[date].revenue = parseFloat(item.value) || 0;
    } else {
      monthlyData[date].orders = parseFloat(item.value) || 0;
    }
  });
  
  return Object.values(monthlyData);
}

function transformDashboardData(rawData: any[]): DashboardData {
  return {
    metrics: transformMetrics(rawData),
    historicalData: transformHistoricalData(rawData),
    accounts: transformAccountsPayable(rawData),
    customerMetrics: transformCustomers(rawData),
    inventory: transformInventory(rawData),
    porOverview: transformPOROverview(rawData),
    siteDistribution: transformSiteDistribution(rawData),
    arAging: transformARData(rawData),
    dailyOrders: transformDailyOrders(rawData),
    webOrders: transformWebOrders(rawData)
  };
}

export {
  transformToSpreadsheetRows,
  transformDashboardData,
  transformMetrics,
  transformHistoricalData,
  transformAccountsPayable,
  transformCustomers,
  transformDailyShipments,
  transformProducts,
  transformSiteDistribution,
  transformInventory,
  transformPOROverview,
  transformARData,
  transformDailyOrders,
  transformWebOrders,
  getTransformer,
  parseDataPoint,
  cleanSqlExpression
};
