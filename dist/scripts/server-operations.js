// This file contains server-side-only database operations
// It should never be imported directly in client components
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Execute a query against the specified database server
 * This function should only be called from server components or API routes
 */
export function executeServerQuery(server, sql) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // This is a server-side only operation
            if (typeof window !== 'undefined') {
                throw new Error('executeServerQuery can only be called from server components or API routes');
            }
            console.log(`SERVER-OPS: Executing query on ${server} server: ${sql}`);
            // Get the server configuration
            const { getServerConfig } = yield import('./connections');
            const config = yield getServerConfig(server);
            if (!config) {
                console.error(`SERVER-OPS: No configuration found for ${server} server`);
                throw new Error(`No configuration found for ${server} server`);
            }
            console.log(`SERVER-OPS: Using configuration for ${server}: Server=${config.server}, Database=${config.database}`);
            // Dynamically import the SQL Server client
            const { getSqlServerClient } = yield import('./sqlserver');
            const client = yield getSqlServerClient(config);
            // Test the connection
            console.log(`SERVER-OPS: Testing connection to ${server} server`);
            const status = yield client.testConnection();
            if (!status.isConnected) {
                console.error(`SERVER-OPS: Failed to connect to ${server} server: ${status.error}`);
                throw new Error(`Failed to connect to ${server} server: ${status.error}`);
            }
            console.log(`SERVER-OPS: Successfully connected to ${server} server, executing query`);
            // Execute the query
            const result = yield client.executeQuery(sql);
            console.log(`SERVER-OPS: Query executed successfully on ${server} server`);
            // Process the result
            if (Array.isArray(result)) {
                console.log(`SERVER-OPS: Query returned ${result.length} rows`);
            }
            else if (typeof result === 'object' && result !== null) {
                console.log(`SERVER-OPS: Query returned an object with keys: ${Object.keys(result).join(', ')}`);
            }
            else {
                console.log(`SERVER-OPS: Query returned a ${typeof result}: ${result}`);
            }
            // Ensure we return an array of results
            if (Array.isArray(result)) {
                return result;
            }
            else if (result && typeof result === 'object') {
                return [result];
            }
            else if (result !== undefined && result !== null) {
                // For scalar results, create an object with a 'value' property
                return [{ value: result }];
            }
            else {
                return [];
            }
        }
        catch (error) {
            console.error(`SERVER-OPS: Error executing query on ${server} server:`, error);
            throw error;
        }
    });
}
/**
 * Test connection to the specified database server
 * This function should only be called from server components or API routes
 */
export function testServerConnection(server, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // This is a server-side only operation
            if (typeof window !== 'undefined') {
                throw new Error('testServerConnection can only be called from server components or API routes');
            }
            console.log(`SERVER-OPS: Testing connection to ${server} server with config:`, server === 'P21'
                ? `Using DSN: ${config.dsn || 'P21Play'}`
                : `Server=${config.server}, Database=${config.database}, FilePath=${config.filePath || 'N/A'}`);
            // Import the ConnectionManager
            const { ConnectionManager } = yield import('./connection-manager');
            // Use the ConnectionManager to test the connection
            const result = yield ConnectionManager.testConnection(config);
            if (result.success) {
                console.log(`SERVER-OPS: Successfully connected to ${server} server`);
            }
            else {
                console.error(`SERVER-OPS: Failed to connect to ${server} server: ${result.message}`);
            }
            return result;
        }
        catch (error) {
            console.error(`SERVER-OPS: Error testing connection to ${server} server:`, error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            };
        }
    });
}
/**
 * Close connection to the specified database server
 * This function should only be called from server components or API routes
 */
export function closeServerConnection(server) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // This is a server-side only operation
            if (typeof window !== 'undefined') {
                throw new Error('closeServerConnection can only be called from server components or API routes');
            }
            // Get server configuration
            const { getServerConfig } = yield import('./connections');
            const config = yield getServerConfig(server);
            if (!config) {
                return { success: false, message: `No configuration found for ${server} server` };
            }
            // Dynamically import the SQL Server client
            const { getSqlServerClient } = yield import('./sqlserver');
            const client = yield getSqlServerClient(config);
            // Close the connection
            yield client.close();
            return { success: true, message: 'Connection closed' };
        }
        catch (error) {
            console.error(`Error closing connection to ${server}:`, error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
}
