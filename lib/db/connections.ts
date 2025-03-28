import { getMode } from '@/lib/state/dashboardState';
import path from 'path';
// Import fs conditionally for Next.js compatibility
const fs = typeof window === 'undefined' ? require('fs') : null;
import { getSqlServerClient } from './sqlserver';
import { AccessConnection, AccessConfig } from './access-connection';

// Import Database type only for type checking
import type { Database } from 'better-sqlite3';

export interface ServerConfig {
  server?: string;     // Server hostname or IP (optional for P21 when using DSN)
  database?: string;   // Database name (optional for P21 when using DSN)
  user?: string;       // Username (optional if using Windows auth)
  username?: string;   // Alternative username field
  password?: string;   // Password (optional for POR/MS Access)
  port?: number;       // Port (default 1433 for SQL Server)
  domain?: string;     // Domain for Windows authentication
  useWindowsAuth?: boolean; // Whether to use Windows Authentication
  type?: 'P21' | 'POR' | 'SQLServer'; // Server type
  dsn?: string;        // DSN name for ODBC connections
  options?: {
    trustServerCertificate?: boolean;
    encrypt?: boolean;
    driver?: string;   // ODBC driver name for SQL Server
  };
  // For MS Access
  filePath?: string;   // Path to MS Access file
}

// Type guard to check if password is required based on server type
export function requiresPassword(config: ServerConfig): config is ServerConfig & { password: string } {
  return config.type !== 'POR';
}

export interface DatabaseConfig {
  name: string;  // P21 or POR identifier
  dbPath: string;
  journalMode?: 'wal' | 'delete' | 'truncate';
  timeout?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
  details?: {
    server?: string;
    database?: string;
    user?: string;
    fileAccessible?: boolean;
    walModeEnabled?: boolean;
    foreignKeysEnabled?: boolean;
    tablesInitialized?: boolean;
  };
}

class DatabaseConnection {
  private db: Database | null = null;
  private config: DatabaseConfig;
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    details: {
      fileAccessible: false,
      walModeEnabled: false,
      foreignKeysEnabled: false,
      tablesInitialized: false
    }
  };

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Initialize SQLite database
      const Database = (await import('better-sqlite3')).default;
      this.db = new Database(this.config.dbPath, {
        timeout: this.config.timeout || 5000,
        verbose: console.log
      });

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Enable foreign key constraints
      this.db.pragma('foreign_keys = ON');

      const endTime = Date.now();

      // Verify database health
      const walMode = this.db.pragma('journal_mode');
      const foreignKeys = this.db.pragma('foreign_keys');
      const tables = this.db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();

      this.status = {
        isConnected: true,
        lastChecked: new Date(),
        details: {
          fileAccessible: true,
          walModeEnabled: walMode === 'wal',
          foreignKeysEnabled: foreignKeys === 1,
          tablesInitialized: tables.length > 0
        }
      };
    } catch (error) {
      this.status = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          fileAccessible: false,
          walModeEnabled: false,
          foreignKeysEnabled: false,
          tablesInitialized: false
        }
      };
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.status.isConnected = false;
      this.status.lastChecked = new Date();
    }
  }

  async checkConnection(): Promise<ConnectionStatus> {
    try {
      if (!this.db) {
        await this.connect();
      }
      
      // Check if DB is still responsive by running a simple query
      const result = this.db?.pragma('quick_check');
      
      this.status = {
        isConnected: !!result,
        lastChecked: new Date(),
        details: this.status.details
      };
      
      return this.status;
    } catch (error) {
      this.status = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: this.status.details
      };
      
      return this.status;
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      await this.connect();
    }
    
    try {
      // Execute the query
      const statement = this.db?.prepare(sql);
      let result: any;
      
      if (params.length > 0) {
        result = statement?.all(...params);
      } else {
        result = statement?.all();
      }
      
      return result as T[];
    } catch (error) {
      console.error(`Error executing query: ${sql}`, error);
      throw error;
    }
  }
}

