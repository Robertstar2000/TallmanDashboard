var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sql from 'mssql';
// Connection pool cache
const connectionPools = {};
// Connection status cache
const connectionStatus = {};
/**
 * Manages real database connections to P21play and POR
 */
export class RealConnectionManager {
    /**
     * Tests a connection to a SQL Server database
     * @param config Server configuration
     * @returns Result of the connection test
     */
    static testConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create connection configuration
                const sqlConfig = this.createSqlConfig(config);
                // Create a new connection pool
                const pool = new sql.ConnectionPool(sqlConfig);
                // Attempt to connect
                yield pool.connect();
                // Test a simple query
                const result = yield pool.request().query('SELECT @@VERSION as version');
                // Close the connection
                yield pool.close();
                return {
                    success: true,
                    message: `Successfully connected to ${config.server}. SQL Server version: ${result.recordset[0].version.split('\n')[0]}`
                };
            }
            catch (error) {
                console.error('Connection test failed:', error);
                return {
                    success: false,
                    message: `Connection failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Gets or creates a connection pool for a server
     * @param config Server configuration
     * @returns SQL connection pool
     */
    static getConnectionPool(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionId = `${config.server}_${config.database}`;
            // Return existing connection if available
            if (connectionPools[connectionId] && connectionStatus[connectionId]) {
                return connectionPools[connectionId];
            }
            // Create connection configuration
            const sqlConfig = this.createSqlConfig(config);
            try {
                // Create a new connection pool
                const pool = new sql.ConnectionPool(sqlConfig);
                // Connect to the database
                yield pool.connect();
                // Store the connection pool
                connectionPools[connectionId] = pool;
                connectionStatus[connectionId] = true;
                // Add event listeners
                pool.on('error', (err) => {
                    console.error(`Connection pool error for ${connectionId}:`, err);
                    connectionStatus[connectionId] = false;
                });
                return pool;
            }
            catch (error) {
                console.error(`Failed to create connection pool for ${connectionId}:`, error);
                connectionStatus[connectionId] = false;
                throw new Error(`Failed to connect to ${config.server}: ${error.message}`);
            }
        });
    }
    /**
     * Creates a SQL Server configuration object from ServerConfig
     * @param config Server configuration
     * @returns SQL Server configuration
     */
    static createSqlConfig(config) {
        // Create base configuration
        const sqlConfig = {
            server: config.server,
            database: config.database,
            options: {
                trustServerCertificate: true,
                encrypt: false,
                enableArithAbort: true,
                connectTimeout: 30000,
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        // Add authentication details
        if (config.useWindowsAuth) {
            sqlConfig.options.trustedConnection = true;
        }
        else {
            sqlConfig.user = config.username || config.user;
            sqlConfig.password = config.password;
        }
        // Add port if specified
        if (config.port) {
            sqlConfig.port = typeof config.port === 'string' ? parseInt(config.port) : config.port;
        }
        return sqlConfig;
    }
    /**
     * Executes a SQL query on a server
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    static executeQuery(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield this.getConnectionPool(config);
                const result = yield pool.request().query(query);
                return result.recordset;
            }
            catch (error) {
                console.error('Query execution failed:', error);
                throw new Error(`Query execution failed: ${error.message}`);
            }
        });
    }
    /**
     * Closes all active connections
     */
    static closeAllConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionIds = Object.keys(connectionPools);
            for (const id of connectionIds) {
                try {
                    yield connectionPools[id].close();
                    console.log(`Closed connection: ${id}`);
                }
                catch (error) {
                    console.error(`Error closing connection ${id}:`, error);
                }
            }
            // Clear the connection caches
            Object.keys(connectionPools).forEach(key => delete connectionPools[key]);
            Object.keys(connectionStatus).forEach(key => delete connectionStatus[key]);
        });
    }
    /**
     * Closes a specific connection
     * @param config Server configuration
     */
    static closeConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionId = `${config.server}_${config.database}`;
            if (connectionPools[connectionId]) {
                try {
                    yield connectionPools[connectionId].close();
                    delete connectionPools[connectionId];
                    delete connectionStatus[connectionId];
                    console.log(`Closed connection: ${connectionId}`);
                }
                catch (error) {
                    console.error(`Error closing connection ${connectionId}:`, error);
                }
            }
        });
    }
}
