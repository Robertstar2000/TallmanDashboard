import { testP21ConnectionServer, testPORConnectionServer } from './server';
import type { DatabaseConnection, ServerConfig } from './types';

export interface ConnectionStatus {
  isConnected: boolean;
  details?: any;
  error?: string;
  lastChecked: Date;
}

export async function checkAllConnections(): Promise<{ p21Status: ConnectionStatus; porStatus: ConnectionStatus }> {
  const now = new Date();

  let p21Status: ConnectionStatus = { isConnected: false, lastChecked: now };
  try {
    const result = await testP21ConnectionServer({} as DatabaseConnection);
    p21Status = {
      isConnected: result.success,
      details: undefined,
      error: result.success ? undefined : result.message,
      lastChecked: now,
    };
  } catch (err: any) {
    p21Status = {
      isConnected: false,
      details: undefined,
      error: err instanceof Error ? err.message : String(err),
      lastChecked: now,
    };
  }

  let porStatus: ConnectionStatus = { isConnected: false, lastChecked: now };
  try {
    const filePath = process.env.POR_DB_PATH!;
    const password = process.env.POR_DB_PASSWORD;
    const result = await testPORConnectionServer({ filePath, password } as DatabaseConnection);
    porStatus = {
      isConnected: result.success,
      details: undefined,
      error: result.success ? undefined : result.message,
      lastChecked: now,
    };
  } catch (err: any) {
    porStatus = {
      isConnected: false,
      details: undefined,
      error: err instanceof Error ? err.message : String(err),
      lastChecked: now,
    };
  }

  return { p21Status, porStatus };
}

// Export types and functions for client-side configuration management
export type { ServerConfig, DatabaseConnection } from './types';

export function saveServerConfig(serverType: 'P21' | 'POR', config: ServerConfig): void {
  try {
    localStorage.setItem(`${serverType.toLowerCase()}_config`, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save server config', err);
  }
}

export function getServerConfig(serverType: 'P21' | 'POR'): ServerConfig | null {
  try {
    const item = localStorage.getItem(`${serverType.toLowerCase()}_config`);
    return item ? (JSON.parse(item) as ServerConfig) : null;
  } catch (err) {
    console.error('Failed to get server config', err);
    return null;
  }
}
