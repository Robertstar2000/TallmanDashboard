var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as sql from 'mssql';
// Import ODBC dynamically to prevent webpack from trying to process it during build
// This prevents the error with Find-VisualStudio.cs
// Use Maps instead of objects with string keys for better type safety
const connectionPools = new Map();
const porReaders = new Map();
const odbcConnections = new Map();
const sqlPools = new Map();
/**
 * Manages database connections to P21 and POR servers
 */
export class ConnectionManager {
    /**
     * Get the singleton instance of ConnectionManager
     * @returns The ConnectionManager instance
     */
    static getInstance() {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }
    /**
     * Tests a connection to a database
     * @param serverType Type of server (P21, POR, etc.)
     * @param config Server configuration
     * @returns Result of the connection test
     */
    static testConnection(serverType, config) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Testing connection to ${serverType} server`);
            try {
                if (serverType === 'P21') {
                    // Extract P21 connection details from config
                    const p21Config = {
                        dsn: config.dsn || process.env.P21_DSN || 'P21Play',
                        username: config.username || process.env.P21_USERNAME || '',
                        password: config.password || process.env.P21_PASSWORD || '',
                        database: config.database || process.env.P21_DATABASE || 'P21Play',
                        server: config.server || process.env.P21_SERVER || 'SQL01',
                        domain: config.domain || process.env.P21_DOMAIN || 'Tallman.com'
                    };
                    console.log('Testing P21 connection with config:', Object.assign(Object.assign({}, p21Config), { password: p21Config.password ? '***' : undefined }));
                    return yield this.testP21Connection(p21Config);
                }
                else if (serverType === 'POR') {
                    if (!config.filePath) {
                        return { success: false, message: 'File path is required for POR connections' };
                    }
                    return yield this.testAccessConnection(config);
                }
                else {
                    return { success: false, message: `Unsupported server type: ${serverType}` };
                }
            }
            catch (error) {
                console.error(`Error testing ${serverType} connection:`, error);
                return { success: false, message: `Connection test failed: ${error.message}` };
            }
        });
    }
    /**
     * Tests a connection to MS Access database
     * @param config Server configuration
     * @returns Result of the connection test
     */
    static testAccessConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!config.filePath) {
                    return { success: false, message: 'File path is required for POR connection' };
                }
                // Test the connection by executing a simple query
                const result = yield this.executeAccessQuery(config, 'SELECT TOP 1 * FROM MSysObjects');
                return {
                    success: true,
                    message: `Successfully connected to POR database at ${config.filePath}`
                };
            }
            catch (error) {
                console.error('POR connection test failed:', error);
                return {
                    success: false,
                    message: `POR connection failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Tests a P21 connection using ODBC DSN
     * @param config Server configuration
     * @returns Test result with success flag and message
     */
    static testP21Connection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use the DSN from config or default to P21Play
            const dsn = config.dsn || 'P21Play';
            console.log('Testing P21 connection with ODBC DSN:', dsn);
            try {
                // Use the ODBC driver for P21 connections
                const odbc = require('odbc');
                // Connect using the DSN that's already configured in Windows
                const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
                console.log('ODBC connection string:', connectionString);
                console.log('Connecting to ODBC data source...');
                const connection = yield odbc.connect(connectionString);
                console.log('Connected successfully to ODBC data source!');
                // Execute a simple test query
                console.log('Executing test query...');
                const result = yield connection.query('SELECT 1 AS TestValue');
                console.log('Test query executed successfully, result:', result);
                // Close the connection
                yield connection.close();
                return {
                    success: true,
                    message: `Successfully connected to P21 database using ODBC DSN: ${dsn}`
                };
            }
            catch (error) {
                console.error('P21 ODBC connection test failed:', error);
                return {
                    success: false,
                    message: `Failed to connect to P21 database: ${error.message}`
                };
            }
        });
    }
    /**
     * Tests a connection to SQL Server
     * @param config Server configuration
     * @returns Result of the connection test
     */
    static testSqlServerConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create SQL Server configuration
                const sqlConfig = {
                    server: config.server || '',
                    database: config.database || '',
                    user: config.username || config.user,
                    password: config.password,
                    options: {
                        trustServerCertificate: true,
                        encrypt: false
                    }
                };
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
                    message: `Successfully connected to ${config.database} on ${config.server}`
                };
            }
            catch (error) {
                console.error('SQL Server connection test failed:', error);
                return {
                    success: false,
                    message: `SQL Server connection failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Gets a POR direct reader for executing queries against the POR database
     * @param config Server configuration
     * @returns POR direct reader
     */
    static getPORDirectReader(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!config.filePath) {
                    throw new Error('File path is required for POR database');
                }
                // Check if the file exists
                const fs = require('fs');
                if (!fs.existsSync(config.filePath)) {
                    throw new Error(`POR database file not found at path: ${config.filePath}`);
                }
                // Use the PORDirectReader class directly instead of making a fetch request
                // This is critical for server-side code where fetch to relative URLs doesn't work
                const { PORDirectReader } = require('./por-direct-reader');
                const reader = new PORDirectReader(config.filePath);
                // Connect to the database
                const connectionResult = yield reader.connect();
                if (!connectionResult.success) {
                    throw new Error(`Failed to connect to POR database: ${connectionResult.message}`);
                }
                return reader;
            }
            catch (error) {
                console.error('Error getting POR direct reader:', error);
                throw error;
            }
        });
    }
    /**
     * Execute a query on the Access database using the POR direct reader
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    static executeAccessQuery(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!config.filePath) {
                    throw new Error('File path is required for Access database queries');
                }
                console.log(`Executing Access query with file path: ${config.filePath}`);
                console.log(`Query: ${query}`);
                const reader = yield this.getPORDirectReader(config);
                const result = yield reader.executeQuery(query);
                console.log('Access query execution successful:', result);
                return result;
            }
            catch (error) {
                console.error('Access query execution failed:', error);
                throw new Error(`Access query execution failed: ${error.message}`);
            }
        });
    }
    /**
     * Executes a query against the POR database
     * @param query SQL query to execute
     * @param porFilePath Optional path to the POR database file
     * @returns Query results
     */
    static executePORQuery(query, porFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create a POR server config
                const config = {
                    type: 'POR',
                    filePath: porFilePath || process.env.POR_FILE_PATH || 'C:\\POR\\PORENT.mdb'
                };
                // Get or create a connection to the POR database
                const reader = yield this.getConnection(config);
                // Execute the query
                const result = yield reader.executeQuery(query);
                return result;
            }
            catch (error) {
                console.error('Error executing POR query:', error);
                throw new Error(`Failed to execute POR query: ${error.message}`);
            }
        });
    }
    /**
     * Gets a connection to the specified server
     * @param config Server configuration
     * @returns Database connection
     */
    static getConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionKey = this.getConnectionKey(config);
            // For SQL Server connections (including P21 when using direct connection)
            if (((config.type === 'SQLServer') || (config.type === 'P21')) && config.server) {
                // Use type assertion to tell TypeScript that connectionKey is a valid key
                if (sqlPools.has(connectionKey)) {
                    return sqlPools.get(connectionKey);
                }
                else {
                    const sqlConfig = {
                        user: config.username || '',
                        password: config.password,
                        server: config.server,
                        database: config.database || '',
                        options: {
                            encrypt: false,
                            trustServerCertificate: true,
                            enableArithAbort: true
                        }
                    };
                    console.log(`Creating new SQL Server connection pool for ${config.server}`);
                    const pool = new sql.ConnectionPool(sqlConfig);
                    yield pool.connect();
                    sqlPools.set(connectionKey, pool);
                    return pool;
                }
            }
            // Handle MS Access connections (both POR and explicit Access type)
            if (config.type === 'POR') {
                // Ensure filePath is provided
                if (!config.filePath) {
                    throw new Error('File path is required for POR connections');
                }
                // Use type assertion to tell TypeScript that connectionKey is a valid key
                if (porReaders.has(connectionKey)) {
                    return porReaders.get(connectionKey);
                }
                else {
                    const reader = yield this.getPORDirectReader(config);
                    porReaders.set(connectionKey, reader);
                    return reader;
                }
            }
            // For P21, use ODBC DSN connection
            if (config.type === 'P21') {
                // First try direct SQL Server connection if server is provided
                if (config.server) {
                    try {
                        // Create a new connection pool
                        const sqlConfig = {
                            user: config.username || '',
                            password: config.password,
                            server: config.server,
                            database: config.database || 'P21',
                            options: {
                                encrypt: false,
                                trustServerCertificate: true,
                                enableArithAbort: true
                            }
                        };
                        console.log(`Attempting to connect to P21 with SQL Server connection: ${config.server}`);
                        // Create or reuse SQL Server connection pool
                        if (sqlPools.has(connectionKey)) {
                            console.log('Using existing P21 SQL Server connection pool');
                            return sqlPools.get(connectionKey);
                        }
                        else {
                            console.log('Creating new P21 SQL Server connection pool');
                            const pool = new sql.ConnectionPool(sqlConfig);
                            yield pool.connect();
                            sqlPools.set(connectionKey, pool);
                            console.log('P21 SQL Server connection established successfully');
                            return pool;
                        }
                    }
                    catch (sqlError) {
                        console.error('SQL Server connection failed, falling back to ODBC:', sqlError);
                        // Fall through to ODBC connection
                    }
                }
                let odbc;
                try {
                    // Dynamically import ODBC to prevent webpack issues
                    odbc = yield import('odbc');
                }
                catch (odbcError) {
                    console.error('Failed to load ODBC module:', odbcError);
                    throw new Error('Failed to load ODBC driver. This is a server-side feature and may not be available in development mode.');
                }
                // Use Windows Authentication with the DSN
                const dsn = config.dsn || 'P21Play';
                let connectionString = `DSN=${dsn};Trusted_Connection=Yes;Database=P21;`;
                console.log(`Attempting to connect to P21 with connection string: ${connectionString}`);
                // Create or reuse ODBC connection
                if (odbcConnections.has(connectionString)) {
                    console.log('Using existing P21 ODBC connection');
                    return odbcConnections.get(connectionString);
                }
                else {
                    try {
                        console.log('Creating new P21 ODBC connection');
                        const connection = yield odbc.connect(connectionString);
                        odbcConnections.set(connectionString, connection);
                        console.log('P21 ODBC connection established successfully');
                        return connection;
                    }
                    catch (error) {
                        console.error('Error connecting to P21 database:', error);
                        throw new Error(`Failed to connect to P21 database: ${error.message}`);
                    }
                }
            }
            // For any other type (including SQLite), throw an error
            throw new Error(`Unsupported server type: ${config.type}`);
        });
    }
    /**
     * Helper method to generate a consistent connection key
     * @param config Server configuration
     * @returns Connection key string
     */
    static getConnectionKey(config) {
        if (config.type === 'P21') {
            return 'P21';
        }
        else if (config.type === 'POR') {
            return `POR_${config.filePath}`;
        }
        else {
            return `${config.type}_${config.server || ''}_${config.database || ''}`;
        }
    }
    /**
     * Closes all active connections
     */
    static closeAllConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Close all SQL Server connection pools
                for (const [key, pool] of connectionPools) {
                    try {
                        yield pool.close();
                        console.log(`Closed connection: ${key}`);
                    }
                    catch (error) {
                        console.error(`Error closing connection ${key}:`, error);
                    }
                }
                // Close all POR direct readers
                for (const [key, reader] of porReaders) {
                    try {
                        yield reader.disconnect();
                        console.log(`Closed POR reader: ${key}`);
                    }
                    catch (error) {
                        console.error(`Error closing POR reader ${key}:`, error);
                    }
                }
                // Close all ODBC connections
                for (const [key, connection] of odbcConnections) {
                    try {
                        yield connection.close();
                        console.log(`Closed ODBC connection: ${key}`);
                    }
                    catch (error) {
                        console.error(`Error closing ODBC connection ${key}:`, error);
                    }
                }
                // Clear the connection pools and readers
                connectionPools.clear();
                porReaders.clear();
                odbcConnections.clear();
                console.log('All connections closed');
            }
            catch (error) {
                console.error('Error closing connections:', error);
            }
        });
    }
    static createPorConnectionPool(config) {
        // Create a new connection pool for MS Access
        const pool = new sql.ConnectionPool({
            server: 'localhost',
            database: config.filePath,
            user: '',
            password: '',
            options: {
                trustServerCertificate: true,
                encrypt: false
            }
        });
        // Connect to the database
        return pool.connect();
    }
    /**
     * Executes a query against the P21 database
     * @param query SQL query to execute
     * @returns Query results
     */
    static executeP21Query(query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Executing P21 query:', query);
            let connection; // Define connection variable outside try block for wider scope
            try {
                // Use the DSN from environment or default to P21Play
                const dsn = process.env.P21_DSN || 'P21Play';
                console.log(`Using P21 DSN: ${dsn}`); // Log the DSN being used
                // Dynamically import ODBC to prevent webpack issues
                const odbc = require('odbc');
                // Connect using the DSN that's already configured in Windows
                // Using Trusted_Connection=Yes relies on Windows Authentication
                const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
                console.log('Attempting P21 ODBC connection with string:', connectionString);
                connection = yield odbc.connect(connectionString);
                console.log('Connected successfully to P21 ODBC data source!');
                // Execute the query
                console.log('Executing query on P21:', query);
                try {
                    const result = yield connection.query(query);
                    console.log('P21 query executed successfully.');
                    // Log the result structure for debugging if needed (can be verbose)
                    // console.debug('P21 query raw result:', JSON.stringify(result));
                    if (result && result.length > 0) {
                        console.log(`P21 query returned ${result.length} rows. First row:`, result[0]);
                    }
                    else {
                        console.log('P21 query returned no rows.');
                    }
                    // Return the result even if it's empty
                    return result || [];
                }
                catch (queryError) {
                    console.error('P21 query execution error:', queryError); // Log the full error object
                    throw queryError; // Re-throw the original error
                }
                finally {
                    // Always try to close the connection after query execution
                    if (connection) {
                        try {
                            yield connection.close();
                            console.log('P21 ODBC connection closed.');
                        }
                        catch (closeError) {
                            console.error('Error closing P21 ODBC connection after query:', closeError);
                        }
                    }
                }
            }
            catch (connectionError) {
                console.error('P21 ODBC connection failed:', connectionError); // Log the full error object
                // No need to close connection here as it likely didn't open
                // Re-throw a more specific error message
                throw new Error(`P21 ODBC connection failed: ${connectionError.message || connectionError}`);
            }
        });
    }
    /**
     * Instance method to execute a P21 query
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    executeP21Query(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            return ConnectionManager.executeQuery(config, query);
        });
    }
    /**
     * Instance method to execute an Access query
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    executeAccessQuery(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            return ConnectionManager.executeQuery(config, query);
        });
    }
    /**
     * Executes a query with a fresh connection to ensure accurate results
     * This is important for P21 queries where connection state can affect results
     */
    static executeQueryWithFreshConnection(connectionInfo, query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Executing query with fresh connection: ${query}`);
            // Determine the connection type
            if (connectionInfo.type === 'P21') {
                try {
                    // Import ODBC directly to avoid webpack issues
                    const odbc = yield import('odbc');
                    // Get DSN and credentials from connection info
                    const dsn = connectionInfo.dsn || process.env.P21_DSN || 'P21Play';
                    const username = connectionInfo.username || process.env.P21_USERNAME;
                    const password = connectionInfo.password || process.env.P21_PASSWORD;
                    // Build connection string
                    let connectionString = `DSN=${dsn};`;
                    // Add authentication details if provided
                    if (username && password) {
                        connectionString += `UID=${username};PWD=${password};`;
                        console.log('Using SQL Server Authentication with ODBC');
                    }
                    else {
                        // Use Windows Authentication
                        connectionString += 'Trusted_Connection=Yes;';
                        console.log('Using Windows Authentication with ODBC');
                    }
                    console.log(`Creating ODBC connection with DSN: ${dsn}`);
                    // Ensure query has proper schema prefixes
                    let modifiedQuery = query;
                    if (!query.includes('dbo.')) {
                        // Common P21 table names to add schema prefix to
                        const p21Tables = [
                            'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line',
                            'customer', 'inv_mast', 'ar_open_items', 'ap_open_items'
                        ];
                        // Add dbo. prefix to each table name
                        p21Tables.forEach(tableName => {
                            // Use regex to match table names that aren't already prefixed
                            const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'g');
                            modifiedQuery = modifiedQuery.replace(regex, `dbo.${tableName}`);
                        });
                        console.log(`Modified SQL with schema prefixes: ${modifiedQuery}`);
                    }
                    // Create a new connection
                    const connection = yield odbc.connect(connectionString);
                    try {
                        // Execute the query
                        console.log(`Executing P21 query via ODBC: ${modifiedQuery}`);
                        const startTime = Date.now();
                        const queryResult = yield connection.query(modifiedQuery);
                        const duration = Date.now() - startTime;
                        console.log(`P21 query executed in ${duration}ms`);
                        // Process the result
                        if (Array.isArray(queryResult) && queryResult.length > 0) {
                            console.log(`P21 query returned ${queryResult.length} rows`);
                            // Get the first row
                            const firstRow = queryResult[0];
                            console.log(`First row:`, JSON.stringify(firstRow));
                            // Try to find a 'value' column (case insensitive)
                            const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
                            if (valueKey) {
                                const rawValue = firstRow[valueKey];
                                console.log(`Found 'value' column with raw value:`, rawValue, `type:`, typeof rawValue);
                                // Handle different value types
                                if (typeof rawValue === 'number') {
                                    return { value: rawValue };
                                }
                                else if (rawValue !== null && rawValue !== undefined) {
                                    // Try to convert string values to numbers
                                    const parsedValue = parseFloat(String(rawValue));
                                    if (!isNaN(parsedValue)) {
                                        return { value: parsedValue };
                                    }
                                    else {
                                        // Return the string value if it can't be parsed as a number
                                        return { value: String(rawValue) };
                                    }
                                }
                                else {
                                    // Handle null/undefined values
                                    return { value: 0 };
                                }
                            }
                            else {
                                // If no 'value' column, use the first column
                                const firstKey = Object.keys(firstRow)[0];
                                const rawValue = firstRow[firstKey];
                                console.log(`Using first column '${firstKey}' with raw value:`, rawValue, `type:`, typeof rawValue);
                                // Handle different value types
                                if (typeof rawValue === 'number') {
                                    return { value: rawValue };
                                }
                                else if (rawValue !== null && rawValue !== undefined) {
                                    // Try to convert string values to numbers
                                    const parsedValue = parseFloat(String(rawValue));
                                    if (!isNaN(parsedValue)) {
                                        return { value: parsedValue };
                                    }
                                    else {
                                        // Return the string value if it can't be parsed as a number
                                        return { value: String(rawValue) };
                                    }
                                }
                                else {
                                    // Handle null/undefined values
                                    return { value: 0 };
                                }
                            }
                        }
                        else {
                            console.log('P21 query returned empty result');
                            return { value: 0 };
                        }
                    }
                    finally {
                        // Always close the connection
                        yield connection.close();
                        console.log('ODBC connection closed');
                    }
                }
                catch (error) {
                    console.error('Error executing P21 query with fresh connection:', error);
                    throw new Error(`P21 query execution failed: ${error.message}`);
                }
            }
            else if (connectionInfo.type === 'POR') {
                try {
                    // Check if POR file path is configured
                    const porFilePath = connectionInfo.filePath || process.env.POR_FILE_PATH;
                    if (!porFilePath) {
                        throw new Error('POR database file path is not configured');
                    }
                    // Check if file exists
                    const fs = yield import('fs');
                    if (!fs.existsSync(porFilePath)) {
                        throw new Error(`POR database file not found at configured path: ${porFilePath}`);
                    }
                    // Use the executeAccessQuery API endpoint to query the Access database
                    const response = yield fetch('http://localhost:5500/api/executeAccessQuery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filePath: porFilePath,
                            sql: query
                        })
                    });
                    if (!response.ok) {
                        const errorText = yield response.text();
                        throw new Error(`POR query execution failed: ${errorText}`);
                    }
                    const result = yield response.json();
                    if (result.error) {
                        throw new Error(`POR query execution failed: ${result.error}`);
                    }
                    console.log(`POR query executed successfully, result:`, JSON.stringify(result).substring(0, 200));
                    return result;
                }
                catch (error) {
                    console.error('Error executing POR query with fresh connection:', error);
                    throw new Error(`POR query execution failed: ${error.message}`);
                }
            }
            else {
                throw new Error(`Unsupported connection type: ${connectionInfo.type}`);
            }
        });
    }
    /**
     * Executes a SQL Server query with a fresh connection
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    static executeSqlServerQueryWithFreshConnection(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // Always create a new connection pool
                const sqlConfig = {
                    user: config.username || config.user,
                    password: config.password,
                    server: config.server || '',
                    database: config.database,
                    options: {
                        encrypt: (_b = (_a = config.options) === null || _a === void 0 ? void 0 : _a.encrypt) !== null && _b !== void 0 ? _b : true, // Use encryption by default
                        trustServerCertificate: (_d = (_c = config.options) === null || _c === void 0 ? void 0 : _c.trustServerCertificate) !== null && _d !== void 0 ? _d : false
                    },
                    pool: {
                        max: 1, // Use a minimal pool for a single query
                        min: 0,
                        idleTimeoutMillis: 5000 // Short timeout
                    }
                };
                console.log(`Creating fresh SQL Server connection pool for ${config.server}/${config.database}`);
                const pool = yield new sql.ConnectionPool(sqlConfig).connect();
                try {
                    // Execute the query
                    console.log(`Executing SQL Server query via fresh connection: ${query}`);
                    const result = yield pool.request().query(query);
                    console.log('Query executed successfully, result:', result ? `${result.recordset.length} rows` : 'No results');
                    // If we got results, log the first row for debugging
                    if (result && result.recordset && result.recordset.length > 0) {
                        console.log('First row:', result.recordset[0]);
                    }
                    // Close the connection
                    yield pool.close();
                    return result.recordset;
                }
                catch (queryError) {
                    console.error('Query execution error:', queryError);
                    // Check for specific SQL Server error codes
                    if (queryError.number) {
                        console.error(`SQL Server Error Number: ${queryError.number}`);
                    }
                    // Throw a more descriptive error
                    throw new Error(`Query execution failed: ${queryError.message}`);
                }
                finally {
                    // Always close the connection when done
                    try {
                        yield pool.close();
                        console.log('SQL Server connection pool closed successfully');
                    }
                    catch (closeError) {
                        console.error('Error closing SQL Server connection pool:', closeError);
                    }
                }
            }
            catch (error) {
                console.error('Error executing SQL Server query with fresh connection:', error);
                throw new Error(`SQL Server query execution failed: ${error.message}`);
            }
        });
    }
    /**
     * Executes a query on the appropriate database based on the server type
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    static executeQuery(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (typeof window !== 'undefined') {
                    throw new Error('executeQuery can only be called from server components or API routes');
                }
                // For Access database, use the Access module
                if (config.type === 'POR') {
                    return this.executeAccessQuery(config, query);
                }
                // For P21, use the P21 query method
                if (config.type === 'P21') {
                    return this.executeP21Query(query);
                }
                // For other SQL Server connections, use the SQL Server module
                return this.executeSqlServerQuery(config, query);
            }
            catch (error) {
                console.error('Error executing query:', error);
                throw error;
            }
        });
    }
    /**
     * Executes a SQL Server query
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    static executeSqlServerQuery(config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // Get or create a connection pool for this server
                const key = this.getConnectionKey(config);
                let pool = connectionPools.get(key);
                if (!pool) {
                    // Create a new connection pool
                    const sqlConfig = {
                        user: config.username || config.user,
                        password: config.password,
                        server: config.server || '',
                        database: config.database,
                        options: {
                            encrypt: (_b = (_a = config.options) === null || _a === void 0 ? void 0 : _a.encrypt) !== null && _b !== void 0 ? _b : true, // Use encryption by default
                            trustServerCertificate: (_d = (_c = config.options) === null || _c === void 0 ? void 0 : _c.trustServerCertificate) !== null && _d !== void 0 ? _d : false
                        },
                        pool: {
                            max: 10,
                            min: 0,
                            idleTimeoutMillis: 30000
                        }
                    };
                    pool = yield new sql.ConnectionPool(sqlConfig).connect();
                    connectionPools.set(key, pool);
                }
                // Execute the query
                try {
                    const result = yield pool.request().query(query);
                    console.log('Query executed successfully, result:', result ? `${result.recordset.length} rows` : 'No results');
                    // If we got results, log the first row for debugging
                    if (result && result.recordset && result.recordset.length > 0) {
                        console.log('First row:', result.recordset[0]);
                    }
                    // Close the connection
                    yield pool.close();
                    return result.recordset;
                }
                catch (queryError) {
                    console.error('Query execution error:', queryError);
                    // Check for specific SQL Server error codes
                    if (queryError.number) {
                        console.error(`SQL Server Error Number: ${queryError.number}`);
                    }
                    // Throw a more descriptive error
                    throw new Error(`Query execution failed: ${queryError.message}`);
                }
            }
            catch (error) {
                console.error('SQL Server query execution failed:', error);
                throw new Error(`SQL Server query execution failed: ${error.message}`);
            }
        });
    }
    /**
     * Get all server configurations
     * @returns Array of server configurations
     */
    getAllServerConfigs() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Getting all server configurations');
            // Default configurations
            const configs = [
                {
                    name: 'P21',
                    type: 'P21',
                    dsn: process.env.P21_DSN || 'P21Play',
                    username: process.env.P21_USERNAME || '',
                    password: process.env.P21_PASSWORD || ''
                },
                {
                    name: 'POR',
                    type: 'POR',
                    filePath: process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB'
                }
            ];
            // Test connections to verify configurations
            try {
                // Test P21 connection
                const p21Config = configs.find(config => config.name === 'P21');
                if (p21Config) {
                    const p21Result = yield ConnectionManager.testConnection('P21', p21Config);
                    console.log(`P21 connection test: ${p21Result.success ? 'Success' : 'Failed'} - ${p21Result.message}`);
                }
                // Test POR connection
                const porConfig = configs.find(config => config.name === 'POR');
                if (porConfig) {
                    const porResult = yield ConnectionManager.testConnection('POR', porConfig);
                    console.log(`POR connection test: ${porResult.success ? 'Success' : 'Failed'} - ${porResult.message}`);
                }
            }
            catch (error) {
                console.error('Error testing connections:', error);
                // Continue even if connection tests fail
            }
            return configs;
        });
    }
    /**
     * Execute a query on the specified server
     * @param serverName Name of the server
     * @param config Server configuration
     * @param query SQL query to execute
     * @returns Query result
     */
    executeQuery(serverName, config, query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Executing query on ${serverName} server: ${query}`);
            if (serverName.toLowerCase() === 'p21') {
                return yield ConnectionManager.executeP21Query(query);
            }
            else if (serverName.toLowerCase() === 'por') {
                return yield ConnectionManager.executeAccessQuery(config, query);
            }
            else {
                throw new Error(`Unsupported server type: ${serverName}`);
            }
        });
    }
}
