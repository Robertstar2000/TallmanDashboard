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
  RawARAgingData
} from '../types/dashboard';

// Type guard functions
function isHistoricalData(item: RawDashboardData): item is RawHistoricalData {
  return item.chartName === 'Historical Data' || item.chartName === 'Historical Sales';
}

function isInventoryData(item: RawDashboardData): item is RawInventoryData {
  return 'inventory' in item || (item.chartName?.includes('Inventory') ?? false);
}

function isSiteDistributionData(item: RawDashboardData): item is RawSiteDistributionData {
  return 'historicalDate' in item && (item.chartName === 'Site Distribution' || (item.chartName?.includes('Distribution') ?? false));
}

function isAccountsPayableData(item: RawDashboardData): item is RawAccountsPayableData {
  return 'accountsPayableDate' in item || (item.chartName === 'Accounts Payable' || item.chartName === 'AP Aging');
}

function isCustomersData(item: RawDashboardData): item is RawCustomersData {
  return 'customersDate' in item || item.chartName === 'Customer Metrics';
}

function isProductData(item: RawDashboardData): item is RawProductData {
  return 'category' in item || item.chartName === 'Products';
}

function isMetricData(item: RawDashboardData): item is RawMetricData {
  return 'metricType' in item || item.chartName === 'Metrics';
}

// Function to transform raw data into spreadsheet rows
function transformToSpreadsheetRows(rawData: RawDashboardData[]): AdminVariable[] {
  return rawData.map(item => {
    // Ensure all required properties are included with appropriate defaults
    const baseVariable: AdminVariable = {
      id: item.id || '',
      name: item.name || '',
      chartGroup: item.chartGroup || '',
      chartName: item.chartName || '',
      category: item.chartGroup || '',
      variableName: item.variableName || '',
      server: item.server || '',
      sqlExpression: item.sqlExpression || '',
      tableName: item.tableName || '',
      value: item.value || ''
    };

    // Add type-specific properties
    if (isHistoricalData(item)) {
      return {
        ...baseVariable,
        historicalDate: item.historicalDate
      };
    } else if (isInventoryData(item)) {
      return {
        ...baseVariable,
        inventoryValueDate: item.inventoryValueDate
      };
    } else if (isSiteDistributionData(item)) {
      return {
        ...baseVariable,
        historicalDate: item.historicalDate
      };
    } else if (isAccountsPayableData(item)) {
      return {
        ...baseVariable,
        accountsPayableDate: item.accountsPayableDate
      };
    } else if (isCustomersData(item)) {
      return {
        ...baseVariable,
        customersDate: item.customersDate
      };
    } else if (isProductData(item)) {
      return {
        ...baseVariable,
        category: item.category
      };
    } else if (isMetricData(item)) {
      return {
        ...baseVariable,
        metricType: item.metricType
      };
    }

    return baseVariable;
  });
}

// Add a new function to get a transformer by name
function getTransformer(name: string): ((value: number) => number) | null {
  const transformers: Record<string, (value: number) => number> = {
    // Example transformers
    'to_thousands': (value: number) => value / 1000,
    'to_millions': (value: number) => value / 1000000,
    'to_percentage': (value: number) => value * 100,
    'to_days': (value: number) => value / (24 * 60 * 60),
    'to_hours': (value: number) => value / (60 * 60),
    // Identity transformer (no change)
    'identity': (value: number) => value
  };

  return transformers[name] || null;
}

