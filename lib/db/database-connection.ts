'use client';

import { DatabaseConnections, DatabaseConnectionState, AdminVariable } from '@/lib/types/dashboard';
import { useState } from 'react';

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private p21Pool: any = null;
  private porPool: any = null;
  private connectionState: DatabaseConnectionState = {
    isConnected: false,
    p21Connected: false,
    porConnected: false
  };

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(connections: DatabaseConnections): Promise<DatabaseConnectionState> {
    try {
      if (connections.p21Connection) {
        // Connect to P21
        this.p21Pool = connections.p21Connection;
        this.connectionState.p21Connected = true;
      }

      if (connections.porConnection) {
        // Connect to POR
        this.porPool = connections.porConnection;
        this.connectionState.porConnected = true;
      }

      // Overall connection state is true if either database is connected
      this.connectionState.isConnected = this.connectionState.p21Connected || this.connectionState.porConnected;
      
      return { ...this.connectionState };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database connection error';
      this.connectionState = {
        isConnected: false,
        p21Connected: false,
        porConnected: false,
        lastError: errorMessage
      };
      throw new DatabaseError(errorMessage);
    }
  }

  public async disconnect(): Promise<void> {
    // Clean up connections
    this.p21Pool = null;
    this.porPool = null;
    this.connectionState = {
      isConnected: false,
      p21Connected: false,
      porConnected: false
    };
  }

  public async executeQuery(sqlExpression: string, dictionary: string): Promise<string> {
    // Check if we have the required connection for this dictionary
    const isP21Dictionary = dictionary.toLowerCase().includes('p21');
    const isPORDictionary = dictionary.toLowerCase().includes('por');

    if (isP21Dictionary && !this.connectionState.p21Connected) {
      throw new DatabaseError('P21 database not connected');
    }

    if (isPORDictionary && !this.connectionState.porConnected) {
      throw new DatabaseError('POR database not connected');
    }

    try {
      // In real implementation, you would:
      // 1. Use the appropriate connection pool based on the dictionary
      // 2. Execute the query on that database
      // 3. Return the result
      
      // Mock implementation for demonstration
      return Math.floor(Math.random() * 1000).toString();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown query execution error';
      throw new DatabaseError(errorMessage);
    }
  }

  public getConnectionState(): DatabaseConnectionState {
    return { ...this.connectionState };
  }
}

export function useDatabase() {
  const [connectionState, setConnectionState] = useState<DatabaseConnectionState>({
    isConnected: false,
    p21Connected: false,
    porConnected: false
  });

  const connect = async (connections: DatabaseConnections) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const newState = await dbManager.connect(connections);
      setConnectionState(newState);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionState({
        isConnected: false,
        p21Connected: false,
        porConnected: false,
        lastError: errorMessage
      });
      throw new DatabaseError(errorMessage);
    }
  };

  const disconnect = async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.disconnect();
    setConnectionState({
      isConnected: false,
      p21Connected: false,
      porConnected: false
    });
  };

  const executeQueries = async (adminData: AdminVariable[]): Promise<AdminVariable[]> => {
    const dbManager = DatabaseManager.getInstance();
    
    if (!connectionState.isConnected) {
      throw new DatabaseError('Database not connected');
    }

    return Promise.all(
      adminData.map(async (item) => {
        try {
          const sqlExpressions = item.sqlExpression.split('-- Second Query ------------------------------------------');
          const primaryValue = await dbManager.executeQuery(sqlExpressions[0].trim(), item.p21DataDictionary);
          let secondaryValue = undefined;
          
          if (sqlExpressions.length > 1) {
            secondaryValue = await dbManager.executeQuery(sqlExpressions[1].trim(), item.p21DataDictionary);
          }

          return {
            ...item,
            extractedValue: primaryValue,
            secondaryValue: secondaryValue,
            updateTime: new Date().toISOString(),
            connectionState: dbManager.getConnectionState()
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown query execution error';
          return {
            ...item,
            connectionState: {
              ...dbManager.getConnectionState(),
              lastError: errorMessage
            }
          };
        }
      })
    );
  };

  return {
    connectionState,
    connect,
    disconnect,
    executeQueries
  };
}
