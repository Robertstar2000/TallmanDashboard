import { 
  RawARAgingData,
  Metric,
  DailyShipment,
  SiteDistribution,
  RawAccountsPayableData,
  MonthlyData,
  Product,
  HistoricalDataPoint,
  CustomerMetric,
  WebMetric,
  DatabaseConfig,
  ServerHealthStatusEnum,
  ServerHealthCheckResult
} from '@/lib/types/dashboard';
import { executeRead, executeWrite } from './db/sqlite';

// Type definitions
export interface ConnectionConfig {
  server: string;
  ipAddress: string;
  port: string;
  database: string;
  username: string;
  password: string;
  instance?: string;
  domain: string;
}

// SQL Server connection configurations
let p21Connection: DatabaseConfig | null = null;
let porConnection: DatabaseConfig | null = null;

// Function declarations
export async function getConnection(serverType: 'P21' | 'POR'): Promise<DatabaseConfig | null> {
  return serverType === 'P21' ? p21Connection : porConnection;
}

export async function resetData(): Promise<void> {
  // Add logic to reset data here
}

export async function connectToServer(serverType: 'P21' | 'POR', config: DatabaseConfig | null): Promise<boolean> {
  if (!config) {
    if (serverType === 'P21') {
      p21Connection = null;
    } else {
      porConnection = null;
    }
    return false;
  }

  try {
    // Test connection
    if (serverType === 'P21') {
      p21Connection = config;
    } else {
      porConnection = config;
    }

    return true;
  } catch (error) {
    console.error(`Error connecting to ${serverType} server:`, error);
    return false;
  }
};

export async function isServerConnected(serverType: 'P21' | 'POR'): Promise<boolean> {
  return serverType === 'P21' ? p21Connection !== null : porConnection !== null;
};

export async function logConnectionInfo(config: DatabaseConfig, connectionType: string): Promise<void> {
  try {
    console.log(`
      ========== ${connectionType} CONNECTION ==========
      Server: ${config.server}
      Database: ${config.database}
      Domain: ${config.domain || 'N/A'}
      Instance: ${config.instance || 'default'}
      =====================================
    `);
  } catch (error) {
    console.error(`Error logging ${connectionType} connection info:`, error);
  }
}

