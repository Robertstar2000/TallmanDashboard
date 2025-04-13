import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const DATA_DIR = path.dirname(DB_PATH);
// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
let db;
export const getDb = () => {
    if (!db) {
        try {
            db = new Database(DB_PATH, { /* verbose: console.log */});
            console.log('Database connection established successfully.');
            // Ensure table exists
            db.exec(`
        CREATE TABLE IF NOT EXISTS chart_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rowId TEXT UNIQUE NOT NULL,
          chartGroup TEXT,
          chartName TEXT,
          variableName TEXT,
          DataPoint TEXT, -- Renamed from 'name' based on memory
          serverName TEXT,
          tableName TEXT,
          productionSqlExpression TEXT,
          value REAL DEFAULT 0,
          lastUpdated TEXT,
          calculationType TEXT,
          axisStep TEXT
        );
      `);
            // Add other necessary initializations if needed
        }
        catch (error) {
            console.error('Failed to connect to or initialize the database:', error);
            throw new Error('Database initialization failed');
        }
    }
    return db;
};
export const closeDb = () => {
    if (db) {
        db.close();
        console.log('Database connection closed.');
    }
};
// Function to get all chart data (consider pagination for large datasets)
export const getAllChartData = () => {
    const dbInstance = getDb();
    try {
        const stmt = dbInstance.prepare('SELECT * FROM chart_data ORDER BY id ASC');
        const data = stmt.all();
        return data;
    }
    catch (error) {
        console.error('Error fetching all chart data:', error);
        throw error; // Re-throw the error
    }
};
// Alias for getAllChartData, assuming admin spreadsheet views the same data
export const getAllSpreadsheetData = () => {
    const dbInstance = getDb();
    try {
        // TODO: Verify if SpreadsheetRow structure differs significantly from ChartDataRow
        // If they differ, add necessary transformations or query specific columns.
        const stmt = dbInstance.prepare('SELECT * FROM chart_data ORDER BY id ASC');
        const data = stmt.all();
        return data;
    }
    catch (error) {
        console.error('Error fetching data for admin spreadsheet:', error);
        throw error; // Re-throw the error
    }
};
// Function to update a single row's value
export const updateChartDataValue = (rowId, value) => {
    const dbInstance = getDb();
    try {
        const stmt = dbInstance.prepare('UPDATE chart_data SET value = ?, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?');
        const info = stmt.run(value, rowId);
        return info.changes > 0;
    }
    catch (error) {
        console.error(`Error updating value for rowId ${rowId}:`, error);
        return false;
    }
};
// Function to update multiple fields of a row (e.g., for admin edits)
export const updateChartDataRow = (rowId, data) => {
    const dbInstance = getDb();
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'rowId' && key !== 'lastUpdated');
    if (fields.length === 0) {
        console.warn('No fields provided to update for rowId:', rowId);
        return false;
    }
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(rowId); // Add rowId for the WHERE clause
    try {
        const stmt = dbInstance.prepare(`UPDATE chart_data SET ${setClause}, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?`);
        const info = stmt.run(...values);
        console.log(`Updated row ${rowId}. Changes: ${info.changes}`);
        return info.changes > 0;
    }
    catch (error) {
        console.error(`Error updating row ${rowId}:`, error);
        return false;
    }
};
// Function to replace all chart data (used for loading from init file)
export const replaceAllChartData = (data) => {
    const dbInstance = getDb();
    const insertStmt = dbInstance.prepare(`
    INSERT INTO chart_data (rowId, chartGroup, chartName, variableName, DataPoint, serverName, tableName, productionSqlExpression, value, calculationType, axisStep)
    VALUES (@rowId, @chartGroup, @chartName, @variableName, @DataPoint, @serverName, @tableName, @productionSqlExpression, @value, @calculationType, @axisStep)
  `);
    const transaction = dbInstance.transaction((rows) => {
        dbInstance.exec('DELETE FROM chart_data'); // Clear existing data
        dbInstance.exec('DELETE FROM sqlite_sequence WHERE name=\'chart_data\''); // Reset auto-increment
        for (const row of rows) {
            insertStmt.run(row);
        }
    });
    try {
        transaction(data);
        console.log(`Successfully replaced all chart data with ${data.length} rows.`);
        return true;
    }
    catch (error) {
        console.error('Error replacing chart data:', error);
        return false;
    }
};
// Function to update spreadsheet data in the chart_data table
export function updateSpreadsheetData(data) {
    if (!db) {
        throw new Error("Database connection not initialized.");
    }
    // Prepare the UPDATE statement
    // Make sure to include all columns that can be edited from the spreadsheet
    const updateStmt = db.prepare(`
    UPDATE chart_data
    SET
      chartGroup = ?,
      variableName = ?,
      DataPoint = ?,
      serverName = ?,
      tableName = ?,
      productionSqlExpression = ?,
      calculationType = ?,
      chartName = ?,  -- Added chartName
      axisStep = ?,   -- Added axisStep
      lastUpdated = ? -- Update lastUpdated timestamp
    WHERE id = ?
  `);
    // Use a transaction for atomicity
    const updateMany = db.transaction((rows) => {
        for (const row of rows) {
            // Ensure row.id is treated as a number for the WHERE clause if needed,
            // though better-sqlite3 often handles type coercion.
            // Ensure types match the prepare statement placeholders.
            const params = [
                row.chartGroup,
                row.variableName,
                row.DataPoint,
                row.serverName,
                row.tableName,
                row.productionSqlExpression,
                row.calculationType,
                row.chartName, // Pass chartName
                row.axisStep, // Pass axisStep
                new Date().toISOString(), // Update lastUpdated time
                row.id // For the WHERE clause
            ];
            // Log parameters being sent for a specific row for debugging
            // if (row.id === 'some_specific_id_to_debug') {
            //   console.log(`Updating row ${row.id} with params:`, params);
            // }
            try {
                updateStmt.run(params);
            }
            catch (err) {
                console.error(`Failed to update row with id ${row.id}:`, err);
                console.error('Row data:', row);
                // Re-throw the error to rollback the transaction
                throw err;
            }
        }
    });
    try {
        console.log(`Starting transaction to update ${data.length} rows...`);
        updateMany(data);
        console.log(`Successfully updated ${data.length} rows.`);
    }
    catch (error) {
        console.error('Transaction failed during spreadsheet data update:', error);
        // Re-throw the error so the API route can catch it and respond appropriately
        throw error;
    }
}
// Basic setup requires a types file. Let's create a placeholder.
export const ensureTypesFile = () => {
    const TYPES_PATH = path.join(process.cwd(), 'lib', 'db', 'types.ts');
    if (!fs.existsSync(TYPES_PATH)) {
        const content = `
export interface ChartDataRow {
  id: number;
  rowId: string; // e.g., row_001
  chartGroup: string; // e.g., "Key Metrics"
  chartName: string;
  variableName: string; // e.g., "Total Orders"
  DataPoint: string; // e.g., "Total Orders, Current"
  serverName: 'P21' | 'POR';
  tableName: string | null;
  productionSqlExpression: string | null;
  value: number | null;
  lastUpdated: string | null;
  calculationType: 'SUM' | 'AVG' | 'COUNT' | 'LATEST' | null; // How value is derived/used
  axisStep: string;
}

export interface SpreadsheetRow {
  // Add properties for SpreadsheetRow
}

export interface ConnectionConfig {
  serverType: 'P21' | 'POR';
  serverAddress: string;
  databaseName: string;
  userName?: string; // Optional depending on auth
  password?: string; // Optional depending on auth
  // Add other relevant connection parameters like port, options, etc.
}
`;
        fs.writeFileSync(TYPES_PATH, content, 'utf8');
        console.log('Created placeholder lib/db/types.ts');
    }
};
ensureTypesFile(); // Ensure the types file exists on module load
