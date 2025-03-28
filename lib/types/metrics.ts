export interface Metric {
  id: string;
  name: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  calculation?: string;
}

export interface DailyOrder {
  date: string;
  orders: number;
}

export interface SiteDistribution {
  name: string;
  value: number;
}

export interface CustomerMetric {
  month: string;
  newCustomers: number;
  prospects: number;
}

export interface AccountsPayable {
  month: string;
  payable: number;
  receivable: number;
}

export interface InventoryData {
  category: string;
  inStock: number;
  onOrder: number;
}

export interface WebMetric {
  month: string;
  W_Orders: number;
  W_Revenue: number;
}

export interface HistoricalData {
  month: string;
  p21: number;
  por: number;
  total: number;
}

export interface ARAging {
  range: string;
  amount: number;
  color: string;
}
