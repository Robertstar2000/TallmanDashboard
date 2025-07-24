import { getAllChartData, updateChartDataValue, executePORQueryServer } from '@/lib/db/server';
import odbc from 'odbc';
import type { ChartDataRow } from '@/lib/db/types';

// --- State Management ---

// Define the shape of our global state for development
interface GlobalWorkerState {
  isRunning: boolean;
  promise: Promise<void> | null;
}

// Declare module-level state variable for production fallback
let workerStateModuleLevel: GlobalWorkerState;

// Function to get or initialize the worker state object
const getWorkerState = (): GlobalWorkerState => {
  // Use globalThis only in development to avoid module caching issues
  if (process.env.NODE_ENV === 'development') {
    const globalWithWorker = globalThis as typeof globalThis & {
      __SQL_WORKER_STATE__: GlobalWorkerState | undefined;
    };

    if (!globalWithWorker.__SQL_WORKER_STATE__) {
      console.log('[Worker] Initializing global state for development.');
      globalWithWorker.__SQL_WORKER_STATE__ = {
        isRunning: false,
        promise: null,
      };
    }
    return globalWithWorker.__SQL_WORKER_STATE__;
  } else {
    // In production, use module-level state (assuming module caching isn't an issue there)
    // We need to define these here if not in dev
    if (typeof workerStateModuleLevel === 'undefined') {
        // Initialize module-level state if it doesn't exist
         workerStateModuleLevel = { isRunning: false, promise: null };
    }
    return workerStateModuleLevel;
  }
};

// Get the state object (either global for dev or module-level for prod)
let workerState = getWorkerState();

// --- Original state variables (commented out or removed) ---
// let isWorkerRunning = false;
// let currentWorkerPromise: Promise<void> | null = null;
const EXECUTION_DELAY_MS = 2000; // 2 seconds

// --- Database Execution Logic ---

/**
 * Executes a SQL query against the P21 database using the DSN.
 * Expects a single row with a single column.
 */
async function executeP21QueryWithValue(sql: string): Promise<number | null> {
  console.log('[Worker] >>> ENTERING executeP21QueryWithValue');
  console.log(`[Worker] P21 Query Init: ${sql.substring(0, 100)}...`);
  const dsnName = process.env.P21_DSN;

  if (!dsnName) {
    console.error('[Worker] P21_DSN environment variable is not set. Cannot execute P21 query.');
    return null;
  }

  // Note: Assumes DSN is configured with necessary credentials or uses Windows Auth.
  // Add Uid=; Pwd=; if needed and storing credentials securely.
  const connectionString = `DSN=${dsnName};`;
  let connection: odbc.Connection | null = null;

  try {
    console.log(`[Worker] P21 Connecting using DSN: ${dsnName}...`);
    connection = await odbc.connect(connectionString);
    console.log('[Worker] P21 Connected. Executing query...');
    // Execute with a query timeout (e.g., 30 seconds)
    const result = await connection.query<any[]>(sql);
    console.log('[Worker] P21 Query executed.');

    if (Array.isArray(result) && result.length > 0) {
      const row = result[0] as Record<string, any>;
      const key = Object.keys(row)[0];
      const rawVal = row[key];
      const numericValue = Number(rawVal);
      if (!isNaN(numericValue)) {
        console.log(`[Worker] P21 Query Success. Value: ${numericValue}`);
        return numericValue;
      } else {
        console.warn(`[Worker] P21 Query returned non-numeric value: ${rawVal} (SQL: ${sql})`);
        return null;
      }
    } else {
      console.warn(`[Worker] P21 Query returned no rows (SQL: ${sql})`);
      return null;
    }
  } catch (error) {
    console.error(`[Worker] P21 Query FAILED for SQL [${sql.substring(0,100)}...]:`, error instanceof Error ? error.message : error);
    console.error('[Worker] P21 Query Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('[Worker] P21 Connection closed.');
      } catch (closeError) {
        console.error('[Worker] Error closing P21 connection:', closeError);
      }
    }
  }
}

/**
 * Executes a SQL query against the POR database using the file path.
 * Expects a single row with a single column.
 */
async function executePORQueryWithValue(sql: string): Promise<number | null> {
  console.log('[Worker] >>> ENTERING executePORQueryWithValue');
  console.log(`[Worker] POR Query Init: ${sql.substring(0, 100)}...`);
  const dbPath = process.env.NEXT_PUBLIC_POR_DB_PATH;
  if (!dbPath) {
    console.error('[Worker] NEXT_PUBLIC_POR_DB_PATH environment variable is not set. Cannot execute POR query.');
    return null;
  }
  try {
    const result = await executePORQueryServer(dbPath, process.env.POR_DB_PASSWORD, sql);
    if (!result.success) {
      console.error(`[Worker] POR Query failed: ${result.error || result.message}`);
      return null;
    }
    const rows = result.data;
    const columns = result.columns;
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as Record<string, any>;
      const key = columns && columns.length > 0 ? columns[0] : Object.keys(row)[0];
      const rawVal = row[key];
      const numericValue = Number(rawVal);
      if (!isNaN(numericValue)) {
        console.log(`[Worker] POR Query Success. Value: ${numericValue}`);
        return numericValue;
      } else {
        console.warn(`[Worker] POR Query returned non-numeric value: ${rawVal} (SQL: ${sql})`);
      }
    } else {
      console.warn(`[Worker] POR Query returned no rows (SQL: ${sql})`);
    }
  } catch (error) {
    console.error(`[Worker] executePORQueryWithValue error:`, error);
  }
  return null;
}

