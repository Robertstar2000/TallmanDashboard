import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type * as sql from 'mssql'; 
import { ChartDataRow, ServerConfig, DatabaseConnection } from './types';
import MDBReader from 'mdb-reader';
import { IUser } from './types'; // Added IUser import
import crypto from 'crypto'; // For generating UUIDs
import bcrypt from 'bcryptjs'; // For password hashing

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');
const DATA_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure node-adodb uses the 64-bit cscript host (System32) instead of the default SysWOW64.
if (!process.env.ADODB_JS_CSCRIPT_PATH) {
  const system32Cscript = path.join(process.env.windir || 'C:/Windows', 'System32', 'cscript.exe');
  process.env.ADODB_JS_CSCRIPT_PATH = system32Cscript;
}

let db: Database.Database;

/**
 * Initializes and returns a singleton SQLite database instance.
 * Ensures that the schema (including the users table) exists.
 */
export const getDb = (): Database.Database => {
  if (!db) {
    try {
      db = new Database(DB_PATH, { verbose: console.log }); // Enable verbose logging for DB operations if needed
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      ensureTableExists(db); // This function already exists and applies schema.sql
      console.log('Database connection established and schema ensured.');
    } catch (error) {
      console.error('Failed to initialize the database:', error);
      throw error; // Re-throw to indicate critical failure
    }
  }
  return db;
};

// Close the database connection when the application exits
process.on('exit', () => {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed.');
  }
});
// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed due to app termination.');
  }
  process.exit(0);
});


function ensureTableExists(db: Database.Database) {
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  try {
    db.exec(schemaSql);
  } catch (error) {
    console.error('Error executing schema.sql:', error);
    throw error;
  }
}

// Ensure DB is initialized when module is loaded, so other functions can use getDb()
getDb();

export const getAllChartData = (): ChartDataRow[] => {
    const currentDb = getDb();
  try {
    console.log('[getAllChartData] Preparing to execute SELECT * FROM chart_data'); 
    const stmt = currentDb.prepare('SELECT * FROM chart_data ORDER BY id ASC');
    const data = stmt.all() as ChartDataRow[];
    return data;
  } catch (error) {
    console.error('Error fetching all chart data:', error);
    throw error; 
  }
};

export const getAllSpreadsheetData = (): ChartDataRow[] => {
  return getAllChartData();
};

export const updateChartDataValue = (rowId: string, value: number): boolean => {
    const currentDb = getDb();
  try {
    const stmt = currentDb.prepare('UPDATE chart_data SET value = ?, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?');
    const info = stmt.run(value, rowId);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error updating value for rowId ${rowId}:`, error);
    return false;
  }
};

export const updateChartDataRow = (rowId: string, data: Partial<Omit<ChartDataRow, 'id' | 'rowId' | 'lastUpdated'>>): boolean => {
  const currentDb = getDb();
  const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'rowId' && key !== 'lastUpdated');
  if (fields.length === 0) {
    console.warn('No fields provided to update for rowId:', rowId);
    return false;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => (data as any)[field]);
  values.push(rowId); 

  try {
    const stmt = currentDb.prepare(`UPDATE chart_data SET ${setClause}, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?`);
    const info = stmt.run(...values);
    console.log(`Updated row ${rowId}. Changes: ${info.changes}`);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error updating row ${rowId}:`, error);
    return false;
  }
};

