var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
// Initialize global cache variables if they don't exist
if (typeof global.chartDataCache === 'undefined') {
    global.chartDataCache = null;
}
if (typeof global.chartDataCacheVersion === 'undefined') {
    global.chartDataCacheVersion = null;
}
// Global variable to hold the single database instance
let dbInstance = null;
// SQLite database configuration
const dbConfig = {
    filename: path.join(process.cwd(), 'data', 'dashboard.db'),
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    timeout: 10000, // 10 second timeout
    busyTimeout: 10000 // Wait up to 10 seconds when the database is busy
};
// Helper function to initialize the database connection (run once)
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[sqlite.ts] Entering initializeDatabase...');
        if (dbInstance) {
            console.log('[sqlite.ts] Returning existing dbInstance.');
            return dbInstance;
        }
        console.log('[sqlite.ts] No existing instance, proceeding with initialization...');
        try {
            // 1. Ensure data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            console.log(`[sqlite.ts] Data directory path: ${dataDir}`);
            console.log('[sqlite.ts] Ensuring data directory exists...');
            try {
                if (!fs.existsSync(dataDir)) {
                    console.log(`[sqlite.ts] Data directory not found, creating: ${dataDir}`);
                    fs.mkdirSync(dataDir, { recursive: true });
                    console.log(`Created data directory at ${dataDir}`);
                }
                else {
                    console.log('[sqlite.ts] Data directory already exists.');
                }
            }
            catch (dirError) {
                console.error(`Failed to create/verify data directory:`, dirError);
                throw dirError;
            }
            // Ensure we have write access to the directory
            console.log('[sqlite.ts] Ensuring write access to the data directory...');
            try {
                const testFile = path.join(dataDir, '.write-test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log('Verified write access to data directory');
            }
            catch (writeError) {
                console.error(`No write access to data directory:`, writeError);
                throw writeError;
            }
            // Open database connection with retry logic
            console.log(`[sqlite.ts] Opening database connection to: ${dbConfig.filename}`);
            let retries = 3;
            let localDb = null;
            while (retries > 0) {
                try {
                    localDb = yield open(dbConfig);
                    console.log('Successfully opened SQLite database connection');
                    // Enable WAL mode for better concurrency
                    console.log('[sqlite.ts] Setting WAL mode...');
                    yield localDb.exec('PRAGMA journal_mode = WAL');
                    yield localDb.exec('PRAGMA busy_timeout = 10000');
                    // Initialize database tables
                    console.log('[sqlite.ts] Initializing database tables...');
                    yield initializeDatabaseTables(localDb);
                    console.log('Database tables initialized');
                    // Check if we need to load initial data
                    console.log('[sqlite.ts] Checking if initial data needs to be loaded...');
                    const hasData = yield localDb.get('SELECT COUNT(*) as count FROM chart_data');
                    if (!hasData || hasData.count === 0) {
                        console.log('No data found, loading initial data...');
                        // Dynamically import to avoid potential circular dependencies at module load time
                        const dataModule = yield import('./single-source-data');
                        yield loadInitialData(localDb, dataModule.dashboardData, dataModule.chartGroupSettings, dataModule.serverConfigs);
                        console.log('Initial data loaded successfully.');
                    }
                    dbInstance = localDb;
                    console.log('[sqlite.ts] Database initialized successfully. Returning instance.');
                    return dbInstance;
                }
                catch (dbError) {
                    retries--;
                    if (localDb) {
                        try {
                            yield localDb.close();
                        }
                        catch (closeErr) {
                            console.error('Error closing DB during retry:', closeErr);
                        }
                    }
                    if (retries === 0) {
                        console.error(`Failed to open SQLite database after all retries:`, dbError);
                        throw dbError;
                    }
                    console.warn(`Database connection failed, retrying... (${retries} attempts left)`);
                    yield new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
                }
            }
        }
        catch (error) {
            console.error('Critical error during database initialization:', error);
            console.error('[sqlite.ts] Closing potentially partially opened DB connection.');
            if (dbInstance) {
                dbInstance.close();
                dbInstance = null;
            }
            // Propagate the error to prevent the application from starting in a bad state
            throw new Error(`[sqlite.ts] Failed to initialize database: ${error.message}`);
        }
        // Should not be reached if initialization fails due to throw
        return dbInstance;
    });
}
// Helper function to convert SQLite integer to boolean
function toBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    return false;
}
// Get or initialize the SQLite database connection
export function getDb() {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure the database is initialized and return the instance
        return yield initializeDatabase();
    });
}
// Helper function to load initial data
function loadInitialData(db, dashboardData, chartGroupSettings, serverConfigs) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db.run('BEGIN TRANSACTION');
            // Clear existing data
            yield db.run('DELETE FROM chart_data');
            yield db.run('DELETE FROM chart_groups');
            yield db.run('DELETE FROM server_configs');
            // Insert chart data
            for (const row of dashboardData) {
                yield db.run(`INSERT INTO chart_data (
          id, name, chart_group, variable_name, server_name, value, 
          table_name, sql_expression, last_updated, axis_step
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    row.id,
                    row.name || '',
                    row.chartGroup || '',
                    row.variableName || '',
                    row.serverName || 'P21',
                    row.value || '0',
                    row.tableName || '',
                    row.sqlExpression || '',
                    row.lastUpdated || new Date().toISOString(),
                    row.axisStep || ''
                ]);
            }
            // Insert chart group settings
            for (const group of chartGroupSettings) {
                yield db.run(`INSERT INTO chart_groups (
          id, name, display_order, is_visible, settings
        ) VALUES (?, ?, ?, ?, ?)`, [
                    group.id,
                    group.name || '',
                    group.display_order || 0,
                    group.is_visible ? 1 : 0,
                    JSON.stringify(group.settings || {})
                ]);
            }
            // Insert server configs
            for (const config of serverConfigs) {
                yield db.run(`INSERT INTO server_configs (
          id, server_name, host, port, database, username, password,
          is_active, connection_type, server, created_at, updated_at, config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    config.id,
                    config.server_name || '',
                    config.host || '',
                    config.port || 0,
                    config.database || '',
                    config.username || '',
                    config.password || '',
                    config.is_active ? 1 : 0,
                    config.connection_type || 'sqlserver',
                    config.server || '',
                    config.created_at || new Date().toISOString(),
                    config.updated_at || new Date().toISOString(),
                    JSON.stringify(config.config || {})
                ]);
            }
            yield db.run('COMMIT');
            console.log('Successfully loaded initial data');
        }
        catch (error) {
            yield db.run('ROLLBACK');
            console.error('Error loading initial data:', error);
            throw error;
        }
    });
}
// Execute admin query
export function executeAdminQuery(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDb();
            // Validate and sanitize the query
            if (!query.trim().toLowerCase().startsWith('select')) {
                throw new Error('Only SELECT queries are allowed');
            }
            // Execute the query
            const result = yield db.get(query);
            // await (db as any).close();
            // Extract the first numeric value from the result
            let value = null;
            if (result) {
                const firstValue = Object.values(result)[0];
                if (typeof firstValue === 'number') {
                    value = firstValue;
                }
                else if (typeof firstValue === 'string') {
                    const parsedValue = parseFloat(firstValue);
                    if (!isNaN(parsedValue)) {
                        value = parsedValue;
                    }
                }
            }
            return { value };
        }
        catch (error) {
            console.error('Error executing admin query:', error);
            return { value: null, error: error.message };
        }
    });
}
// Execute query for reading data
export function executeRead(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDb();
            const result = yield db.all(query);
            // await db.close();
            return result;
        }
        catch (error) {
            console.error('Error executing read query:', error);
            throw new Error('Failed to execute read query');
        }
    });
}
// Execute query for writing data
export function executeWrite(query, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDb();
            // Use prepare for potentially better performance and safety, though run is fine too
            const stmt = yield db.prepare(query);
            yield stmt.run(params);
            yield stmt.finalize(); // Finalize the statement
            // Do NOT close the connection here
            return true;
        }
        catch (error) {
            console.error('Error executing write query:', error);
            return false;
        }
    });
}
// Get chart data
export function getChartData() {
    return __awaiter(this, arguments, void 0, function* (forceRefresh = false) {
        try {
            // Check cache first unless forced refresh
            if (!forceRefresh && global.chartDataCache) {
                return global.chartDataCache;
            }
            const db = yield getDb();
            // Get all chart data
            const rows = yield db.all(`
      SELECT 
        id,
        variable_name as name,
        chart_group as chartGroup,
        variable_name as variableName,
        server_name as serverName,
        value,
        table_name as tableName,
        sql_expression as sqlExpression,
        last_updated as lastUpdated,
        axis_step as axisStep
      FROM chart_data
      ORDER BY id ASC
    `);
            // Process each row
            const processedRows = rows.map((row) => ({
                id: row.id,
                name: row.name || '',
                chartGroup: row.chartGroup || '',
                variableName: row.variableName || '',
                serverName: row.serverName || 'P21',
                value: row.value || '0',
                tableName: row.tableName || '',
                sqlExpression: row.sqlExpression || '',
                lastUpdated: row.lastUpdated || new Date().toISOString(),
                axisStep: row.axisStep || calculateAxisStepForRow(row)
            }));
            // Update cache
            global.chartDataCache = processedRows;
            global.chartDataCacheVersion = new Date().toISOString();
            return processedRows;
        }
        catch (error) {
            console.error('Error getting chart data:', error);
            throw error;
        }
    });
}
// Helper to determine axis_step based on row data and chartgroup_specs.md logic
function calculateAxisStepForRow(row) {
    const chartGroup = row.chartGroup || '';
    const variableName = row.variableName || '';
    const name = row.name || ''; // Often holds the specific label within a group
    // --- Logic based on chartgroup_specs.md ---
    switch (chartGroup) {
        case 'AR Aging':
            // Specs: \"1-30 Days\", \"31-60 Days\", \"61-90 Days\", \"90+ Days\"
            // Assume variableName or name directly matches the aging bucket
            return variableName || name;
        case 'Accounts':
        case 'Customer Metrics':
        case 'Historical Data':
        case 'Web Orders':
        case 'POR Overview':
            // Specs: Month, for last 12 months. Need to extract month.
            // Prioritize variableName if it contains the month (e.g., \"Rental Value, Jan\")
            const monthMatch = variableName.match(/,\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i);
            if (monthMatch && monthMatch[1]) {
                // Format consistently (e.g., \"Jan\")
                return monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
            }
            // Fallback: Use the 'name' field, assuming it holds the month/date label
            if (name)
                return name;
            // Final fallback if no month found
            return variableName || chartGroup; // Less ideal, but better than empty
        case 'Daily Orders':
            // Specs: \"Today-6\", \"Today-5\", ..., \"Today\"
            // Assume 'name' or 'variableName' holds the specific day label
            return name || variableName;
        case 'Inventory':
            // Specs: \"Dept 100\", \"Dept 101\", \"Dept 102\", \"Dept 107\"
            // Assume 'name' holds the department label
            return name;
        case 'Key Metrics':
            // Specs: Single value metrics (Total Orders, Daily Revenue, etc.)
            // Use the metric's 'name' as the label (axis step isn't really applicable here)
            return name;
        case 'Site Distribution':
            // Specs: \"Columbus\", \"Addison\", \"Lake City\"
            // Assume 'name' holds the site label
            return name;
        default:
            // Fallback for any unexpected chart groups
            return variableName || name || chartGroup;
    }
}
// Update chart data
export function updateChartData(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let db;
        try {
            db = yield getDb();
            // Start transaction
            yield db.run('BEGIN TRANSACTION');
            for (const row of data) {
                yield db.run(`
        UPDATE chart_data 
        SET 
          name = ?,
          chart_group = ?,
          variable_name = ?,
          server_name = ?,
          value = ?,
          table_name = ?,
          sql_expression = ?,
          last_updated = ?,
          axis_step = ?
        WHERE id = ?
      `, [
                    row.name,
                    row.chartGroup,
                    row.variableName,
                    row.serverName,
                    row.value,
                    row.tableName,
                    row.sqlExpression,
                    row.lastUpdated,
                    row.axisStep,
                    row.id
                ]);
            }
            // Commit transaction
            yield db.run('COMMIT');
            // Clear cache
            global.chartDataCache = null;
            global.chartDataCacheVersion = null;
        }
        catch (error) {
            console.error('Error updating chart data:', error);
            // Rollback transaction
            if (db) {
                yield db.run('ROLLBACK');
            }
            throw error;
        }
    });
}
// Save spreadsheet row
export function saveSpreadsheetRow(row) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`saveSpreadsheetRow: Saving row ${row.id} with value: ${row.value}`);
            const db = yield getDb();
            yield db.run(`
      UPDATE chart_data 
      SET value = ?, last_updated = ? 
      WHERE id = ?
    `, [row.value, new Date().toISOString(), row.id]);
            // Clear cache
            global.chartDataCache = null;
            global.chartDataCacheVersion = null;
        }
        catch (error) {
            console.error('Error saving spreadsheet row:', error);
            throw error;
        }
    });
}
// Update all rows
export function updateAllRows(rows) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`updateAllRows: Updating ${rows.length} rows`);
            const db = yield getDb();
            // Start transaction
            yield db.run('BEGIN TRANSACTION');
            for (const row of rows) {
                yield db.run(`
        UPDATE chart_data 
        SET 
          name = ?,
          chart_group = ?,
          variable_name = ?,
          server_name = ?,
          value = ?,
          table_name = ?,
          sql_expression = ?,
          last_updated = ?,
          axis_step = ?
        WHERE id = ?
      `, [
                    row.name,
                    row.chartGroup,
                    row.variableName,
                    row.serverName,
                    row.value,
                    row.tableName,
                    row.sqlExpression,
                    row.lastUpdated,
                    row.axisStep,
                    row.id
                ]);
            }
            // Commit transaction
            yield db.run('COMMIT');
            // Clear cache
            global.chartDataCache = null;
            global.chartDataCacheVersion = null;
        }
        catch (error) {
            console.error('Error updating all rows:', error);
            // Rollback transaction
            const db = yield getDb();
            if (db) {
                yield db.run('ROLLBACK');
            }
            throw error;
        }
    });
}
// Initialize database tables
export function initializeDatabaseTables(db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Drop the table first to ensure schema updates are applied
            yield db.run(`DROP TABLE IF EXISTS chart_data`);
            // Create chart_data table if it doesn't exist
            yield db.run(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id TEXT PRIMARY KEY,
        name TEXT,
        chart_group TEXT,
        variable_name TEXT,
        server_name TEXT,
        value TEXT,
        table_name TEXT,
        sql_expression TEXT,
        last_updated TEXT,
        axis_step TEXT
      )
    `);
            // Add axis_step column if it doesn't exist
            const columns = yield db.all(`PRAGMA table_info(chart_data)`);
            if (!columns.some((col) => col.name === 'axis_step')) {
                yield db.run(`ALTER TABLE chart_data ADD COLUMN axis_step TEXT`);
            }
            // Update existing rows to set axis_step based on data type
            yield db.run(`
      UPDATE chart_data 
      SET axis_step = CASE
        WHEN chart_group LIKE '%Monthly%' THEN strftime('%m/%Y', last_updated)
        WHEN chart_group LIKE '%Department%' THEN variable_name
        ELSE COALESCE(variable_name, chart_group)
      END
      WHERE axis_step IS NULL
    `);
            // Create chart_groups table if it doesn't exist
            yield db.run(`
      CREATE TABLE IF NOT EXISTS chart_groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        display_order INTEGER,
        is_visible INTEGER,
        settings TEXT
      )
    `);
            // Create server_configs table if it doesn't exist
            yield db.run(`
      CREATE TABLE IF NOT EXISTS server_configs (
        id TEXT PRIMARY KEY,
        server_name TEXT,
        host TEXT,
        port INTEGER,
        database TEXT,
        username TEXT,
        password TEXT,
        is_active INTEGER,
        connection_type TEXT,
        server TEXT,
        created_at TEXT,
        updated_at TEXT,
        config TEXT
      )
    `);
        }
        catch (error) {
            console.error('Error initializing database tables:', error);
            throw error;
        }
    });
}
// Loads all database content from the single source data file
// This includes chart data, chart group settings, and connection data
export function loadDbFromInitFile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Loading database content from single source data file...');
            // Import the data directly
            const { dashboardData, chartGroupSettings, serverConfigs } = yield import('./single-source-data');
            // Get database connection
            const db = yield getDb();
            // Begin transaction
            yield db.run('BEGIN TRANSACTION');
            try {
                // Clear existing data
                yield db.run('DELETE FROM chart_data');
                yield db.run('DELETE FROM chart_groups');
                yield db.run('DELETE FROM server_configs');
                // Insert chart data
                for (const row of dashboardData) {
                    yield db.run(`INSERT INTO chart_data (
            id, name, chart_group, variable_name, server_name, value, 
            table_name, sql_expression, last_updated, axis_step
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        row.id,
                        row.name || '',
                        row.chartGroup || '',
                        row.variableName || '',
                        row.serverName || 'P21',
                        row.value || '0',
                        row.tableName || '',
                        row.sqlExpression || '',
                        row.lastUpdated || new Date().toISOString(),
                        row.axisStep || ''
                    ]);
                }
                // Insert chart group settings
                for (const group of chartGroupSettings) {
                    yield db.run(`INSERT INTO chart_groups (
            id, name, display_order, is_visible, settings
          ) VALUES (?, ?, ?, ?, ?)`, [
                        group.id,
                        group.name || '',
                        group.display_order || 0,
                        group.is_visible, // Keep as number (0/1) from DB
                        JSON.stringify(group.settings || {})
                    ]);
                }
                // Insert server configs
                for (const config of serverConfigs) {
                    yield db.run(`INSERT INTO server_configs (
            id, server_name, host, port, database, username, password,
            is_active, connection_type, server, created_at, updated_at, config
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        config.id,
                        config.server_name || '',
                        config.host || '',
                        config.port || 0,
                        config.database || '',
                        config.username || '',
                        config.password || '',
                        config.is_active, // Keep as number (0/1) from DB
                        config.connection_type || 'sqlserver',
                        config.server || '',
                        config.created_at || new Date().toISOString(),
                        config.updated_at || new Date().toISOString(),
                        JSON.stringify(config.config || {})
                    ]);
                }
                // Commit transaction
                yield db.run('COMMIT');
                console.log('Successfully loaded database content from single source data file');
                // Clear cache to force reload
                global.chartDataCache = null;
                global.chartDataCacheVersion = null;
            }
            catch (error) {
                // Rollback on error
                yield db.run('ROLLBACK');
                console.error('Error loading database content, rolling back:', error);
                throw error;
            }
        }
        catch (error) {
            console.error('Error in loadDbFromInitFile:', error);
            throw error;
        }
    });
}
/**
 * Saves all database content to the single source data file
 * This includes chart data, chart group settings, and connection data
 */
export function saveDbToInitFile() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Saving database content to single source data file...');
        try {
            const db = yield getDb();
            // Get all chart data with proper aliases to match the SpreadsheetRow interface
            const chartData = yield db.all(`
      SELECT 
        id,
        variable_name as name,
        chart_group as chartGroup,
        variable_name as variableName,
        server_name as serverName,
        value,
        table_name as tableName,
        sql_expression as sqlExpression,
        last_updated as lastUpdated,
        axis_step as axisStep
      FROM chart_data
      ORDER BY id ASC
    `);
            console.log(`Retrieved ${chartData.length} rows of chart data`);
            // Process chart data to ensure all fields have valid values
            const processedChartData = chartData.map(row => ({
                id: row.id || '',
                name: row.name || '',
                chartGroup: row.chartGroup || '',
                variableName: row.variableName || '',
                serverName: row.serverName || '',
                value: row.value || '0',
                tableName: row.tableName || '',
                sqlExpression: row.sqlExpression || '',
                lastUpdated: row.lastUpdated || new Date().toISOString(),
                axisStep: row.axisStep || ''
            }));
            // Get chart group settings
            const chartGroupSettings = yield db.all(`
      SELECT 
        id,
        name,
        display_order,
        is_visible,
        settings
      FROM chart_groups
    `);
            console.log(`Retrieved ${chartGroupSettings.length} chart group settings`);
            // Process chart group settings
            const processedChartGroupSettings = chartGroupSettings.map(setting => ({
                id: setting.id || '',
                name: setting.name || '',
                display_order: setting.display_order || 0,
                is_visible: setting.is_visible, // Keep as number (0/1) from DB
                settings: JSON.parse(setting.settings || '{}')
            }));
            // Get server configs
            const serverConfigs = yield db.all(`
      SELECT 
        id,
        server_name,
        host,
        port,
        database,
        username,
        password,
        is_active,
        connection_type,
        server,
        created_at,
        updated_at,
        config
      FROM server_configs
    `);
            console.log(`Retrieved ${serverConfigs.length} server configs`);
            // Process server configs
            const processedServerConfigs = serverConfigs.map(config => {
                let configObj = {};
                try {
                    configObj = JSON.parse(config.config || '{}');
                }
                catch (error) {
                    console.warn(`Error parsing config for server ${config.server}:`, error);
                }
                return {
                    id: config.id || '',
                    server_name: config.server_name || '',
                    host: config.host || '',
                    port: config.port || 0,
                    database: config.database || '',
                    username: config.username || '',
                    password: config.password || '',
                    is_active: config.is_active,
                    connection_type: config.connection_type || 'sqlserver',
                    server: config.server || '',
                    created_at: config.created_at || new Date().toISOString(),
                    updated_at: config.updated_at || new Date().toISOString(),
                    config: configObj
                };
            });
            // Generate the file content
            const timestamp = new Date().toISOString();
            const fileContent = `/**
 * SINGLE SOURCE OF TRUTH for dashboard data
 * 
 * This file contains all SQL expressions, chart configurations, and server settings
 * for the Tallman Dashboard. This is the authoritative source that the database
 * will be initialized from.
 * 
 * When changes are made to the database through the admin interface, the "Save DB"
 * button will update this file directly.
 * 
 * When the "Load DB" button is clicked, the database will be populated from this file.
 * 
 * Last updated: ${timestamp}
 */

import type { ChartGroupSetting, ServerConfig } from './types';

// Chart data for the dashboard
export const dashboardData: any[] = ${JSON.stringify(processedChartData, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
            // Write the file
            const filePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
            fs.writeFileSync(filePath, fileContent);
            console.log(`Successfully saved database content to: ${filePath}`);
        }
        catch (error) {
            console.error('Error saving database content to single source data file:', error);
            throw error;
        }
    });
}
// Keep aliases for backward compatibility
export { loadDbFromInitFile as loadChartDataFromInitFile };
export { saveDbToInitFile as saveChartDataToInitFile };
// Helper functions for default values
function getDefaultTableName(metricName) {
    const name = metricName.toLowerCase();
    if (name.includes('revenue') || name.includes('sales')) {
        return 'invoice_hdr';
    }
    else if (name.includes('order') || name.includes('orders')) {
        return 'order_hdr';
    }
    else if (name.includes('customer') || name.includes('customers')) {
        return 'customer_mst';
    }
    else if (name.includes('inventory') || name.includes('stock')) {
        return 'inv_mst';
    }
    else if (name.includes('web')) {
        return 'web_order_hdr';
    }
    else if (name.includes('aging') || name.includes('receivable')) {
        return 'ar_open_items';
    }
    else if (name.includes('payable')) {
        return 'ap_open_items';
    }
    else if (name.includes('site') || name.includes('distribution')) {
        return 'location_mst';
    }
    // Default table
    return 'dashboard_metrics';
}
function getDefaultProductionSql(metricName) {
    const name = metricName.toLowerCase();
    if (name.includes('revenue') || name.includes('total revenue')) {
        return `SELECT SUM(invoice_total) 
FROM invoice_hdr 
WHERE invoice_date >= DATEADD(month, -1, GETDATE())`;
    }
    else if (name.includes('total orders')) {
        return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
    }
    else if (name.includes('active customers')) {
        return `SELECT COUNT(DISTINCT customer_id) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -3, GETDATE())`;
    }
    else if (name.includes('average order')) {
        return `SELECT AVG(order_total) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
    }
    else if (name.includes('web orders')) {
        return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_source = 'WEB' AND order_date >= DATEADD(month, -1, GETDATE())`;
    }
    else if (name.includes('inventory value')) {
        return `SELECT SUM(qty_on_hand * avg_cost) 
FROM inv_mst`;
    }
    else if (name.includes('aging') && name.includes('amount')) {
        if (name.includes('1-30') || name.includes('30')) {
            return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
        }
        else if (name.includes('31-60') || name.includes('60')) {
            return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
        }
        else if (name.includes('61-90') || name.includes('90')) {
            return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
        }
        else if (name.includes('90+') || name.includes('over')) {
            return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due > 90`;
        }
    }
    else if (name.includes('aging') && name.includes('count')) {
        if (name.includes('1-30') || name.includes('30')) {
            return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
        }
        else if (name.includes('31-60') || name.includes('60')) {
            return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
        }
        else if (name.includes('61-90') || name.includes('90')) {
            return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
        }
        else if (name.includes('90+') || name.includes('over')) {
            return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due > 90`;
        }
    }
    // Default SQL
    return `SELECT COUNT(*) FROM ${getDefaultTableName(metricName)} WHERE 1=1`;
}
function getDefaultTransformer(metricName) {
    const name = metricName.toLowerCase();
    if (name.includes('revenue') || name.includes('value') || name.includes('amount')) {
        return 'currency';
    }
    else if (name.includes('count') || name.includes('orders') || name.includes('customers')) {
        return 'number';
    }
    else if (name.includes('percent') || name.includes('rate')) {
        return 'percent';
    }
    // Default transformer
    return 'number';
}
// Helper function to normalize SQL expressions with embedded newlines and brackets
function normalizeSqlExpression(sql) {
    if (!sql)
        return '';
    // Replace newlines and extra spaces
    let normalizedSql = sql.replace(/\s+/g, ' ').trim();
    // Fix MS Access date functions that might be split across lines
    normalizedSql = normalizedSql.replace(/DatePart\(\s*'m'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('m', [RentalDate])");
    normalizedSql = normalizedSql.replace(/DatePart\(\s*'yyyy'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('yyyy', [RentalDate])");
    return normalizedSql;
}
// Test SQLite connection
export function testSqliteConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // First try the main SQLite database
            const db = yield getDb();
            // Simple test query
            yield db.get('SELECT 1 as test');
            // Close the connection
            // await (db as any).close();
            // Also test the test database initialization
            try {
                const { initTestDb } = require('./test-db');
                yield initTestDb();
                console.log('Test database initialized successfully during connection test');
            }
            catch (testDbError) {
                console.warn('Test database initialization warning:', testDbError);
                // Don't fail the connection test if test DB fails
            }
            return { isConnected: true };
        }
        catch (error) {
            console.error('SQLite connection test failed:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            return {
                isConnected: false,
                error: error instanceof Error ? error.message : 'Failed to connect to SQLite database'
            };
        }
    });
}
// Check database health
export function checkDatabaseHealth() {
    return __awaiter(this, void 0, void 0, function* () {
        const status = {
            isHealthy: false,
            lastChecked: new Date(),
            error: undefined,
            details: {
                fileAccessible: false,
                walModeEnabled: false,
                foreignKeysEnabled: false,
                tablesInitialized: false
            }
        };
        try {
            const db = yield getDb();
            // Check if the database file is accessible
            status.details.fileAccessible = fs.existsSync(dbConfig.filename);
            // Check if WAL mode is enabled
            const walModeResult = yield db.get('PRAGMA journal_mode');
            status.details.walModeEnabled = walModeResult.journal_mode === 'wal';
            // Check if foreign keys are enabled
            const foreignKeysResult = yield db.get('PRAGMA foreign_keys');
            status.details.foreignKeysEnabled = foreignKeysResult.foreign_keys === 1;
            // Check if tables are initialized
            const tablesResult = yield db.all('SELECT name FROM sqlite_master WHERE type="table"');
            status.details.tablesInitialized = tablesResult.length > 0;
            // Update the overall health status
            status.isHealthy = status.details.fileAccessible && status.details.walModeEnabled && status.details.foreignKeysEnabled && status.details.tablesInitialized;
        }
        catch (error) {
            status.error = error.message;
        }
        return status;
    });
}
