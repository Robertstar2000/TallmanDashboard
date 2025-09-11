// Minimal server.ts to test if database initialization is causing issues
import { ChartDataRow, ServerConfig, DatabaseConnection } from './types';

// Stub functions to prevent import errors
export function getAllChartData(): ChartDataRow[] {
  return [];
}

export function getAllSpreadsheetData(): ChartDataRow[] {
  return [];
}

export function updateChartDataValue(rowId: string, value: number): boolean {
  return true;
}

export function updateChartDataRow(rowId: string, data: Partial<Omit<ChartDataRow, 'id' | 'rowId' | 'lastUpdated'>>): boolean {
  return true;
}

export function replaceAllChartData(data: Omit<ChartDataRow, 'id' | 'lastUpdated'>[]): boolean {
  return true;
}

export function updateSpreadsheetData(data: ChartDataRow[]) {
  // Stub implementation
}

export async function testP21ConnectionServer(connectionDetails: DatabaseConnection): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Database testing disabled in minimal mode' };
}

export async function testSQLiteConnectionServer(): Promise<{ success: boolean; message: string; path?: string }> {
  return { success: false, message: 'Database testing disabled in minimal mode' };
}

export async function testPORConnectionServer(connectionDetails: DatabaseConnection): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Database testing disabled in minimal mode' };
}

export async function executeP21QueryServer(sqlQuery: string): Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string; message?: string; executionTime?: number }> {
  return { success: false, message: 'Query execution disabled in minimal mode' };
}

export async function executePORQueryServer(filePath: string, password: string | undefined, sqlQuery: string): Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string; message?: string; executionTime?: number }> {
  return { success: false, message: 'Query execution disabled in minimal mode' };
}

export function getAdminVariables(): ServerConfig[] {
  return [];
}

export function updateAdminVariable(id: string, data: Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>>): boolean {
  return true;
}

export function getDb() {
  return null;
}