export async function getConnectionStatus(config: DatabaseConfig): Promise<{ isConnected: boolean; error?: string }> {
  try {
    if (!config.server || !config.database || !config.username || !config.password) {
      return { 
        isConnected: false, 
        error: 'Missing required connection parameters' 
      };
    }
    // Add connection test logic here
    return { isConnected: true };
  } catch (error) {
    return { 
      isConnected: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getMetrics(): Promise<Metric[]> {
  return executeRead('SELECT * FROM metrics');
}

export async function updateMetric(metric: Metric): Promise<void> {
  await executeWrite(
    'UPDATE metrics SET name = ?, value = ?, calculation = ? WHERE id = ?',
    [metric.name, metric.value, metric.calculation, metric.id]
  );
}

export async function getDailyOrders(): Promise<DailyShipment[]> {
  const result = await executeRead(`
    SELECT 
      strftime('%Y-%m-%d', order_date) as date,
      COUNT(*) as orders 
    FROM oe_hdr 
    WHERE order_date >= date('now', '-7 days')
    GROUP BY date 
    ORDER BY date DESC
  `);
  return result;
}

export async function getSiteDistribution(): Promise<SiteDistribution[]> {
  return executeRead('SELECT * FROM site_distribution');
}

export async function getCustomerMetrics(): Promise<CustomerMetric[]> {
  // For now, return mock data until we implement the actual query
  return [
    { id: '1', month: '2024-02', date: '2024-02-01', newCustomers: 45, prospects: 120 },
    { id: '2', month: '2024-01', date: '2024-01-01', newCustomers: 38, prospects: 95 }
  ];
}

export async function getAccounts(): Promise<RawAccountsPayableData[]> {
  // For now, return mock data until we implement the actual query
  return [
    { 
      id: '1', 
      chartGroup: 'Accounts', 
      calculation: 'Monthly', 
      name: 'February', 
      accountsPayableDate: '2024-02-01', 
      payable: '250000', 
      overdue: '15000', 
      receivable: '380000' 
    },
    { 
      id: '2', 
      chartGroup: 'Accounts', 
      calculation: 'Monthly', 
      name: 'January', 
      accountsPayableDate: '2024-01-01', 
      payable: '220000', 
      overdue: '12000', 
      receivable: '350000' 
    }
  ];
}

export async function getPORData(): Promise<MonthlyData[]> {
  // For now, return mock data until we implement the actual query
  return [
    { id: '1', month: '2024-02', newRentals: 85, openRentals: 320, rentalValue: 450000 },
    { id: '2', month: '2024-01', newRentals: 72, openRentals: 290, rentalValue: 420000 }
  ];
}

export async function getInventoryValue(): Promise<Product[]> {
  // For now, return mock data until we implement the actual query
  return [
    { id: '1', category: 'Equipment', inStock: 250, onOrder: 50 },
    { id: '2', category: 'Parts', inStock: 1200, onOrder: 300 }
  ];
}

export async function getHistoricalData(): Promise<HistoricalDataPoint[]> {
  return executeRead('SELECT * FROM historical_data ORDER BY month DESC');
}

export async function getWebMetrics(): Promise<WebMetric[]> {
  // For now, return mock data until we implement the actual query
  return [
    { id: '1', month: '2024-02', W_Orders: 85, W_Revenue: 125000 },
    { id: '2', month: '2024-01', W_Orders: 72, W_Revenue: 105000 }
  ];
}

export async function checkServerHealth(): Promise<ServerHealthCheckResult> {
  try {
    await executeRead('SELECT 1');
    return {
      status: ServerHealthStatusEnum.Connected,
      message: 'Connected to database'
    };
  } catch (error) {
    return {
      status: ServerHealthStatusEnum.Error,
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getServerStatus(config: DatabaseConfig): Promise<boolean> {
  try {
    console.log(`Checking server connection: ${config.server}`);
    // Add your server status check logic here
    return true;
  } catch (error) {
    console.error('Error checking server status:', error);
    return false;
  }
}

export async function getServerInfo(config: DatabaseConfig): Promise<string> {
  try {
    return `Server: ${config.server}\nDatabase: ${config.database}`;
  } catch (error) {
    console.error('Error getting server info:', error);
    return 'Unable to get server info';
  }
}

export async function logServerInfo(config: DatabaseConfig): Promise<void> {
  try {
    console.log(`
      Server: ${config.server}
      Database: ${config.database}
      Username: ${config.username}
      Instance: ${config.instance || 'default'}
      Domain: ${config.domain || 'N/A'}
    `);
  } catch (error) {
    console.error('Error logging server info:', error);
  }
}

export async function validateServerConfig(config: DatabaseConfig): Promise<boolean> {
  try {
    if (!config.server || !config.database || !config.username || !config.password) {
      console.error('Missing required server configuration');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error validating server config:', error);
    return false;
  }
}

export async function updateHistoricalData(data: HistoricalDataPoint[]): Promise<void> {
  // Implementation
}

export async function updateDailyOrders(data: DailyShipment[]): Promise<void> {
  // Implementation
}

export async function updateSiteDistribution(data: SiteDistribution[]): Promise<void> {
  // Implementation
}

export async function updateAccounts(data: RawAccountsPayableData[]): Promise<void> {
  // Implementation
}

export async function updatePOR(data: MonthlyData[]): Promise<void> {
  // Implementation
}

export async function updateInventoryValue(data: Product[]): Promise<void> {
  // Implementation
}

export async function updateGrowthMetrics(data: any[]): Promise<void> {
  // Implementation
}

// Initial data structure
interface InitialData {
  metrics: Metric[];
  dailyOrders: DailyShipment[];
  siteDistribution: SiteDistribution[];
  customerMetrics: CustomerMetric[];
  accounts: RawAccountsPayableData[];
  por: MonthlyData[];
  inventoryValue: Product[];
  webMetrics: WebMetric[];
}

const initialData: InitialData = {
  metrics: [
    { id: '1', name: 'Total Orders', value: 150, calculation: 'Count of total orders', trend: 'up', change: 5 },
    { id: '2', name: 'Average Order Value', value: 2500, calculation: 'Average order value', trend: 'down', change: 2 },
    { id: '3', name: 'Open Orders', value: 45, calculation: 'Count of open orders', trend: 'up', change: 10 },
    { id: '4', name: 'Daily Revenue', value: 35000, calculation: 'Sum of daily revenue', trend: 'up', change: 15 }
  ],
  dailyOrders: [
    { id: '1', date: '2024-02-24', orders: 45 },
    { id: '2', date: '2024-02-23', orders: 38 },
    { id: '3', date: '2024-02-22', orders: 42 },
    { id: '4', date: '2024-02-21', orders: 36 },
    { id: '5', date: '2024-02-20', orders: 40 }
  ],
  siteDistribution: [
    { id: '1', name: 'Site A', columbus: 45, addison: 30, lakeCity: 25, other: 0 },
    { id: '2', name: 'Site B', columbus: 25, addison: 40, lakeCity: 35, other: 0 }
  ],
  customerMetrics: [
    { id: '1', month: '2024-02', date: '2024-02-01', newCustomers: 45, prospects: 120 },
    { id: '2', month: '2024-01', date: '2024-01-01', newCustomers: 38, prospects: 95 }
  ],
  accounts: [
    { 
      id: '1', 
      chartGroup: 'Accounts', 
      calculation: 'Monthly', 
      name: 'February', 
      accountsPayableDate: '2024-02-01', 
      payable: '250000', 
      overdue: '15000', 
      receivable: '380000' 
    },
    { 
      id: '2', 
      chartGroup: 'Accounts', 
      calculation: 'Monthly', 
      name: 'January', 
      accountsPayableDate: '2024-01-01', 
      payable: '220000', 
      overdue: '12000', 
      receivable: '350000' 
    }
  ],
  por: [
    { id: '1', month: '2024-02', newRentals: 85, openRentals: 320, rentalValue: 450000 },
    { id: '2', month: '2024-01', newRentals: 72, openRentals: 290, rentalValue: 420000 }
  ],
  inventoryValue: [
    { id: '1', category: 'Equipment', inStock: 250, onOrder: 50 },
    { id: '2', category: 'Parts', inStock: 1200, onOrder: 300 }
  ],
  webMetrics: [
    { id: '1', month: '2024-02', W_Orders: 85, W_Revenue: 125000 },
    { id: '2', month: '2024-01', W_Orders: 72, W_Revenue: 105000 }
  ]
};

export { initialData };

const arAgingData: RawARAgingData[] = [
  {
    id: '1',
    chartGroup: 'AR Aging',
    calculation: 'Current',
    name: 'Current',
    value: '100000',
    arAgingDate: '2024-02-24',
    sqlExpression: 'SELECT SUM(current) FROM ar_aging',
    p21DataDictionary: 'AR_AGING',
    current: '100000'
  },
  {
    id: '2',
    chartGroup: 'AR Aging',
    calculation: '1-30',
    name: '1-30 Days',
    value: '75000',
    arAgingDate: '2024-02-24',
    sqlExpression: 'SELECT SUM(aging_1_30) FROM ar_aging',
    p21DataDictionary: 'AR_AGING',
    aging_1_30: '75000'
  },
  {
    id: '3',
    chartGroup: 'AR Aging',
    calculation: '31-60',
    name: '31-60 Days',
    value: '50000',
    arAgingDate: '2024-02-24',
    sqlExpression: 'SELECT SUM(aging_31_60) FROM ar_aging',
    p21DataDictionary: 'AR_AGING',
    aging_31_60: '50000'
  },
  {
    id: '4',
    chartGroup: 'AR Aging',
    calculation: '61-90',
    name: '61-90 Days',
    value: '25000',
    arAgingDate: '2024-02-24',
    sqlExpression: 'SELECT SUM(aging_61_90) FROM ar_aging',
    p21DataDictionary: 'AR_AGING',
    aging_61_90: '25000'
  },
  {
    id: '5',
    chartGroup: 'AR Aging',
    calculation: '90+',
    name: '90+ Days',
    value: '15000',
    arAgingDate: '2024-02-24',
    sqlExpression: 'SELECT SUM(aging_90_plus) FROM ar_aging',
    p21DataDictionary: 'AR_AGING',
    aging_90_plus: '15000'
  }
];

export async function getARAgingData(): Promise<RawARAgingData[]> {
  return arAgingData;
}
