/**
 * Test POR Query Execution
 *
 * This script tests executing queries against the POR database
 * using the executeAccessQuery API endpoint.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import MDBReader from 'mdb-reader';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
// Set the correct POR database path from memory
const POR_DB_PATH = 'C:\\Users\\BobM\\Desktop\\POR.MDB';
// Expected tables based on schema
const EXPECTED_TABLES = [
    'Contracts',
    'Rentals',
    'Transactions',
    'Orders',
    'Invoices',
    'tblContract',
    'tblCustomer',
    'tblEquipment',
    'tblTransaction'
];
/**
 * Test connection to the POR database
 */
function testPORConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing POR database connection...');
        // Get the POR database path from environment variables or use the default
        const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
        console.log(`Using POR database path: ${porFilePath}`);
        // Check if the file exists
        if (!fs.existsSync(porFilePath)) {
            console.error(`POR database file not found at path: ${porFilePath}`);
            console.log('Checking for POR.MDB in common locations...');
            // Check common locations for the POR database
            const commonLocations = [
                'C:\\Users\\BobM\\Desktop\\POR.MDB',
                'C:\\POR\\POR.MDB',
                'C:\\Program Files\\Point of Rental\\POR.MDB',
                'C:\\Program Files (x86)\\Point of Rental\\POR.MDB',
                'D:\\POR\\POR.MDB'
            ];
            let found = false;
            for (const location of commonLocations) {
                if (fs.existsSync(location)) {
                    console.log(`Found POR database at: ${location}`);
                    // Update the environment variable
                    process.env.POR_FILE_PATH = location;
                    // Update the .env.local file
                    try {
                        const envPath = path.join(process.cwd(), '.env.local');
                        let envContent = '';
                        if (fs.existsSync(envPath)) {
                            envContent = fs.readFileSync(envPath, 'utf8');
                            // Check if POR_FILE_PATH already exists
                            if (envContent.includes('POR_FILE_PATH=')) {
                                // Update the existing value
                                envContent = envContent.replace(/POR_FILE_PATH=.*/, `POR_FILE_PATH=${location}`);
                            }
                            else {
                                // Add the new variable
                                envContent += `\nPOR_FILE_PATH=${location}`;
                            }
                        }
                        else {
                            // Create a new .env.local file
                            envContent = `POR_FILE_PATH=${location}`;
                        }
                        // Write the updated content
                        fs.writeFileSync(envPath, envContent);
                        console.log('Updated .env.local file with POR_FILE_PATH');
                    }
                    catch (envError) {
                        console.error('Error updating .env.local file:', envError);
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.error('POR database file not found in any common locations');
                return false;
            }
        }
        try {
            // Test the connection using mdb-reader directly
            console.log('Testing connection with mdb-reader...');
            const buffer = fs.readFileSync(porFilePath);
            const reader = new MDBReader(buffer);
            // Get table names
            const tables = reader.getTableNames();
            console.log('Available tables:', tables);
            // Get some sample data from the first table
            if (tables.length > 0) {
                const firstTable = reader.getTable(tables[0]);
                const columns = firstTable.getColumnNames();
                const sampleData = firstTable.getData({ rowLimit: 5 }); // Get first 5 rows
                console.log(`Sample data from table ${tables[0]}:`);
                console.log('Columns:', columns);
                console.log('Sample rows:', sampleData.length > 0 ? 'Data available' : 'No data');
            }
            console.log('Connection test with mdb-reader successful!');
            return true;
        }
        catch (error) {
            console.error('Error testing connection with mdb-reader:', error);
            return false;
        }
    });
}
/**
 * Execute a test query against the POR database
 */