// SQL Server connection for P21 and POR
class SqlServerConnection {
  private config: ServerConfig;
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    details: {
      server: '',
      database: '',
      user: ''
    }
  };
  private connectionId: string | null = null;

  constructor(config: ServerConfig) {
    this.config = config;
    this.status.details = {
      server: config.server,
      database: config.database,
      user: config.user
    };
  }

  async executeQuery(sql: string): Promise<number> {
    console.log(`Executing query on ${this.config.database}: ${sql}`);
    
    // Ensure we're connected
    if (!this.status.isConnected) {
      await this.connect();
    }
    
    try {
      // In a real implementation, this would use a SQL Server client library
      // For now, we'll use our SqlServerClient which communicates with the API
      const client = getSqlServerClient(this.config);
      return await client.executeQuery(sql);
    } catch (error) {
      console.error(`Error executing query on ${this.config.database}:`, error);
      
      // Update connection status on error
      this.status.isConnected = false;
      this.status.lastChecked = new Date();
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
      
      throw error;
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  async connect(): Promise<boolean> {
    if (this.config.type === 'P21' && this.config.dsn) {
      console.log(`Connecting to P21 using DSN: ${this.config.dsn}, database: ${this.config.database || 'P21Play'}`);
    } else {
      console.log(`Connecting to ${this.config.server}:${this.config.port || 1433} database ${this.config.database}`);
    }
    
    try {
      // Use our SqlServerClient to test the connection
      const client = getSqlServerClient(this.config);
      const status = await client.testConnection();
      
      // Update our status based on the client's status
      this.status = status;
      
      return this.status.isConnected;
    } catch (error) {
      this.status = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          server: this.config.server,
          database: this.config.database,
          user: this.config.user
        }
      };
      return false;
    }
  }

  async checkConnection(): Promise<ConnectionStatus> {
    try {
      if (!this.status.isConnected) {
        await this.connect();
      } else {
        // Use our SqlServerClient to test the connection
        const client = getSqlServerClient(this.config);
        this.status = await client.testConnection();
      }
      
      return this.status;
    } catch (error) {
      this.status = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: this.status.details
      };
      
      return this.status;
    }
  }
}

// Create singleton instances
let p21Connection: SqlServerConnection | null = null;
let porConnection: AccessConnection | null = null;
let sqliteConnection: DatabaseConnection | null = null;

function getDbPath(name: string): string {
  // Create a database file path in the data directory
  const dataDir = path.join(process.cwd(), 'data');
  
  // Only run fs operations on the server
  if (typeof window === 'undefined' && fs) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  return path.join(dataDir, `${name.toLowerCase()}.db`);
}

// Get or create a database connection
export async function getConnection(server: 'P21' | 'POR'): Promise<SqlServerConnection | AccessConnection> {
  try {
    console.log(`CONNECTIONS: Getting connection for ${server}`);
    
    // Get the server configuration
    const config = await getServerConfig(server);
    if (!config) {
      throw new Error(`No configuration found for ${server}`);
    }
    
    // Return the appropriate connection
    if (server === 'P21') {
      // Use SQL Server connection for P21
      if (!p21Connection) {
        console.log('CONNECTIONS: Creating new P21 connection');
        p21Connection = new SqlServerConnection(config);
        await p21Connection.connect();
      }
      return p21Connection;
    } else {
      // Use MS Access connection for POR
      if (!porConnection) {
        console.log('CONNECTIONS: Creating new POR connection');
        const accessConfig: AccessConfig = {
          filePath: config.filePath || 'C:\\Users\\BobM\\Desktop\\POR.MDB',
          type: 'POR'
        };
        porConnection = new AccessConnection(accessConfig);
        await porConnection.connect();
      }
      return porConnection;
    }
  } catch (error) {
    console.error(`CONNECTIONS: Error getting connection for ${server}:`, error);
    throw error;
  }
}

/**
 * Get the server configuration for the specified server
 */
