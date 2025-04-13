import { getAllChartData, updateChartDataValue } from '@/lib/db/server';
import { ChartDataRow } from '@/lib/db/types';
import odbc from 'odbc';

// --- State Management ---

// Define the shape of our global state for development
interface GlobalWorkerState {
  isRunning: boolean;
  promise: Promise<void> | null;
}

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

// Declare module-level state variable for production fallback
let workerStateModuleLevel: GlobalWorkerState;

// Get the state object (either global for dev or module-level for prod)
let workerState = getWorkerState();

// --- Original state variables (commented out or removed) ---
// let isWorkerRunning = false;
// let currentWorkerPromise: Promise<void> | null = null;
const EXECUTION_DELAY_MS = 2000; // 2 seconds

// --- Database Execution Logic ---

/**
 * Executes a SQL query against the P21 database using the DSN.
 * Expects a single row with a single column named 'value'.
 */
async function executeP21QueryWithValue(sql: string): Promise<number | null> {
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

    // Check if result is an array and has at least one element with a 'value' property
    if (Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object' && 'value' in result[0] && result[0].value !== null) {
      const firstResult = result[0] as { value: any }; // Type assertion after checks
      const numericValue = Number(firstResult.value);
      if (!isNaN(numericValue)) {
        console.log(`[Worker] P21 Query Success. Value: ${numericValue}`);
        return numericValue;
      } else {
        console.warn(`[Worker] P21 Query result 'value' is not a valid number:`, firstResult.value, `SQL: ${sql}`);
        return null;
      }
    } else {
      console.warn(`[Worker] P21 Query did not return expected 'value' structure or value was null. SQL: ${sql}`, result);
      return null; // Or potentially 0 depending on desired handling
    }
  } catch (error) {
    console.error(`[Worker] P21 Query FAILED for SQL [${sql.substring(0,100)}...]:`, error instanceof Error ? error.message : error);
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
 * Expects a single row with a single column named 'value'.
 */
async function executePORQueryWithValue(sql: string): Promise<number | null> {
  console.log(`[Worker] POR Query Init: ${sql.substring(0, 100)}...`);
  const dbPath = process.env.POR_DB_PATH;

  if (!dbPath) {
    console.error('[Worker] POR_DB_PATH environment variable is not set. Cannot execute POR query.');
    return null;
  }

  // Construct the connection string for MS Access
  // Note: Ensure the Microsoft Access Database Engine Redistributable is installed
  // on the machine running this code if it's not a standard Windows install with Office.
  const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=${dbPath};`;
  let connection: odbc.Connection | null = null;

  try {
    console.log(`[Worker] POR Connecting using Path: ${dbPath}...`);
    console.log('[Worker] POR Attempting odbc.connect...'); 
    connection = await odbc.connect(connectionString);
    console.log('[Worker] POR odbc.connect successful.'); 
    console.log('[Worker] POR Connected. Executing query...');
    const result = await connection.query<any[]>(sql);
    console.log('[Worker] POR Query executed.');

    if (Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object' && 'value' in result[0] && result[0].value !== null) {
      const firstResult = result[0] as { value: any };
      const numericValue = Number(firstResult.value);
      if (!isNaN(numericValue)) {
        console.log(`[Worker] POR Query Success. Value: ${numericValue}`);
        return numericValue;
      } else {
        console.warn(`[Worker] POR Query result 'value' is not a valid number:`, firstResult.value, `SQL: ${sql}`);
        return null;
      }
    } else {
      console.warn(`[Worker] POR Query did not return expected 'value' structure or value was null. SQL: ${sql}`, result);
      return null;
    }
  } catch (error) {
    console.error(`[Worker] POR Query FAILED during execution or connection for SQL [${sql.substring(0,100)}...]. Error:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('[Worker] POR Error Stack:', error.stack);
    }
    return null;
  } finally {
    console.log('[Worker] POR Entering finally block.'); 
    if (connection) {
      try {
        console.log('[Worker] POR Attempting connection.close()...'); 
        await connection.close();
        console.log('[Worker] POR Connection closed successfully.');
      } catch (closeError) {
        console.error('[Worker] POR Error closing connection:', closeError instanceof Error ? closeError.message : closeError);
      }
    } else {
      console.log('[Worker] POR Connection was null in finally block.'); 
    }
    console.log('[Worker] POR Exiting finally block.'); 
  }
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

      if (!item.productionSqlExpression || !item.serverName || (item.serverName !== 'P21' && item.serverName !== 'POR')) {
        continue; 
      }

      let newValue: number | null = null;
      try {
        if (item.serverName === 'P21') {
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
          console.log(`[Worker] Execution failed or returned no value for item ${item.rowId}, skipping update.`);
        }
      } catch (execError) {
        console.error(`[Worker] Unhandled error executing SQL for item ${item.rowId}:`, execError);
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
