var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { open } from 'sqlite';
import { combinedSpreadsheetData } from './combined-spreadsheet-data';
// Default server configurations
const defaultServerConfigs = [
    {
        id: 'p21',
        name: 'P21',
        host: 'localhost',
        port: 1433,
        username: 'sa',
        password: 'password',
        database: 'P21',
        is_active: 1,
        connection_type: 'mssql'
    },
    {
        id: 'por',
        name: 'POR',
        host: 'localhost',
        port: 0,
        username: '',
        password: '',
        database: 'POR',
        is_active: 1,
        connection_type: 'msaccess'
    }
];
// Sample chart groups for initialization
const chartGroups = [
    {
        id: 'historical-data',
        name: 'Historical Data',
        display_order: 1,
        is_visible: 1,
        settings: {}
    },
    {
        id: 'key-metrics',
        name: 'Key Metrics',
        display_order: 2,
        is_visible: 1,
        settings: {}
    },
    {
        id: 'accounts-payable',
        name: 'Accounts Payable',
        display_order: 3,
        is_visible: 1,
        settings: {}
    }
];
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
// Function to create the chart data table
export function createChartDataTable(db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db.exec(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id TEXT PRIMARY KEY,
        DataPoint TEXT,
        chart_name TEXT,
        chart_group TEXT,
        variable_name TEXT,
        serverName TEXT,
        db_table_name TEXT,
        calculation TEXT,
        value TEXT,
        last_updated TEXT
      );
    `);
            console.log('Chart data table created successfully');
        }
        catch (error) {
            console.error('Error creating chart data table:', error);
            throw error;
        }
    });
}
// Function to insert chart data
export function insertChartData(db, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Begin a transaction
            yield db.exec('BEGIN TRANSACTION');
            for (const row of data) {
                try {
                    // Insert the chart data
                    yield db.run(`INSERT INTO chart_data (
            id, 
            DataPoint,
            chart_name,
            chart_group, 
            variable_name, 
            serverName, 
            db_table_name, 
            calculation,
            value, 
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        row.id,
                        row.DataPoint || '',
                        row.chartName || '',
                        row.chartGroup || '',
                        row.variableName || '',
                        row.serverName || 'P21',
                        row.tableName || '',
                        row.calculation || 'number',
                        row.value || '0',
                        row.lastUpdated || new Date().toISOString()
                    ]);
                }
                catch (error) {
                    console.error(`Error inserting chart data for row ${row.id}:`, error);
                    // Continue with the next row
                }
            }
            // Commit the transaction
            yield db.exec('COMMIT');
            console.log(`Inserted ${data.length} chart data rows`);
        }
        catch (error) {
            // Rollback the transaction in case of error
            yield db.exec('ROLLBACK');
            console.error('Error inserting chart data:', error);
            throw error;
        }
    });
}
/**
 * Initialize the database with the combined spreadsheet data
 * @param dbPath Path to the SQLite database file
 */
export function initializeDatabase(dbPath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Initializing database at ${dbPath}`);
        try {
            // Open the database
            const db = yield open({
                filename: dbPath,
                driver: require('sqlite3').Database
            });
            console.log('Database opened successfully');
            // Create tables if they don't exist
            yield db.exec(`
      CREATE TABLE IF NOT EXISTS chart_group_settings (
        id TEXT PRIMARY KEY,
        name TEXT,
        display_order INTEGER,
        is_visible INTEGER,
        settings TEXT
      );
      
      CREATE TABLE IF NOT EXISTS server_config (
        id TEXT PRIMARY KEY,
        name TEXT,
        host TEXT,
        port INTEGER,
        username TEXT,
        password TEXT,
        database TEXT,
        is_active INTEGER,
        connection_type TEXT
      );
    `);
            yield createChartDataTable(db);
            console.log('Database tables created successfully');
            // Clear existing data
            yield db.exec(`
      DELETE FROM chart_data;
      DELETE FROM chart_group_settings;
      DELETE FROM server_config;
    `);
            console.log('Existing data cleared successfully');
            // Insert chart data
            yield insertChartData(db, combinedSpreadsheetData);
            // Insert chart group settings
            const chartGroupStmt = yield db.prepare(`
      INSERT INTO chart_group_settings (
        id, name, display_order, is_visible, settings
      ) VALUES (?, ?, ?, ?, ?)
    `);
            for (const group of chartGroups) {
                yield chartGroupStmt.run(group.id, group.name, group.display_order, group.is_visible, JSON.stringify(group.settings));
            }
            yield chartGroupStmt.finalize();
            console.log(`Inserted ${chartGroups.length} chart group settings`);
            // Insert server configurations
            const serverConfigStmt = yield db.prepare(`
      INSERT INTO server_config (
        id, name, host, port, username, password, database, is_active, connection_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
            for (const config of defaultServerConfigs) {
                yield serverConfigStmt.run(config.id, config.name, config.host, config.port, config.username, config.password, config.database, config.is_active, config.connection_type);
            }
            yield serverConfigStmt.finalize();
            console.log(`Inserted ${defaultServerConfigs.length} server configurations`);
            // Close the database
            yield db.close();
            console.log('Database closed successfully');
        }
        catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    });
}
