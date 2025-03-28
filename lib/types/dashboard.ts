// Raw Data Types
export interface RawDataBase {
  id: string;
  name?: string;
  chartGroup?: string;
  chartName?: string;
  variableName?: string;
  server?: string;
  productionSqlExpression?: string;
  tableName?: string;
  value: string | number;
}

export interface RawMetricData extends RawDataBase {
  name: string;
  value: string;
  metricType: string;
}

export interface RawProductData extends RawDataBase {
  name: string;
  value: string;
  subGroup?: string;
  category: string;
}

export interface RawHistoricalData extends RawDataBase {
  name: string;
  historicalDate: string;
  p21: string;
  por: string;
  variableName?: string;
  server?: string;
  chartName?: string;
}

export interface RawAccountsPayableData extends RawDataBase {
  name: string;
  accountsPayableDate: string;
  payable: string;
  receivable: string;
  overdue: string;
}

export interface RawCustomersData extends RawDataBase {
  name: string;
  customersDate: string;
  new: string;
  prospects: string;
}

export interface RawInventoryData extends RawDataBase {
  name: string;
  inventoryValueDate: string;
  inventory: string;
  turnover: string;
}

export interface RawSiteDistributionData extends RawDataBase {
  name: string;
  historicalDate: string;
  columbus: string;
  addison: string;
  lakeCity: string;
}

export interface RawARAgingData extends RawDataBase {
  name: string;
  value: string;
  arAgingDate: string;
  p21?: string;
  por?: string;
  variableName?: string;
  server?: string;
  chartName?: string;
  current?: string;
  aging_1_30?: string;
  aging_31_60?: string;
  aging_61_90?: string;
  aging_90_plus?: string;
}

export type RawDashboardData = 
  | RawMetricData 
  | RawProductData 
  | RawHistoricalData 
  | RawAccountsPayableData 
  | RawCustomersData 
  | RawInventoryData 
  | RawSiteDistributionData 
  | RawARAgingData;