export const replaceAllChartData = (data: Omit<ChartDataRow, 'id' | 'lastUpdated'>[]): boolean => {
  const currentDb = getDb();
  try {
    currentDb.transaction(() => {
      const deleteStmt = currentDb.prepare('DELETE FROM chart_data');
      deleteStmt.run();
      
      const insertStmt = currentDb.prepare(`
        INSERT INTO chart_data (
          id, rowId, chartGroup, variableName, DataPoint, chartName, 
          serverName, tableName, productionSqlExpression, value, 
          lastUpdated, calculationType, axisStep, error
        ) VALUES (
          @id, @rowId, @chartGroup, @variableName, @DataPoint, @chartName, 
          @serverName, @tableName, @productionSqlExpression, @value, 
          CURRENT_TIMESTAMP, @calculationType, @axisStep, @error
        )
      `);

      for (const row of data) {
        insertStmt.run({
          ...row,
          id: crypto.randomUUID(), // Generate new UUID for id
          lastUpdated: new Date().toISOString() // Set lastUpdated, though DB will set CURRENT_TIMESTAMP
        });
      }
    })();
    return true;
  } catch (error) {
    console.error('Error replacing all chart data:', error);
    return false;
  }
};

export const updateSpreadsheetData = (data: ChartDataRow[]): boolean => {
  const currentDb = getDb();
  try {
    const updateStmt = currentDb.prepare(`
      UPDATE chart_data 
      SET 
        chartGroup = @chartGroup, 
        variableName = @variableName, 
        DataPoint = @DataPoint, 
        chartName = @chartName,
        serverName = @serverName, 
        tableName = @tableName, 
        productionSqlExpression = @productionSqlExpression, 
        value = @value,
        calculationType = @calculationType, 
        axisStep = @axisStep,
        error = @error,
        lastUpdated = CURRENT_TIMESTAMP
      WHERE rowId = @rowId
    `);

    const updateMany = currentDb.transaction((rows: ChartDataRow[]) => {
      let changes = 0;
      for (const row of rows) {
        // Ensure all fields from ChartDataRow are present, providing defaults for nullable ones if necessary
        const result = updateStmt.run({
          chartGroup: row.chartGroup,
          variableName: row.variableName,
          DataPoint: row.DataPoint,
          chartName: row.chartName,
          serverName: row.serverName,
          tableName: row.tableName,
          productionSqlExpression: row.productionSqlExpression,
          value: row.value,
          calculationType: row.calculationType,
          axisStep: row.axisStep,
          // error: row.error, // ChartDataRow does not have an 'error' property. The 'error' column in DB is handled separately.
          rowId: row.rowId
        });
        changes += result.changes;
      }
      return changes;
    });

    console.log(`Starting transaction to update ${data.length} rows in chart_data...`);
    const totalChanges = updateMany(data);
    console.log(`Successfully updated chart_data. Total changes: ${totalChanges}`);
    return totalChanges > 0 || data.length === 0; // Return true if changes were made or if no data was passed
  } catch (error) {
    console.error('Error updating spreadsheet data in chart_data:', error);
    return false;
  }
};

export const getAdminVariables = (): ServerConfig[] => {
  const currentDb = getDb();
  try {
    currentDb.exec(`
      CREATE TABLE IF NOT EXISTS admin_variables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value TEXT,
        description TEXT,
        type TEXT CHECK(type IN ('P21', 'POR', 'LOCAL', 'Other')) DEFAULT 'Other',
        is_active INTEGER DEFAULT 1, 
        last_updated TEXT
      );
    `);

    const stmt = currentDb.prepare('SELECT id, name, type, value, description, is_active, last_updated FROM admin_variables');
    const rows = stmt.all() as any[]; 

    const results: ServerConfig[] = rows.map(row => ({
      id: String(row.id), 
      name: String(row.name),
      type: ['P21', 'POR', 'LOCAL', 'Other'].includes(row.type) ? row.type : 'Other',
      value: row.value !== null ? String(row.value) : null,
      description: row.description !== null ? String(row.description) : null,
      isActive: Boolean(row.is_active), 
      lastUpdated: row.last_updated !== null ? String(row.last_updated) : null,
    }));

    console.log(`Server: Fetched ${results.length} rows from admin_variables.`);
    return results;

  } catch (error) {
    console.error('Server: Failed to get admin variables:', error);
    return []; 
  }
};

