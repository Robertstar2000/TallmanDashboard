import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import odbc from 'odbc'; // Corrected: Use regular import for runtime usage
const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const DATA_DIR = path.dirname(DB_PATH);
// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Helper function to create the table if it doesn't exist
const ensureTableExists = (dbInstance) => {
    dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS chart_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rowId TEXT UNIQUE NOT NULL,
      chartGroup TEXT,
      chartName TEXT,
      variableName TEXT,
      DataPoint TEXT,
      serverName TEXT,
      tableName TEXT,
      productionSqlExpression TEXT,
      value REAL DEFAULT 0,
      lastUpdated TEXT,
      calculationType TEXT,
      axisStep TEXT
    );
  `);
};
// Function to get all chart data (consider pagination for large datasets)
export const getAllChartData = () => {
    let dbInstance = null;
    try {
        dbInstance = new Database(DB_PATH);
        ensureTableExists(dbInstance);
        console.log('[getAllChartData] Preparing to execute SELECT * FROM chart_data'); // Added log
        const stmt = dbInstance.prepare('SELECT * FROM chart_data ORDER BY id ASC');
        const data = stmt.all();
        return data;
    }
    catch (error) {
        console.error('Error fetching all chart data:', error);
        throw error; // Re-throw the error
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
// Alias for getAllChartData, assuming admin spreadsheet views the same data
export const getAllSpreadsheetData = () => {
    // This simply calls the modified getAllChartData
    return getAllChartData();
};
// Function to update a single row's value
export const updateChartDataValue = (rowId, value) => {
    let dbInstance = null;
    try {
        dbInstance = new Database(DB_PATH);
        ensureTableExists(dbInstance);
        const stmt = dbInstance.prepare('UPDATE chart_data SET value = ?, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?');
        const info = stmt.run(value, rowId);
        return info.changes > 0;
    }
    catch (error) {
        console.error(`Error updating value for rowId ${rowId}:`, error);
        return false;
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
// Function to update multiple fields of a row (e.g., for admin edits)
export const updateChartDataRow = (rowId, data) => {
    let dbInstance = null;
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'rowId' && key !== 'lastUpdated');
    if (fields.length === 0) {
        console.warn('No fields provided to update for rowId:', rowId);
        return false;
    }
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(rowId); // Add rowId for the WHERE clause
    try {
        dbInstance = new Database(DB_PATH);
        if (!dbInstance)
            throw new Error("Failed to create DB instance"); // Added null check
        ensureTableExists(dbInstance);
        const stmt = dbInstance.prepare(`UPDATE chart_data SET ${setClause}, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?`);
        const info = stmt.run(...values);
        console.log(`Updated row ${rowId}. Changes: ${info.changes}`);
        return info.changes > 0;
    }
    catch (error) {
        console.error(`Error updating row ${rowId}:`, error);
        return false;
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
// Function to replace all chart data (used for loading from init file)
export const replaceAllChartData = (data) => {
    let dbInstance = null;
    try {
        dbInstance = new Database(DB_PATH);
        if (!dbInstance)
            throw new Error("Failed to create DB instance"); // Added null check
        ensureTableExists(dbInstance);
        const insertStmt = dbInstance.prepare(`
      INSERT INTO chart_data (rowId, chartGroup, chartName, variableName, DataPoint, serverName, tableName, productionSqlExpression, value, calculationType, axisStep)
      VALUES (@rowId, @chartGroup, @chartName, @variableName, @DataPoint, @serverName, @tableName, @productionSqlExpression, @value, @calculationType, @axisStep)
    `);
        const transaction = dbInstance.transaction((rows) => {
            if (!dbInstance)
                throw new Error("DB instance not available in transaction"); // Added null check
            dbInstance.exec('DELETE FROM chart_data'); // Clear existing data
            dbInstance.exec('DELETE FROM sqlite_sequence WHERE name=\'chart_data\''); // Reset auto-increment
            for (const row of rows) {
                insertStmt.run(row);
            }
        });
        console.log('[replaceAllChartData] Executing transaction...'); // Added log
        transaction(data);
        console.log(`[replaceAllChartData] Transaction completed. Successfully replaced all chart data with ${data.length} rows.`); // Modified log
        return true;
    }
    catch (error) {
        console.error('Error replacing chart data:', error);
        return false;
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
// Function to update spreadsheet data in the chart_data table
export function updateSpreadsheetData(data) {
    let dbInstance = null;
    try {
        dbInstance = new Database(DB_PATH);
        if (!dbInstance)
            throw new Error("Failed to create DB instance"); // Added null check
        ensureTableExists(dbInstance);
        // Prepare the UPDATE statement
        // Make sure to include all columns that can be edited from the spreadsheet
        const updateStmt = dbInstance.prepare(`
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
        const updateMany = dbInstance.transaction((rows) => {
            if (!dbInstance)
                throw new Error("DB instance not available in transaction"); // Added null check
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
    finally {
        // Ensure the database connection is closed
        if (dbInstance) {
            dbInstance.close();
        }
    }
}
// --- External Database Connection Testing (Server-Side) ---
/**
 * Tests the connection to a P21 database using provided connection details.
 */
export const testP21ConnectionServer = async (connectionDetails) => {
    // Using a predefined DSN for P21Play
    const dsnName = "P21Play";
    // Connection details like server/database might still be useful for logging or other purposes
    // but are not used for the connection string itself when using a DSN.
    const { server, database, username, password } = connectionDetails;
    // Note: When using a DSN, authentication details (username/password or trusted connection)
    // are typically configured within the DSN settings in the ODBC Data Source Administrator.
    // The connection string here might need adjustment based on how P21Play DSN is set up.
    // For now, we'll just use the DSN name.
    let connectionString = `DSN=${dsnName};`;
    // Add standard options if needed and not covered by DSN
    // connectionString += 'Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;';
    console.log(`Attempting to connect to P21 using DSN: ${dsnName}`);
    let connection = null;
    try {
        // Dynamically import odbc only when needed
        const odbc = await import('odbc');
        console.log('ODBC module imported successfully for P21.');
        connection = await odbc.connect(connectionString);
        console.log(`Successfully connected to P21 using DSN: ${dsnName}`);
        // Optional: Execute a simple query to verify connection health
        await connection.query('SELECT 1');
        console.log(`Test query executed successfully on P21 via DSN: ${dsnName}.`);
        return { success: true, message: `P21 connection successful using DSN: ${dsnName}!` };
    }
    catch (error) {
        // Error during connection or query execution
        console.error(`Error testing P21 connection using DSN ${dsnName}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Unknown P21 connection error with DSN ${dsnName}.`;
        return { success: false, message: `P21 connection failed using DSN ${dsnName}: ${errorMessage}` };
    }
    finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`P21 connection (DSN: ${dsnName}) closed.`);
            }
            catch (closeError) {
                console.error(`Error closing P21 connection (DSN: ${dsnName}):`, closeError);
            }
        }
    }
};
/**
 * Tests the connection to a POR database (MS Access) using provided file path.
 */