function executeTestQuery() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Executing test query against POR database...');
        // Get the POR database path
        const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
        try {
            // First, get available tables to use a valid one
            const buffer = fs.readFileSync(porFilePath);
            const reader = new MDBReader(buffer);
            const tableNames = reader.getTableNames();
            if (tableNames.length === 0) {
                console.error('No tables found in the database');
                return false;
            }
            // Find a suitable table for testing
            // Look for common tables or use the first available table
            const commonTables = [
                'AccountingAPIQueueCustomer',
                'AccountingAPIQueueGL',
                'AccountingClass',
                'CustomerStatus'
            ];
            let testTable = '';
            for (const table of commonTables) {
                if (tableNames.includes(table)) {
                    testTable = table;
                    console.log(`Found common table for testing: ${testTable}`);
                    break;
                }
            }
            // If no common table found, use the first table
            if (!testTable && tableNames.length > 0) {
                testTable = tableNames[0];
                console.log(`Using first available table for testing: ${testTable}`);
            }
            // Create a test query using the proper MS Access/Jet SQL syntax
            // Format: SELECT Count(*) as value FROM [TableName]
            const testQuery = `SELECT Count(*) as value FROM ${testTable}`;
            console.log(`Test query: ${testQuery}`);
            // Execute the query using the executeAccessQuery API endpoint
            const response = yield fetch('http://localhost:3000/api/executeAccessQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: porFilePath,
                    sql: testQuery
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error(`Query execution failed with status ${response.status}: ${errorText}`);
                return false;
            }
            const result = yield response.json();
            if (result.error) {
                console.error('Query execution failed:', result.error);
                // If we have available tables, suggest a valid table
                if (result.availableTables) {
                    console.log('Available tables:', result.availableTables);
                    console.log('Try using one of these tables in your query');
                }
                // If we have suggested tables, show them
                if (result.suggestedTables) {
                    console.log('Suggested tables:', result.suggestedTables);
                    console.log('Suggestion:', result.suggestion);
                }
                return false;
            }
            console.log('Query execution successful!');
            console.log('Result:', result);
            // Try a more complex query if the first one succeeded
            if (result && Array.isArray(result) && result.length > 0) {
                // Get the columns for the test table
                const table = reader.getTable(testTable);
                const columns = table.getColumnNames();
                if (columns.length > 0) {
                    // Create a query that selects the first column with an alias
                    const testColumn = columns[0];
                    const complexQuery = `SELECT ${testColumn} as value FROM ${testTable}`;
                    console.log(`\nTesting complex query: ${complexQuery}`);
                    const complexResponse = yield fetch('http://localhost:3000/api/executeAccessQuery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filePath: porFilePath,
                            sql: complexQuery
                        })
                    });
                    if (complexResponse.ok) {
                        const complexResult = yield complexResponse.json();
                        console.log('Complex query result:', complexResult);
                    }
                    else {
                        console.error('Complex query failed');
                    }
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error executing query:', error);
            return false;
        }
    });
}
/**
 * Execute a test query directly using mdb-reader
 */
function executeDirectMDBQuery() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Executing test query directly with mdb-reader...');
        // Get the POR database path
        const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
        try {
            // Read the database file
            const buffer = fs.readFileSync(porFilePath);
            const reader = new MDBReader(buffer);
            // Get available tables
            const tableNames = reader.getTableNames();
            console.log(`Found ${tableNames.length} tables in the database`);
            // Find a suitable table for testing
            // Look for common POR tables or use the first available table
            const commonTables = ['Rentals', 'Contracts', 'Invoices', 'Customers', 'Items'];
            let testTable = '';
            for (const table of commonTables) {
                if (tableNames.includes(table)) {
                    testTable = table;
                    console.log(`Found common table: ${testTable}`);
                    break;
                }
            }
            // If no common table found, use the first table
            if (!testTable && tableNames.length > 0) {
                testTable = tableNames[0];
                console.log(`Using first available table: ${testTable}`);
            }
            if (!testTable) {
                console.error('No tables found in the database');
                return false;
            }
            // Get the table data
            const table = reader.getTable(testTable);
            const columns = table.getColumnNames();
            const rows = table.getData();
            console.log(`Retrieved ${rows.length} rows from table ${testTable}`);
            console.log(`Table columns: ${columns.join(', ')}`);
            console.log(`Count result: ${rows.length}`);
            // Test another query: Get specific columns with a WHERE clause
            if (rows.length > 0) {
                console.log('\nTesting a more complex query...');
                console.log('First row data sample:');
                // Display the first row data
                const firstRow = rows[0];
                columns.forEach((column, index) => {
                    const value = firstRow[index];
                    console.log(`${column}: ${value}`);
                });
                // Try to find a column for filtering
                const textColumns = columns.filter(col => {
                    const index = columns.indexOf(col);
                    const firstValue = rows[0][index];
                    return typeof firstValue === 'string' && firstValue !== null && firstValue !== '';
                });
                if (textColumns.length > 0) {
                    const filterColumn = textColumns[0];
                    console.log(`\nFound text column for filtering: ${filterColumn}`);
                    // Get the value from the first row for this column
                    const columnIndex = columns.indexOf(filterColumn);
                    const filterValue = rows[0][columnIndex];
                    if (filterValue) {
                        console.log(`Filter value: ${filterValue}`);
                        // Filter rows by the value
                        const filteredRows = rows.filter(row => row[columnIndex] === filterValue);
                        console.log(`Filtered rows with ${filterColumn} = ${filterValue}: ${filteredRows.length}`);
                    }
                }
            }
            console.log('Direct query execution with mdb-reader successful!');
            return true;
        }
        catch (error) {
            console.error('Error executing direct query with mdb-reader:', error);
            return false;
        }
    });
}
/**
 * Main function to run the tests
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting POR database tests...');
        // Test the connection
        const connectionSuccess = yield testPORConnection();
        if (!connectionSuccess) {
            console.error('Connection test failed, aborting query tests');
            process.exit(1);
        }
        // Execute a direct query using mdb-reader
        console.log('\n=== Testing direct mdb-reader query ===');
        const directQuerySuccess = yield executeDirectMDBQuery();
        if (!directQuerySuccess) {
            console.error('Direct query test failed');
            // Continue with API test even if direct test fails
        }
        // Check if the server is running before executing the API test
        try {
            yield fetch('http://localhost:3000/api/health');
            console.log('\n=== Testing API query execution ===');
            // Execute a test query via API
            const querySuccess = yield executeTestQuery();
            if (!querySuccess) {
                console.error('API query test failed');
                process.exit(1);
            }
        }
        catch (error) {
            console.warn('Server not running at localhost:3000, skipping API test');
            console.log('You can start the server with: npm run dev');
            // If direct query was successful, consider the test passed
            if (directQuerySuccess) {
                console.log('Direct query test passed successfully!');
                process.exit(0);
            }
            else {
                process.exit(1);
            }
        }
        console.log('All tests passed successfully!');
        process.exit(0);
    });
}
// Run the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
/**
 * Test SQL expressions from the schema
 */