export interface MetricItem {
  id: string;
  name: string;
  value: number;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface HistoricalDataPoint {
  id: string;
  date: string;
  month?: string;
  p21?: number;
  por?: number;
  sales?: number;
  orders?: number;
  combined?: number;
  value1?: number;
  value2?: number;
  value3?: number;
  total?: number;
}

export interface AccountsDataPoint {
  id: string;
  date: string;
  payable: number;
  receivable: number;
  overdue: number;
  current?: number;
  past_due_30?: number;
  past_due_60?: number;
  past_due_90?: number;
}

export interface CustomerMetricPoint {
  id: string;
  date: string;
  name?: string;
  newCustomers: number;
  returning?: number;
  returningCustomers?: number;
}

export interface InventoryDataPoint {
  id: string;
  department?: string;
  date?: string;
  name?: string;
  inStock: number;
  onOrder: number;
}

export interface POROverviewPoint {
  id: string;
  date: string;
  name?: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

export interface SiteDistributionPoint {
  id: string;
  name: string;
  value: number;
  percentage?: number;
  columbus?: number;
  addison?: number;
  lakeCity?: number;
}

export interface ARAgingPoint {
  id: string;
  range: string;
  amount: number;
  name?: string;
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90?: number;
  days_120?: number;
}

export interface DailyOrderPoint {
  id: string;
  date?: string;
  day?: number;
  orders: number;
}

export interface WebOrderPoint {
  id: string;
  date: string;
  orders: number;
  revenue: number;
}

export interface DashboardData {
  metrics: MetricItem[];
  historicalData: HistoricalDataPoint[];
  accounts: AccountsDataPoint[];
  customerMetrics: CustomerMetricPoint[];
  inventory: InventoryDataPoint[];
  porOverview: POROverviewPoint[];
  siteDistribution: SiteDistributionPoint[];
  arAging: ARAgingPoint[];
  dailyOrders: DailyOrderPoint[];
  webOrders: WebOrderPoint[];
  status?: {
    [key: string]: {
      success: boolean;
      error?: string;
    };
  };
}

export interface ChartDataItem {
  id: string;
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface TimeSeriesDataPoint {
  id: string;
  date: string;
  value: number;
}

export interface ComparisonDataPoint {
  id: string;
  date: string;
  p21: number;
  por: number;
}

export interface ARAgingDataPoint {
  id: string;
  range: string;
  amount: number;
  color: string;
}

export interface OrdersDataPoint {
  id: string;
  date: string;
  orders: number;
}

export interface MetricCard {
  id: number;
  name: string;
  value: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartData {
  id: string;
  chartName: string;
  variableName: string;
  serverName: string;
  tableName: string;
  productionSqlExpression: string;
  value: string | number;
}

export interface TransformedData {
  metrics: MetricItem[];
  historicalData: ComparisonDataPoint[];
  accountsPayable: AccountsDataPoint[];
  siteDistribution: TimeSeriesDataPoint[];
  arAging: ARAgingDataPoint[];
  orderStatus: OrdersDataPoint[];
  webOrders: OrdersDataPoint[];
}

export interface CustomerMetric {
  id: string;
  date: string;
  month: string;
  newCustomers: number;
  prospects: number;
}

export interface DailyShipment {
  id: string;
  date: string;
  orders: number;
}

export interface POROverviewData {
  id: string;
  date: string;
  value: number;
}

export interface SiteDistribution {
  id: string;
  name: string;
  columbus: number;
  addison: number;
  lakeCity: number;
  other: number;
}

export interface ARAgingData {
  id: string;
  name: string;
  date: string;
  category: string;
  value: number;
}

export interface DailyOrderData {
  id: string;
  date: string;
  value: number;
}

export interface WebOrderData {
  id: string;
  date: string;
  value: number;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  calculation?: string;
}

export interface SpreadsheetRow {
  id: string;
  chartGroup: string;
  chartName?: string;
  variableName: string;
  serverName: string;
  tableName: string;
  calculation: string;
  productionSqlExpression: string;
  value: string;
  lastUpdated?: string;
  timeframe?: string;
  DataPoint?: string;
  transformer?: string; // Keep for backward compatibility
  error?: string;
  errorType?: 'connection' | 'execution' | 'syntax' | 'other';
  lastError?: string;
}

export interface ChartGroupSettings {
  id: string;
  name: string;
  display_order: number;
  is_visible: number;
  chart_type: string;
  description: string;
  last_updated: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  is_active: number;
  connection_type: string;
  domain?: string;
  instance?: string;
}

export interface DatabaseConfig {
  server: string;
  database: string;
  username: string;
  password: string;
  port: number;
  domain?: string;
  instance?: string;
}

export interface DatabaseConnection {
  server: string;
  database: string;
  username: string;
  password: string;
  port: number;
  filePath?: string; // Added for MS Access connections
}

export interface DatabaseConnections {
  p21: DatabaseConnection | null;
  por: DatabaseConnection | null;
}

export enum ServerHealthStatusEnum {
  Connected = 'CONNECTED',
  Error = 'ERROR'
}

export interface ServerHealthCheckResult {
  status: ServerHealthStatusEnum;
  message: string;
  error?: string;
}

export interface AdminVariable {
  id: string;
  name: string;
  chartGroup: string;
  chartName: string;
  category: string;
  variableName: string;
  server: string;
  serverName?: string;
  productionSqlExpression: string;
  tableName: string;
  value: string | number;
  historicalDate?: string;
  accountsPayableDate?: string;
  inventoryValueDate?: string;
  customersDate?: string;
  metricType?: string;
  subGroup?: string;
  timeframe?: string;
}

export interface DashboardVariable extends RawDataBase {
  id: string;
  name: string;
  value: string | number;
  category: string;
  subcategory?: string;
  chartId: string;
  chartType: 'metric' | 'chart' | 'graph';
  displayName: string;
  chartGroup: string;
  calculation: string;
  productionSqlExpression: string;
  p21DataDictionary: string;
  historicalDate?: string;
  p21?: string;
  por?: string;
  accountsPayableDate?: string;
  total?: string;
  overdue?: string;
  customersDate?: string;
  new?: string;
  prospects?: string;
  inventoryValueDate?: string;
  inventory?: string;
  turnover?: string;
  arAgingDate?: string;
  current?: string;
  aging_1_30?: string;
  aging_31_60?: string;
  aging_61_90?: string;
  aging_90_plus?: string;
}

export interface ChartMetadata {
  id: string;
  name: string;
  type: 'metric' | 'chart' | 'graph';
  category: string;
  variables: string[]; // List of variable IDs associated with this chart
}

export interface SpreadsheetDataWithPopupSupport extends SpreadsheetData {
  variables: Record<string, DashboardVariable>;
  charts: Record<string, ChartMetadata>;
  categories: string[];
}

// Alias for backward compatibility
export type Products = Product[];

// Spreadsheet Data Types
export interface MonthlyData {
  id: string;
  month: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

export interface SpreadsheetData {
  entries: MonthlyData[];
  totals: {
    p21: number;
    por: number;
    accountsPayable: {
      total: number;
      overdue: number;
    };
    customers: {
      new: number;
      prospects: number;
    };
    inventory: {
      averageValue: number;
      averageTurnover: number;
    };
    sites: {
      columbus: number;
      addison: number;
      lakeCity: number;
    };
    arAging: {
      current: number;
      aging_1_30: number;
      aging_31_60: number;
      aging_61_90: number;
      aging_90_plus: number;
    };
  };
  dailyShipments: DailyShipment[];
}

export interface Product {
  id: string;
  category: string;
  inStock: number;
  onOrder: number;
}

export interface WebMetric {
  id: string;
  month: string;
  W_Orders: number;
  W_Revenue: number;
}

export interface DatabaseConnectionState {
  isConnected: boolean;
  isConnecting?: boolean;
  error?: string;
  lastError?: string;
  p21Connected?: boolean;
  porConnected?: boolean;
}
