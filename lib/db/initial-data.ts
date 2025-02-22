'use client';

import { 
  RawHistoricalData,
  RawProductData,
  RawAccountsPayableData,
  RawCustomersData,
  RawInventoryData,
  RawSiteDistributionData,
  RawDashboardData,
  SpreadsheetData,
  RawARAgingData
} from '@/lib/types/dashboard';

function generateLastNMonths(n: number, baseDate: string = '2025-01-11'): string[] {
  const dates: string[] = [];
  const date = new Date(baseDate);
  
  for (let i = 0; i < n; i++) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    dates.push(`${year}-${month.toString().padStart(2, '0')}-01`);
    date.setMonth(date.getMonth() - 1);
  }
  
  return dates;
}

function generateLastNDays(n: number, baseDate: string = '2025-01-11'): string[] {
  const dates: string[] = [];
  const date = new Date(baseDate);
  
  for (let i = 0; i < n; i++) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    date.setDate(date.getDate() - 1);
  }
  
  return dates;
}

const historicalData = generateLastNMonths(12).map((date, index) => ({
  id: (100 + index).toString(),
  name: date,
  chartGroup: 'Historical Data',
  historicalDate: date,
  calculation: 'Monthly revenue comparison between P21 and POR systems',
  sqlExpression: `
    -- POR Revenue Query
    SELECT CAST(SUM(r.TotalAmount) as VARCHAR) as por_revenue
    FROM tblContract r
    WHERE r.StartDate >= DATE_TRUNC('month', '${date}'::date)
      AND r.StartDate < DATE_TRUNC('month', '${date}'::date + INTERVAL '1 month')
      AND r.StatusCode <> 'X'
      AND r.LocationID = @location_id
  `,
  p21DataDictionary: 'tblContract',
  p21: (Math.random() * 1000000 + 500000).toFixed(0),
  por: (Math.random() * 800000 + 400000).toFixed(0)
}));

const accountsPayableData = generateLastNDays(30).map((date, index) => ({
  id: (200 + index).toString(),
  name: date,
  chartGroup: 'Accounts Payable Overview',
  accountsPayableDate: date,
  calculation: 'Daily tracking of total accounts payable and overdue amounts',
  sqlExpression: `
    -- Total Payable Query
    SELECT CAST(SUM(t.Amount) as VARCHAR) as total_payable
    FROM tblTransaction t
    WHERE t.TransactionType = 'AP'
      AND t.TransactionDate <= '${date}'
      AND t.StatusCode = 'O'
      AND t.LocationID = @location_id

    -- Overdue Amount Query
    SELECT CAST(SUM(CASE 
      WHEN t.PostedDate < CURRENT_DATE THEN t.Amount 
      ELSE 0 
    END) as VARCHAR) as overdue_amount
    FROM tblTransaction t
    WHERE t.TransactionType = 'AP'
      AND t.TransactionDate <= '${date}'
      AND t.StatusCode = 'O'
      AND t.LocationID = @location_id
  `,
  p21DataDictionary: 'tblTransaction',
  total: (Math.random() * 100000 + 50000).toFixed(0),
  overdue: (Math.random() * 20000 + 5000).toFixed(0)
}));

const customerData = generateLastNDays(30).map((date, index) => ({
  id: (300 + index).toString(),
  name: date,
  chartGroup: 'New Customers vs. New Prospects',
  customersDate: date,
  calculation: 'Daily comparison of new customer acquisitions versus new prospect registrations',
  sqlExpression: `
    -- New Customers Query
    SELECT CAST(COUNT(*) as VARCHAR) as new_customers
    FROM tblCustomer c
    WHERE c.CustomerType = 'C'
      AND c.LastRentalDate >= '${date}'
      AND c.StatusCode = 'A'
      AND c.DefaultLocation = @location_id

    -- New Prospects Query
    SELECT CAST(COUNT(*) as VARCHAR) as new_prospects
    FROM tblCustomer c
    WHERE c.CustomerType = 'P'
      AND c.LastRentalDate >= '${date}'
      AND c.StatusCode = 'A'
      AND c.DefaultLocation = @location_id
  `,
  p21DataDictionary: 'tblCustomer',
  new: (Math.random() * 50 + 10).toFixed(0),
  prospects: (Math.random() * 30 + 5).toFixed(0)
}));

