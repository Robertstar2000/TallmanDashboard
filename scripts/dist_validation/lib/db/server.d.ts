import { ChartDataRow, ServerConfig, DatabaseConnection } from './types';
export declare const getAllChartData: () => ChartDataRow[];
export declare const getAllSpreadsheetData: () => ChartDataRow[];
export declare const updateChartDataValue: (rowId: string, value: number) => boolean;
export declare const updateChartDataRow: (rowId: string, data: Partial<Omit<ChartDataRow, "id" | "rowId" | "lastUpdated">>) => boolean;
export declare const replaceAllChartData: (data: Omit<ChartDataRow, "id" | "lastUpdated">[]) => boolean;
export declare function updateSpreadsheetData(data: ChartDataRow[]): void;
/**
 * Tests the connection to a P21 database using provided connection details.
 */
export declare const testP21ConnectionServer: (connectionDetails: DatabaseConnection) => Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Tests the connection to a POR database (MS Access) using provided file path.
 */
export declare const testPORConnectionServer: (connectionDetails: DatabaseConnection) => Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Retrieves all rows from the admin_variables table, mapped to ServerConfig type.
 */
export declare const getAdminVariables: () => ServerConfig[];
/**
 * Updates a specific row in the admin_variables table.
 */
export declare const updateAdminVariable: (id: string, data: Partial<Omit<ServerConfig, "id" | "lastUpdated">>) => boolean;
export declare const ensureTypesFile: () => void;
interface QueryExecResult {
    success: boolean;
    data?: any[];
    columns?: string[];
    error?: string;
    message?: string;
    executionTime?: number;
}
/**
 * Executes a read-only SQL query against the P21 database using the configured DSN.
 */
export declare const executeP21QueryServer: (sqlQuery: string) => Promise<QueryExecResult>;
/**
 * Executes a read-only SQL query against the POR database (MS Access) using file path.
 */
export declare const executePORQueryServer: (filePath: string, password: string | undefined, sqlQuery: string) => Promise<QueryExecResult>;
export {};
