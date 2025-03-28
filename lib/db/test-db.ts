import { Database } from 'sqlite3';
import { promises as fs } from 'fs';
import { join } from 'path';
import { initializeTestData, getTestValue } from './initialize-test-data';

let db: Database | null = null;
let dbInitialized = false;

export const initTestDb = async () => {
  if (dbInitialized && db) return db;

  try {
    console.log('Creating new in-memory test database');
    db = new Database(':memory:', (err) => {
      if (err) {
        console.error('Error opening test database:', err);
        throw err;
      }
      console.log('In-memory database created successfully');
    });

    // Read and execute the SQL setup script
    const sqlPath = join(process.cwd(), 'lib', 'db', 'test-data.sql');
    console.log(`Reading SQL script from ${sqlPath}`);
    const sqlScript = await fs.readFile(sqlPath, 'utf-8');
    
    return new Promise<Database>((resolve, reject) => {
      console.log('Executing SQL setup script...');
      db?.exec(sqlScript, async (err) => {
        if (err) {
          console.error('Error initializing test database:', err);
          reject(err);
        } else {
          console.log('Test database initialized successfully');
          
          // Initialize test data mappings
          try {
            await initializeTestData();
            console.log('Test data mappings initialized successfully');
          } catch (testDataError) {
            console.error('Error initializing test data mappings:', testDataError);
            // Continue even if test data initialization fails
          }
          
          dbInitialized = true;
          resolve(db!);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
};

export const executeTestQuery = async (query: string, serverName: string = 'P21'): Promise<any[]> => {
  try {
    if (!db || !dbInitialized) {
      console.log('Initializing test database before executing query');
      await initTestDb();
    }

    console.log(`Executing test query on ${serverName}: ${query}`);
    
    // Check if this is a query for a specific row ID
    const rowIdMatch = query.match(/-- ROW_ID: ([a-zA-Z0-9_-]+)/);
    const rowId = rowIdMatch ? rowIdMatch[1] : null;
    
    if (rowId) {
      console.log(`Detected row ID: ${rowId}, using it for test value generation`);
      
      // Get the test value for this row ID from the test_data_mapping table
      const testValue = await getTestValueForRowId(rowId, serverName);
      console.log(`Generated test value for row ${rowId}: ${testValue}`);
      return [{ value: testValue }];
    }
    
    // If the query is a SELECT with a constant value (our pattern-based queries)
    // just parse and return the value without hitting the database
    if (query.trim().toUpperCase().startsWith('SELECT ')) {
      const parts = query.trim().split(' ');
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        // This is a simple "SELECT number" query
        const directValue = Number(parts[1]);
        console.log(`Direct value from constant query: ${directValue}`);
        return [{ value: directValue }];
      }
      
      // Handle "SELECT x * y" pattern
      if (parts.length >= 4 && parts[2] === '*' && 
          !isNaN(Number(parts[1])) && !isNaN(Number(parts[3]))) {
        const value1 = Number(parts[1]);
        const value2 = Number(parts[3]);
        const result = value1 * value2;
        console.log(`Calculated value from pattern: ${value1} * ${value2} = ${result}`);
        return [{ value: result }];
      }
    }
    
    // Check for AR Aging queries
    if (query.toLowerCase().includes('ar_open_items') && query.toLowerCase().includes('days_past_due')) {
      // This is an AR Aging query, generate appropriate test data
      const agingBuckets = [
        { range: 'Current', value: Math.floor(Math.random() * 50000) + 10000 },
        { range: '1-30', value: Math.floor(Math.random() * 30000) + 5000 },
        { range: '31-60', value: Math.floor(Math.random() * 20000) + 3000 },
        { range: '61-90', value: Math.floor(Math.random() * 10000) + 1000 },
        { range: '91+', value: Math.floor(Math.random() * 5000) + 500 }
      ];
      
      // Try to determine which aging bucket this query is for
      let bucketIndex = 0;
      if (query.includes('days_past_due = 0') || query.includes('days_past_due <= 0')) {
        bucketIndex = 0; // Current
      } else if (query.includes('days_past_due <= 30') || query.includes('days_past_due BETWEEN 1 AND 30')) {
        bucketIndex = 1; // 1-30
      } else if (query.includes('days_past_due <= 60') || query.includes('days_past_due BETWEEN 31 AND 60')) {
        bucketIndex = 2; // 31-60
      } else if (query.includes('days_past_due <= 90') || query.includes('days_past_due BETWEEN 61 AND 90')) {
        bucketIndex = 3; // 61-90
      } else if (query.includes('days_past_due > 90')) {
        bucketIndex = 4; // 91+
      }
      
      console.log(`AR Aging query for bucket ${agingBuckets[bucketIndex].range}`);
      return [{ value: agingBuckets[bucketIndex].value }];
    }
    
    // Transform the query to match our test database schema
    const transformedQuery = transformQueryForTestDb(query, serverName);
    console.log(`Transformed query: ${transformedQuery}`);
    
    // Execute the transformed query
    return new Promise<any[]>((resolve, reject) => {
      db?.all(transformedQuery, (err, rows) => {
        if (err) {
          console.error('Error executing test query:', err);
          // Return a default value instead of rejecting
          console.log('Returning default value 0 due to query error');
          resolve([{ value: 0, error: err.message, errorType: 'execution' }]);
        } else if (rows && rows.length > 0) {
          // Process the rows to ensure they have a 'value' property
          const processedRows = rows.map((row: any) => {
            // If the row already has a 'value' property, keep it as is
            if ('value' in row) {
              // Convert string values to numbers when appropriate
              if (typeof row.value === 'string') {
                const parsedValue = parseFloat(String(row.value));
                if (!isNaN(parsedValue)) {
                  return { ...row, value: parsedValue };
                }
              }
              return row;
            }
            
            // Otherwise, extract the first column value and create a new object with a 'value' property
            const keys = Object.keys(row);
            if (keys.length > 0) {
              // Try to find a key named 'value' or similar first
              const valueKey = keys.find(k => k.toLowerCase() === 'value') || keys[0];
              const firstValue = row[valueKey];
              
              // Try to convert the value to a number if it's a string
              let numericValue = firstValue;
              if (typeof firstValue === 'string') {
                const parsedValue = parseFloat(String(firstValue));
                if (!isNaN(parsedValue)) {
                  numericValue = parsedValue;
                }
              }
              
              console.log(`Processed row: Created value property with ${numericValue} from column ${valueKey}`);
              return { ...row, value: numericValue };
            }
            
            // Fallback if the row is empty
            return { value: 0 };
          });
          
          console.log(`Query returned ${processedRows.length} rows`);
          resolve(processedRows);
        } else {
          console.log('Query returned no rows, using default empty array');
          resolve([{ value: 0 }]);
        }
      });
    });
  } catch (error: any) {
    console.error('Error in executeTestQuery:', error);
    return [{ value: 0, error: error.message, errorType: 'execution' }];
  }
};

// Function to transform production SQL queries to match our test database schema
function transformQueryForTestDb(query: string, serverName: string): string {
  let transformedQuery = query;
  
  // Handle SQL Server specific functions
  transformedQuery = transformedQuery
    // Date functions
    .replace(/GETDATE\(\)/gi, "datetime('now')")
    .replace(/DATEADD\(month, -(\d+), GETDATE\(\)\)/gi, "datetime('now', '-$1 month')")
    .replace(/DATEADD\(day, -(\d+), GETDATE\(\)\)/gi, "datetime('now', '-$1 day')")
    .replace(/CONVERT\(date, ([^)]+)\)/gi, "date($1)")
    .replace(/FORMAT\(([^,]+), 'yyyy-MM'\)/gi, "strftime('%Y-%m', $1)")
    .replace(/MONTH\(([^)]+)\)/gi, "strftime('%m', $1)")
    .replace(/YEAR\(([^)]+)\)/gi, "strftime('%Y', $1)")
    // Aggregation functions
    .replace(/ISNULL\(/gi, "COALESCE(")
    // Remove NOLOCK hints
    .replace(/WITH \(NOLOCK\)/gi, "");
  
  // Replace P21 table names with our test table names
  if (serverName === 'P21') {
    // P21 schema references
    transformedQuery = transformedQuery
      .replace(/P21\.dbo\./gi, "")
      .replace(/pub\./gi, "pub_");
    
    // Common P21 table name replacements
    transformedQuery = transformedQuery
      .replace(/\boe_hdr\b/gi, 'pub_oe_hdr')
      .replace(/\bcustomers\b/gi, 'pub_customers')
      .replace(/\binventory_master\b/gi, 'pub_inventory_master')
      .replace(/\bwebsite_orders\b/gi, 'pub_website_orders')
      .replace(/\bar_open_items\b/gi, 'pub_ar_open_items')
      .replace(/\bap_open_items\b/gi, 'pub_ap_open_items');
    
    // Replace P21 column names with our test column names
    transformedQuery = transformedQuery
      .replace(/\border_no\b/gi, 'order_id')
      .replace(/\bord_no\b/gi, 'order_id')
      .replace(/\bcust_no\b/gi, 'customer_id')
      .replace(/\bitem_no\b/gi, 'item_id')
      .replace(/\binv_no\b/gi, 'invoice_id')
      .replace(/\bord_date\b/gi, 'order_date')
      .replace(/\border_date\b/gi, 'order_date')
      .replace(/\border_amt\b/gi, 'total_amount')
      .replace(/\btotal_amt\b/gi, 'total_amount')
      .replace(/\bqty_oh\b/gi, 'qty_on_hand')
      .replace(/\bitem_status\b/gi, 'status')
      .replace(/\border_status\b/gi, 'status')
      .replace(/\binvoice_amt\b/gi, 'amount_open');
  }
  
  // Replace POR table names with our test table names
  if (serverName === 'POR') {
    // POR schema references
    transformedQuery = transformedQuery
      .replace(/POR\.dbo\./gi, "")
      .replace(/dbo\./gi, "por_");
    
    // Common POR table name replacements
    transformedQuery = transformedQuery
      .replace(/\brental_contracts\b/gi, 'por_rental_contracts')
      .replace(/\brental_items\b/gi, 'por_rental_items')
      .replace(/\bcustomers\b/gi, 'por_customers')
      .replace(/\binvoices\b/gi, 'por_invoices');
    
    // Replace POR column names with our test column names
    transformedQuery = transformedQuery
      .replace(/\bcontract_no\b/gi, 'contract_id')
      .replace(/\bcustomer_no\b/gi, 'customer_id')
      .replace(/\bitem_no\b/gi, 'item_id')
      .replace(/\binvoice_no\b/gi, 'invoice_id')
      .replace(/\bcontract_date\b/gi, 'start_date')
      .replace(/\btotal_amt\b/gi, 'total_value');
  }
  
  // Handle generic table names for test SQL expressions
  transformedQuery = transformedQuery
    .replace(/\borders\b/gi, 'pub_oe_hdr')
    .replace(/\binvoices\b/gi, 'pub_ar_open_items')
    .replace(/\binventory\b/gi, 'pub_inventory_master');
  
  // Fix 'rowid' error by replacing it with the primary key column
  if (transformedQuery.includes('rowid')) {
    const tableMatch = transformedQuery.match(/FROM\s+(\w+)/i);
    if (tableMatch && tableMatch[1]) {
      const tableName = tableMatch[1];
      
      // Try to determine the primary key based on common naming patterns
      let primaryKey = '';
      
      if (tableName.toLowerCase() === 'oe_hdr') {
        primaryKey = 'order_no';
      } else if (tableName.toLowerCase() === 'ar_cust') {
        primaryKey = 'customer_id';
      } else if (tableName.toLowerCase() === 'in_item') {
        primaryKey = 'item_id';
      } else if (tableName.toLowerCase() === 'ar_open_item') {
        primaryKey = 'invoice_no';
      } else if (tableName.toLowerCase() === 'ap_open_item') {
        primaryKey = 'invoice_no';
      } else if (tableName.toLowerCase() === 'rentals') {
        primaryKey = 'RentalID';
      } else if (tableName.toLowerCase() === 'customers') {
        primaryKey = 'CustomerID';
      } else if (tableName.toLowerCase() === 'locations') {
        primaryKey = 'LocationID';
      } else {
        // If we can't determine the primary key, use a generic ID column
        primaryKey = `${tableName}_id`;
      }
      
      // Replace rowid with the primary key
      transformedQuery = transformedQuery.replace(/rowid/gi, primaryKey);
    }
  }
  
  console.log(`Transformed query: ${transformedQuery}`);
  return transformedQuery;
}

// Generate a consistent test value based on row ID and server
function generateTestValue(rowId: string, serverName: string): number {
  // Use the row ID to generate a consistent value
  const hash = rowId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Different ranges for different servers
  const baseValue = (hash % 900) + 100; // Range 100-999
  
  // Apply server-specific multipliers
  let value = baseValue;
  if (serverName === 'P21') {
    // P21 values tend to be higher
    value = Math.round(baseValue * 1.5);
  } else if (serverName === 'POR') {
    // POR values tend to be lower
    value = Math.round(baseValue * 0.8);
  }
  
  // Add some variance based on the length of the row ID
  const variance = rowId.length % 5;
  value = value + variance;
  
  return value;
}

// Get a test value for a specific row ID, checking the database first
export const getTestValueForRowId = async (rowId: string, serverName: string): Promise<number> => {
  try {
    // First, check if we have a stored test value for this row ID
    const storedValue = await getStoredTestValue(rowId);
    
    if (storedValue !== null) {
      console.log(`Using stored test value for row ${rowId}: ${storedValue}`);
      return storedValue;
    }
    
    // If no stored value, generate a new one
    console.log(`No stored test value found for row ${rowId}, generating new value`);
    const generatedValue = generateTestValue(rowId, serverName);
    
    // Store the generated value for future use
    await storeTestValue(rowId, generatedValue);
    
    return generatedValue;
  } catch (error) {
    console.error(`Error getting test value for row ${rowId}:`, error);
    return 0;
  }
};

// Store a test value in the database
export const storeTestValue = async (rowId: string, value: number): Promise<void> => {
  try {
    if (!db || !dbInitialized) {
      await initTestDb();
    }
    
    return new Promise<void>((resolve, reject) => {
      const stmt = db?.prepare(`
        INSERT OR REPLACE INTO test_data_mapping (id, test_value)
        VALUES (?, ?)
      `);
      
      stmt?.run(rowId, value.toString(), (err: Error | null) => {
        if (err) {
          console.error(`Error storing test value for row ${rowId}:`, err);
          reject(err);
        } else {
          console.log(`Stored test value for row ${rowId}: ${value}`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(`Error storing test value for row ${rowId}:`, error);
  }
};

// Get a stored test value from the database
async function getStoredTestValue(rowId: string): Promise<number | null> {
  return new Promise<number | null>((resolve, reject) => {
    if (!db) {
      resolve(null);
      return;
    }
    
    db.get('SELECT test_value FROM test_data_mapping WHERE id = ?', [rowId], (err, row: any) => {
      if (err || !row) {
        resolve(null);
      } else {
        const value = Number(row.test_value);
        if (isNaN(value)) {
          resolve(null);
        } else {
          resolve(value);
        }
      }
    });
  });
}

export const closeTestDb = async () => {
  return new Promise<void>((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing test database:', err);
          reject(err);
        } else {
          db = null;
          dbInitialized = false;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};
