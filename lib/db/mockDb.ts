// Mock database for test mode
import { defaultAdminData } from './admin';
import { AdminVariable } from '../types';

// Each metric in the mock database corresponds to a specific row in the admin spreadsheet
interface MockInventory {
  month_offset: number;
  value: number;
  backorder_value: number;
}

interface MockArAging {
  current_amount: number;
  days_30_amount: number;
  days_60_amount: number;
  days_90_amount: number;
  days_90_plus_amount: number;
  [key: string]: number;
}

interface MockSiteMetrics {
  lake_city_revenue: number;
  lake_city_previous: number;
  columbus_revenue: number;
  columbus_previous: number;
  addison_revenue: number;
  addison_previous: number;
}

interface MockHistorical {
  month_offset: number;
  value: number;
}

interface MockWebMetrics {
  day_offset: number;
  visitors: number;
  page_views: number;
  bounce_rate: number;
}

interface MockInventoryStatus {
  current_inventory: number;
  target_level: number;
  reorder_point: number;
  instock_101: number;
  instock_102: number;
  instock_103: number;
  instock_104: number;
  instock_107: number;
}

interface MockAccountsPayable {
  month_offset: number;
  value: number;
}

interface MockCustomerGrowth {
  month_offset: number;
  new_customers: number;
  total_customers: number;
  retention_rate: number;
}

interface MockDailyOrders {
  day_offset: number;
  order_count: number;
  order_value: number;
}

interface MockMetrics {
  [key: string]: number;
}

type MockDatabase = {
  mock_inventory: MockInventory[];
  mock_ar_aging: MockArAging;
  mock_site_metrics: MockSiteMetrics;
  mock_historical: MockHistorical[];
  mock_web_metrics: MockWebMetrics[];
  mock_inventory_status: MockInventoryStatus;
  mock_accounts_payable: MockAccountsPayable[];
  mock_customer_growth: MockCustomerGrowth[];
  mock_daily_orders: MockDailyOrders[];
  mock_metrics: MockMetrics;
};

const mockMetrics: MockMetrics = {
  // Key Metrics
  total_orders: 1250,
  open_orders: 450,
  open_orders_2: 75,
  daily_revenue: 125000,
  open_invoices: 850000,
  orders_backlogged: 95,
  total_sales_monthly: 3750000,

  // Site Distribution
  site_lake_city_current: 450000,
  site_lake_city_previous: 425000,
  site_columbus_current: 375000,
  site_columbus_previous: 350000,
  site_addison_current: 325000,
  site_addison_previous: 300000,

  // Historical Data (last 12 months)
  historical_m0: 3750000,
  historical_m1: 3500000,
  historical_m2: 3250000,
  historical_m3: 3000000,
  historical_m4: 2750000,
  historical_m5: 2500000,
  historical_m6: 2250000,
  historical_m7: 2000000,
  historical_m8: 1750000,
  historical_m9: 1500000,
  historical_m10: 1250000,
  historical_m11: 1000000,

  // Customer Data (Total)
  customers_total_m0: 1500,
  customers_total_m1: 1450,
  customers_total_m2: 1400,
  customers_total_m3: 1350,
  customers_total_m4: 1300,
  customers_total_m5: 1250,

  // Customer Data (New)
  customers_new_m0: 75,
  customers_new_m1: 70,
  customers_new_m2: 65,
  customers_new_m3: 60,
  customers_new_m4: 55,
  customers_new_m5: 50,

  // Accounts Payable
  ap_total_m0: 950000,
  ap_total_m1: 900000,
  ap_total_m2: 850000,
  ap_total_m3: 800000,
  ap_total_m4: 750000,
  ap_total_m5: 700000,

  // POR Data (last 12 months)
  por_total_m0: 450,
  por_total_m1: 425,
  por_total_m2: 400,
  por_total_m3: 375,
  por_total_m4: 350,
  por_total_m5: 325,
  por_total_m6: 300,
  por_total_m7: 275,
  por_total_m8: 250,
  por_total_m9: 225,
  por_total_m10: 200,
  por_total_m11: 175
};

export const mockDatabase: MockDatabase = {
  mock_inventory: Array.from({ length: 12 }, (_, i) => ({
    month_offset: i,
    value: 2500000 + (i * 100000),
    backorder_value: 150000 + (i * 10000)
  })),
  mock_ar_aging: {
    current_amount: 2500000,
    days_30_amount: 500000,
    days_60_amount: 250000,
    days_90_amount: 125000,
    days_90_plus_amount: 75000
  },
  mock_site_metrics: {
    lake_city_revenue: 4100000,
    lake_city_previous: 3900000,
    columbus_revenue: 2700000,
    columbus_previous: 2500000,
    addison_revenue: 1400000,
    addison_previous: 1300000
  },
  mock_historical: Array.from({ length: 12 }, (_, i) => ({
    month_offset: i,
    value: 1000000 + (i * 50000)
  })),
  mock_web_metrics: Array.from({ length: 30 }, (_, i) => ({
    day_offset: i,
    visitors: 1000 + (i * 10),
    page_views: 3000 + (i * 30),
    bounce_rate: 25 + (Math.sin(i) * 5)
  })),
  mock_inventory_status: {
    current_inventory: 250000,
    target_level: 300000,
    reorder_point: 200000,
    instock_101: 180000,
    instock_102: 320000,
    instock_103: 250000,
    instock_104: 290000,
    instock_107: 280000
  },
  mock_accounts_payable: Array.from({ length: 12 }, (_, i) => ({
    month_offset: i,
    value: 500000 - (i * 25000)
  })),
  mock_customer_growth: Array.from({ length: 12 }, (_, i) => ({
    month_offset: i,
    new_customers: 100 + (i * 5),
    total_customers: 2000 + (i * 50),
    retention_rate: 85 + (Math.sin(i) * 2)
  })),
  mock_daily_orders: Array.from({ length: 30 }, (_, i) => ({
    day_offset: i,
    order_count: 50 + (Math.sin(i) * 10),
    order_value: 75000 + (Math.sin(i) * 15000)
  })),
  mock_metrics: mockMetrics
};

export function mockQuery(query: string): Promise<{ value: number }> {
  return new Promise((resolve, reject) => {
    const fieldMatch = query.match(/SELECT\s+(\w+)\s+as\s+value/i);
    if (!fieldMatch || fieldMatch.length < 2) {
      reject(new Error(`Invalid metrics query format: ${query}`));
      return;
    }

    const field = fieldMatch[1];
    const value = mockDatabase.mock_metrics[field];

    if (typeof value === 'undefined') {
      reject(new Error(`Field not found in mock data: ${field}`));
      return;
    }

    resolve({ value });
  });
}
