var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { join } from 'path';
let db = null;
let dbInitialized = false;
// Stub for initializeTestData - ensures the mapping table exists
// In a real scenario, this might populate the table based on single-source-data.ts
const initializeTestData = (dbInstance) => {
    console.log('Initializing test data mappings (ensuring table exists)...');
    try {
        const stmt = dbInstance.prepare(`
            CREATE TABLE IF NOT EXISTS test_data_mapping (
                id TEXT PRIMARY KEY,
                test_value TEXT
            );
        `);
        stmt.run();
        console.log('test_data_mapping table verified/created.');
    }
    catch (error) {
        console.error('Error ensuring test_data_mapping table exists:', error);
        throw error;
    }
};
// Generate a consistent test value based on row ID and server
function generateTestValue(rowId, serverName) {
    const hash = rowId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseValue = (hash % 900) + 100;
    let value = baseValue;
    if (serverName === 'P21') {
        value = Math.round(baseValue * 1.5);
    }
    else if (serverName === 'POR') {
        value = Math.round(baseValue * 0.8);
    }
    const variance = rowId.length % 5;
    value = value + variance;
    return value;
}
// Store a test value in the database (synchronous)
const storeTestValue = (dbInstance, rowId, value) => {
    try {
        const stmt = dbInstance.prepare(`
            INSERT OR REPLACE INTO test_data_mapping (id, test_value)
            VALUES (?, ?)
        `);
        stmt.run(rowId, value.toString());
        console.log(`Stored test value for row ${rowId}: ${value}`);
    }
    catch (error) {
        console.error(`Error storing test value for row ${rowId}:`, error);
    }
};
// Get a stored test value from the database (synchronous)
function getStoredTestValue(dbInstance, rowId) {
    try {
        const stmt = dbInstance.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?');
        const row = stmt.get(rowId);
        if (row && row.test_value) {
            const value = Number(row.test_value);
            return isNaN(value) ? null : value;
        }
        return null;
    }
    catch (error) {
        console.error(`Error getting stored test value for row ${rowId}:`, error);
        return null;
    }
}
// Get a test value for a specific row ID, checking the database first (synchronous)
const getTestValueForRowId = (dbInstance, rowId, serverName) => {
    const storedValue = getStoredTestValue(dbInstance, rowId);
    if (storedValue !== null) {
        console.log(`Using stored test value for row ${rowId}: ${storedValue}`);
        return storedValue;
    }
    console.log(`No stored test value found for row ${rowId}, generating new value`);
    const generatedValue = generateTestValue(rowId, serverName);
    storeTestValue(dbInstance, rowId, generatedValue);
    return generatedValue;
};
export const initTestDb = () => __awaiter(void 0, void 0, void 0, function* () {
    if (dbInitialized && db)
        return db;
    try {
        console.log('Creating new in-memory test database');
        db = new Database(':memory:');
        if (!db) {
            throw new Error('Failed to create in-memory database instance.');
        }
        console.log('In-memory database created successfully');
        const sqlPath = join(process.cwd(), 'lib', 'db', 'test-data.sql');
        console.log(`Reading SQL script from ${sqlPath}`);
        const sqlScript = yield fs.readFile(sqlPath, 'utf-8');
        const statements = sqlScript
            .split(/;\s*($|--.*)/m) // Split on semicolon possibly followed by comment or end-of-line
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        console.log(`Found ${statements.length} SQL statements to execute.`);
        for (const statement of statements) {
            try {
                console.log(`Executing Test DB Statement: ${statement.substring(0, 150)}...`);
                const stmt = db.prepare(statement);
                stmt.run();
                // console.log(`Successfully executed: ${statement.substring(0, 50)}...`); // Reduce verbosity
            }
            catch (error) {
                console.error(`--- Test DB Init FAILED ---`);
                console.error(`Failed SQL Statement: ${statement}`);
                console.error(`Error:`, error);
                db.close(); // Close connection on error
                throw new Error(`Failed to initialize test database during statement execution. Error: ${error.message}`); // Re-throw to stop execution
            }
        }
        console.log('All SQL statements executed successfully.');
        console.log('Test database schema and base data initialized successfully');
        try {
            if (!db)
                throw new Error('Database instance is null before initializing test data.');
            initializeTestData(db);
            console.log('Test data mappings initialized successfully');
        }
        catch (testDataError) {
            console.error('Error initializing test data mappings:', testDataError);
        }
        dbInitialized = true;
        if (!db) {
            throw new Error("Database initialization failed unexpectedly before return.");
        }
        return db;
    }
    catch (error) {
        console.error('Failed to initialize test database:', error);
        if (db) {
            db.close();
            db = null;
        }
        dbInitialized = false;
        throw error;
    }
});
export const executeQuery = (query, serverName) => {
    if (!db || !dbInitialized) {
        throw new Error('Test database is not initialized. Call initTestDb first.');
    }
    console.log(`Executing test query on ${serverName}: ${query}`);
    const rowIdMatch = query.match(/-- ROW_ID: ([a-zA-Z0-9_-]+)/);
    const rowId = rowIdMatch ? rowIdMatch[1] : null;
    if (rowId) {
        console.log(`Detected row ID: ${rowId}, using it for test value generation`);
        const testValue = getTestValueForRowId(db, rowId, serverName);
        console.log(`Generated test value for row ${rowId}: ${testValue}`);
        return [{ value: testValue }];
    }
    if (query.trim().toUpperCase().startsWith('SELECT ')) {
        const parts = query.trim().split(' ');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
            const directValue = Number(parts[1]);
            console.log(`Direct value from constant query: ${directValue}`);
            return [{ value: directValue }];
        }
        if (parts.length === 4 && parts[2] === '*' && !isNaN(Number(parts[1])) && !isNaN(Number(parts[3]))) {
            const value1 = Number(parts[1]);
            const value2 = Number(parts[3]);
            console.log(`Direct calculation from query: ${value1 * value2}`);
            return [{ value: value1 * value2 }];
        }
    }
    if (query.toLowerCase().includes('ar_open_items') && query.toLowerCase().includes('days_past_due')) {
        console.warn('Simulating AR Aging query result - Consider using actual data');
        const agingBuckets = [
            { range: 'Current', value: Math.floor(Math.random() * 50000) + 10000 },
            { range: '1-30', value: Math.floor(Math.random() * 30000) + 5000 },
            { range: '31-90', value: Math.floor(Math.random() * 20000) + 1000 },
            { range: '91+', value: Math.floor(Math.random() * 5000) + 500 }
        ];
        let bucketIndex = 0;
        if (query.includes('>= 1 AND') && query.includes('<= 30'))
            bucketIndex = 1;
        else if (query.includes('>= 31 AND') && query.includes('<= 90'))
            bucketIndex = 2;
        else if (query.includes('>= 91'))
            bucketIndex = 3;
        else if (query.includes('= 0') || query.includes('<= 0'))
            bucketIndex = 0;
        return [{ value: agingBuckets[bucketIndex].value }];
    }
    const transformedQuery = transformQueryForTestDb(query, serverName);
    console.log(`Transformed query: ${transformedQuery}`);
    try {
        if (!db)
            throw new Error('Database instance is null during query execution.');
        const rows = db.prepare(transformedQuery).all();
        if (rows && rows.length > 0) {
            const processedRows = rows.map((row) => {
                if ('value' in row) {
                    if (typeof row.value === 'string') {
                        const parsedValue = parseFloat(row.value);
                        if (!isNaN(parsedValue))
                            return Object.assign(Object.assign({}, row), { value: parsedValue });
                    }
                    return row;
                }
                const keys = Object.keys(row);
                if (keys.length > 0) {
                    const firstValue = row[keys[0]];
                    let numericValue = firstValue;
                    if (typeof firstValue === 'string') {
                        const parsedValue = parseFloat(firstValue);
                        if (!isNaN(parsedValue))
                            numericValue = parsedValue;
                    }
                    return Object.assign(Object.assign({}, row), { value: numericValue });
                }
                return { value: 0 };
            });
            console.log(`Query successful, returning ${processedRows.length} processed rows.`);
            return processedRows;
        }
        else {
            console.log('Query executed successfully but returned no rows. Returning default [{ value: 0 }].');
            return [{ value: 0 }];
        }
    }
    catch (err) {
        console.error(`Error executing transformed query: ${transformedQuery}`, err);
        console.log('Returning default value [{ value: 0 }] due to query execution error.');
        return [{ value: 0, error: err.message, errorType: 'execution' }];
    }
};
function transformQueryForTestDb(query, serverName) {
    let transformedQuery = query;
    transformedQuery = transformedQuery
        .replace(/GETDATE\(\)/gi, "datetime('now')")
        .replace(/DATEADD\(month,\s*-(\d+),\s*GETDATE\(\)\)/gi, "datetime('now', '-$1 months')")
        .replace(/DATEADD\(day,\s*-(\d+),\s*GETDATE\(\)\)/gi, "datetime('now', '-$1 days')")
        .replace(/DATEDIFF\(day,\s*([^,]+),\s*GETDATE\(\)\)/gi, "julianday('now') - julianday($1)")
        .replace(/FORMAT\(([^,]+),\s*'yyyy-MM'\)/gi, "strftime('%Y-%m', $1)")
        .replace(/MONTH\(([^)]+)\)/gi, "CAST(strftime('%m', $1) AS INTEGER)")
        .replace(/YEAR\(([^)]+)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)")
        .replace(/ISNULL\(/gi, "COALESCE(")
        .replace(/WITH\s+\(NOLOCK\)/gi, "")
        .replace(/dbo\./gi, "");
    if (serverName === 'P21') {
        transformedQuery = transformedQuery
            .replace(/\boe_hdr\b/gi, 'pub_oe_hdr')
            .replace(/\bcustomers\b/gi, 'pub_customers')
            .replace(/\binventory_master\b/gi, 'pub_inventory_master')
            .replace(/\bwebsite_orders\b/gi, 'pub_website_orders')
            .replace(/\bar_open_items\b/gi, 'pub_ar_open_items')
            .replace(/\bap_open_items\b/gi, 'pub_ap_open_items');
        transformedQuery = transformedQuery
            .replace(/\border_no\b/gi, 'order_id')
            .replace(/\bcustomer_no\b/gi, 'customer_id')
            .replace(/\bitem_no\b/gi, 'item_id')
            .replace(/\binvoice_no\b/gi, 'invoice_id')
            .replace(/\binvoice_date\b/gi, 'invoice_date')
            .replace(/\bdue_dt\b/gi, 'due_date')
            .replace(/\binvoice_amt\b/gi, 'amount_open');
    }
    if (serverName === 'POR') {
        transformedQuery = transformedQuery
            .replace(/\brental_contracts\b/gi, 'por_rental_contracts')
            .replace(/\brental_items\b/gi, 'por_rental_items')
            .replace(/\bcustomers\b/gi, 'por_customers')
            .replace(/\binvoices\b/gi, 'por_invoices');
        transformedQuery = transformedQuery
            .replace(/\bcontract_no\b/gi, 'contract_id')
            .replace(/\bcustomer_no\b/gi, 'customer_id')
            .replace(/\bitem_no\b/gi, 'item_id')
            .replace(/\btotal_amt\b/gi, 'total_value')
            .replace(/\binvoice_date\b/gi, 'invoice_date')
            .replace(/\bdue_dt\b/gi, 'due_date');
    }
    transformedQuery = transformedQuery
        .replace(/\borders\b/gi, 'pub_oe_hdr')
        .replace(/\binvoices\b/gi, 'pub_ar_open_items');
    transformedQuery = transformedQuery.trim().replace(/;$/, '');
    return transformedQuery;
}
export const closeDbConnection = () => {
    if (db) {
        console.log('Closing test database connection.');
        db.close();
        db = null;
        dbInitialized = false;
    }
};
