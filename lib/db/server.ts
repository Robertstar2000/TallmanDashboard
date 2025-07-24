import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import odbc from 'odbc'; 
import type * as sql from 'mssql'; 
import { ChartDataRow, ServerConfig, DatabaseConnection } from './types';
import MDBReader from 'mdb-reader';

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

function ensureTableExists(db: Database.Database) {
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const statements = schema.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        db.exec(stmt);
      } catch (error) {
        console.error('Error executing schema statement:', error);
        console.error('Statement:', stmt);
        throw error;
      }
    }
  }
}

export const getAllChartData = (): ChartDataRow[] => {
  let dbInstance: Database.Database | null = null;
  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);
    console.log('[getAllChartData] Preparing to execute SELECT * FROM chart_data'); 
    const stmt = dbInstance.prepare('SELECT * FROM chart_data ORDER BY id ASC');
    const data = stmt.all() as ChartDataRow[];
    return data;
  } catch (error) {
    console.error('Error fetching all chart data:', error);
    throw error; 
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
};

export const getAllSpreadsheetData = (): ChartDataRow[] => {
  return getAllChartData();
};

export const updateChartDataValue = (rowId: string, value: number): boolean => {
  let dbInstance: Database.Database | null = null;
  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);
    const stmt = dbInstance.prepare('UPDATE chart_data SET value = ?, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?');
    const info = stmt.run(value, rowId);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error updating value for rowId ${rowId}:`, error);
    return false;
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
};

export const updateChartDataRow = (rowId: string, data: Partial<Omit<ChartDataRow, 'id' | 'rowId' | 'lastUpdated'>>): boolean => {
  let dbInstance: Database.Database | null = null;
  const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'rowId' && key !== 'lastUpdated');
  if (fields.length === 0) {
    console.warn('No fields provided to update for rowId:', rowId);
    return false;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => (data as any)[field]);
  values.push(rowId); 

  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);
    const stmt = dbInstance.prepare(`UPDATE chart_data SET ${setClause}, lastUpdated = CURRENT_TIMESTAMP WHERE rowId = ?`);
    const info = stmt.run(...values);
    console.log(`Updated row ${rowId}. Changes: ${info.changes}`);
    return info.changes > 0;
  } catch (error) {
    console.error(`Error updating row ${rowId}:`, error);
    return false;
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
};

export const replaceAllChartData = (data: Omit<ChartDataRow, 'id' | 'lastUpdated'>[]): boolean => {
  let dbInstance: Database.Database | null = null;
  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);
    const insertStmt = dbInstance.prepare(`
      INSERT INTO chart_data (id, rowId, chartGroup, chartName, variableName, DataPoint, serverName, tableName, productionSqlExpression, value, calculationType, axisStep)
      VALUES (@rowId, @rowId, @chartGroup, @chartName, @variableName, @DataPoint, @serverName, @tableName, @productionSqlExpression, @value, @calculationType, @axisStep)
    `);

    const transaction = dbInstance.transaction((rows: Omit<ChartDataRow, 'id' | 'lastUpdated'>[]) => {
      if (!dbInstance) throw new Error("DB instance not available in transaction"); 
      dbInstance.exec('DELETE FROM chart_data'); 
      dbInstance.exec('DELETE FROM sqlite_sequence WHERE name=\'chart_data\''); 
      for (const row of rows) {
        insertStmt.run(row);
      }
    });

    console.log('[replaceAllChartData] Executing transaction...'); 
    transaction(data);
    console.log(`[replaceAllChartData] Transaction completed. Successfully replaced all chart data with ${data.length} rows.`); 
    return true;
  } catch (error) {
    console.error('Error replacing chart data:', error);
    return false;
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
};

export const updateSpreadsheetData = (data: ChartDataRow[]) => {
  let dbInstance: Database.Database | null = null;
  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);

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
        chartName = ?,  
        axisStep = ?,   
        lastUpdated = ? 
      WHERE rowId = ?
    `);

    const updateMany = dbInstance.transaction((rows: ChartDataRow[]) => {
      if (!dbInstance) throw new Error("DB instance not available in transaction"); 
      for (const row of rows) {
        const params = [
          row.chartGroup,
          row.variableName,
          row.DataPoint,
          row.serverName,
          row.tableName,
          row.productionSqlExpression,
          row.calculationType,
          row.chartName, 
          row.axisStep,  
          new Date().toISOString(), 
          row.rowId 
        ];
        try {
          updateStmt.run(params);
        } catch(err) {
          console.error(`Failed to update row with id ${row.id}:`, err);
          console.error('Row data:', row);
          throw err;
        }
      }
    });

    try {
      console.log(`Starting transaction to update ${data.length} rows...`);
      updateMany(data);
      console.log(`Successfully updated ${data.length} rows.`);
    } catch (error) {
      console.error('Transaction failed during spreadsheet data update:', error);
      throw error;
    }
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
}

