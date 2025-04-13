var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ServerHealthStatusEnum } from '@/lib/types/dashboard';
import { executeRead, executeWrite } from './db/sqlite';
// SQL Server connection configurations
let p21Connection = null;
let porConnection = null;
// Function declarations
export function getConnection(serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        return serverType === 'P21' ? p21Connection : porConnection;
    });
}
export function resetData() {
    return __awaiter(this, void 0, void 0, function* () {
        // Add logic to reset data here
    });
}
export function connectToServer(serverType, config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config) {
            if (serverType === 'P21') {
                p21Connection = null;
            }
            else {
                porConnection = null;
            }
            return false;
        }
        try {
            // Test connection
            if (serverType === 'P21') {
                p21Connection = config;
            }
            else {
                porConnection = config;
            }
            return true;
        }
        catch (error) {
            console.error(`Error connecting to ${serverType} server:`, error);
            return false;
        }
    });
}
;
export function isServerConnected(serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        return serverType === 'P21' ? p21Connection !== null : porConnection !== null;
    });
}
;
export function logConnectionInfo(config, connectionType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`
      ========== ${connectionType} CONNECTION ==========
      Server: ${config.server}
      Database: ${config.database}
      Domain: ${config.domain || 'N/A'}
      Instance: ${config.instance || 'default'}
      =====================================
    `);
        }
        catch (error) {
            console.error(`Error logging ${connectionType} connection info:`, error);
        }
    });
}
export function getConnectionStatus(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!config.server || !config.database || !config.username || !config.password) {
                return {
                    isConnected: false,
                    error: 'Missing required connection parameters'
                };
            }
            // Add connection test logic here
            return { isConnected: true };
        }
        catch (error) {
            return {
                isConnected: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    });
}
export function getMetrics() {
    return __awaiter(this, void 0, void 0, function* () {
        return executeRead('SELECT * FROM metrics');
    });
}
export function updateMetric(metric) {
    return __awaiter(this, void 0, void 0, function* () {
        yield executeWrite('UPDATE metrics SET name = ?, value = ?, calculation = ? WHERE id = ?', [metric.name, metric.value, metric.calculation, metric.id]);
    });
}
export function getDailyOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield executeRead(`
    SELECT 
      strftime('%Y-%m-%d', order_date) as date,
      COUNT(*) as orders 
    FROM oe_hdr 
    WHERE order_date >= date('now', '-7 days')
    GROUP BY date 
    ORDER BY date DESC
  `);
        return result;
    });
}
export function getSiteDistribution() {
    return __awaiter(this, void 0, void 0, function* () {
        return executeRead('SELECT * FROM site_distribution');
    });
}
export function getCustomerMetrics() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return mock data until we implement the actual query
        return [
            { id: '1', month: '2024-02', date: '2024-02-01', newCustomers: 45, prospects: 120 },
            { id: '2', month: '2024-01', date: '2024-01-01', newCustomers: 38, prospects: 95 }
        ];
    });
}
export function getAccounts() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
export function getPORData() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return mock data until we implement the actual query
        return [
            { id: '1', month: '2024-02', newRentals: 85, openRentals: 320, rentalValue: 450000 },
            { id: '2', month: '2024-01', newRentals: 72, openRentals: 290, rentalValue: 420000 }
        ];
    });
}
export function getInventoryValue() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return mock data until we implement the actual query
        return [
            { id: '1', category: 'Equipment', inStock: 250, onOrder: 50 },
            { id: '2', category: 'Parts', inStock: 1200, onOrder: 300 }
        ];
    });
}
export function getHistoricalData() {
    return __awaiter(this, void 0, void 0, function* () {
        return executeRead('SELECT * FROM historical_data ORDER BY month DESC');
    });
}
export function getWebMetrics() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return mock data until we implement the actual query
        return [
            { id: '1', month: '2024-02', W_Orders: 85, W_Revenue: 125000 },
            { id: '2', month: '2024-01', W_Orders: 72, W_Revenue: 105000 }
        ];
    });
}
export function checkServerHealth() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield executeRead('SELECT 1');
            return {
                status: ServerHealthStatusEnum.Connected,
                message: 'Connected to database'
            };
        }
        catch (error) {
            return {
                status: ServerHealthStatusEnum.Error,
                message: 'Failed to connect to database',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
}
export function getServerStatus(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Checking server connection: ${config.server}`);
            // Add your server status check logic here
            return true;
        }
        catch (error) {
            console.error('Error checking server status:', error);
            return false;
        }
    });
}
export function getServerInfo(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return `Server: ${config.server}\nDatabase: ${config.database}`;
        }
        catch (error) {
            console.error('Error getting server info:', error);
            return 'Unable to get server info';
        }
    });
}
export function logServerInfo(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`
      Server: ${config.server}
      Database: ${config.database}
      Username: ${config.username}
      Instance: ${config.instance || 'default'}
      Domain: ${config.domain || 'N/A'}
    `);
        }
        catch (error) {
            console.error('Error logging server info:', error);
        }
    });
}
export function validateServerConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!config.server || !config.database || !config.username || !config.password) {
                console.error('Missing required server configuration');
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error validating server config:', error);
            return false;
        }
    });
}
export function updateHistoricalData(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updateDailyOrders(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updateSiteDistribution(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updateAccounts(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updatePOR(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updateInventoryValue(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
export function updateGrowthMetrics(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation
    });
}
const initialData = {
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
const arAgingData = [
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
export function getARAgingData() {
    return __awaiter(this, void 0, void 0, function* () {
        return arAgingData;
    });
}
