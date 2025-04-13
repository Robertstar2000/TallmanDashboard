// Configuration for a connection to P21 or POR
export type ServerConfig = {
    id: string; // Corresponds to the admin_variables id
    name: string; // User-friendly name for the server config (e.g., 'P21 Production')
    type: 'P21' | 'POR' | 'LOCAL' | 'Other'; // Type of server
    value: string | null; // Connection string, DSN, or relevant config value
    description: string | null; // Optional description
    isActive: boolean; // Is this connection configuration active?
    lastUpdated: string | null;
};

// Settings and metadata for a group of charts
export type ChartGroupSetting = {
    name: string; // The unique name of the chart group (e.g., 'AR Aging')
    description: string; // Description of the chart group (from README or inferred)
    variables: string[]; // List of variable names associated with this group
    // Future enhancements:
    // visualizationType?: string; // e.g., 'Line', 'Bar', 'Donut'
    // expectedRowCount?: number;
};

// Status of a database connection
export type DatabaseStatus = {
    serverName: string; // e.g., 'P21', 'POR', 'Local SQLite'
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    isHealthy?: boolean; // More specific health check result
    details?: any; // Specific details about connection or health
    error?: string; // Error message if status is 'error'
    lastChecked?: Date | string; // When the status was last checked
};

// Type for holding connection details in the Admin Connection Dialog form
export type ConnectionDetails = {
  type: 'P21' | 'POR';
  // P21 Specific
  dsn?: string;
  database?: string;
  user?: string;
  password?: string;
  // POR Specific
  filePath?: string;
};

// TODO: Define structure based on actual usage or original definition
export interface DatabaseConnection {
  // Placeholder properties based on common connection attributes
  id?: string;
  name?: string;
  type?: 'P21' | 'POR';
  status?: 'connected' | 'disconnected' | 'error';
  // Add other necessary properties
  [key: string]: any; // Allow flexible properties for now
}

// Represents the structure of data returned from chart_data table
// Matches the schema defined in lib/db/server.ts getDb function
export type ChartDataRow = {
  id: string;                 // Unique identifier from single-source-data
  rowId: string;              // Unique identifier from single-source-data
  chartGroup: string;         // Corrected name
  variableName: string;       // Added field
  DataPoint: string;          // Added field
  chartName: string | null;   // Added field from JSON
  serverName: 'P21' | 'POR';  // Added field with specific types
  tableName: string | null;   // Added field
  productionSqlExpression: string | null; // Added field
  value: number | null;       // Matches DB type REAL
  lastUpdated: string | null; // Added field (ISO date string)
  calculationType: 'SUM' | 'AVG' | 'COUNT' | 'LATEST' | null; // Added field
  axisStep: string | null;    // Added field from JSON
};

// Placeholder Types for Charts - TODO: Refine based on actual data structures
export interface POROverviewPoint {
  // Example properties - adjust based on POROverviewChart.tsx needs
  month: string;
  revenue?: number;
  orders?: number;
  [key: string]: any;
}

export interface SiteDistributionPoint {
  // Example properties - adjust based on SiteDistributionChart.tsx needs
  site: string;
  value: number;
  [key: string]: any;
}

export interface WebOrderPoint {
  // Example properties - adjust based on WebOrdersChart.tsx needs
  date: string | Date;
  count: number;
  [key: string]: any;
}

// Additional Placeholder Types based on Lint Errors - TODO: Refine
export interface DailyOrderPoint {
  [key: string]: any;
}

export interface RawAccountsPayableData {
  [key: string]: any;
}

export interface MetricItem {
  [key: string]: any;
}

export interface DashboardData {
  [key: string]: any;
}

export interface SpreadsheetRow {
  [key: string]: any;
}

export interface AccountsDataPoint {
  [key: string]: any;
}

export interface ARAgingPoint {
  [key: string]: any;
}

export interface HistoricalDataPoint {
  [key: string]: any;
}

export interface CustomerMetricPoint {
  [key: string]: any;
}

export interface InventoryDataPoint {
  [key: string]: any;
}

// Assuming this is a collection/map of DatabaseConnection
export interface DatabaseConnections {
  [key: string]: DatabaseConnection; 
}

// Generic result type (can be used for various query results)
// Keeping this simple for now, might need more specific result types later
export type QueryResult = ChartDataRow | ServerConfig | ChartGroupSetting | DatabaseStatus | { [key: string]: any };