export const testP21ConnectionServer = async (
  connectionDetails: DatabaseConnection
): Promise<{ success: boolean; message: string }> => {
  const dsnName = process.env.P21_DSN;
  
  if (!dsnName) {
    return { 
      success: false, 
      message: 'P21_DSN environment variable is not set. Please configure the DSN in .env.local file.' 
    };
  }
  const { server, database, username, password } = connectionDetails;

  let connectionString = `DSN=${dsnName};`;

  console.log(`Attempting to connect to P21 using DSN: ${dsnName}`);

  let connection: odbc.Connection | null = null;

  try {
    console.log('Using ODBC module for P21.');
    connection = await odbc.connect(connectionString);
    console.log(`Successfully connected to P21 using DSN: ${dsnName}`);

    await connection.query('SELECT 1');
    console.log(`Test query executed successfully on P21 via DSN: ${dsnName}.`);

    return { success: true, message: `P21 connection successful using DSN: ${dsnName}!` };

  } catch (error) {
    console.error(`Error testing P21 connection using DSN ${dsnName}:`, error);
    const errorMessage = error instanceof Error ? error.message : `Unknown P21 connection error with DSN ${dsnName}.`;
    return { success: false, message: `P21 connection failed using DSN ${dsnName}: ${errorMessage}` };

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log(`P21 connection (DSN: ${dsnName}) closed.`);
      } catch (closeError) {
        console.error(`Error closing P21 connection (DSN: ${dsnName}):`, closeError);
      }
    }
  }
};

export const testSQLiteConnectionServer = async (): Promise<{ success: boolean; message: string; path?: string }> => {
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, message: 'SQLite database file does not exist.', path: dbPath };
    }
    const db = new Database(dbPath, { readonly: true });
    db.prepare('SELECT 1').run();
    db.close();
    return { success: true, message: 'SQLite connection successful.', path: dbPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown SQLite connection error.';
    return { success: false, message: `SQLite connection failed: ${errorMessage}`, path: dbPath };
  }
};

export const testPORConnectionServer = async (
  connectionDetails: DatabaseConnection
): Promise<{ success: boolean; message: string }> => {
  const { filePath } = connectionDetails;
  if (!filePath) {
    return { success: false, message: 'File path is required for POR test.' };
  }

  const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath}`;
  let connection: odbc.Connection | null = null;

  try {
    console.log(`Attempting to connect to POR using connection string...`);
    connection = await odbc.connect(connectionString);
    console.log(`Successfully connected to POR database at ${filePath}`);

    await connection.query('SELECT 1');
    console.log(`Test query executed successfully on POR.`);

    return { success: true, message: `POR connection successful using file path: ${filePath}` };
  } catch (error) {
    console.error(`Error testing POR connection:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown POR connection error.';
    if (errorMessage.includes('Data source name not found')) {
        return { success: false, message: `POR connection failed: The Microsoft Access ODBC driver might not be installed or configured correctly. Please ensure the 'Microsoft Access Driver (*.mdb, *.accdb)' is available. Error: ${errorMessage}` };
    }
    return { success: false, message: `POR connection failed: ${errorMessage}` };
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log(`POR connection to ${filePath} closed.`);
      } catch (closeError) {
        console.error(`Error closing POR connection:`, closeError);
      }
    }
  }
};

export const executeP21QueryServer = async (
  sqlQuery: string
): Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string; message?: string; executionTime?: number }> => {
  const startTime = Date.now();
  const dsnName = process.env.P21_DSN!;
  let connection: odbc.Connection | null = null;

  console.log(`Attempting to execute P21 query using DSN: ${dsnName}`);

  try {
    console.log('Using ODBC module for P21.');
    connection = await odbc.connect(`DSN=${dsnName};`);
    console.log(`Connected to P21 using DSN: ${dsnName} for query execution.`);

    const rawQuery = sqlQuery.replace(/;$/, '');
    const msQuery = rawQuery.replace(/\bAS\s+value\b/gi, 'AS [value]');
    console.log('POR adjusted query:', msQuery);

    const result = await connection.query(msQuery);
    const executionTime = Date.now() - startTime;
    console.log(`P21 query executed via DSN ${dsnName} in ${executionTime}ms.`);

    const data = result as any[]; 
    let columns: string[] = [];
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

  } catch (error) {
    console.error(`Error executing P21 query using DSN ${dsnName}:`, error);
    console.error('[Server] P21 Query Error Details:', JSON.stringify(error, null, 2)); 

    const errorMessageString = error instanceof Error ? error.message : `Unknown P21 query execution error with DSN ${dsnName}.`;

    const errorResult: { success: boolean; data?: any[]; columns?: string[]; error?: string; message?: string; executionTime?: number } = {
        success: false,
        error: `P21 query execution failed using DSN ${dsnName}: ${errorMessageString}`,
        executionTime: Date.now() - startTime
    };
    return errorResult;

  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log(`P21 connection (DSN: ${dsnName}) closed after query.`);
      } catch (closeError) {
        console.error(`Error closing P21 connection (DSN: ${dsnName}) after query:`, closeError);
      }
    }
  }
};

