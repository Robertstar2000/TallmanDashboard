// Raw Data Types
export interface RawDataBase {
  id: number;
  name: string;
  chartGroup: string;
  calculation: string;
  sqlExpression: string;
  p21DataDictionary: string;
}

export interface RawMetricData extends RawDataBase {
  value: string;
}

export interface RawProductData extends RawDataBase {
  value: string;
  subGroup?: string;
}

export interface RawHistoricalData extends RawDataBase {
  historicalDate: string;
  p21: string;
  por: string;
}

export interface RawAccountsPayableData extends RawDataBase {
  accountsPayableDate: string;
  total: string;
  overdue: string;
}

export interface RawCustomersData extends RawDataBase {
  customersDate: string;
  new: string;
  prospects: string;
}

export interface RawInventoryData extends RawDataBase {
  inventoryValueDate: string;
  inventory: string;
  turnover: string;
}

export interface RawSiteDistributionData extends RawDataBase {
  historicalDate: string;
  columbus: string;
  addison: string;
  lakeCity: string;
}

export type RawDashboardData = 
  RawMetricData 
  | RawProductData 
  | RawHistoricalData 
  | RawAccountsPayableData 
  | RawCustomersData 
  | RawInventoryData 
  | RawSiteDistributionData;

// Transformed Data Types
export interface DashboardData {
  metrics: Metric[];
  historicalData: HistoricalDataPoint[];
  accountsPayable: AccountsPayableData[];
  customers: CustomerData[];
  products: ProductsByCategory;
  siteDistribution: SiteDistribution[];
  dailyShipments: DailyShipment[];
}

export interface Metric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface HistoricalDataPoint {
  date: string;
  p21: number;
  por: number;
}

export interface AccountsPayableData {
  date: string;
  total: number;
  overdue: number;
}

export interface DailyShipment {
  date: string;
  shipments: number;
}

export interface SiteDistribution {
  date: string;
  columbus: number;
  addison: number;
  lakeCity: number;
}

export interface CustomerData {
  date: string;
  new: number;
  prospects: number;
}

export interface Product {
  name: string;
  value: number;
}

export interface ProductsByCategory {
  online: Product[];
  inside: Product[];
  outside: Product[];
}

// Alias for backward compatibility
export type Products = ProductsByCategory;

// Spreadsheet Data Types
export interface MonthlyData {
  date: string;
  p21Value: number;
  porValue: number;
  accountsPayable: {
    total: number;
    overdue: number;
  };
  customers: {
    new: number;
    prospects: number;
  };
  inventory: {
    value: number;
    turnover: number;
  };
  sites: {
    columbus: number;
    addison: number;
    lakeCity: number;
  };
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
  };
  dailyShipments: DailyShipment[];
}

export interface DashboardVariable {
  id: string;
  name: string;
  value: string | number;
  category: string;
  subcategory?: string;
  chartId: string;
  chartType: 'metric' | 'chart' | 'graph';
  displayName: string;
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

// Database Connection Types
export interface DatabaseConnection {
  server: string;
  database: string;
  username: string;
  password: string;
  port: number;
}

export interface DatabaseConnections {
  p21Connection: DatabaseConnection | undefined;
  porConnection: DatabaseConnection | undefined;
}

export interface DatabaseConnectionState {
  isConnected: boolean;
  p21Connected: boolean;
  porConnected: boolean;
  lastError?: string;
}

export interface AdminVariable extends RawDataBase {
  id: number;
  name: string;
  chartGroup: string;
  calculation: string;
  sqlExpression: string;
  p21DataDictionary: string;
  extractedValue?: string;
  secondaryValue?: string;
  updateTime?: string;
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
  columbus?: string;
  addison?: string;
  lakeCity?: string;
  value?: string;
  subGroup?: string;
  connectionState?: DatabaseConnectionState;
}