const inventoryData = generateLastNMonths(12).map((date, index) => ({
  id: (400 + index).toString(),
  name: date,
  chartGroup: 'Inventory Metrics',
  inventoryDate: date,
  calculation: 'Monthly inventory value and equipment utilization',
  sqlExpression: `
    -- Total Equipment Value Query
    SELECT CAST(SUM(e.ReplacementCost) as VARCHAR) as total_value
    FROM tblEquipment e
    WHERE e.StatusCode = 'A'
      AND e.LocationID = @location_id

    -- Equipment Utilization Query
    SELECT CAST(
      (COUNT(CASE WHEN e.StatusCode = 'R' THEN 1 END) * 100.0 / 
       NULLIF(COUNT(*), 0)) as VARCHAR
    ) as utilization_rate
    FROM tblEquipment e
    WHERE e.LocationID = @location_id
  `,
  p21DataDictionary: 'tblEquipment',
  value: (Math.random() * 2000000 + 1000000).toFixed(0),
  utilization: (Math.random() * 40 + 60).toFixed(1)
}));

const siteDistributionData = [
  {
    id: '91',
    name: 'Columbus',
    chartGroup: 'Site Distribution',
    historicalDate: '2025-01-11',
    calculation: 'Monthly revenue for Columbus location',
    sqlExpression: `
      SELECT CAST(SUM(CASE WHEN oh.location_id = 'ID' THEN oh.order_total + COALESCE(oh.freight_amount, 0) + COALESCE(oh.tax_amount, 0) ELSE 0 END) as VARCHAR) as columbus_revenue
      FROM oe_hdr oh
      WHERE oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND oh.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
    `,
    p21DataDictionary: 'oe_hdr',
    p21: (Math.random() * 400000 + 200000).toFixed(0),
    por: (Math.random() * 400000 + 200000).toFixed(0),
  },
  {
    id: '92',
    name: 'Addison',
    chartGroup: 'Site Distribution',
    historicalDate: '2025-01-11',
    calculation: 'Monthly revenue for Addison location',
    sqlExpression: `
      SELECT CAST(SUM(CASE WHEN oh.location_id = 'IL' THEN oh.order_total + COALESCE(oh.freight_amount, 0) + COALESCE(oh.tax_amount, 0) ELSE 0 END) as VARCHAR) as addison_revenue
      FROM oe_hdr oh
      WHERE oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND oh.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
    `,
    p21DataDictionary: 'oe_hdr',
    p21: (Math.random() * 400000 + 200000).toFixed(0),
    por: (Math.random() * 400000 + 200000).toFixed(0),
  },
  {
    id: '93',
    name: 'Lake City',
    chartGroup: 'Site Distribution',
    historicalDate: '2025-01-11',
    calculation: 'Monthly revenue for Lake City location',
    sqlExpression: `
      SELECT CAST(SUM(CASE WHEN oh.location_id = 'FL' THEN oh.order_total + COALESCE(oh.freight_amount, 0) + COALESCE(oh.tax_amount, 0) ELSE 0 END) as VARCHAR) as lakecity_revenue
      FROM oe_hdr oh
      WHERE oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND oh.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
    `,
    p21DataDictionary: 'oe_hdr',
    p21: (Math.random() * 400000 + 200000).toFixed(0),
    por: (Math.random() * 400000 + 200000).toFixed(0),
  }
];