export const executePORQueryServer = async (
  filePath: string,
  password: string | undefined,
  sqlQuery: string
): Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string; message?: string; executionTime?: number }> => {
  const startTime = Date.now();
  if (!filePath) {
    return { success: false, error: 'File path is required for POR query.' };
  }

  // Prepare individual statements (split on semicolons) and trim whitespace
  const statements = sqlQuery
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length);

  // Regex to detect very simple "SELECT Count(*) AS value FROM [TableName]" pattern
  const simpleCountRegex = /^SELECT\s+Count\(\*\)\s+AS\s+(?:\[[^\]]+\]|[A-Za-z0-9_]+)\s+FROM\s+\[?([A-Za-z0-9_ ]+)\]?$/i;

  // Helper using MDBReader for simple count queries
  const tryExecuteWithMdbReader = (): { success: boolean; data?: any[]; columns?: string[]; error?: string } => {
    try {
      // If any statement is not a simple COUNT pattern, abort this strategy
      if (!statements.every(stmt => simpleCountRegex.test(stmt))) {
        return { success: false, error: 'Not all statements match simple COUNT pattern' };
      }

      // Read MDB file into memory
      const buffer = fs.readFileSync(filePath);
      const reader = new MDBReader(buffer, password ? { password } as any : undefined);
      const tableNames = reader.getTableNames();

      const results: { value: number }[] = [];
      for (const stmt of statements) {
        const match = simpleCountRegex.exec(stmt);
        if (!match) {
          return { success: false, error: `Unsupported SQL syntax: ${stmt}` };
        }
        const tableNameRaw = match[1];
        const tableName = tableNameRaw.replace(/\[|\]/g, '');
        if (!tableNames.includes(tableName)) {
          return { success: false, error: `Table ${tableName} not found in MDB.` };
        }
        const table = reader.getTable(tableName);
        const count = table.getData().length;
        results.push({ value: count });
      }

      return { success: true, data: results, columns: ['value'] };
    } catch (readerErr) {
      console.error('[POR-MDB] Reader error details:', readerErr);
      const msg = readerErr instanceof Error ? readerErr.message : String(readerErr);
      return { success: false, error: `MDB reader failed: ${msg}` };
    }
  };

  // First, attempt to execute via ADODB (required for complex queries)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ADODB: any = require('node-adodb');

    const provider = filePath.toLowerCase().endsWith('.accdb')
      ? 'Provider=Microsoft.ACE.OLEDB.12.0;'
      : 'Provider=Microsoft.Jet.OLEDB.4.0;';
    const auth = password ? `Jet OLEDB:Database Password=${password};` : '';
    const connStr = `${provider}Data Source=${filePath};Persist Security Info=False;${auth}`;

    const connection = ADODB.open(connStr, true); // force x64 engine

    const results: any[] = [];
    for (const original of statements) {
      const raw = original.replace(/;$/, '');
      const accessQuery = raw.replace(/\bAS\s+value\b/gi, 'AS [value]');
      const partial = await connection.query(accessQuery);
      // Access returns rows; we expect a single row with alias "value"
      if (Array.isArray(partial)) {
        results.push(partial[0] ?? {});
      }
    }

    const executionTime = Date.now() - startTime;
    const cols = results.length && results[0] ? Object.keys(results[0]) : [];
    return {
      success: true,
      data: results,
      columns: cols,
      message: `Query executed via ADODB. Statements: ${results.length}`,
      executionTime,
    };
  } catch (adodbErr) {
    console.error('[POR-ADODB] Query error details:', adodbErr);
    // Attempt fallback using MDBReader
    const fallback = tryExecuteWithMdbReader();
    if (fallback.success) {
      return {
        success: true,
        data: fallback.data,
        columns: fallback.columns,
        message: `Query executed via fallback MDB reader. Statements: ${fallback.data?.length ?? 0}`,
        executionTime: Date.now() - startTime,
      };
    }

    const errorMsg = adodbErr instanceof Error ? adodbErr.message : String(adodbErr);
    return {
      success: false,
      error: `POR query execution failed via ADODB: ${errorMsg}. Fallback attempt: ${fallback.error ?? 'none'}`,
      executionTime: Date.now() - startTime,
    };
  }
};

export const getAdminVariables = (): ServerConfig[] => {
  let dbInstance: Database.Database | null = null;
  try {
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    dbInstance.exec(`
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

    const stmt = dbInstance.prepare('SELECT id, name, type, value, description, is_active, last_updated FROM admin_variables');
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
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
  }
};

export const updateAdminVariable = (id: string, data: Partial<Omit<ServerConfig, 'id' | 'lastUpdated'>>): boolean => {
  let dbInstance: Database.Database | null = null;
  const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'lastUpdated');
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
    dbInstance = new Database(DB_PATH);
    if (!dbInstance) throw new Error("Failed to create DB instance"); 
    ensureTableExists(dbInstance);
    const stmt = dbInstance.prepare(sql);
    const info = stmt.run(params);
    console.log(`Server: Admin variable ${id} update result: ${info.changes} changes.`);
    return info.changes > 0;
  } catch (error) {
    console.error(`Server: Failed to update admin variable ${id}:`, error);
    return false; 
  } finally {
    if (dbInstance) {
      dbInstance.close();
    }
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

interface QueryExecResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
  message?: string; 
  executionTime?: number;
}
