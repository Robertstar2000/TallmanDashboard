// This file is deprecated. All database functionality has been moved to server.ts
// Please use server.ts for all database operations

import BetterSQLite3 from 'better-sqlite3';
import { kv } from '@vercel/kv';
import path from 'path';

interface ConnectionConfig {
  dbPath: string;
}

let p21Pool: BetterSQLite3.Database | null = null;
let porPool: BetterSQLite3.Database | null = null;

async function getConnectionConfig(serverType: 'P21' | 'POR'): Promise<ConnectionConfig | null> {
  try {
    // In this version, we'll use local SQLite databases for both P21 and POR
    const dbName = serverType === 'P21' ? 'p21_test.db' : 'por_test.db';
    return { 
      dbPath: path.join(process.cwd(), 'data', dbName) 
    };
  } catch (error) {
    console.error(`Error getting ${serverType} config:`, error);
    return null;
  }
}

export async function executeP21Query(query: string): Promise<{ value?: number; error?: string }> {
  try {
    // In test mode or if no connection config, return mock data
    const config = await getConnectionConfig('P21');
    if (!config) {
      // Generate realistic mock data based on query type
      if (query.toLowerCase().includes('count(*)')) {
        return { value: Math.floor(Math.random() * 1000) };
      } else if (query.toLowerCase().includes('sum(')) {
        return { value: Math.floor(Math.random() * 1000000) };
      } else if (query.toLowerCase().includes('avg(')) {
        return { value: Math.floor(Math.random() * 1000) };
      } else {
        return { value: Math.floor(Math.random() * 100) };
      }
    }

    if (!p21Pool) {
      await connectToP21();
    }

    if (!p21Pool) {
      throw new Error('Could not establish P21 connection');
    }

    const result = p21Pool.prepare(query).all();
    const value = result.length > 0 ? result[0] : null;
    return { value: value as number };
  } catch (error) {
    console.error('Error executing P21 query:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function executePORQuery(query: string): Promise<{ value?: number; error?: string }> {
  try {
    // In test mode or if no connection config, return mock data
    const config = await getConnectionConfig('POR');
    if (!config) {
      // Generate realistic mock data based on query type
      if (query.toLowerCase().includes('count(*)')) {
        return { value: Math.floor(Math.random() * 1000) };
      } else if (query.toLowerCase().includes('sum(')) {
        return { value: Math.floor(Math.random() * 1000000) };
      } else if (query.toLowerCase().includes('avg(')) {
        return { value: Math.floor(Math.random() * 1000) };
      } else {
        return { value: Math.floor(Math.random() * 100) };
      }
    }

    if (!porPool) {
      await connectToPOR();
    }

    if (!porPool) {
      throw new Error('Could not establish POR connection');
    }

    const result = porPool.prepare(query).all();
    const value = result.length > 0 ? result[0] : null;
    return { value: value as number };
  } catch (error) {
    console.error('Error executing POR query:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function connectToP21(): Promise<boolean> {
  try {
    const config = await getConnectionConfig('P21');
    if (!config) {
      console.warn('No P21 connection config found, using test mode');
      return false;
    }

    if (p21Pool) {
      return true;
    }

    p21Pool = new BetterSQLite3(config.dbPath);
    return true;
  } catch (error) {
    console.error('Error connecting to P21:', error);
    return false;
  }
}

export async function connectToPOR(): Promise<boolean> {
  try {
    const config = await getConnectionConfig('POR');
    if (!config) {
      console.warn('No POR connection config found, using test mode');
      return false;
    }

    if (porPool) {
      return true;
    }

    porPool = new BetterSQLite3(config.dbPath);
    return true;
  } catch (error) {
    console.error('Error connecting to POR:', error);
    return false;
  }
}

export async function closeConnections(): Promise<void> {
  try {
    if (p21Pool) {
      p21Pool.close();
    }
    if (porPool) {
      porPool.close();
    }
  } catch (error) {
    console.error('Error closing connections:', error);
  }
}

export async function checkConnections(): Promise<{ p21Connected: boolean; porConnected: boolean }> {
  return {
    p21Connected: !!p21Pool,
    porConnected: !!porPool
  };
}