const topProducts = [
  {
    id: '600',
    name: 'Inside Sales Leader',
    chartGroup: 'Top Products',
    subGroup: 'Inside Sales',
    calculation: 'Track the product with highest order count through inside sales team in the last 30 days, excluding web and outside sales',
    sqlExpression: `
      SELECT TOP 5
        sp.name as salesperson,
        CAST(COUNT(DISTINCT oh.order_no) as VARCHAR) as order_count,
        CAST(SUM(oh.order_total) as VARCHAR) as total_sales
      FROM oe_hdr oh
      JOIN salesperson sp ON oh.salesperson_id = sp.salesperson_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND oh.order_source = 'IS'
      GROUP BY sp.name
      ORDER BY SUM(oh.order_total) DESC
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '0'
  },
  {
    id: '601',
    name: 'Copper Fittings',
    chartGroup: 'Top Products',
    subGroup: 'Inside Sales',
    calculation: 'Sum total revenue from copper fitting product line sold through inside sales channel in current month',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line = 'COPPER'
        AND im.item_desc LIKE '%FITTING%'
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '450000'
  },
  {
    id: '602',
    name: 'PVC Pipes',
    chartGroup: 'Top Products',
    subGroup: 'Inside Sales',
    calculation: 'Sum total revenue from PVC pipe products sold through inside sales representatives this month',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line = 'PVC'
        AND im.item_desc LIKE '%PIPE%'
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '380000'
  },
  {
    id: '603',
    name: 'Steel Pipes',
    chartGroup: 'Top Products',
    subGroup: 'Outside Sales',
    calculation: 'Track total revenue from steel pipe products sold by outside sales team in current quarter',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line = 'STEEL'
        AND im.item_desc LIKE '%PIPE%'
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '520000'
  },
  {
    id: '604',
    name: 'Valves',
    chartGroup: 'Top Products',
    subGroup: 'Outside Sales',
    calculation: 'Measure total revenue from valve products sold through outside sales channel year-to-date',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line IN ('VALVE', 'VALVES')
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '420000'
  },
  {
    id: '605',
    name: 'Tools',
    chartGroup: 'Top Products',
    subGroup: 'Online Sales',
    calculation: 'Calculate total revenue from tool products sold through e-commerce platform in past 30 days',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line = 'TOOLS'
        AND oh.order_source = 'WEB'
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '280000'
  },
  {
    id: '606',
    name: 'Accessories',
    chartGroup: 'Top Products',
    subGroup: 'Online Sales',
    calculation: 'Sum revenue from accessory products sold through online store in current month',
    sqlExpression: `
      SELECT CAST(SUM(ol.ext_price) as VARCHAR) as revenue
      FROM oe_line ol
      JOIN oe_hdr oh ON ol.order_no = oh.order_no
      JOIN inv_mast im ON ol.item_id = im.item_id
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
        AND im.product_line = 'ACCESSORIES'
        AND oh.order_source = 'WEB'
    `,
    p21DataDictionary: 'oe_hdr, oe_line, inv_mast',
    value: '180000'
  }
];

const arAgingData = [
  {
    id: '218',
    name: '0-30 Days',
    chartGroup: 'AR Aging',
    arAgingDate: '2024-01-25',
    calculation: 'Accounts receivable aging analysis',
    sqlExpression: `
      SELECT CAST(SUM(t.Amount) as VARCHAR) as aging_amount
      FROM tblTransaction t
      WHERE t.TransactionType = 'AR'
        AND t.StatusCode = 'O'
        AND t.TransactionDate >= DATEADD(day, -30, CURRENT_DATE)
        AND t.LocationID = @location_id
    `,
    p21DataDictionary: 'tblTransaction',
    value: '100000'
  },
  {
    id: '219',
    name: '31-60 Days',
    chartGroup: 'AR Aging',
    arAgingDate: '2024-01-25',
    calculation: 'Accounts receivable aging analysis',
    sqlExpression: `
      SELECT CAST(SUM(t.Amount) as VARCHAR) as aging_amount
      FROM tblTransaction t
      WHERE t.TransactionType = 'AR'
        AND t.StatusCode = 'O'
        AND t.TransactionDate BETWEEN DATEADD(day, -60, CURRENT_DATE) AND DATEADD(day, -31, CURRENT_DATE)
        AND t.LocationID = @location_id
    `,
    p21DataDictionary: 'tblTransaction',
    value: '75000'
  }
];

const metricsData = [
  {
    id: '1',
    name: 'Active Rentals',
    chartGroup: 'Key Metrics',
    calculation: 'Current count of active rental contracts',
    sqlExpression: `
      SELECT CAST(COUNT(*) as VARCHAR) as active_rentals,
             CAST(SUM(TotalAmount) as VARCHAR) as total_value
      FROM tblContract
      WHERE StatusCode = 'A'
        AND ReturnDate >= CURRENT_DATE
        AND LocationID = @location_id
    `,
    p21DataDictionary: 'tblContract',
    value: (Math.random() * 500 + 200).toFixed(0)
  },
  {
    id: '2',
    name: 'Equipment Maintenance',
    chartGroup: 'Key Metrics',
    calculation: 'Equipment items due for maintenance',
    sqlExpression: `
      SELECT CAST(COUNT(*) as VARCHAR) as maintenance_due
      FROM tblEquipment
      WHERE LastMaintenanceDate <= DATEADD(day, 30, CURRENT_DATE)
        AND StatusCode = 'A'
        AND LocationID = @location_id
    `,
    p21DataDictionary: 'tblEquipment',
    value: (Math.random() * 50 + 10).toFixed(0)
  }
];

function isHistoricalData(item: RawDashboardData): item is RawHistoricalData {
  return item.chartGroup === 'Historical Data';
}

function isAccountsPayableData(item: RawDashboardData): item is RawAccountsPayableData {
  return item.chartGroup === 'Accounts Payable Overview';
}

function isCustomersData(item: RawDashboardData): item is RawCustomersData {
  return item.chartGroup === 'New Customers vs. New Prospects';
}

function isInventoryData(item: RawDashboardData): item is RawInventoryData {
  return item.chartGroup === 'Inventory Metrics';
}

function isSiteDistributionData(item: RawDashboardData): item is RawSiteDistributionData {
  return item.chartGroup === 'Site Distribution';
}

function isProductData(item: RawDashboardData): item is RawProductData {
  return item.chartGroup === 'Top Products';
}

function isARAgingData(item: RawDashboardData): item is RawARAgingData {
  return item.chartGroup === 'AR Aging';
}

const initialARAgingData = [
  {
    name: '0-30 Days',
    value: 100000,
    arAgingDate: '2024-01-25'
  },
  {
    name: '31-60 Days',
    value: 75000,
    arAgingDate: '2024-01-25'
  }
];

// Combine all data into initialData
export const initialData = [
  ...historicalData,
  ...siteDistributionData,
  ...topProducts,
  ...arAgingData,
  ...metricsData
];

// Export raw dashboard data with all components
export const rawDashboardData: RawDashboardData[] = [
  ...metricsData,
  ...historicalData,
  ...accountsPayableData,
  ...customerData,
  ...inventoryData,
  ...siteDistributionData,
  ...topProducts,
  ...arAgingData
];

export const spreadsheetData: SpreadsheetData = {
  entries: rawDashboardData
    .map(item => {
      const entry: MonthlyData = {
        date: '',
        p21Value: 0,
        porValue: 0,
        accountsPayable: { total: 0, overdue: 0 },
        customers: { new: 0, prospects: 0 },
        inventory: { value: 0, turnover: 0 },
        sites: { columbus: 0, addison: 0, lakeCity: 0 },
        arAging: { current: 0, aging_1_30: 0, aging_31_60: 0, aging_61_90: 0, aging_90_plus: 0 }
      };

      if (isHistoricalData(item)) {
        entry.date = item.historicalDate;
        entry.p21Value = parseInt(item.p21);
        entry.porValue = parseInt(item.por);
      }

      if (isAccountsPayableData(item)) {
        entry.date = item.accountsPayableDate;
        entry.accountsPayable.total = parseInt(item.total);
        entry.accountsPayable.overdue = parseInt(item.overdue);
      }

      if (isCustomersData(item)) {
        entry.date = item.customersDate;
        entry.customers.new = parseInt(item.new);
        entry.customers.prospects = parseInt(item.prospects);
      }

      if (isInventoryData(item)) {
        entry.date = item.inventoryDate;
        entry.inventory.value = parseInt(item.value);
        entry.inventory.turnover = parseInt(item.utilization);
      }

      if (isSiteDistributionData(item)) {
        entry.date = item.historicalDate;
        entry.sites = { columbus: parseInt(item.columbus), addison: parseInt(item.addison), lakeCity: parseInt(item.lakeCity) };
      }

      if (isARAgingData(item)) {
        entry.date = item.arAgingDate;
        entry.arAging.current = parseInt(item.value);
      }

      return entry;
    })
    .filter(entry => entry.date !== ''),
  totals: {
    p21: 0,
    por: 0,
    accountsPayable: { total: 0, overdue: 0 },
    customers: { new: 0, prospects: 0 },
    inventory: { averageValue: 0, averageTurnover: 0 },
    sites: { columbus: 0, addison: 0, lakeCity: 0 },
    arAging: { current: 0, aging_1_30: 0, aging_31_60: 0, aging_61_90: 0, aging_90_plus: 0 }
  }
};

export const adminSpreadsheetData = rawDashboardData.map(item => ({
  id: item.id,
  name: item.name,
  chartGroup: item.chartGroup,
  calculation: item.calculation,
  sqlExpression: item.sqlExpression,
  p21DataDictionary: item.p21DataDictionary,
  extractedValue: isProductData(item) ? item.value : undefined,
  secondaryValue: isProductData(item) ? item.subGroup : undefined,
  updateTime: new Date().toISOString(),
  historicalDate: isHistoricalData(item) ? item.historicalDate : undefined,
  p21: isHistoricalData(item) ? item.p21 : undefined,
  por: isHistoricalData(item) ? item.por : undefined,
  accountsPayableDate: isAccountsPayableData(item) ? item.accountsPayableDate : undefined,
  total: isAccountsPayableData(item) ? item.total : undefined,
  overdue: isAccountsPayableData(item) ? item.overdue : undefined,
  customersDate: isCustomersData(item) ? item.customersDate : undefined,
  new: isCustomersData(item) ? item.new : undefined,
  prospects: isCustomersData(item) ? item.prospects : undefined,
  inventoryDate: isInventoryData(item) ? item.inventoryDate : undefined,
  value: isInventoryData(item) ? item.value : undefined,
  utilization: isInventoryData(item) ? item.utilization : undefined,
  columbus: isSiteDistributionData(item) ? item.columbus : undefined,
  addison: isSiteDistributionData(item) ? item.addison : undefined,
  lakeCity: isSiteDistributionData(item) ? item.lakeCity : undefined,
  arAgingDate: isARAgingData(item) ? item.arAgingDate : undefined,
  current: isARAgingData(item) ? item.value : undefined,
}));

// Initialize storage with initial data
export const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  const storage = window.localStorage;
  const arAgingData = [
    {
      name: '0-30 Days',
      value: 100000,
      arAgingDate: '2024-01-25'
    },
    {
      name: '31-60 Days',
      value: 75000,
      arAgingDate: '2024-01-25'
    }
  ];

  if (!storage.getItem('arAging')) {
    storage.setItem('arAging', JSON.stringify(arAgingData));
  }
};

// Call initialization on import
initializeStorage();