export const updateAdminVariable = (id: string, data: Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>>): boolean => {
  const currentDb = getDb();
  const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'lastUpdated');
  // ensureTableExists is called by getDb() if db is new, so not needed here directly.
  if (fields.length === 0) {
    console.warn('No fields provided to update for admin variable ID:', id);
    return false;
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  const fieldMap: { [K in keyof typeof data]?: string } = {
    name: 'name',
    type: 'type',
    value: 'value',
    description: 'description',
    isActive: 'is_active',
  };

  for (const key in data) {
    const typedKey = key as keyof typeof data;
    const dbColumn = fieldMap[typedKey];
    if (dbColumn && data[typedKey] !== undefined) {
      setClauses.push(`${dbColumn} = ?`);
      if (typedKey === 'isActive') {
        params.push(data[typedKey] ? 1 : 0);
      } else {
        params.push(data[typedKey]);
      }
    }
  }

  setClauses.push('last_updated = CURRENT_TIMESTAMP');

  if (setClauses.length <= 1) { 
    console.warn('Server: updateAdminVariable called with no valid fields to update.');
    return false;
  }

  params.push(id);

  const sql = `UPDATE admin_variables SET ${setClauses.join(', ')} WHERE id = ?`;

    try {
    const stmt = currentDb.prepare(sql);
    const info = stmt.run(params);
    console.log(`Server: Admin variable ${id} update result: ${info.changes} changes.`);
    return info.changes > 0;
  } catch (error) {
    console.error(`Server: Failed to update admin variable ${id}:`, error);
    return false; 
  }
};

export const ensureTypesFile = () => {
  const TYPES_PATH = path.join(process.cwd(), 'lib', 'db', 'types.ts');
  if (!fs.existsSync(TYPES_PATH)) {
    const content = `
export interface ChartDataRow {
  id: number;
  rowId: string; 
  chartGroup: string; 
  chartName: string;
  variableName: string; 
  DataPoint: string; 
  serverName: 'P21' | 'POR';
  tableName: string | null;
  productionSqlExpression: string | null;
  value: number | null;
  lastUpdated: string | null;
  calculationType: 'SUM' | 'AVG' | 'COUNT' | 'LATEST' | null; 
  axisStep: string;
}

export interface SpreadsheetRow {
  
}

export interface ConnectionConfig {
  serverType: 'P21' | 'POR';
  serverAddress: string;
  databaseName: string;
  userName?: string; 
  password?: string; 
  // Add other relevant connection parameters like port, options, etc.
}
`;
    fs.writeFileSync(TYPES_PATH, content, 'utf8');
    console.log('Created placeholder lib/db/types.ts');
  }
};

ensureTypesFile(); 

// --- User Authentication Functions ---

export const findUserByEmail = (email: string): IUser | null => {
  const currentDb = getDb();
  try {
    const stmt = currentDb.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase()) as IUser | undefined;
    return user || null;
  } catch (error) {
    console.error(`Error finding user by email ${email}:`, error);
    return null;
  }
};

export const findUserById = (id: string): IUser | null => {
  const currentDb = getDb();
  try {
    const stmt = currentDb.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as IUser | undefined;
    return user || null;
  } catch (error) {
    console.error(`Error finding user by id ${id}:`, error);
    return null;
  }
};