export const testPORConnectionServer = async (connectionDetails) => {
    const { filePath, password } = connectionDetails;
    if (!filePath) {
        const errorMsg = 'File path is required for POR test.';
        console.error(errorMsg);
        return { success: false, message: errorMsg };
    }
    console.log("Attempting to connect to POR (ODBC):", {
        driver: '{Microsoft Access Driver (*.mdb)}', // Or the specific driver name if known
        dbq: filePath, // Corrected: Use filePath for Access DB path
        uid: '', // No username for Access
        // Password should not be logged
    });
    let connection = null;
    try {
        // Dynamically import the odbc library only when needed
        const odbc = await import('odbc');
        console.log('odbc library loaded dynamically.');
        // Construct the connection string
        // Note: The exact format might vary based on the specific ODBC driver and Access version.
        // UID and PWD might not be needed if the database isn't password protected.
        // Simplifying driver based on user request - might need adjustment if file is .accdb
        // let connectionString = `Driver={Microsoft Access Driver (*.mdb)};DBQ=${filePath};` // Corrected: Use filePath
        // Original: let connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
        // Updated based on MS documentation for 2016 Redistributable
        let connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
        if (password) {
            // WARNING: Including password directly in the string is insecure.
            // Consider secure methods if applicable (e.g., Windows authentication if possible).
            connectionString += `Pwd=${password};`;
        }
        console.log('ODBC Connection String (Password Omitted):', connectionString.replace(/Pwd=.*?;/, 'Pwd=****;'));
        try {
            // Connection parameters object including timeout
            const connectionParams = {
                connectionString: connectionString,
                connectionTimeout: 5 // Timeout in seconds
            };
            console.log(`Attempting ODBC connection with timeout: ${connectionParams.connectionTimeout} seconds.`);
            connection = await odbc.connect(connectionParams);
            console.log('POR (ODBC) Connection successful.');
            // Optional: Run a simple query to further verify
            // For Access SQL, table/column names with spaces need brackets []
            // Using a known system table (MSysObjects) if available, otherwise a simple SELECT 1
            try {
                const result = await connection.query('SELECT Count(*) AS test FROM MSysObjects');
                console.log('POR (ODBC) Test query successful:', result);
            }
            catch (queryError) {
                console.warn('POR (ODBC) Test query failed (this might be expected if MSysObjects is restricted):', queryError);
                // If the above fails, try a simpler query
                // await connection.query('SELECT 1');
            }
            return { success: true, message: 'POR (ODBC) connection successful.' };
        }
        catch (connectionError) {
            console.error('POR (ODBC) Connection failed:', connectionError);
            const errMsg = connectionError instanceof Error ? connectionError.message : 'Unknown POR connection error.';
            // Check for common errors
            if (errMsg.includes('Data source name not found')) {
                return { success: false, message: `POR (ODBC) connection failed: Data source name not found or driver not installed correctly.` };
            }
            else if (errMsg.includes('Invalid authorization specification')) {
                return { success: false, message: `POR (ODBC) connection failed: Invalid username or password.` };
            }
            return { success: false, message: `POR (ODBC) connection failed: ${errMsg}` };
        }
    }
    catch (importError) {
        console.error('Failed to dynamically import odbc library:', importError);
        return { success: false, message: 'Internal server error: Failed to load ODBC driver.' };
    }
    finally {
        if (connection) {
            try {
                await connection.close();
                console.log('POR (ODBC) connection closed.');
            }
            catch (closeError) {
                console.error('Error closing POR (ODBC) connection:', closeError);
            }
        }
    }
};
// --- Admin Variable Functions (Server-Side) ---
/**
 * Retrieves all rows from the admin_variables table, mapped to ServerConfig type.
 */