// Transform functions for dashboard data
function transformHistoricalData(rawData: RawDashboardData[]): HistoricalDataPoint[] {
  const historicalItems = rawData.filter(isHistoricalData);
  
  // Group by month
  const groupedByMonth: { 
    [month: string]: { 
      month: string; 
      p21: number; 
      por: number;
    } 
  } = {};
  
  // Define months array for sorting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  historicalItems.forEach(item => {
    // Extract month from the variable name or use a default
    const monthMatch = item.variableName?.match(/(\w+)$/);
    const month = monthMatch ? monthMatch[1] : 'Jan';
    
    // Initialize the month data if it doesn't exist
    if (!groupedByMonth[month]) {
      groupedByMonth[month] = {
        month,
        p21: 0,
        por: 0
      };
    }
    
    // Determine if this is P21 or POR data based on server field
    const server = (item.server || '').toLowerCase();
    if (server === 'p21') {
      groupedByMonth[month].p21 = parseFloat(item.value as string) || 0;
    } else if (server === 'por') {
      groupedByMonth[month].por = parseFloat(item.value as string) || 0;
    }
  });
  
  // Convert to array and sort by month
  return Object.values(groupedByMonth)
    .sort((a, b) => {
      const aIndex = months.indexOf(a.month);
      const bIndex = months.indexOf(b.month);
      return aIndex - bIndex;
    })
    .map((item, index) => ({
      id: `historical-${index}`,
      date: new Date().toISOString().split('T')[0], // Add required date field
      month: item.month,
      p21: item.p21,
      por: item.por
    }));
}

function transformMetrics(rawData: RawDashboardData[]): MetricItem[] {
  const metricItems = rawData.filter(isMetricData);
  return metricItems.map(item => ({
    id: item.id || `metric-${item.name}`,
    name: item.name,
    // Directly use the value from the spreadsheet without additional processing
    value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : (item.value || 0),
    change: 0, // Default to 0 since change is not in RawMetricData
    trend: 'neutral',
    color: 'blue' // Default color
  }));
}

function transformAccountsPayable(rawData: RawDashboardData[]): AccountsDataPoint[] {
  const accountsItems = rawData.filter(isAccountsPayableData);
  
  // Group by date
  const groupedByDate: Record<string, AccountsDataPoint> = {};
  
  accountsItems.forEach(item => {
    const date = item.accountsPayableDate || new Date().toISOString().split('T')[0];
    
    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        id: `accounts-${date}`,
        date,
        payable: 0,
        receivable: 0,
        overdue: 0,
        current: 0,
        past_due_30: 0,
        past_due_60: 0,
        past_due_90: 0
      };
    }
    
    // Update the appropriate field based on variableName
    const variableName = item.variableName?.toLowerCase() || '';
    const value = parseFloat(item.value as string) || 0;
    
    if (variableName.includes('payable')) {
      groupedByDate[date].payable = value;
    } else if (variableName.includes('receivable')) {
      groupedByDate[date].receivable = value;
    } else if (variableName.includes('overdue')) {
      groupedByDate[date].overdue = value;
    } else if (variableName.includes('current')) {
      groupedByDate[date].current = value;
    } else if (variableName.includes('30')) {
      groupedByDate[date].past_due_30 = value;
    } else if (variableName.includes('60')) {
      groupedByDate[date].past_due_60 = value;
    } else if (variableName.includes('90')) {
      groupedByDate[date].past_due_90 = value;
    }
  });
  
  return Object.values(groupedByDate);
}

function transformCustomerMetrics(rawData: RawDashboardData[]): CustomerMetricPoint[] {
  const customerItems = rawData.filter(item => item.chartName === 'Customer Metrics');
  
  return customerItems.map((item, index) => ({
    id: `customer-${index}`,
    name: item.name || item.variableName || '',
    value: parseFloat(item.value as string) || 0,
    date: new Date().toISOString().split('T')[0],
    newCustomers: parseFloat(item.value as string) || 0
  }));
}

function transformDailyShipments(rawData: RawDashboardData[]): DailyShipment[] {
  const shipmentItems = rawData.filter(item => item.chartName === 'Daily Shipments');
  
  return shipmentItems.map((item, index) => ({
    id: `shipment-${index}`,
    day: item.variableName || '',
    value: parseFloat(item.value as string) || 0,
    date: new Date().toISOString().split('T')[0],
    orders: parseFloat(item.value as string) || 0
  }));
}

