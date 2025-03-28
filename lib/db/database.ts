// This file is deprecated. All database functionality has been moved to server.ts
// Please use server.ts for all database operations

import BetterSQLite3 from 'better-sqlite3';
import { kv } from '@vercel/kv';

interface DatabaseConfig {
  path: string;
}

interface ConnectionPool {
  p21Pool: BetterSQLite3.Database | null;
  porPool: BetterSQLite3.Database | null;
}

let pools: ConnectionPool = {
  p21Pool: null,
  porPool: null
};

// Helper to ensure we're on the server
function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations can only be performed on the server');
  }
}

async function getConfig(type: 'p21' | 'por'): Promise<DatabaseConfig | null> {
  try {
    const config = await kv.get(`db_config_${type}`);
    return config as DatabaseConfig;
  } catch (error) {
    console.error(`Failed to get ${type} database config:`, error);
    return null;
  }
}

async function getPool(type: 'p21' | 'por'): Promise<BetterSQLite3.Database> {
  assertServer();

  const poolKey = `${type}Pool` as keyof ConnectionPool;
  if (pools[poolKey]) {
    return pools[poolKey]!;
  }

  const config = await getConfig(type);
  if (!config) {
    throw new Error(`No configuration found for ${type} database`);
  }

  try {
    const pool = new BetterSQLite3(config.path);
    pools[poolKey] = pool;
    return pool;
  } catch (error) {
    console.error(`Failed to connect to ${type} database:`, error);
    throw error;
  }
}

export async function checkDatabaseHealth(type: 'p21' | 'por'): Promise<boolean> {
  try {
    const pool = await getPool(type);
    const result = await pool.prepare('SELECT 1 as test').get();
    return result !== undefined;
  } catch (error) {
    console.error(`Database health check failed for ${type}:`, error);
    return false;
  }
}

export async function executeQuery(type: 'p21' | 'por', query: string, params: any[] = []): Promise<any> {
  try {
    const pool = await getPool(type);
    const statement = await pool.prepare(query);
    const result = await statement.run(params);
    return result;
  } catch (error) {
    console.error(`Query execution failed for ${type}:`, error);
    throw error;
  }
}

export async function executeQueryAll(type: 'p21' | 'por', query: string, params: any[] = []): Promise<any[]> {
  try {
    const pool = await getPool(type);
    const statement = await pool.prepare(query);
    const result = await statement.all(params);
    return result;
  } catch (error) {
    console.error(`Query execution failed for ${type}:`, error);
    throw error;
  }
}

export async function testConnection(config: DatabaseConfig): Promise<boolean> {
  try {
    const pool = new BetterSQLite3(config.path);
    await pool.prepare('SELECT 1 as test').get();
    await pool.close();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export async function saveConnection(type: 'p21' | 'por', config: DatabaseConfig): Promise<void> {
  try {
    // Test the connection first
    const isValid = await testConnection(config);
    if (!isValid) {
      throw new Error('Connection test failed');
    }

    // Save the config
    await kv.set(`db_config_${type}`, config);

    // Close existing pool if it exists
    const poolKey = `${type}Pool` as keyof ConnectionPool;
    if (pools[poolKey]) {
      await pools[poolKey]!.close();
      pools[poolKey] = null;
    }
  } catch (error) {
    console.error(`Failed to save ${type} connection:`, error);
    throw error;
  }
}

export async function closeConnections(): Promise<void> {
  try {
    if (pools.p21Pool) {
      await pools.p21Pool.close();
      pools.p21Pool = null;
    }
    if (pools.porPool) {
      await pools.porPool.close();
      pools.porPool = null;
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}
