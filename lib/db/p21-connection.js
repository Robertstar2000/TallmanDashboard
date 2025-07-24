/**
 * P21 Database Connection Utilities
 * 
 * This file contains all code needed to connect with, send SQL expressions to,
 * and receive values back from the P21 database.
 */

// NOTE: Dynamic import used to avoid bundling issues with odbc & node-pre-gyp during Next.js build.
let odbc = null;

/**
 * Gets the ODBC module, importing it dynamically if not already loaded
 */
const getOdbc = async () => {
  if (odbc) return odbc;
  try {
    // Using dynamic import for CommonJS package
    odbc = (await import('odbc')).default ?? (await import('odbc'));
    return odbc;
  } catch (err) {
    console.error('[P21] Failed to load odbc package:', err);
    return null;
  }
};

/**
 * Tests connectivity to a P21 SQL Server database using ODBC.
 * Tries to establish a connection and run a trivial `SELECT 1` query.
 * 
 * @param {Object} details - Database connection details
 * @returns {Promise<Object>} Result with success status and message
 */
export async function testP21Connection(details) {
  try {
    // Resolve connection string / DSN
    const dsn = (details && details.dsn) || process.env.P21_DSN;
    const server = details.server || process.env.P21_SERVER;
    const database = details.database || process.env.P21_DATABASE;

    let connectionString;
    if (dsn) {
      connectionString = `DSN=${dsn};`;
    } else if (server && database) {
      // Build a generic trusted connection string (integrated security)
      connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;`;
    } else {
      return { success: false, message: 'Missing DSN or server/database details for P21 connection.' };
    }

    const odbcPkg = await getOdbc();
    if (!odbcPkg) {
      return { success: false, message: 'Failed to load ODBC package.' };
    }

    let conn;
    try {
      console.log(`[P21] Connecting using DSN: ${dsn || 'N/A'}, Server: ${server || 'N/A'}...`);
      conn = await odbcPkg.connect(connectionString);
      await conn.query('SELECT 1');
      return { success: true, message: 'Successfully connected to P21.' };
    } finally {
      if (conn) {
        try {
          await conn.close();
          console.log(`P21 connection closed.`);
        } catch (closeError) {
          console.error(`Error closing P21 connection:`, closeError);
        }
      }
    }
  } catch (err) {
    console.error('[testP21Connection] Error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Executes a SQL query against the P21 database using the DSN.
 * Expects a single row with a single column.
 * 
 * @param {string} sql - SQL query to execute
 * @returns {Promise<number|null>} The query result as a number, or null if failed
 */
export async function executeP21QueryWithValue(sql) {
  console.log(`[P21] Query Init: ${sql.substring(0, 100)}...`);
  const dsnName = process.env.P21_DSN;

  if (!dsnName) {
    console.error('[P21] P21_DSN environment variable is not set. Cannot execute P21 query.');
    return null;
  }

  // Note: Assumes DSN is configured with necessary credentials or uses Windows Auth.
  const connectionString = `DSN=${dsnName};`;
  const odbcPkg = await getOdbc();
  if (!odbcPkg) {
    console.error('[P21] odbc package unavailable; skipping P21 query');
    return null;
  }
  
  let connection = null;

  try {
    console.log(`[P21] Connecting using DSN: ${dsnName}...`);
    connection = await odbcPkg.connect(connectionString);
    console.log('[P21] Connected. Executing query...');
    
    // Execute the query
    const result = await connection.query(sql);
    console.log('[P21] Query executed.');

    if (Array.isArray(result) && result.length > 0) {
      const row = result[0];
      const key = Object.keys(row)[0];
      const rawVal = row[key];
      const numericValue = Number(rawVal);
      
      if (!isNaN(numericValue)) {
        console.log(`[P21] Query Success. Value: ${numericValue}`);
        return numericValue;
      } else {
        console.warn(`[P21] Query returned non-numeric value: ${rawVal}`);
        return null;
      }
    } else {
      console.warn('[P21] Query returned no rows or no result array.');
      return null;
    }
  } catch (error) {
    console.error('[P21] Error executing query:', error);
    return null;
  } finally {
    // Ensure connection is closed even if there's an error
    if (connection) {
      try {
        await connection.close();
        console.log('[P21] Connection closed.');
      } catch (closeError) {
        console.error('[P21] Error closing connection:', closeError);
      }
    }
  }
}

/**
 * Executes a SQL query against the P21 database and returns all results.
 * 
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Object>} Query execution results
 */
export async function executeP21Query(sql) {
  const start = Date.now();
  console.log(`[P21] Executing query: ${sql.substring(0, 100)}...`);
  
  const dsnName = process.env.P21_DSN;
  if (!dsnName) {
    return { 
      success: false, 
      error: 'P21_DSN environment variable is not set' 
    };
  }

  const connectionString = `DSN=${dsnName};`;
  const odbcPkg = await getOdbc();
  if (!odbcPkg) {
    return { 
      success: false, 
      error: 'ODBC package could not be loaded' 
    };
  }

  let connection = null;
  try {
    connection = await odbcPkg.connect(connectionString);
    const result = await connection.query(sql);
    
    // Process results
    if (!Array.isArray(result) || result.length === 0) {
      return {
        success: true,
        data: [],
        columns: [],
        executionTime: Date.now() - start
      };
    }
    
    const firstRow = result[0];
    const columns = Object.keys(firstRow);
    
    return {
      success: true,
      data: result,
      columns,
      executionTime: Date.now() - start
    };
  } catch (err) {
    return { 
      success: false, 
      error: err.message 
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('[P21] Error closing connection:', closeError);
      }
    }
  }
}

export default {
  testP21Connection,
  executeP21QueryWithValue,
  executeP21Query
};