export async function getServerConfig(server: 'P21' | 'POR'): Promise<ServerConfig | null> {
  try {
    console.log(`CONNECTIONS: Getting server configuration for ${server}`);
    
    // Server-side execution
    if (typeof window === 'undefined') {
      console.log(`CONNECTIONS: Server-side execution for ${server}`);
      
      // Try to get from environment variables
      const config = getServerConfigFromEnv(server);
      if (config) {
        console.log(`CONNECTIONS: Found ${server} configuration in environment variables`);
        return config;
      }
      
      // If not in environment variables, try to get from database
      try {
        // Import the database module dynamically to avoid issues
        const db = await import('./sqlite').then(module => module.getDb());
        
        const serverConfigRow = await db.get(
          'SELECT config FROM server_configs WHERE server = ?',
          [server]
        );
        
        if (serverConfigRow?.config) {
          try {
            const config = JSON.parse(serverConfigRow.config);
            console.log(`CONNECTIONS: Found ${server} configuration in database`);
            return config;
          } catch (parseError) {
            console.error(`CONNECTIONS: Error parsing ${server} configuration from database:`, parseError);
          }
        }
      } catch (dbError) {
        console.error(`CONNECTIONS: Error getting ${server} configuration from database:`, dbError);
      }
      
      console.log(`CONNECTIONS: No configuration found for ${server}`);
      return null;
    }
    
    // Client-side execution
    console.log(`CONNECTIONS: Client-side execution for ${server}`);
    
    // Try to get from localStorage
    const storedConfig = localStorage.getItem(`${server.toLowerCase()}_config`);
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        console.log(`CONNECTIONS: Found ${server} configuration in localStorage`);
        
        // Validate the configuration
        if (config && (
          (server === 'P21' && config.server && config.database && (config.user || config.useWindowsAuth)) ||
          (server === 'POR' && config.filePath)
        )) {
          return config;
        } else {
          console.error(`CONNECTIONS: Invalid ${server} configuration in localStorage:`, config);
        }
      } catch (parseError) {
        console.error(`CONNECTIONS: Error parsing ${server} configuration from localStorage:`, parseError);
      }
    }
    
    // If not in localStorage, try to get from API
    try {
      console.log(`CONNECTIONS: Fetching ${server} configuration from API`);
      const response = await fetch(`/api/getServerConfig?server=${server}`);
      if (response.ok) {
        const config = await response.json();
        if (config && (
          (server === 'P21' && config.server && config.database && (config.user || config.useWindowsAuth)) ||
          (server === 'POR' && config.filePath)
        )) {
          console.log(`CONNECTIONS: Successfully fetched ${server} configuration from API`);
          return config;
        } else {
          console.error(`CONNECTIONS: Invalid ${server} configuration from API:`, config);
        }
      } else {
        console.error(`CONNECTIONS: Error fetching ${server} configuration from API: ${response.statusText}`);
      }
    } catch (apiError) {
      console.error(`CONNECTIONS: Error fetching ${server} configuration from API:`, apiError);
    }
    
    console.log(`CONNECTIONS: No configuration found for ${server}`);
    return null;
  } catch (error) {
    console.error(`CONNECTIONS: Error getting server configuration for ${server}:`, error);
    return null;
  }
}

/**
 * Get server configuration from environment variables
 */
function getServerConfigFromEnv(server: 'P21' | 'POR'): ServerConfig | null {
  try {
    const prefix = server.toUpperCase();
    
    if (server === 'P21') {
      const serverHost = process.env[`${prefix}_SERVER`];
      const database = process.env[`${prefix}_DATABASE`];
      const user = process.env[`${prefix}_USER`];
      const password = process.env[`${prefix}_PASSWORD`];
      const portStr = process.env[`${prefix}_PORT`];
      const domain = process.env[`${prefix}_DOMAIN`];
      
      // Check if we have all required values
      if (!serverHost || !database || !password) {
        console.log(`CONNECTIONS: Missing required environment variables for ${server}`);
        return null;
      }
      
      // Parse port
      const port = portStr ? parseInt(portStr, 10) : 1433;
      
      // Get optional values
      const trustServerCertificate = process.env[`${prefix}_TRUST_SERVER_CERT`] === 'true';
      const encrypt = process.env[`${prefix}_ENCRYPT`] !== 'false';
      
      const config: ServerConfig = {
        server: serverHost,
        database,
        password,
        port,
        domain,
        options: {
          trustServerCertificate,
          encrypt
        }
      };
      
      console.log(`CONNECTIONS: Created ${server} configuration from environment variables`);
      return config;
    } else {
      // For POR, we need the file path
      const filePath = process.env[`${prefix}_FILE_PATH`];
      
      if (!filePath) {
        console.log(`CONNECTIONS: Missing required environment variables for ${server}`);
        return null;
      }
      
      const config: ServerConfig = {
        server: 'TS03',
        database: 'POR',
        password: '',
        filePath
      };
      
      console.log(`CONNECTIONS: Created ${server} configuration from environment variables`);
      return config;
    }
  } catch (error) {
    console.error(`CONNECTIONS: Error getting ${server} configuration from environment variables:`, error);
    return null;
  }
}

