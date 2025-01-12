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
  AccountsPayableData,
  SiteDistribution,
  Products,
  DailyShipment,
  CustomerData,
  RawMetricData,
  Metric
} from '../types/dashboard';

// Type guards
function isMetricData(item: RawDashboardData): item is RawMetricData {
  return item.chartGroup === 'Metrics';
}

function isProductData(item: RawDashboardData): item is RawProductData {
  return 'value' in item && item.chartGroup !== 'Metrics';
}

function isHistoricalData(item: RawDashboardData): item is RawHistoricalData {
  return 'historicalDate' in item;
}

function isAccountsPayableData(item: RawDashboardData): item is RawAccountsPayableData {
  return 'accountsPayableDate' in item;
}

function isCustomersData(item: RawDashboardData): item is RawCustomersData {
  return 'customersDate' in item;
}

function isInventoryData(item: RawDashboardData): item is RawInventoryData {
  return 'inventoryValueDate' in item;
}

function isSiteDistributionData(item: RawDashboardData): item is RawSiteDistributionData {
  return 'columbus' in item;
}

// Function to transform raw data into spreadsheet rows
export function transformToSpreadsheetRows(rawData: RawDashboardData[]): AdminVariable[] {
  const spreadsheetRows: AdminVariable[] = [];

  // Process Metrics
  const metricItems = rawData.filter(isMetricData);

  metricItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: item.calculation,
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.value,
      updateTime: new Date().toISOString()
    });
  });

  // Process Historical Data
  const historicalItems = rawData.filter((item): item is RawHistoricalData => 
    item.chartGroup === 'Historical Data' && isHistoricalData(item));
  
  historicalItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Monthly Values',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.p21,
      secondaryValue: item.por,
      updateTime: new Date().toISOString(),
      historicalDate: item.historicalDate
    });
  });

  // Process Inventory Data
  const inventoryItems = rawData.filter((item): item is RawInventoryData => 
    item.chartGroup === 'Inventory Value & Turnover' && isInventoryData(item));

  inventoryItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Monthly Values',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.inventory,
      secondaryValue: item.turnover,
      updateTime: new Date().toISOString(),
      inventoryValueDate: item.inventoryValueDate
    });
  });

  // Process Accounts Payable Data
  const apItems = rawData.filter((item): item is RawAccountsPayableData =>
    item.chartGroup === 'Accounts Payable Overview' && isAccountsPayableData(item));
  
  apItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Monthly Values',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.total,
      secondaryValue: item.overdue,
      updateTime: new Date().toISOString(),
      accountsPayableDate: item.accountsPayableDate
    });
  });

  // Process Customer Data
  const customerItems = rawData.filter((item): item is RawCustomersData =>
    item.chartGroup === 'New Customers vs. New Prospects' && isCustomersData(item));
  
  customerItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Monthly Values',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.new,
      secondaryValue: item.prospects,
      updateTime: new Date().toISOString(),
      customersDate: item.customersDate
    });
  });

  // Process Daily Shipments
  const shipmentItems = rawData.filter((item): item is RawProductData => 
    item.chartGroup === 'Daily Shipments' && isProductData(item));
  
  shipmentItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Daily Values',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.value,
      updateTime: new Date().toISOString()
    });
  });

  // Process Site Distribution
  const siteItems = rawData.filter((item): item is RawSiteDistributionData =>
    item.chartGroup === 'Site Distribution' && isSiteDistributionData(item));
  
  siteItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: 'Distribution',
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.columbus,
      updateTime: new Date().toISOString()
    });
  });

  // Process Top Products
  const productItems = rawData.filter((item): item is RawProductData => 
    item.chartGroup === 'Top Products' && isProductData(item));
  
  productItems.forEach(item => {
    spreadsheetRows.push({
      id: item.id,
      name: item.name,
      chartGroup: item.chartGroup,
      calculation: item.calculation,
      sqlExpression: item.sqlExpression,
      p21DataDictionary: item.p21DataDictionary,
      value: item.value,
      subGroup: item.subGroup,
      updateTime: new Date().toISOString()
    });
  });

  return spreadsheetRows;
}

// Transform functions for dashboard data
function transformHistoricalData(rawData: RawDashboardData[]): HistoricalDataPoint[] {
  const historyItems = rawData.filter(isHistoricalData);
  return historyItems
    .filter(item => !isNaN(parseInt(item.p21)) && !isNaN(parseInt(item.por)))
    .map(item => ({
      date: item.historicalDate,
      p21: parseInt(item.p21),
      por: parseInt(item.por)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function transformMetrics(rawData: RawDashboardData[]): Metric[] {
  return rawData
    .filter((item): item is RawMetricData => 
      item.chartGroup === 'Metrics' && 
      'value' in item &&
      item.name !== 'Inside Sales Leader' // Exclude Inside Sales Leader from metrics
    )
    .map(item => ({
      name: item.name,
      value: parseInt(item.value || '0'),
      change: 0, // Implement if needed
      trend: 'neutral' // Implement if needed
    }));
}

function transformAccountsPayable(rawData: RawDashboardData[]): AccountsPayableData[] {
  const apItems = rawData.filter(isAccountsPayableData);
  return apItems.map(item => ({
    date: item.accountsPayableDate,
    total: parseInt(item.total),
    overdue: parseInt(item.overdue)
  }));
}

function transformCustomers(rawData: RawDashboardData[]): CustomerData[] {
  const customerItems = rawData.filter(isCustomersData);
  return customerItems.map(item => ({
    date: item.customersDate,
    new: parseInt(item.new),
    prospects: parseInt(item.prospects)
  }));
}

function transformDailyShipments(rawData: RawDashboardData[]): DailyShipment[] {
  return rawData
    .filter((item): item is RawMetricData => 
      item.chartGroup === 'Daily Shipments' && 'value' in item)
    .map(item => ({
      date: item.name,
      shipments: parseInt(item.value || '0')
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function transformProducts(rawData: RawDashboardData[]): Products {
  const result: Products = {
    online: [],
    inside: [],
    outside: []
  };

  const productItems = rawData.filter((item): item is RawProductData => 
    item.chartGroup === 'Top Products' && isProductData(item));

  productItems.forEach(item => {
    const product = {
      name: item.name,
      value: parseInt(item.value || '0')
    };
    
    if (item.subGroup?.toLowerCase().includes('online')) {
      result.online.push(product);
    } else if (item.subGroup?.toLowerCase().includes('inside')) {
      result.inside.push(product);
    } else if (item.subGroup?.toLowerCase().includes('outside')) {
      result.outside.push(product);
    }
  });

  result.online.sort((a, b) => b.value - a.value);
  result.inside.sort((a, b) => b.value - a.value);
  result.outside.sort((a, b) => b.value - a.value);

  return result;
}

function transformSiteDistribution(rawData: RawDashboardData[]): SiteDistribution[] {
  const siteItems = rawData.filter(isSiteDistributionData);
  return siteItems.map(item => ({
    date: item.historicalDate,
    columbus: parseInt(item.columbus),
    addison: parseInt(item.addison),
    lakeCity: parseInt(item.lakeCity)
  }))
  .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending to get latest first
}

export function transformDashboardData(rawData: RawDashboardData[]): DashboardData {
  return {
    metrics: transformMetrics(rawData),
    historicalData: transformHistoricalData(rawData),
    dailyShipments: transformDailyShipments(rawData),
    accountsPayable: transformAccountsPayable(rawData),
    customers: transformCustomers(rawData),
    siteDistribution: transformSiteDistribution(rawData),
    products: transformProducts(rawData)
  };
}
