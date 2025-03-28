import { ConnectionStatus } from './connections';

export interface AccessConfig {
  filePath: string;
  type?: 'POR';
}

/**
 * MS Access connection class for POR database
 */
export class AccessConnection {
  private config: AccessConfig;
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    details: {
      server: 'TS03',
      database: 'POR',
      fileAccessible: false
    }
  };
  private connectionId: string | null = null;

  constructor(config: AccessConfig) {
    this.config = config;
    this.status.details = {
      server: 'TS03',
      database: 'POR',
      fileAccessible: false
    };
  }

  /**
   * Execute a query against the MS Access database
   */
  async executeQuery(sql: string): Promise<any> {
    try {
      // We'll use ODBC to connect to Access database
      // This is a server-side operation that will be implemented in the API
      const response = await fetch('/api/executeAccessQuery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: this.config.filePath,
          sql
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute query: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing Access query:', error);
      throw error;
    }
  }

  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Connect to the MS Access database
   */
  async connect(): Promise<boolean> {
    try {
      const status = await this.checkConnection();
      this.status = status;
      return status.isConnected;
    } catch (error) {
      console.error('Error connecting to Access database:', error);
      this.status.isConnected = false;
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Check the connection to the MS Access database
   */
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      // We'll check if we can access the file
      const response = await fetch('/api/testAccessConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: this.config.filePath
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to test connection: ${errorText}`);
      }

      const result = await response.json();
      
      this.status = {
        isConnected: result.isConnected,
        lastChecked: new Date(),
        error: result.error,
        details: {
          server: 'TS03',
          database: 'POR',
          fileAccessible: result.isConnected
        }
      };

      return this.status;
    } catch (error) {
      console.error('Error checking Access connection:', error);
      return {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          server: 'TS03',
          database: 'POR',
          fileAccessible: false
        }
      };
    }
  }

  /**
   * Test the connection to the MS Access database
   */
  async testConnection(): Promise<ConnectionStatus> {
    return this.checkConnection();
  }
}
