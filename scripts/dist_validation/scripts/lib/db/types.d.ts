export type ServerConfig = {
    id: string;
    name: string;
    type: 'P21' | 'POR' | 'LOCAL' | 'Other';
    value: string | null;
    description: string | null;
    isActive: boolean;
    lastUpdated: string | null;
};
export type ChartGroupSetting = {
    name: string;
    description: string;
    variables: string[];
};
export type DatabaseStatus = {
    serverName: string;
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    isHealthy?: boolean;
    details?: any;
    error?: string;
    lastChecked?: Date | string;
};
export type ConnectionDetails = {
    type: 'P21' | 'POR';
    dsn?: string;
    database?: string;
    user?: string;
    password?: string;
    filePath?: string;
};
export interface DatabaseConnection {
    id?: string;
    name?: string;
    type?: 'P21' | 'POR';
    status?: 'connected' | 'disconnected' | 'error';
    [key: string]: any;
}
export type ChartDataRow = {
    id: string;
    rowId: string;
    chartGroup: string;
    variableName: string;
    DataPoint: string;
    chartName: string | null;
    serverName: 'P21' | 'POR';
    tableName: string | null;
    productionSqlExpression: string | null;
    value: number | null;
    lastUpdated: string | null;
    calculationType: 'SUM' | 'AVG' | 'COUNT' | 'LATEST' | null;
    axisStep: string | null;
};
export interface POROverviewPoint {
    month: string;
    revenue?: number;
    orders?: number;
    [key: string]: any;
}
export interface SiteDistributionPoint {
    site: string;
    value: number;
    [key: string]: any;
}
export interface WebOrderPoint {
    date: string | Date;
    count: number;
    [key: string]: any;
}
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
export interface DatabaseConnections {
    [key: string]: DatabaseConnection;
}
export type QueryResult = ChartDataRow | ServerConfig | ChartGroupSetting | DatabaseStatus | {
    [key: string]: any;
};
