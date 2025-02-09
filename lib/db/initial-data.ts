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
    SELECT CAST(SUM(CASE 
      WHEN oh.order_source = 'P21' THEN oh.order_total + COALESCE(oh.freight_amount, 0) + COALESCE(oh.tax_amount, 0)
      ELSE 0 
    END) as VARCHAR) as p21_revenue
    FROM pub.oe_hdr oh
    WHERE oh.company_id = 1
      AND oh.order_status <> 'X'
      AND oh.order_date >= DATE_TRUNC('month', '${date}'::date)
      AND oh.order_date < DATE_TRUNC('month', '${date}'::date + INTERVAL '1 month')
  `,
  p21DataDictionary: 'oe_hdr',
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
    SELECT CAST(SUM(ap.invoice_amount) as VARCHAR) as total_payable
    FROM pub.ap_invoices ap
    WHERE ap.company_id = 1
      AND ap.invoice_date <= '${date}'
      AND (ap.paid_date IS NULL OR ap.paid_date > '${date}')

    -- Second Query ------------------------------------------

    SELECT CAST(SUM(CASE 
      WHEN ap.due_date < CURRENT_DATE THEN ap.invoice_amount 
      ELSE 0 
    END) as VARCHAR) as overdue_amount
    FROM pub.ap_invoices ap
    WHERE ap.company_id = 1
      AND ap.invoice_date <= '${date}'
      AND (ap.paid_date IS NULL OR ap.paid_date > '${date}')
  `,
  p21DataDictionary: 'ap_invoices',
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
    SELECT CAST(COUNT(*) as VARCHAR) as new_customers
    FROM pub.customer c 
    WHERE c.company_id = 1
      AND c.created_date::date = '${date}'
      AND c.status = 'A'

    -- Second Query ------------------------------------------

    SELECT CAST(COUNT(*) as VARCHAR) as new_prospects
    FROM pub.prospects p 
    WHERE p.company_id = 1
      AND p.created_date::date = '${date}'
      AND p.status = 'NEW'
  `,
  p21DataDictionary: 'customer, prospects',
  new: (Math.floor(Math.random() * 10)).toString(),
  prospects: (Math.floor(Math.random() * 20)).toString()
}));

const inventoryData = generateLastNMonths(12).map((date, index) => ({
  id: (400 + index).toString(),
  name: date,
  chartGroup: 'Inventory Value & Turnover',
  inventoryValueDate: date,
  calculation: 'Monthly tracking of total inventory value and inventory turnover rate',
  sqlExpression: `
    WITH MonthlyInventory AS (
      SELECT 
        CAST(SUM(im.qty_on_hand * im.unit_cost) as VARCHAR) as inventory_value,
        CAST(SUM(il.qty_shipped * il.unit_cost) as VARCHAR) as cogs
      FROM pub.inv_mast im
      LEFT JOIN pub.inv_lot il ON il.item_id = im.item_id 
        AND il.company_id = im.company_id
        AND il.transaction_date >= DATE_TRUNC('month', '${date}'::date)
        AND il.transaction_date < DATE_TRUNC('month', '${date}'::date + INTERVAL '1 month')
      WHERE im.company_id = 1
        AND im.status = 'A'
    )
    SELECT 
      inventory_value,
      CASE 
        WHEN inventory_value > 0 THEN CAST((cogs * 12.0 / inventory_value) as VARCHAR)
        ELSE '0' 
      END as turnover_rate
    FROM MonthlyInventory
  `,
  p21DataDictionary: 'inv_mast, inv_lot',
  inventory: (Math.random() * 5000000 + 2000000).toFixed(0),
  turnover: (Math.random() * 2 + 2).toFixed(2)
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

const arAgingData: RawARAgingData[] = [
  {
    id: '218',
    name: 'ar_aging_current',
    value: '125000',
    chartGroup: 'AR Aging',
    calculation: 'Current AR (0-30 days)',
    sqlExpression: `
      SELECT SUM(invoice_amt) as current_amount
      FROM ap_hdr
      WHERE DATEDIFF(day, due_date, GETDATE()) <= 30
      AND invoice_status != 'P'
    `,
    p21DataDictionary: 'ap_hdr.invoice_amt,ap_hdr.due_date,ap_hdr.invoice_status',
    arAgingDate: new Date().toISOString().slice(0, 10),
    current: '125000'
  },
  {
    id: '219',
    name: 'ar_aging_1_30',
    value: '75000',
    chartGroup: 'AR Aging',
    calculation: 'AR 1-30 days past due',
    sqlExpression: `
      SELECT SUM(invoice_amt) as amount_1_30
      FROM ap_hdr
      WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30
      AND invoice_status != 'P'
    `,
    p21DataDictionary: 'ap_hdr.invoice_amt,ap_hdr.due_date,ap_hdr.invoice_status',
    arAgingDate: new Date().toISOString().slice(0, 10),
    aging_1_30: '75000'
  },
  {
    id: '220',
    name: 'ar_aging_31_60',
    value: '45000',
    chartGroup: 'AR Aging',
    calculation: 'AR 31-60 days past due',
    sqlExpression: `
      SELECT SUM(invoice_amt) as amount_31_60
      FROM ap_hdr
      WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60
      AND invoice_status != 'P'
    `,
    p21DataDictionary: 'ap_hdr.invoice_amt,ap_hdr.due_date,ap_hdr.invoice_status',
    arAgingDate: new Date().toISOString().slice(0, 10),
    aging_31_60: '45000'
  },
  {
    id: '221',
    name: 'ar_aging_61_90',
    value: '25000',
    chartGroup: 'AR Aging',
    calculation: 'AR 61-90 days past due',
    sqlExpression: `
      SELECT SUM(invoice_amt) as amount_61_90
      FROM ap_hdr
      WHERE DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90
      AND invoice_status != 'P'
    `,
    p21DataDictionary: 'ap_hdr.invoice_amt,ap_hdr.due_date,ap_hdr.invoice_status',
    arAgingDate: new Date().toISOString().slice(0, 10),
    aging_61_90: '25000'
  },
  {
    id: '222',
    name: 'ar_aging_90_plus',
    value: '15000',
    chartGroup: 'AR Aging',
    calculation: 'AR over 90 days past due',
    sqlExpression: `
      SELECT SUM(invoice_amt) as amount_90_plus
      FROM ap_hdr
      WHERE DATEDIFF(day, due_date, GETDATE()) > 90
      AND invoice_status != 'P'
    `,
    p21DataDictionary: 'ap_hdr.invoice_amt,ap_hdr.due_date,ap_hdr.invoice_status',
    arAgingDate: new Date().toISOString().slice(0, 10),
    aging_90_plus: '15000'
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
  return item.chartGroup === 'Inventory Value & Turnover';
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

const metricsData = [
  // Metrics - 6 unique metrics
  {
    id: '1',
    name: 'Total Orders',
    chartGroup: 'Metrics',
    calculation: 'Count all unique order numbers from orders placed within the last 24 hours across all sales channels',
    sqlExpression: `
      SELECT CAST(COUNT(DISTINCT oh.order_no) as VARCHAR) as total_orders
      FROM oe_hdr oh
      WHERE oh.order_date >= DATEADD(hour, -24, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
    `,
    p21DataDictionary: 'orders',
    value: '150'
  },
  {
    id: '2',
    name: 'Average Order Value',
    chartGroup: 'Metrics',
    calculation: 'Calculate the mean value of all orders from the past day, including tax and shipping but excluding cancelled orders',
    sqlExpression: `
      SELECT CAST(AVG(oh.order_total) as VARCHAR) as avg_order_value
      FROM oe_hdr oh
      WHERE oh.order_date >= DATEADD(day, -30, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
    `,
    p21DataDictionary: 'orders',
    value: '2500'
  },
  {
    id: '3',
    name: 'Active Customers',
    chartGroup: 'Metrics',
    calculation: 'Count the number of unique customers who have made at least one purchase in the last 90 days',
    sqlExpression: `
      SELECT CAST(COUNT(DISTINCT oh.customer_id) as VARCHAR) as active_customers
      FROM oe_hdr oh
      WHERE oh.order_date >= DATEADD(day, -90, GETDATE())
        AND oh.order_status <> 'X'
        AND oh.company_id = @company_id
    `,
    p21DataDictionary: 'customers',
    value: '450'
  },
  {
    id: '4',
    name: 'Open Support Tickets',
    chartGroup: 'Metrics',
    calculation: 'Count all unresolved support tickets that have not been marked as closed or resolved',
    sqlExpression: `
      SELECT CAST(COUNT(*) as VARCHAR) as open_tickets
      FROM service_ticket st
      WHERE st.ticket_status IN ('O', 'P', 'W')
        AND st.company_id = @company_id
    `,
    p21DataDictionary: 'support',
    value: '25'
  },
  {
    id: '5',
    name: 'Revenue MTD',
    chartGroup: 'Metrics',
    calculation: 'Sum the total revenue from all completed transactions since the start of the current calendar month',
    sqlExpression: `
      SELECT CAST(SUM(oh.order_total) as VARCHAR) as revenue_mtd
      FROM oe_hdr oh
      WHERE oh.order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
        AND oh.order_status = 'C'
        AND oh.company_id = @company_id
    `,
    p21DataDictionary: 'finance',
    value: '1250000'
  },
  {
    id: '6',
    name: 'Website Visitors',
    chartGroup: 'Metrics',
    calculation: 'Count unique visitors to the website over the past 24 hours based on unique visitor IDs',
    sqlExpression: `
      SELECT CAST(COUNT(DISTINCT session_id) as VARCHAR) as visitors
      FROM web_session_log
      WHERE session_start >= DATEADD(day, -1, GETDATE())
        AND company_id = @company_id
    `,
    p21DataDictionary: 'analytics',
    value: '3200'
  },
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
    .filter(item => 
      isHistoricalData(item) || 
      isAccountsPayableData(item) || 
      isCustomersData(item) || 
      isInventoryData(item) || 
      isSiteDistributionData(item) ||
      isARAgingData(item))
    .map(item => {
      const entry = {
        date: '',
        p21Value: 0,
        porValue: 0,
        p21: 0,
        por: 0,
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
        entry.p21 = parseInt(item.p21);
        entry.por = parseInt(item.por);
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
        entry.date = item.inventoryValueDate;
        entry.inventory.value = parseInt(item.inventory);
        entry.inventory.turnover = parseInt(item.turnover);
      }

      if (isSiteDistributionData(item)) {
        entry.sites.columbus = parseInt(item.columbus);
        entry.sites.addison = parseInt(item.addison);
        entry.sites.lakeCity = parseInt(item.lakeCity);
      }

      if (isARAgingData(item)) {
        entry.date = item.arAgingDate;
        entry.arAging.current = parseInt(item.current || '0');
        entry.arAging.aging_1_30 = parseInt(item.aging_1_30 || '0');
        entry.arAging.aging_31_60 = parseInt(item.aging_31_60 || '0');
        entry.arAging.aging_61_90 = parseInt(item.aging_61_90 || '0');
        entry.arAging.aging_90_plus = parseInt(item.aging_90_plus || '0');
      }

      return entry;
    }),
  totals: {
    p21: 0,
    por: 0,
    accountsPayable: {
      total: 0,
      overdue: 0
    },
    customers: {
      new: 0,
      prospects: 0
    },
    inventory: {
      averageValue: 0,
      averageTurnover: 0
    },
    sites: {
      columbus: 0,
      addison: 0,
      lakeCity: 0
    },
    arAging: {
      current: 0,
      aging_1_30: 0,
      aging_31_60: 0,
      aging_61_90: 0,
      aging_90_plus: 0
    }
  },
  dailyShipments: rawDashboardData
    .filter(item => isHistoricalData(item))
    .map(item => ({
      date: isHistoricalData(item) ? item.historicalDate : '',
      shipments: isHistoricalData(item) ? parseInt(item.p21) : 0
    }))
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
  inventoryValueDate: isInventoryData(item) ? item.inventoryValueDate : undefined,
  inventory: isInventoryData(item) ? item.inventory : undefined,
  turnover: isInventoryData(item) ? item.turnover : undefined,
  columbus: isSiteDistributionData(item) ? item.columbus : undefined,
  addison: isSiteDistributionData(item) ? item.addison : undefined,
  lakeCity: isSiteDistributionData(item) ? item.lakeCity : undefined,
  value: isProductData(item) ? item.value : undefined,
  subGroup: isProductData(item) ? item.subGroup : undefined,
  arAgingDate: isARAgingData(item) ? item.arAgingDate : undefined,
  current: isARAgingData(item) ? item.current : undefined,
  aging_1_30: isARAgingData(item) ? item.aging_1_30 : undefined,
  aging_31_60: isARAgingData(item) ? item.aging_31_60 : undefined,
  aging_61_90: isARAgingData(item) ? item.aging_61_90 : undefined,
  aging_90_plus: isARAgingData(item) ? item.aging_90_plus : undefined
}));

export const initialARAgingData = [
  {
    name: '0-30 Days',
    value: 100000,
    arAgingDate: '2024-01-25'
  },
  {
    name: '31-60 Days',
    value: 75000,
    arAgingDate: '2024-01-25'
  },
  {
    name: '61-90 Days',
    value: 50000,
    arAgingDate: '2024-01-25'
  },
  {
    name: '90+ Days',
    value: 25000,
    arAgingDate: '2024-01-25'
  }
];

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
    },
    {
      name: '61-90 Days',
      value: 50000,
      arAgingDate: '2024-01-25'
    },
    {
      name: '90+ Days',
      value: 25000,
      arAgingDate: '2024-01-25'
    }
  ];

  if (!storage.getItem('arAging')) {
    storage.setItem('arAging', JSON.stringify(arAgingData));
  }
};

// Call initialization on import
initializeStorage();