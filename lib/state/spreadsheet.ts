import { SpreadsheetData, DashboardVariable, ChartMetadata } from '@/lib/types/dashboard';

interface SpreadsheetState {
  variables: Record<string, DashboardVariable>;
  charts: Record<string, ChartMetadata>;
  categories: string[];
}

export const initialSpreadsheetState: SpreadsheetState = {
  variables: {
    'var-total-orders': {
      id: 'var-total-orders',
      name: 'total_orders',
      displayName: 'Total Orders',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-total-orders',
      chartType: 'metric',
      chartGroup: 'Metrics',
      calculation: 'COUNT',
      sqlExpression: 'SELECT COUNT(*) FROM orders',
      p21DataDictionary: 'orders'
    },
    'var-open-orders': {
      id: 'var-open-orders',
      name: 'open_orders',
      displayName: 'Open Orders',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-open-orders',
      chartType: 'metric',
      chartGroup: 'Metrics',
      calculation: 'COUNT',
      sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "open"',
      p21DataDictionary: 'orders'
    },
    'var-in-process': {
      id: 'var-in-process',
      name: 'in_process',
      displayName: 'In Process',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-in-process',
      chartType: 'metric',
      chartGroup: 'Metrics',
      calculation: 'COUNT',
      sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "in_process"',
      p21DataDictionary: 'orders'
    },
    'var-weekly-revenue': {
      id: 'var-weekly-revenue',
      name: 'weekly_revenue',
      displayName: 'Weekly Revenue',
      value: 0,
      category: 'Key Metrics',
      chartId: 'metric-weekly-revenue',
      chartType: 'metric',
      chartGroup: 'Metrics',
      calculation: 'SUM',
      sqlExpression: 'SELECT SUM(revenue) FROM orders WHERE date >= NOW() - INTERVAL 1 WEEK',
      p21DataDictionary: 'orders'
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
  categories: ['Key Metrics', 'Historical Data', 'Accounts Payable', 'Customers', 'Inventory', 'Site Distribution', 'AR Aging']
};