export const getAdminVariables = () => {
    let dbInstance = null;
    try {
        dbInstance = new Database(DB_PATH);
        if (!dbInstance)
            throw new Error("Failed to create DB instance"); // Added null check
        // Ensure the admin_variables table exists (consider moving schema setup elsewhere)
        dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS admin_variables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value TEXT,
        description TEXT,
        type TEXT CHECK(type IN ('P21', 'POR', 'LOCAL', 'Other')) DEFAULT 'Other',
        is_active INTEGER DEFAULT 1, -- SQLite uses INTEGER for BOOLEAN
        last_updated TEXT
      );
    `);
        const stmt = dbInstance.prepare('SELECT id, name, type, value, description, is_active, last_updated FROM admin_variables');
        const rows = stmt.all(); // Cast to any[] initially
        // Manually map to ServerConfig, handling potential nulls and type conversions
        const results = rows.map(row => ({
            id: String(row.id), // Ensure ID is string
            name: String(row.name),
            // Ensure type is one of the allowed literals
            type: ['P21', 'POR', 'LOCAL', 'Other'].includes(row.type) ? row.type : 'Other',
            value: row.value !== null ? String(row.value) : null,
            description: row.description !== null ? String(row.description) : null,
            isActive: Boolean(row.is_active), // Convert SQLite INTEGER (0/1) to boolean
            // Ensure lastUpdated is a string or null
            lastUpdated: row.last_updated !== null ? String(row.last_updated) : null,
        }));
        console.log(`Server: Fetched ${results.length} rows from admin_variables.`);
        return results;
    }
    catch (error) {
        console.error('Server: Failed to get admin variables:', error);
        return []; // Return empty array on error
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
/**
 * Updates a specific row in the admin_variables table.
 */
export const updateAdminVariable = (id, data) => {
    let dbInstance = null;
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'lastUpdated');
    if (fields.length === 0) {
        console.warn('No fields provided to update for admin variable ID:', id);
        return false;
    }
    // Build the SET part of the SQL query dynamically
    const setClauses = [];
    const params = [];
    // Map ServerConfig fields to database column names
    const fieldMap = {
        name: 'name',
        type: 'type',
        value: 'value',
        description: 'description',
        isActive: 'is_active',
        // 'lastUpdated' is handled separately
    };
    for (const key in data) {
        const typedKey = key;
        const dbColumn = fieldMap[typedKey];
        if (dbColumn && data[typedKey] !== undefined) {
            setClauses.push(`${dbColumn} = ?`);
            // Handle boolean conversion for SQLite
            if (typedKey === 'isActive') {
                params.push(data[typedKey] ? 1 : 0);
            }
            else {
                params.push(data[typedKey]);
            }
        }
    }
    // Add a last_updated timestamp automatically
    setClauses.push('last_updated = CURRENT_TIMESTAMP');
    if (setClauses.length <= 1) { // Only the last_updated clause was added
        console.warn('Server: updateAdminVariable called with no valid fields to update.');
        return false;
    }
    // Add the ID for the WHERE clause
    params.push(id);
    const sql = `UPDATE admin_variables SET ${setClauses.join(', ')} WHERE id = ?`;
    try {
        dbInstance = new Database(DB_PATH);
        if (!dbInstance)
            throw new Error("Failed to create DB instance"); // Added null check
        // No need to ensureTableExists here if it's guaranteed elsewhere
        const stmt = dbInstance.prepare(sql);
        const info = stmt.run(params);
        console.log(`Server: Admin variable ${id} update result: ${info.changes} changes.`);
        return info.changes > 0;
    }
    catch (error) {
        console.error(`Server: Failed to update admin variable ${id}:`, error);
        return false; // Indicate failure
        // Consider throwing the error depending on how the API route should handle it
    }
    finally {
        if (dbInstance) {
            dbInstance.close();
        }
    }
};
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
/**
 * Executes a read-only SQL query against the P21 database using the configured DSN.
 */
export const executeP21QueryServer = async (sqlQuery) => {
    const startTime = Date.now();
    const dsnName = "P21Play"; // Hardcoded DSN from test function
    let connection = null;
    console.log(`Attempting to execute P21 query using DSN: ${dsnName}`);
    try {
        // Note: Security check (isQuerySafe) should happen in the API route BEFORE calling this
        connection = await odbc.connect(`DSN=${dsnName};`);
        console.log(`Connected to P21 using DSN: ${dsnName} for query execution.`);
        const result = await connection.query(sqlQuery);
        const executionTime = Date.now() - startTime;
        console.log(`P21 query executed via DSN ${dsnName} in ${executionTime}ms.`);
        const data = result; // Assuming result is an array of objects
        let columns = [];
        if (data.length > 0) {
            columns = Object.keys(data[0]);
        }
        return {
            success: true,
            data: data,
            columns: columns,
            message: `Query executed successfully on P21. Found ${data.length} rows.`,
            executionTime: executionTime,
        };
    }
    catch (error) {
        console.error(`Error executing P21 query using DSN ${dsnName}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Unknown P21 query execution error with DSN ${dsnName}.`;
        return {
            success: false,
            error: `P21 query execution failed using DSN ${dsnName}: ${errorMessage}`,
            executionTime: Date.now() - startTime
        };
    }
    finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`P21 connection (DSN: ${dsnName}) closed after query.`);
            }
            catch (closeError) {
                console.error(`Error closing P21 connection (DSN: ${dsnName}) after query:`, closeError);
            }
        }
    }
};
/**
 * Executes a read-only SQL query against the POR database (MS Access) using file path.
 */
export const executePORQueryServer = async (filePath, password, sqlQuery) => {
    const startTime = Date.now();
    if (!filePath) {
        return { success: false, error: 'File path is required for POR query.' };
    }
    console.log(`Attempting to execute POR query on file: ${filePath}`);
    let connection = null;
    try {
        // Note: Security check (isQuerySafe) should happen in the API route BEFORE calling this
        // Construct connection string (similar to test function)
        let connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
        if (password) {
            connectionString += `Pwd=${password};`;
        }
        console.log('POR ODBC Connection String for Query (Password Omitted):', connectionString.replace(/Pwd=.*?;/, 'Pwd=****;'));
        const connectionParams = {
            connectionString: connectionString,
            connectionTimeout: 10 // Slightly longer timeout for queries?
        };
        connection = await odbc.connect(connectionParams);
        console.log(`Connected to POR DB ${filePath} for query execution.`);
        const result = await connection.query(sqlQuery);
        const executionTime = Date.now() - startTime;
        console.log(`POR query executed on ${filePath} in ${executionTime}ms.`);
        const data = result; // Assuming result is an array of objects
        let columns = [];
        if (data.length > 0) {
            columns = Object.keys(data[0]);
        }
        return {
            success: true,
            data: data,
            columns: columns,
            message: `Query executed successfully on POR. Found ${data.length} rows.`,
            executionTime: executionTime,
        };
    }
    catch (error) {
        console.error(`Error executing POR query on ${filePath}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown POR query execution error.';
        return {
            success: false,
            error: `POR query execution failed on ${filePath}: ${errorMessage}`,
            executionTime: Date.now() - startTime
        };
    }
    finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`POR connection (${filePath}) closed after query.`);
            }
            catch (closeError) {
                console.error(`Error closing POR connection (${filePath}) after query:`, closeError);
            }
        }
    }
};