function transformProducts(rawData: RawDashboardData[]): Product[] {
  const productItems = rawData.filter(isProductData);
  
  return productItems.map((item, index) => ({
    id: `product-${index}`,
    name: item.variableName || item.name || '',
    value: parseFloat(item.value as string) || 0,
    category: item.chartGroup || '',
    inStock: parseFloat(item.value as string) || 0,
    onOrder: 0
  }));
}

function transformInventory(rawData: RawDashboardData[]): InventoryDataPoint[] {
  const inventoryItems = rawData.filter(item => 
    item.chartName === 'Inventory' || 
    item.chartName === 'Inventory Value'
  );
  
  return inventoryItems.map((item, index) => ({
    id: `inventory-${index}`,
    name: item.variableName || '',
    value: parseFloat(item.value as string) || 0,
    inStock: parseFloat(item.value as string) || 0,
    onOrder: 0
  }));
}

function transformPOROverview(rawData: RawDashboardData[]): POROverviewPoint[] {
  const porItems = rawData.filter(item => item.chartName === 'POR Overview');
  
  return porItems.map((item, index) => ({
    id: `por-${index}`,
    name: item.variableName || '',
    value: parseFloat(item.value as string) || 0,
    date: new Date().toISOString().split('T')[0],
    newRentals: 0,
    openRentals: 0,
    rentalValue: parseFloat(item.value as string) || 0
  }));
}

function transformARAgingData(rawData: RawDashboardData[]): ARAgingPoint[] {
  const arAgingItems = rawData.filter(item => 
    item.chartName === 'AR Aging' || 
    item.chartName === 'Accounts Receivable Aging'
  );
  
  return arAgingItems.map((item, index) => {
    const variableName = item.variableName?.toLowerCase() || '';
    let range = 'Current';
    
    if (variableName.includes('30')) {
      range = '1-30 Days';
    } else if (variableName.includes('60')) {
      range = '31-60 Days';
    } else if (variableName.includes('90')) {
      range = '61-90 Days';
    } else if (variableName.includes('120')) {
      range = '91+ Days';
    }
    
    return {
      id: `ar-aging-${index}`,
      name: item.name || '',
      current: variableName.includes('current') ? parseFloat(item.value as string) || 0 : 0,
      days_30: variableName.includes('30') ? parseFloat(item.value as string) || 0 : 0,
      days_60: variableName.includes('60') ? parseFloat(item.value as string) || 0 : 0,
      days_90: variableName.includes('90') ? parseFloat(item.value as string) || 0 : 0,
      days_120: variableName.includes('120') ? parseFloat(item.value as string) || 0 : 0,
      range,
      amount: parseFloat(item.value as string) || 0
    };
  });
}

function transformDailyOrders(rawData: RawDashboardData[]): DailyOrderPoint[] {
  const orderItems = rawData.filter(item => item.chartName === 'Daily Orders');
  
  // Map of day names to numbers
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
  
  // Group by day
  const groupedByDay: Record<string, any> = {};
  
  // Initialize all days of the week
  for (let i = 1; i <= 7; i++) {
    groupedByDay[i.toString()] = {
      day: i.toString(),
      orders: 0
    };
  }
  
  orderItems.forEach(item => {
    // Try to determine which day this item represents
    let day = '1'; // Default to Sunday
    
    if (item.variableName) {
      const lowerVarName = item.variableName.toLowerCase();
      
      // Check if variableName contains a day name
      for (const [dayName, dayNumber] of Object.entries(dayMap)) {
        if (lowerVarName.includes(dayName)) {
          day = dayNumber;
          break;
        }
      }
      
      // If not found by name, check if variableName is a number 1-7
      if (day === '1' && /^[1-7]$/.test(item.variableName)) {
        day = item.variableName;
      }
    }
    
    // Update the orders value for this day
    if (groupedByDay[day]) {
      groupedByDay[day].orders = parseFloat(item.value as string) || 0;
    }
  });
  
  // Convert to array and sort by day number
  return Object.values(groupedByDay)
    .sort((a: any, b: any) => parseInt(a.day) - parseInt(b.day))
    .map((item: any) => ({
      id: `daily-order-${item.day}`,
      date: item.day,
      orders: item.orders
    }));
}

