// This file provides a unified interface for executing queries against different databases
// It's designed to be used by both client and server components
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { executeRead } from './sqlite'; // Import the actual query execution function
import { getMode } from '@/lib/state/dashboardState';
import { getServerConfig } from '@/lib/db/connections';
/**
 * Validate SQL to prevent injection attacks
 */
export function validateSql(sql) {
    // Basic validation to prevent SQL injection
    const upperSql = sql.toUpperCase();
    // Only allow SELECT statements
    if (!upperSql.trim().startsWith('SELECT')) {
        console.warn('SQL Validation: Query must start with SELECT');
        return false;
    }
    // Disallow multiple statements
    if (upperSql.includes(';')) {
        console.warn('SQL Validation: Multiple statements are not allowed');
        return false;
    }
    // Disallow dangerous keywords
    if (upperSql.includes('DROP') || upperSql.includes('DELETE') ||
        upperSql.includes('UPDATE') || upperSql.includes('INSERT') ||
        upperSql.includes('CREATE') || upperSql.includes('ALTER') ||
        upperSql.includes('TRUNCATE') || upperSql.includes('EXEC')) {
        console.warn('SQL Validation: Dangerous keywords detected');
        return false;
    }
    return true;
}
/**
 * Execute a query against the appropriate database
 * This function handles routing to the correct database based on the server and mode
 */
export function executeQuery(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { server, sql, tableName, testMode = false, rowId } = params;
            // Ensure testMode is treated as a boolean
            const isTestMode = Boolean(testMode);
            // Always extract row ID from SQL comment if available
            let extractedRowId = rowId;
            if (!extractedRowId && sql) {
                const rowIdMatch = sql.match(/--\s*ROW_ID:\s*([^\s]+)/);
                if (rowIdMatch && rowIdMatch[1]) {
                    extractedRowId = rowIdMatch[1];
                }
            }
            // Validate the SQL to prevent injection attacks
            if (!validateSql(sql)) {
                console.error(`QUERY-EXEC: Invalid SQL detected: ${sql}`);
                return {
                    success: false,
                    value: 0, // Always return 0 for invalid SQL
                    error: 'Invalid SQL query detected',
                    errorType: 'syntax'
                };
            }
            // Determine the mode
            const mode = getMode();
            console.log(`QUERY-EXEC: Executing query in ${mode ? 'prod' : 'test'} mode, testMode=${isTestMode}, server=${server}`);
            // If we're in test mode, use the test database
            if (!mode || isTestMode) {
                try {
                    console.log(`QUERY-EXEC: Executing test query: ${sql}`);
                    // Transform SQL query to be compatible with SQLite
                    const transformedSql = transformSqlForSqlite(sql, server);
                    console.log(`QUERY-EXEC: Transformed SQL for SQLite: ${transformedSql}`);
                    // Use executeRead from sqlite.ts for test queries
                    const result = yield executeRead(transformedSql);
                    // Make sure we return a number value, not an array
                    const numericResult = typeof result === 'number' ? result :
                        (Array.isArray(result) && result.length > 0) ?
                            (typeof result[0] === 'number' ? result[0] : parseFloat(result[0]) || 0) : 0;
                    return { success: true, value: numericResult };
                }
                catch (error) {
                    console.error(`QUERY-EXEC: Error executing test query:`, error);
                    // Return error information
                    return {
                        success: false,
                        value: 0,
                        error: error.message,
                        errorType: 'execution'
                    };
                }
            }
            // Otherwise, use the production database
            else {
                console.log(`QUERY-EXEC: Executing production query on ${server}: ${sql}`);
                try {
                    // Get the server configuration
                    const serverConfig = yield getServerConfig(server);
                    if (!serverConfig) {
                        console.error(`QUERY-EXEC: No server configuration found for ${server}`);
                        return {
                            success: false,
                            value: 0, // Return 0 for configuration errors
                            error: `No server configuration found for ${server}`,
                            errorType: 'connection'
                        };
                    }
                    // Log the server configuration (without sensitive info)
                    if (server === 'POR') {
                        console.log(`QUERY-EXEC: Using MS Access configuration for ${server}:`, {
                            type: serverConfig.type,
                            filePath: serverConfig.filePath ? 'CONFIGURED' : 'NOT CONFIGURED'
                        });
                    }
                    else {
                        console.log(`QUERY-EXEC: Using SQL Server configuration for ${server}:`, {
                            type: serverConfig.type,
                            server: serverConfig.server ? 'CONFIGURED' : 'NOT CONFIGURED',
                            database: serverConfig.database,
                            useWindowsAuth: serverConfig.useWindowsAuth
                        });
                    }
                    // Execute the query based on server type
                    let result;
                    if (server === 'P21') {
                        // Execute SQL Server query
                        result = yield executeP21Query(sql, serverConfig);
                    }
                    else if (server === 'POR') {
                        // Execute MS Access query
                        result = yield executePORQuery(sql, serverConfig);
                    }
                    else {
                        throw new Error(`Unknown server type: ${server}`);
                    }
                    console.log(`QUERY-EXEC: Query result:`, result);
                    return { success: true, value: result };
                }
                catch (error) {
                    console.error(`QUERY-EXEC: Error executing production query:`, error);
                    // Determine error type
                    let errorType = 'other';
                    if (error.message.includes('connect') ||
                        error.message.includes('login') ||
                        error.message.includes('authentication')) {
                        errorType = 'connection';
                    }
                    else if (error.message.includes('syntax') ||
                        error.message.includes('invalid')) {
                        errorType = 'syntax';
                    }
                    else {
                        errorType = 'execution';
                    }
                    return {
                        success: false,
                        value: 0, // Return 0 for errors
                        error: error.message,
                        errorType
                    };
                }
            }
        }
        catch (error) {
            console.error(`QUERY-EXEC: Unexpected error:`, error);
            return {
                success: false,
                value: 0, // Return 0 for unexpected errors
                error: error.message,
                errorType: 'other'
            };
        }
    });
}
/**
 * Execute a query against the P21 SQL Server database
 */