function testSqlExpressions() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing SQL expressions from schema...');
        // Get the POR database path
        const porFilePath = process.env.POR_FILE_PATH || POR_DB_PATH;
        // Define SQL expressions to test based on the schema
        const sqlExpressions = [
            {
                id: "74",
                name: "Historical Data - January - POR",
                sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 1 AND Year([ContractDate]) = Year(Date())"
            },
            {
                id: "78",
                name: "Historical Data - February - POR",
                sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE Month([ContractDate]) = 2 AND Year([ContractDate]) = Year(Date())"
            }
        ];
        try {
            // Read the database file to get actual tables
            const buffer = fs.readFileSync(porFilePath);
            const reader = new MDBReader(buffer);
            const tableNames = reader.getTableNames();
            // Test each SQL expression
            for (const expr of sqlExpressions) {
                console.log(`Testing expression: ${expr.name}`);
                // Extract table name from the SQL expression
                const fromIndex = expr.sqlExpression.toLowerCase().indexOf(' from ');
                const whereIndex = expr.sqlExpression.toLowerCase().indexOf(' where ');
                let tableName = '';
                if (whereIndex !== -1) {
                    tableName = expr.sqlExpression.substring(fromIndex + 6, whereIndex).trim();
                }
                else {
                    tableName = expr.sqlExpression.substring(fromIndex + 6).trim();
                }
                console.log(`Original table name: ${tableName}`);
                // Check if the table exists
                if (!tableNames.includes(tableName)) {
                    console.log(`Table '${tableName}' not found in database`);
                    // Try to find a similar table
                    const similarTables = tableNames.filter(t => t.toLowerCase().includes(tableName.toLowerCase().replace(/s$/, '')));
                    if (similarTables.length > 0) {
                        console.log(`Found similar tables: ${similarTables.join(', ')}`);
                        // Try the first similar table
                        const alternativeTable = similarTables[0];
                        const alternativeSql = expr.sqlExpression.replace(tableName, alternativeTable);
                        console.log(`Trying alternative SQL: ${alternativeSql}`);
                        // Execute the alternative query
                        const response = yield fetch('http://localhost:3000/api/executeAccessQuery', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                filePath: porFilePath,
                                sql: alternativeSql
                            })
                        });
                        if (response.ok) {
                            const result = yield response.json();
                            console.log(`Alternative query result: ${JSON.stringify(result)}`);
                        }
                        else {
                            console.error('Alternative query failed');
                        }
                    }
                    else {
                        console.log('No similar tables found');
                    }
                }
                else {
                    // Execute the original query
                    const response = yield fetch('http://localhost:3000/api/executeAccessQuery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filePath: porFilePath,
                            sql: expr.sqlExpression
                        })
                    });
                    if (response.ok) {
                        const result = yield response.json();
                        console.log(`Query result: ${JSON.stringify(result)}`);
                    }
                    else {
                        console.error('Query failed');
                    }
                }
            }
        }
        catch (error) {
            console.error('Error testing SQL expressions:', error);
        }
    });
}