function transformWebOrders(rawData: RawDashboardData[]): WebOrderPoint[] {
  const webOrderItems = rawData.filter(item => 
    item.chartName === 'Web Orders' || 
    item.chartName === 'Online Sales'
  );
  
  // Group by month
  const groupedByMonth: Record<string, any> = {};
  
  // Month name to number mapping
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };
  
  // Initialize all months with current year
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  months.forEach((month, index) => {
    const monthDate = new Date(currentYear, index, 1);
    const monthString = `${month} ${currentYear}`;
    
    groupedByMonth[monthString] = {
      date: monthString,
      orders: 0,
      revenue: 0
    };
  });
  
  webOrderItems.forEach(item => {
    // Try to determine which month this item represents
    let monthString = '';
    let isOrders = false;
    let isRevenue = false;
    
    if (item.variableName) {
      const lowerVarName = item.variableName.toLowerCase();
      
      // Check if variableName contains a month name
      for (const [monthName, monthIndex] of Object.entries(monthMap)) {
        if (lowerVarName.includes(monthName)) {
          monthString = `${months[monthIndex]} ${currentYear}`;
          break;
        }
      }
      
      // Determine if this is orders or revenue data
      isOrders = lowerVarName.includes('order') || lowerVarName.includes('count');
      isRevenue = lowerVarName.includes('revenue') || lowerVarName.includes('sales');
    }
    
    // If we found a valid month, update the appropriate value
    if (monthString && groupedByMonth[monthString]) {
      const value = parseFloat(item.value as string) || 0;
      
      if (isOrders) {
        groupedByMonth[monthString].orders = value;
      } else if (isRevenue) {
        groupedByMonth[monthString].revenue = value;
      } else {
        // If we can't determine, default to orders
        groupedByMonth[monthString].orders = value;
      }
    }
  });
  
  // Convert to array and sort by month
  return Object.values(groupedByMonth)
    .map((item: any, index) => ({
      id: `web-order-${index}`,
      date: item.date,
      orders: item.orders,
      revenue: item.revenue
    }));
}

function transformSiteDistribution(rawData: RawDashboardData[]): SiteDistributionPoint[] {
  const siteItems = rawData.filter(isSiteDistributionData);
  
  // Group by site/region
  const groupedBySite: Record<string, any> = {};
  
  siteItems.forEach(item => {
    // Use variableName as the site/region name
    let site = item.variableName || 'Unknown';
    
    // Initialize site entry if it doesn't exist
    if (!groupedBySite[site]) {
      groupedBySite[site] = {
        site,
        value: 0,
        percentage: 0,
        date: item.historicalDate || new Date().toISOString().split('T')[0]
      };
    }
    
    // Set the value
    groupedBySite[site].value = parseFloat(item.value as string) || 0;
  });
  
  // Calculate percentages
  const total = Object.values(groupedBySite).reduce((sum: number, item: any) => sum + item.value, 0);
  Object.values(groupedBySite).forEach((item: any) => {
    item.percentage = total > 0 ? (item.value / total) * 100 : 0;
  });
  
  // Convert to array
  return Object.values(groupedBySite)
    .map((item: any, index) => ({
      id: `site-${index}`,
      name: item.site,
      value: item.value,
      percentage: item.percentage,
      date: item.date
    }));
}

function transformDashboardData(rawData: RawDashboardData[]): DashboardData {
  return {
    metrics: transformMetrics(rawData),
    historicalData: transformHistoricalData(rawData),
    accounts: transformAccountsPayable(rawData),
    customerMetrics: transformCustomerMetrics(rawData),
    inventory: transformInventory(rawData),
    porOverview: transformPOROverview(rawData),
    siteDistribution: transformSiteDistribution(rawData),
    arAging: transformARAgingData(rawData),
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
  transformCustomerMetrics,
  transformInventory,
  transformSiteDistribution,
  transformPOROverview,
  transformARAgingData,
  transformDailyOrders,
  transformWebOrders,
  transformDailyShipments,
  transformProducts,
  getTransformer
};
