/**
 * POR Table Checker
 *
 * This script checks what tables are actually available in the POR database
 * and tests some basic SQL queries against them.
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
// Configuration
const CONFIG = {
    SERVER_URL: 'http://localhost:3004'
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('POR Table Checker');
            console.log('================\n');
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database:`);
            console.log(availableTables.join(', '));
            // Test each table with a simple COUNT query
            console.log('\nTesting each table with a simple COUNT query:');
            for (const table of availableTables) {
                const sql = `SELECT Count(*) AS value FROM ${table}`;
                console.log(`\nTesting: ${sql}`);
                try {
                    const result = yield testSqlExpression(sql);
                    if (result.success) {
                        console.log(`✅ Success! Count: ${result.value}`);
                    }
                    else {
                        console.log(`❌ Failed: ${result.error}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error: ${error}`);
                }
            }
            // Test a few common SQL patterns for POR
            console.log('\nTesting common SQL patterns for POR:');
            const testQueries = [
                {
                    name: 'Count with Month filter',
                    sql: `SELECT Count(*) AS value FROM ${availableTables[0]} WHERE Month(Date) = 1`
                },
                {
                    name: 'Count with Year filter',
                    sql: `SELECT Count(*) AS value FROM ${availableTables[0]} WHERE Year(Date) = Year(Date())`
                },
                {
                    name: 'DateAdd function',
                    sql: `SELECT Count(*) AS value FROM ${availableTables[0]} WHERE Date >= DateAdd('d', -30, Date())`
                }
            ];
            for (const test of testQueries) {
                console.log(`\nTesting: ${test.name}`);
                console.log(`SQL: ${test.sql}`);
                try {
                    const result = yield testSqlExpression(test.sql);
                    if (result.success) {
                        console.log(`✅ Success! Result: ${result.value}`);
                    }
                    else {
                        console.log(`❌ Failed: ${result.error}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error: ${error}`);
                }
            }
        }
        catch (error) {
            console.error('Error in main function:', error);
        }
    });
}
/**
 * Get available tables from the POR database
 */
function getAvailableTables() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${CONFIG.SERVER_URL}/api/test-por-sql`);
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = yield response.json();
            return data.availableTables || [];
        }
        catch (error) {
            console.error('Error fetching available tables:', error);
            return [];
        }
    });
}
/**
 * Test a POR SQL expression against the database
 */
function testSqlExpression(sql) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${CONFIG.SERVER_URL}/api/test-sql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sqlExpression: sql,
                    serverType: 'POR'
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                return {
                    success: false,
                    error: `API error (${response.status}): ${errorText}`
                };
            }
            const data = yield response.json();
            // Check if there's a result
            if (data.result && Array.isArray(data.result) && data.result.length > 0) {
                // Extract the value from the first result
                const value = data.result[0].value !== undefined ? data.result[0].value : data.result[0];
                // Check if the result contains an error
                if (value && typeof value === 'object' && value.error) {
                    return {
                        success: false,
                        error: value.error
                    };
                }
                return {
                    success: true,
                    value: value
                };
            }
            else if (data.result && !Array.isArray(data.result)) {
                // Handle case where result is a single value or object
                const value = data.result.value !== undefined ? data.result.value : data.result;
                // Check if the result contains an error
                if (value && typeof value === 'object' && value.error) {
                    return {
                        success: false,
                        error: value.error
                    };
                }
                return {
                    success: true,
                    value: value
                };
            }
            else {
                // No results or empty array
                return {
                    success: false,
                    error: 'No results returned from query'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Error: ${error.message}`
            };
        }
    });
}
// Run the main function
main().catch(console.error);
