import type {
  Metric,
  RawCustomersData,
  RawAccountsPayableData,
  DailyShipment,
  SiteDistribution,
  HistoricalDataPoint,
  Product,
  ARAgingData,
  DatabaseConfig,
  ServerHealthStatusEnum,
  ServerHealthCheckResult,
  AdminVariable
} from './dashboard';

export interface MetricsData {
  name: string;
  value: number;
}

export interface DailyOrdersData {
  day: string;
  orders: number;
}

export interface SiteDistributionData {
  name: string;
  value: number;
}

export interface CustomerMetric {
  month: string;
  newCustomers: number;
  prospects: number;
}

export interface AccountsData {
  month: string;
  payable: number;
  overdue: number;
  receivable: number;
}

export interface PORData {
  month: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

export interface InventoryData {
  [key: string]: string | number;
  category: string;
  inStock: number;
  onOrder: number;
}

export interface HistoricalData {
  month: string;
  p21: number;
  por: number;
  total: number;
}

export interface ChartData {
  id: string;
  chartGroup: string;
  variableName: string;
  serverName: string;
  tableName: string;
  sqlExpression: string;
  value: string | number;
}

export interface SqlInfo {
  serverName: string;
  sqlExpression: string;
  tableName: string;
}
