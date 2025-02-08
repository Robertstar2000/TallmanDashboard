import { SpreadsheetData, DashboardVariable, ChartMetadata } from '@/lib/types/dashboard';

export interface SpreadsheetState extends SpreadsheetData {
  variables: Record<string, DashboardVariable>;
  charts: Record<string, ChartMetadata>;
  categories: string[];
}

export const initialSpreadsheetState: SpreadsheetState = {
  entries: [],
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
  dailyShipments: [],
  p21: 0,
  por: 0,
  accountsPayable: { total: 0, overdue: 0 },
  total: 0,
  overdue: 0,
  customers: { new: 0, prospects: 0 },
  new: 0,
  prospects: 0,
  inventory: { averageValue: 0, averageTurnover: 0 },
  averageValue: 0,
  averageTurnover: 0,
  sites: { columbus: 0, addison: 0, lakeCity: 0 },
  columbus: 0,
  addison: 0,
  lakeCity: 0,
  arAging: { current: 0, aging_1_30: 0, aging_31_60: 0, aging_61_90: 0, aging_90_plus: 0 },
  current: 0,
  aging_1_30: 0,
  aging_31_60: 0,
  aging_61_90: 0,
  aging_90_plus: 0,
  variables: {
    // Key Metrics Variables
    'var-total-orders': {
      id: 'var-total-orders',
      name: 'total_orders',
      displayName: 'Total Orders',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-total-orders',
      chartType: 'metric'
    },
    'var-open-orders': {
      id: 'var-open-orders',
      name: 'open_orders',
      displayName: 'Open Orders',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-open-orders',
      chartType: 'metric'
    },
    'var-in-process': {
      id: 'var-in-process',
      name: 'in_process',
      displayName: 'In Process',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-in-process',
      chartType: 'metric'
    },
    'var-weekly-revenue': {
      id: 'var-weekly-revenue',
      name: 'weekly_revenue',
      displayName: 'Weekly Revenue',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-weekly-revenue',
      chartType: 'metric'
    }
  },
  charts: {
    'metric-total-orders': {
      id: 'metric-total-orders',
      name: 'Total Orders',
      type: 'metric',
      category: 'Key Metrics',
      variables: ['var-total-orders']
    },
    'metric-open-orders': {
      id: 'metric-open-orders',
      name: 'Open Orders',
      type: 'metric',
      category: 'Key Metrics',
      variables: ['var-open-orders']
    },
    'metric-in-process': {
      id: 'metric-in-process',
      name: 'In Process',
      type: 'metric',
      category: 'Key Metrics',
      variables: ['var-in-process']
    },
    'metric-weekly-revenue': {
      id: 'metric-weekly-revenue',
      name: 'Weekly Revenue',
      type: 'metric',
      category: 'Key Metrics',
      variables: ['var-weekly-revenue']
    }
  },
  categories: ['Key Metrics']
};
