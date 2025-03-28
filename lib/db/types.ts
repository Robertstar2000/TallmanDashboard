// Define the SpreadsheetRow type to be used across files
export type SpreadsheetRow = {
  id: string;
  name?: string;
  chartName?: string;
  variableName: string;
  serverName: string;
  value: string;
  chartGroup: string;
  calculation: string;
  productionSqlExpression: string;
  sqlExpression?: string; // Added this property to fix TypeScript errors
  tableName: string;
  timeframe?: string;
  lastUpdated?: string;
  DataPoint?: string;
  transformer?: string;
  error?: string;
  errorType?: 'connection' | 'execution' | 'syntax' | 'other';
  lastError?: string;
};

// Define the ChartGroupSetting type
export type ChartGroupSetting = {
  id: string;
  name: string;
  display_order: number;
  is_visible: number;
  settings: {
    chartType: string;
    [key: string]: any;
  };
};

// Define the ServerConfig type
export type ServerConfig = {
  id: string;
  name: string;
  server_name?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  is_active: number;
  connection_type: string;
  server?: string;
  created_at?: string;
  updated_at?: string;
  config?: any;
};