function executeP21Query(sql, serverConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // This is a simplified implementation - in a real scenario, this would use the actual SQL Server connection
        console.log(`QUERY-EXEC: Executing P21 SQL Server query`);
        // If we're in a browser environment (client-side)
        if (typeof window !== 'undefined') {
            // Call the API endpoint to execute the SQL Server query
            const response = yield fetch('/api/executeQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'P21',
                    sql: sql,
                    testMode: false
                }),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error(`QUERY-EXEC: Error response from SQL Server query API:`, errorText);
                throw new Error(`SQL Server query failed: ${errorText}`);
            }
            const result = yield response.json();
            if (result.success && result.value !== undefined) {
                return typeof result.value === 'number' ? result.value : parseFloat(result.value) || 0;
            }
            else if (result.data && result.data.length > 0) {
                const row = result.data[0];
                const keys = Object.keys(row);
                if (keys.length > 0) {
                    // Try to find a column named 'value' or similar
                    const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                    const value = row[valueKey];
                    return typeof value === 'number' ? value : parseFloat(value) || 0;
                }
            }
            return 0;
        }
        else {
            // For server-side execution, we would use a direct connection
            // This is just a placeholder - in a real implementation, this would connect to SQL Server
            throw new Error('Server-side P21 query execution not implemented');
        }
    });
}
/**
 * Execute a query against the POR MS Access database
 */
function executePORQuery(sql, serverConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // This is a simplified implementation - in a real scenario, this would use the actual MS Access connection
        console.log(`QUERY-EXEC: Executing POR MS Access query`);
        // If we're in a browser environment (client-side)
        if (typeof window !== 'undefined') {
            // Call the API endpoint to execute the MS Access query
            const response = yield fetch('/api/executeQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'POR',
                    sql: sql,
                    testMode: false
                }),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error(`QUERY-EXEC: Error response from MS Access query API:`, errorText);
                throw new Error(`MS Access query failed: ${errorText}`);
            }
            const result = yield response.json();
            if (result.success && result.value !== undefined) {
                return typeof result.value === 'number' ? result.value : parseFloat(result.value) || 0;
            }
            else if (result.rows && result.rows.length > 0) {
                const row = result.rows[0];
                const keys = Object.keys(row);
                if (keys.length > 0) {
                    // Try to find a column named 'value' or similar
                    const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
                    const value = row[valueKey];
                    return typeof value === 'number' ? value : parseFloat(value) || 0;
                }
            }
            return 0;
        }
        else {
            // For server-side execution, we would use a direct connection
            // This is just a placeholder - in a real implementation, this would connect to MS Access
            throw new Error('Server-side POR query execution not implemented');
        }
    });
}
/**
 * Transform SQL query to be compatible with SQLite
 * This function removes SQL Server specific syntax that causes issues in SQLite
 */
function transformSqlForSqlite(sql, server) {
    let transformedSql = sql;
    // Remove schema prefixes (dbo.)
    transformedSql = transformedSql.replace(/dbo\./gi, '');
    // Remove WITH (NOLOCK) hints
    transformedSql = transformedSql.replace(/WITH\s*\(\s*NOLOCK\s*\)/gi, '');
    // Replace GETDATE() with datetime('now')
    transformedSql = transformedSql.replace(/GETDATE\(\)/gi, "datetime('now')");
    // Replace DATEADD with SQLite equivalent
    // This is a simplified version that handles common cases
    const dateAddRegex = /DATEADD\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+)\s*\)/gi;
    transformedSql = transformedSql.replace(dateAddRegex, (match, interval, amount, date) => {
        return `datetime(${date}, '${amount} ${interval}')`;
    });
    // Replace DATEDIFF with SQLite equivalent
    // This is a simplified version that handles common cases
    const dateDiffRegex = /DATEDIFF\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi;
    transformedSql = transformedSql.replace(dateDiffRegex, (match, interval, date1, date2) => {
        return `(julianday(${date2}) - julianday(${date1}))`;
    });
    // For MS Access syntax (POR server)
    if (server === 'POR') {
        // Replace Date() with datetime('now')
        transformedSql = transformedSql.replace(/Date\(\)/gi, "datetime('now')");
        // Replace DateAdd with SQLite equivalent
        const dateAddAccessRegex = /DateAdd\s*\(\s*['"](\w+)['"]\s*,\s*(-?\d+)\s*,\s*([^)]+)\s*\)/gi;
        transformedSql = transformedSql.replace(dateAddAccessRegex, (match, interval, amount, date) => {
            return `datetime(${date}, '${amount} ${interval}')`;
        });
        // Replace Nz with IFNULL
        const nzRegex = /Nz\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi;
        transformedSql = transformedSql.replace(nzRegex, (match, expr, defaultVal) => {
            return `IFNULL(${expr}, ${defaultVal})`;
        });
    }
    // For simple test queries, make sure they return a value
    if (transformedSql.trim().toUpperCase() === 'SELECT 1' ||
        transformedSql.trim().toUpperCase() === 'SELECT 0') {
        return transformedSql + ' as value';
    }
    return transformedSql;
}
