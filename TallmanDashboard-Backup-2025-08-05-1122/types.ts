export enum ChartGroup {
    KEY_METRICS = "KEY_METRICS",
    ACCOUNTS = "ACCOUNTS",
    CUSTOMER_METRICS = "CUSTOMER_METRICS",
    INVENTORY = "INVENTORY",
    POR_OVERVIEW = "POR_OVERVIEW",
    DAILY_ORDERS = "DAILY_ORDERS",
    AR_AGING = "AR_AGING",
    HISTORICAL_DATA = "HISTORICAL_DATA",
    SITE_DISTRIBUTION = "SITE_DISTRIBUTION",
    WEB_ORDERS = "WEB_ORDERS",
}

export enum CalculationType {
    SUM = "SUM",
    AVG = "AVG",
    COUNT = "COUNT",
    LATEST = "LATEST"
}

export enum ServerName {
    P21 = "P21",
    POR = "POR"
}

export interface DashboardDataPoint {
    id: number;
    chartGroup: ChartGroup;
    variableName: string;
    dataPoint: string;
    serverName: ServerName;
    tableName: string;
    productionSqlExpression: string;
    value: string | number;
    calculationType: CalculationType;
    lastUpdated: string;
    valueColumn: string;
    filterColumn?: string;
    filterValue?: string | number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing';

export interface ConnectionDetails {
    name: string;
    status: 'Connected' | 'Disconnected' | 'Error';
    responseTime?: number;
    version?: string;
    identifier?: string;
    size?: string;
    error?: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
    id: number;
    username: string;
    role: UserRole;
}
