/**
 * POR SQL Expression Tester
 *
 * This script tests SQL expressions against the POR database
 * focusing on rental-related queries.
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
// Configuration
const CONFIG = {
    SERVER_URL: 'http://localhost:3004',
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'working-por-sql.json')
};
// SQL expressions to test
const SQL_EXPRESSIONS = [
    {
        name: 'Open Rentals',
        description: 'Count of open rentals since the start of the current year',
        sql: "SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
    },
    {
        name: 'New Rentals Jan',
        description: 'Count of new rentals for January of the current year',
        sql: "SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())"
    },
    {
        name: 'New Rentals Feb',
        description: 'Count of new rentals for February of the current year',
        sql: "SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())"
    },
    {
        name: 'New Rentals Mar',
        description: 'Count of new rentals for March of the current year',
        sql: "SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
    },
    {
        name: 'Rental Value',
        description: 'Sum of Amount for all open rentals in the current year',
        sql: "SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
    },
    {
        name: 'Historical OPOR Value',
        description: 'Sum of Amount for all open rentals in the current year (historical data)',
        sql: "SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)"
    }
];
// Alternative tables to try if Rentals doesn't exist
const ALTERNATIVE_TABLE_PATTERNS = [
    { pattern: "Rental", fallback: "Orders" },
    { pattern: "Order", fallback: "Sales" },
    { pattern: "Customer", fallback: "Clients" }
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('POR SQL Expression Tester');
        console.log('========================\n');
        // Get available tables
        console.log('Fetching available tables from POR database...');
        const availableTables = yield getAvailableTables();
        if (!availableTables || availableTables.length === 0) {
            console.error('No tables found in POR database.');
            return;
        }
        console.log(`Found ${availableTables.length} tables in POR database:`);
        console.log(availableTables.join(', '));
        // Check if Rentals table exists
        const hasRentalsTable = availableTables.includes('Rentals');
        console.log(`Rentals table ${hasRentalsTable ? 'found' : 'not found'} in POR database.`);
        // Find alternative tables if Rentals doesn't exist
        let alternativeTables = [];
        if (!hasRentalsTable) {
            console.log('\nLooking for alternative tables...');
            for (const pattern of ALTERNATIVE_TABLE_PATTERNS) {
                const matches = availableTables.filter(table => table.toLowerCase().includes(pattern.pattern.toLowerCase()));
                if (matches.length > 0) {
                    console.log(`Found ${matches.length} tables matching pattern '${pattern.pattern}':`);
                    console.log(matches.join(', '));
                    alternativeTables = [...alternativeTables, ...matches];
                }
                else {
                    console.log(`No tables found matching pattern '${pattern.pattern}'.`);
                    // Try the fallback
                    const fallbackMatches = availableTables.filter(table => table.toLowerCase().includes(pattern.fallback.toLowerCase()));
                    if (fallbackMatches.length > 0) {
                        console.log(`Found ${fallbackMatches.length} tables matching fallback '${pattern.fallback}':`);
                        console.log(fallbackMatches.join(', '));
                        alternativeTables = [...alternativeTables, ...fallbackMatches];
                    }
                }
            }
            // Remove duplicates
            alternativeTables = [...new Set(alternativeTables)];
            console.log(`\nFound ${alternativeTables.length} potential alternative tables:`);
            console.log(alternativeTables.join(', '));
        }
        // Test SQL expressions
        console.log('\nTesting SQL expressions...');
        const results = [];
        for (const expr of SQL_EXPRESSIONS) {
            console.log(`\nTesting: ${expr.name}`);
            console.log(`SQL: ${expr.sql}`);
            let success = false;
            let result = null;
            let finalSql = expr.sql;
            // Try with original SQL first
            try {
                const response = yield testSql(expr.sql);
                if (response.success) {
                    console.log(`✅ Success! Result: ${JSON.stringify(response.result)}`);
                    success = true;
                    result = response.result;
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    // Try with alternative tables if original failed
                    if (alternativeTables.length > 0) {
                        console.log('\nTrying with alternative tables...');
                        for (const table of alternativeTables) {
                            // Replace 'Rentals' with alternative table name
                            const altSql = expr.sql.replace(/Rentals/g, table);
                            console.log(`Trying with table ${table}:`);
                            console.log(`SQL: ${altSql}`);
                            const altResponse = yield testSql(altSql);
                            if (altResponse.success) {
                                console.log(`✅ Success with alternative table! Result: ${JSON.stringify(altResponse.result)}`);
                                success = true;
                                result = altResponse.result;
                                finalSql = altSql;
                                break;
                            }
                            else {
                                console.log(`❌ Failed with alternative table: ${altResponse.error}`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error testing SQL expression: ${error.message}`);
            }
            results.push({
                name: expr.name,
                description: expr.description,
                originalSql: expr.sql,
                finalSql: finalSql,
                success: success,
                result: result
            });
        }
        // Save results to file
        fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
        // Print summary
        console.log('\nSummary:');
        console.log(`Total expressions: ${results.length}`);
        console.log(`Successful expressions: ${results.filter(r => r.success).length}`);
        console.log(`Failed expressions: ${results.filter(r => !r.success).length}`);
        // Print successful expressions
        if (results.filter(r => r.success).length > 0) {
            console.log('\nSuccessful SQL Expressions:');
            results.filter(r => r.success).forEach(r => {
                console.log(`\n${r.name}:`);
                console.log(`SQL: ${r.finalSql}`);
                console.log(`Result: ${JSON.stringify(r.result)}`);
            });
        }
    });
}
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
function testSql(sql) {
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
            if (data.error) {
                return {
                    success: false,
                    error: data.error
                };
            }
            if (data.result) {
                // Handle array or single result
                const result = Array.isArray(data.result) ? data.result[0] : data.result;
                return {
                    success: true,
                    result: result
                };
            }
            return {
                success: false,
                error: 'No results returned'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    });
}
main().catch(console.error);