// --- Worker Loop Logic ---

async function runSqlExecutionLoop(): Promise<void> {
  console.log('[Worker] Starting SQL execution loop...');
  while (workerState.isRunning) {
    let itemsToProcess: ChartDataRow[] = [];
    try {
      itemsToProcess = getAllChartData();
      console.log(`[Worker] Fetched ${itemsToProcess.length} items for processing.`);
    } catch (error) {
      console.error('[Worker] Failed to fetch chart data items:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue; 
    }

    for (const item of itemsToProcess) {
      if (!workerState.isRunning) {
        console.log('[Worker] Stop signal received during item processing. Exiting loop.');
        break; 
      }

      console.log(`[Worker] Processing Item ID: ${item.rowId}, Server: ${item.serverName}, Expression: ${item.productionSqlExpression}`);

      // Check for missing/invalid SQL or serverName
      if (!item.productionSqlExpression || !item.serverName || (item.serverName !== 'P21' && item.serverName !== 'POR')) {
        // Log and ensure zero-value update for skipped row
        console.warn(`[Worker] Skipped rowId ${item.rowId} (${item.DataPoint}): Missing or invalid SQL/serverName. Setting value to 0.`);
        const success = updateChartDataValue(item.rowId, 0);
        if (!success) {
          console.warn(`[Worker] Failed to update SQLite with zero for skipped item ${item.rowId}`);
        }
        // Delay to enforce EXECUTION_DELAY_MS between each execution
        console.log(`[Worker] Waiting ${EXECUTION_DELAY_MS}ms for skipped item...`);
        await new Promise(resolve => setTimeout(resolve, EXECUTION_DELAY_MS));
        continue;
      }

      let newValue: number | null = null;
      try {
        if (item.serverName === 'P21') {
          console.log(`[Worker] --- Calling executeP21QueryWithValue for item ${item.rowId}`);
          newValue = await executeP21QueryWithValue(item.productionSqlExpression);
        } else if (item.serverName === 'POR') {
          newValue = await executePORQueryWithValue(item.productionSqlExpression);
        }

        if (newValue !== null) {
          console.log(`[Worker] Updating item ${item.rowId} (${item.DataPoint}) with value: ${newValue}`);
          const success = updateChartDataValue(item.rowId, newValue);
          if (!success) {
            console.warn(`[Worker] Failed to update SQLite for item ${item.rowId}`);
          }
        } else {
          // Ensure zero-value update and log for failed execution
          console.warn(`[Worker] Execution failed or returned no value for item ${item.rowId} (${item.DataPoint}). Setting value to 0.`);
          const success = updateChartDataValue(item.rowId, 0);
          if (!success) {
            console.warn(`[Worker] Failed to update SQLite with zero for failed item ${item.rowId}`);
          }
        }
      } catch (execError) {
        // Ensure zero-value update and log for unhandled errors
        console.error(`[Worker] Unhandled error executing SQL for item ${item.rowId} (${item.DataPoint}):`, execError);
        const success = updateChartDataValue(item.rowId, 0);
        if (!success) {
          console.warn(`[Worker] Failed to update SQLite with zero for error item ${item.rowId}`);
        }
      }

      console.log(`[Worker] Waiting ${EXECUTION_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, EXECUTION_DELAY_MS));
    }

    if (!workerState.isRunning) {
      console.log('[Worker] Stop signal received after completing a cycle. Exiting loop.');
      break; 
    }

    console.log('[Worker] Completed a full cycle. Restarting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('[Worker] SQL execution loop finished.');
  workerState.promise = null; 
}

// --- Control Functions ---

export function startWorker(): { success: boolean; message: string } {
  if (workerState.isRunning && workerState.promise) {
    console.log('[Worker] Attempted to start worker, but it is already running.');
    return { success: false, message: 'Worker is already running.' };
  }
  console.log('[Worker] Received start signal.');
  workerState.isRunning = true;
  workerState.promise = runSqlExecutionLoop();
  return { success: true, message: 'Worker started.' };
}

export function stopWorker(): { success: boolean; message: string } {
  if (!workerState.isRunning) {
    console.log('[Worker] Attempted to stop worker, but it is not running.');
    return { success: false, message: 'Worker is not running.' };
  }
  console.log('[Worker] Received stop signal.');
  workerState.isRunning = false;
  return { success: true, message: 'Worker stop signal sent. It will halt after the current query (if any).' };
}

export function getWorkerStatus(): { isRunning: boolean } {
  workerState = getWorkerState();
  console.log(`[Worker] Status check: ${workerState.isRunning}`);
  return { isRunning: workerState.isRunning };
}

// Optional: Add a cleanup function if needed, e.g., for server shutdown