export const createUser = (userData: Pick<IUser, 'email' | 'name'> & Partial<Pick<IUser, 'password' | 'role' | 'isLdapUser' | 'status'>>): IUser | null => {
  const currentDb = getDb();
  const newId = crypto.randomUUID();
  const hashedPassword = userData.password ? bcrypt.hashSync(userData.password, 10) : null;

  const stmt = currentDb.prepare(`
    INSERT INTO users (id, email, password, name, status, role, is_ldap_user, failed_login_attempts, lock_until, last_login, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  try {
    stmt.run(
      newId,
      userData.email.toLowerCase(),
      hashedPassword,
      userData.name,
      userData.status || 'active',
      userData.role || 'user',
      userData.isLdapUser || false,
      0, // failed_login_attempts
      null, // lock_until
      null // last_login
    );
    return findUserById(newId);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')) {
      // More specific error handling or re-throwing could be done here
      console.error(`User creation failed: email ${userData.email} already exists.`);
    }
    return null;
  }
};

export const updateUser = (id: string, updates: Partial<Omit<IUser, 'id' | 'created_at' | 'updated_at'>>): boolean => {
  const currentDb = getDb();
  const fieldsToUpdate: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;

    if (key === 'password' && typeof value === 'string') {
      fieldsToUpdate.push('password = ?');
      values.push(bcrypt.hashSync(value, 10));
    } else if (key === 'email' && typeof value === 'string') {
      fieldsToUpdate.push('email = ?');
      values.push(value.toLowerCase());
    } else if (key === 'isLdapUser') {
        fieldsToUpdate.push('is_ldap_user = ?');
        values.push(value ? 1 : 0); // SQLite stores booleans as 0 or 1
    } else {
      // Map IUser field names to DB column names if they differ (e.g., is_ldap_user)
      // For now, assuming they are the same or direct mapping is fine
      fieldsToUpdate.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fieldsToUpdate.length === 0) {
    console.warn('No valid fields provided for user update.');
    return false; // Or true, if no update needed is considered a success
  }

  // Always update the 'updated_at' timestamp
  fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

  const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
  values.push(id);

  try {
    const stmt = currentDb.prepare(sql);
    const info = stmt.run(...values);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return false;
  }
};

export function clearUsersTableForTesting(): void {
  // It's a good practice to ensure this is only run in a test environment
  if (process.env.NODE_ENV !== 'test' && process.env.ALLOW_TEST_DB_CLEAR !== 'true') {
    console.warn('Refusing to clear users table outside of a recognized test environment or without explicit override.');
    return; 
  }
  const db = getDb();
  try {
    db.prepare('DELETE FROM users').run();
    console.log('Users table cleared for testing.');
  } catch (error) {
    console.error('Failed to clear users table:', error);
    throw error; // Rethrow to fail tests if DB clearing fails
  }
}

// ------------------------------------
// Generic result interface for query exec
export interface QueryExecResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
  message?: string;
  executionTime?: number;
}

// ------------------------------------
// P21 (SQL Server via ODBC) query execution helper
export async function executeP21QueryServer(sqlQuery: string): Promise<QueryExecResult> {
  const start = Date.now();
  try {
    const dsn = process.env.P21_DSN;
    if (!dsn) {
      return { success: false, error: 'P21_DSN environment variable is not set.' };
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – dynamic import CommonJS
    const odbcPkg = (await import('odbc')).default ?? (await import('odbc'));

    let conn: any;
    try {
      conn = await odbcPkg.connect(`DSN=${dsn}`);
      const result = await conn.query(sqlQuery);
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      return {
        success: true,
        data: result,
        columns,
        executionTime: Date.now() - start,
      };
    } finally {
      if (conn) {
        await conn.close();
      }
    }
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ------------------------------------
// POR (MS-Access) query execution helper
// NOTE: This is a very light-weight implementation sufficient for simple
// SELECT <col> FROM <table> queries used in TallmanDashboard metrics. It
// avoids adding heavy dependencies that might break existing build setups.
export async function executePORQueryServer(
  filePath: string,
  password: string | undefined,
  sqlQuery: string
): Promise<QueryExecResult> {
  const start = Date.now();
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `POR file not found: ${filePath}` };
    }

    // Very naive SQL parser: we only support `SELECT <column> FROM <table>`
    const match = /select\s+([\w*]+)\s+from\s+(\w+)/i.exec(sqlQuery.trim());
    if (!match) {
      return { success: false, error: 'Unsupported SQL for POR reader' };
    }
    const [, col, tbl] = match;

    const buffer = fs.readFileSync(filePath);
    const reader = new MDBReader(buffer, { password });
    const table = reader.getTable(tbl);
    if (!table) {
      return { success: false, error: `Table ${tbl} not found in POR` };
    }

    const rows = table.getData();
    const columns = table.getColumnNames();
    const colIdx = col === '*' ? -1 : columns.indexOf(col);

    const processed = rows.map(r => {
      if (Array.isArray(r)) {
        return colIdx === -1 ? r : r[colIdx];
      }
      return col === '*' ? r : (r as any)[col];
    });

    return {
      success: true,
      data: processed,
      columns,
      executionTime: Date.now() - start,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ------------------------------------
// Connection Test Helpers for Admin UI

/**
 * Tests connectivity to a P21 SQL Server database using ODBC.
 * Tries to establish a connection and run a trivial `SELECT 1` query.
 * The function re-uses the same ODBC logic that the background worker uses
 * (see lib/worker/sqlExecutor.ts) but does **not** modify that file.
 */
export async function testP21ConnectionServer(
  details: DatabaseConnection,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Resolve connection string / DSN
    const dsn = (details && (details as any).dsn) || process.env.P21_DSN;
    const server = details.server || process.env.P21_SERVER;
    const database = details.database || process.env.P21_DATABASE;

    let connectionString: string;
    if (dsn) {
      connectionString = `DSN=${dsn};`;
    } else if (server && database) {
      // Build a generic trusted connection string (integrated security)
      // Using the common Microsoft ODBC Driver name – adjust if your driver differs
      connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;`;
    } else {
      return { success: false, message: 'Missing DSN or server/database details for P21 connection.' };
    }

    // Dynamically import odbc to avoid build-time bundling issues (same pattern as worker)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – dynamic import CommonJS
    const odbcPkg = (await import('odbc')).default ?? (await import('odbc'));

    let conn: any;
    try {
      conn = await odbcPkg.connect(connectionString);
      await conn.query('SELECT 1');
      return { success: true, message: 'Successfully connected to P21.' };
    } finally {
      if (conn) {
        await conn.close();
      }
    }
  } catch (err) {
    console.error('[testP21ConnectionServer] Error:', err);
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Tests connectivity to a POR MS-Access database by opening the file with mdb-reader.
 */
export async function testPORConnectionServer(
  details: DatabaseConnection,
): Promise<{ success: boolean; message?: string }> {
  try {
    const filePath = (details as any).filePath || process.env.POR_PATH;
    const password = (details as any).password || process.env.POR_DB_PASSWORD;
    if (!filePath) {
      return { success: false, message: 'filePath is required for POR connection test (set POR_PATH in .env).' };
    }

    if (!fs.existsSync(filePath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }

    // Attempt to open the MDB file – if this succeeds, consider the connection healthy.
    const reader = new MDBReader(fs.readFileSync(filePath), { password });
    // Accessing table names ensures the DB is readable
    const tables = reader.getTableNames();
    return { success: true, message: `Successfully opened POR DB. Tables found: ${tables.length}` };
  } catch (err) {
    console.error('[testPORConnectionServer] Error:', err);
    return { success: false, message: (err as Error).message };
  }
}

// ------------------------------------
// Manual-user helpers used by admin API
export const getAllManualUsers = (): IUser[] => {
  const currentDb = getDb();
  try {
    const stmt = currentDb.prepare('SELECT * FROM users WHERE is_ldap_user = 0 ORDER BY email');
    return stmt.all() as IUser[];
  } catch (error) {
    console.error('Error fetching manual users:', error);
    return [];
  }
};

export const deleteUserByEmail = (email: string): boolean => {
  const currentDb = getDb();
  try {
    const stmt = currentDb.prepare('DELETE FROM users WHERE LOWER(email) = LOWER(?)');
    const info = stmt.run(email);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error deleting user ${email}:`, error);
    return false;
  }
};
