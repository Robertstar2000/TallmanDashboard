var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises'; // Use promises version of fs
import { singleSourceData } from './single-source-data';
// --- Configuration ---
// Use __dirname and process.cwd() to construct a reliable path
// Assuming the script runs from the project root or similar standard location.
// Adjust if the execution context is different.
const dbRelativePath = 'dashboard.db'; // Store DB in project root
const dbPath = path.resolve(process.cwd(), dbRelativePath);
const schemaPath = path.resolve(process.cwd(), 'lib', 'db', 'schema.sql');
console.log(`Database path determined as: ${dbPath}`);
console.log(`Schema path determined as: ${schemaPath}`);
let dbInstance = null;
// --- Database Initialization ---
/**
 * Initializes the SQLite database connection and applies the schema.
 */
export function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Initializing database at ${dbPath}...`);
            dbInstance = yield open({
                filename: dbPath,
                driver: sqlite3.Database // Use sqlite3 driver
            });
            console.log('Database connection opened.');
            // Read schema file
            const schemaSql = yield fs.readFile(schemaPath, 'utf-8');
            console.log('Schema file read.');
            // Execute schema SQL (PRAGMA foreign_keys=ON; CREATE TABLE...)
            // Use db.exec for multi-statement SQL
            yield dbInstance.exec(schemaSql);
            console.log('Database schema applied successfully.');
            // Additional setup (like WAL mode, already in schema.sql PRAGMA foreign_keys=ON)
            yield dbInstance.exec('PRAGMA journal_mode = WAL;');
            console.log('WAL mode enabled.');
            // Load initial data after ensuring schema is applied
            yield syncDataFromSource();
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            // Consider more robust error handling or re-throwing
            throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
/**
 * Synchronizes the admin_variables table with data from singleSourceData.
 * Uses INSERT OR REPLACE to add new rows or update existing ones based on ID.
 */
export function syncDataFromSource() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dbInstance) {
            console.error('Database not initialized. Cannot sync data.');
            throw new Error('Database not initialized.');
        }
        console.log('Syncing data from single-source-data.ts to admin_variables...');
        const insertStmt = yield dbInstance.prepare(`INSERT OR REPLACE INTO admin_variables (
            id, name, value, description, server, is_sql_expression, sql_expression, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
        try {
            // Begin transaction for bulk insert/replace
            yield dbInstance.run('BEGIN TRANSACTION;');
            for (const row of singleSourceData) {
                // Map SpreadsheetRow to admin_variables columns
                const id = row.id;
                const name = row.DataPoint || row.variableName || `Unnamed-${row.id}`; // Use DataPoint or variableName
                const value = row.value || ''; // Initial value from source
                // Combine chartGroup and chartName for description, or use DataPoint
                const description = row.chartName ? `${row.chartGroup} - ${row.chartName} (${row.variableName})` : name;
                const server = row.serverName || 'LOCAL';
                const isSqlExpression = !!row.sqlExpression;
                const sqlExpression = row.sqlExpression || null;
                yield insertStmt.run(id, name, value, description, server, isSqlExpression, sqlExpression);
            }
            // Commit transaction
            yield dbInstance.run('COMMIT;');
            console.log(`Synced ${singleSourceData.length} rows to admin_variables.`);
        }
        catch (error) {
            // Rollback transaction on error
            yield dbInstance.run('ROLLBACK;');
            console.error('Failed to sync data to admin_variables:', error);
            throw new Error(`Data sync failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            // Finalize statement MUST be called
            yield insertStmt.finalize();
        }
        // Sync placeholder data for other tables (implementation needed when schemas exist)
        console.log('Placeholder sync for chart_group_settings and server_configs (requires schema updates).');
        // Example: await syncTable('chart_group_settings', placeholderChartGroupSettings);
        // Example: await syncTable('server_configs', placeholderServerConfigs);
    });
}
// Placeholder sync function for future tables
// async function syncTable(tableName: string, data: any[]): Promise<void> {
//     if (!dbInstance) throw new Error('Database not initialized.');
//     console.log(`Syncing data for table ${tableName}...`);
//     // Implementation depends on the specific table structure and data mapping
// }
// --- Data Access Functions ---
/**
 * Retrieves all rows from the admin_variables table.
 */
export function getAdminVariables() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dbInstance)
            throw new Error('Database not initialized.');
        console.log('Fetching data from admin_variables...');
        try {
            // Fetch from admin_variables and map back to SpreadsheetRow structure
            const rows = yield dbInstance.all(`SELECT id, name, value, description, server, is_sql_expression, sql_expression, last_updated
             FROM admin_variables`);
            // Map back to SpreadsheetRow - this might be lossy or need refinement
            // based on how SpreadsheetRow is truly used downstream.
            const results = rows.map((row) => {
                var _a, _b, _c, _d, _e, _f, _g;
                return ({
                    id: String(row.id),
                    DataPoint: String(row.name), // Map name back to DataPoint
                    chartGroup: ((_a = row.description) === null || _a === void 0 ? void 0 : _a.split(' - ')[0]) || '', // Attempt to extract from description
                    chartName: ((_c = (_b = row.description) === null || _b === void 0 ? void 0 : _b.split(' - ')[1]) === null || _c === void 0 ? void 0 : _c.split(' (')[0]) || '', // Attempt to extract
                    variableName: ((_e = (_d = row.description) === null || _d === void 0 ? void 0 : _d.match(/\((.*?)\)/)) === null || _e === void 0 ? void 0 : _e[1]) || String(row.name), // Fallback to name if extraction fails
                    serverName: String(row.server),
                    tableName: '', // Not stored in admin_variables
                    calculation: '', // Not stored in admin_variables
                    sqlExpression: String((_f = row.sql_expression) !== null && _f !== void 0 ? _f : ''),
                    value: String((_g = row.value) !== null && _g !== void 0 ? _g : ''), // Use nullish coalescing
                    lastUpdated: String(row.last_updated),
                    axisStep: '', // Not stored in admin_variables
                });
            });
            console.log(`Fetched ${results.length} rows from admin_variables.`);
            return results;
        }
        catch (error) {
            console.error('Failed to get admin variables:', error);
            throw error; // Re-throw
        }
    });
}
/**
 * Updates the value and timestamp for a specific row in the chart_data table.
 * Inserts the row if it doesn't exist.
 */
export function updateChartDataValue(id, value, error) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!dbInstance)
            throw new Error('Database not initialized.');
        // console.log(`Updating chart_data for id: ${id}, value: ${value}, error: ${error}`); // Debug log
        try {
            // Get chart_group and label from admin_variables to insert/update chart_data
            const adminVar = yield dbInstance.get('SELECT name, description FROM admin_variables WHERE id = ?', id);
            const chartGroup = ((_a = adminVar === null || adminVar === void 0 ? void 0 : adminVar.description) === null || _a === void 0 ? void 0 : _a.split(' - ')[0]) || 'Unknown';
            const label = (adminVar === null || adminVar === void 0 ? void 0 : adminVar.name) || 'Unknown'; // Use name as label
            yield dbInstance.run(`INSERT INTO chart_data (id, value, timestamp, error, chart_group, label)
             VALUES (?, ?, datetime('now'), ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
             value = excluded.value,
             timestamp = excluded.timestamp,
             error = excluded.error,
             chart_group = excluded.chart_group,
             label = excluded.label;`, id, value, error, chartGroup, label);
            // console.log(`Successfully updated chart_data for id: ${id}`); // Debug log
        }
        catch (dbError) {
            console.error(`Failed to update chart_data for id ${id}:`, dbError);
            throw dbError; // Re-throw
        }
    });
}
/**
 * Retrieves all data from the chart_data table.
 */
export function getChartData() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dbInstance)
            throw new Error('Database not initialized.');
        console.log('Fetching data from chart_data...');
        try {
            // Explicitly type the expected return shape
            const results = yield dbInstance.all('SELECT id, value, timestamp, error, chart_group, label FROM chart_data');
            console.log(`Fetched ${results.length} rows from chart_data.`);
            return results; // Returns array of objects matching chart_data schema
        }
        catch (error) {
            console.error('Failed to get chart data:', error);
            throw error;
        }
    });
}
// --- Placeholder Functions (Require Schema Updates) ---
export function getChartGroupSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('getChartGroupSettings: Schema and implementation needed.');
        if (!dbInstance)
            throw new Error('Database not initialized.');
        console.log('Deriving chart group settings from admin_variables...');
        try {
            // 1. Get distinct chart groups
            const groups = yield dbInstance.all(`SELECT DISTINCT SUBSTR(description, 1, INSTR(description, ' - ') - 1) as chartGroup
             FROM admin_variables
             WHERE description LIKE '% - %'` // Basic filter to find potential group names
            );
            const settings = [];
            // 2. For each group, get associated variables
            for (const group of groups) {
                const groupName = group.chartGroup;
                if (!groupName)
                    continue; // Skip if group name extraction failed
                // Extract variables for this group (using the name field as a proxy for variable)
                const variablesResult = yield dbInstance.all(`SELECT name FROM admin_variables
                 WHERE description LIKE ?`, `${groupName} - %`);
                const variableNames = variablesResult.map(v => v.name);
                settings.push({
                    name: groupName,
                    description: `Settings for ${groupName}`, // Placeholder description
                    variables: variableNames,
                });
            }
            console.log(`Derived settings for ${settings.length} chart groups.`);
            return settings;
        }
        catch (error) {
            console.error('Failed to derive chart group settings:', error);
            throw error;
        }
    });
}
export function getServerConfigs() {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('getServerConfigs: Schema and implementation needed.');
        if (!dbInstance)
            throw new Error('Database not initialized.');
        console.log('Fetching server configurations (P21/POR) from admin_variables...');
        try {
            const rows = yield dbInstance.all(`SELECT id, name, value, description, server, is_active, last_updated
             FROM admin_variables
             WHERE server IN ('P21', 'POR')`);
            const configs = rows.map(row => ({
                id: row.id,
                name: row.name,
                type: row.server, // Directly use the server value ('P21' or 'POR')
                value: row.value,
                description: row.description,
                isActive: Boolean(row.is_active), // Convert 0/1 to boolean
                lastUpdated: row.last_updated
            }));
            console.log(`Fetched ${configs.length} server configurations.`);
            return configs;
        }
        catch (error) {
            console.error('Failed to get server configs:', error);
            throw error;
        }
    });
}
// --- Database Status and Utility ---
/**
 * Checks the status and integrity of the SQLite database.
 */
export function checkDbStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const statusResult = {
            serverName: 'Local SQLite',
            status: 'error', // Default to error
            isHealthy: false,
            details: {},
            lastChecked: new Date()
        };
        try {
            // 1. Check if DB file exists and is accessible
            yield fs.access(dbPath, fs.constants.R_OK | fs.constants.W_OK);
            statusResult.details.fileAccessible = true;
            // 2. Ensure DB connection is open (initialize if needed, but be careful)
            if (!dbInstance) {
                console.warn('Attempting to initialize DB during status check.');
                yield initializeDatabase(); // This might retry sync etc.
                if (!dbInstance)
                    throw new Error('DB connection failed during status check.');
            }
            // 3. Check WAL mode
            const journalMode = yield dbInstance.get('PRAGMA journal_mode;');
            statusResult.details.walModeEnabled = ((_a = journalMode === null || journalMode === void 0 ? void 0 : journalMode.journal_mode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'wal';
            // 4. Check foreign keys
            const foreignKeys = yield dbInstance.get('PRAGMA foreign_keys;');
            statusResult.details.foreignKeysEnabled = (foreignKeys === null || foreignKeys === void 0 ? void 0 : foreignKeys.foreign_keys) === 1;
            // 5. Check if core tables exist
            const tables = yield dbInstance.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admin_variables', 'chart_data');");
            // Add explicit type for the object returned by sqlite_master query
            const hasAdminTable = tables.some((t) => t.name === 'admin_variables');
            const hasChartDataTable = tables.some((t) => t.name === 'chart_data');
            statusResult.details.tablesInitialized = hasAdminTable && hasChartDataTable;
            // Determine overall health
            statusResult.isHealthy = statusResult.details.fileAccessible &&
                statusResult.details.walModeEnabled &&
                statusResult.details.foreignKeysEnabled &&
                statusResult.details.tablesInitialized;
            statusResult.status = statusResult.isHealthy ? 'connected' : 'error';
            if (!statusResult.isHealthy) {
                statusResult.error = 'One or more DB status checks failed. Check details.';
                console.error('DB Status Check Failed:', statusResult.details);
            }
        }
        catch (error) {
            statusResult.status = 'error';
            statusResult.error = `DB status check failed: ${error instanceof Error ? error.message : String(error)}`;
            statusResult.isHealthy = false;
            console.error(statusResult.error);
            if (error instanceof Error)
                statusResult.details.errorStack = error.stack; // Add stack trace if available
        }
        return statusResult;
    });
}
/**
 * Closes the database connection gracefully.
 */
export function closeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        if (dbInstance) {
            console.log('Closing database connection...');
            try {
                yield dbInstance.close();
                dbInstance = null;
                console.log('Database connection closed.');
            }
            catch (error) {
                console.error('Failed to close database connection:', error);
            }
        }
    });
}
// Optional: Ensure DB is closed on application exit
// process.on('SIGINT', closeDatabase);
// process.on('SIGTERM', closeDatabase);