/**
 * Check all database connections
 */
export async function checkAllConnections(): Promise<{ 
  p21Status: { isConnected: boolean; error?: string }; 
  porStatus: { isConnected: boolean; error?: string }; 
}> {
  try {
    console.log('CONNECTIONS: Checking all database connections');
    
    const p21Status: { isConnected: boolean; error?: string } = {
      isConnected: false
    };
    
    const porStatus: { isConnected: boolean; error?: string } = {
      isConnected: false
    };
    
    // Check P21 connection
    try {
      const p21Config = await getServerConfig('P21');
      if (p21Config) {
        console.log('CONNECTIONS: Testing P21 connection');
        const { SqlServerClient } = await import('./sqlserver');
        const client = new SqlServerClient(p21Config);
        const status = await client.testConnection();
        p21Status.isConnected = status.isConnected;
        console.log(`CONNECTIONS: P21 connection status: ${status.isConnected ? 'Connected' : 'Disconnected'}`);
        if (!status.isConnected && status.error) {
          p21Status.error = status.error;
          console.error(`CONNECTIONS: P21 connection error: ${status.error}`);
        }
      } else {
        console.log('CONNECTIONS: No P21 configuration found');
        p21Status.error = 'No P21 configuration found';
      }
    } catch (p21Error) {
      console.error('CONNECTIONS: Error checking P21 connection:', p21Error);
      p21Status.error = p21Error instanceof Error ? p21Error.message : 'Unknown error';
    }
    
    // Check POR connection
    try {
      const porConfig = await getServerConfig('POR');
      if (porConfig) {
        console.log('CONNECTIONS: Testing POR connection');
        const accessConfig: AccessConfig = {
          filePath: porConfig.filePath || 'C:\\Users\\BobM\\Desktop\\POR.MDB',
          type: 'POR'
        };
        const client = new AccessConnection(accessConfig);
        const status = await client.testConnection();
        porStatus.isConnected = status.isConnected;
        console.log(`CONNECTIONS: POR connection status: ${status.isConnected ? 'Connected' : 'Disconnected'}`);
        if (!status.isConnected && status.error) {
          porStatus.error = status.error;
          console.error(`CONNECTIONS: POR connection error: ${status.error}`);
        }
      } else {
        console.log('CONNECTIONS: No POR configuration found');
        porStatus.error = 'No POR configuration found';
      }
    } catch (porError) {
      console.error('CONNECTIONS: Error checking POR connection:', porError);
      porStatus.error = porError instanceof Error ? porError.message : 'Unknown error';
    }
    
    return { p21Status, porStatus };
  } catch (error) {
    console.error('CONNECTIONS: Error checking all connections:', error);
    return { 
      p21Status: { isConnected: false, error: 'Failed to check connections' },
      porStatus: { isConnected: false, error: 'Failed to check connections' }
    };
  }
}

/**
 * Save server configuration to localStorage
 */
export function saveServerConfig(server: 'P21' | 'POR', config: ServerConfig): void {
  try {
    console.log(`CONNECTIONS: Saving ${server} configuration to localStorage`);
    localStorage.setItem(`${server.toLowerCase()}_config`, JSON.stringify(config));
    
    // Reset the connection so it will be recreated with the new config
    if (server === 'P21') {
      p21Connection = null;
    } else {
      porConnection = null;
    }
  } catch (error) {
    console.error(`CONNECTIONS: Error saving ${server} configuration to localStorage:`, error);
  }
}
