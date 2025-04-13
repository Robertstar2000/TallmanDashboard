/**
 * POR Rental SQL Generator
 *
 * This script generates and tests SQL expressions for the Rentals table in the POR database
 * based on specific requirements for open rentals, new rentals by month, and rental value calculations.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-rental-sql-expressions.json')
};
/**
 * Main function to generate and test SQL expressions
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('POR Rental SQL Generator');
            console.log('=======================\n');
            // Get available tables from POR database
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database:`);
            console.log(availableTables.join(', '));
            // Check if Rentals table exists
            if (!availableTables.includes('Rentals')) {
                console.error('Rentals table not found in POR database.');
                console.log('Available tables are:');
                console.log(availableTables.join(', '));
                return;
            }
            console.log('\nGenerating SQL expressions for Rentals table...');
            // Generate SQL expressions
            const sqlExpressions = [
                // Open rentals - count all with status of Open since the start of the current year
                {
                    name: 'Open Rentals',
                    description: 'Count of open rentals since the start of the current year',
                    sql: `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`,
                    success: false
                },
                // New rentals by month - January
                {
                    name: 'New Rentals Jan',
                    description: 'Count of new rentals for January of the current year',
                    sql: `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())`,
                    success: false
                },
                // New rentals by month - February
                {
                    name: 'New Rentals Feb',
                    description: 'Count of new rentals for February of the current year',
                    sql: `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())`,
                    success: false
                },
                // New rentals by month - March
                {
                    name: 'New Rentals Mar',
                    description: 'Count of new rentals for March of the current year',
                    sql: `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())`,
                    success: false
                },
                // Rental value - sum Amount for all with status of Open for the current year
                {
                    name: 'Rental Value',
                    description: 'Sum of Amount for all open rentals in the current year',
                    sql: `SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`,
                    success: false
                },
                // Historical OPOR value - sum Amount for all with status of Open for the current year
                {
                    name: 'Historical OPOR Value',
                    description: 'Sum of Amount for all open rentals in the current year (historical data)',
                    sql: `SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`,
                    success: false
                }
            ];
            // Test each SQL expression
            for (let i = 0; i < sqlExpressions.length; i++) {
                const expression = sqlExpressions[i];
                console.log(`\nTesting ${i + 1}/${sqlExpressions.length}: ${expression.name}`);
                console.log(`SQL: ${expression.sql}`);
                try {
                    const result = yield testSqlExpression(expression.sql);
                    if (result.success && !result.error) {
                        console.log(`✅ Success! Result: ${JSON.stringify(result.value)}`);
                        expression.success = true;
                        expression.result = result.value;
                    }
                    else {
                        console.log(`❌ Failed: ${result.error}`);
                        expression.success = false;
                        expression.error = result.error;
                        // Try alternative tables if Rentals doesn't work
                        console.log('\nTrying with alternative tables...');
                        let fixed = false;
                        for (const table of availableTables) {
                            if (fixed || table === 'Rentals')
                                continue;
                            // Replace Rentals with the alternative table
                            const alternativeSql = expression.sql.replace(/Rentals/g, table);
                            console.log(`Trying with table ${table}:`);
                            console.log(`SQL: ${alternativeSql}`);
                            const alternativeResult = yield testSqlExpression(alternativeSql);
                            if (alternativeResult.success && !alternativeResult.error) {
                                console.log(`✅ Success with alternative table! Result: ${JSON.stringify(alternativeResult.value)}`);
                                expression.success = true;
                                expression.result = alternativeResult.value;
                                expression.sql = alternativeSql;
                                fixed = true;
                                break;
                            }
                            else {
                                console.log(`❌ Failed with alternative table: ${alternativeResult.error}`);
                            }
                        }
                    }
                }
                catch (error) {
                    console.error(`Error testing SQL expression: ${error.message}`);
                    expression.success = false;
                    expression.error = error.message;
                }
            }
            // Save results to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(sqlExpressions, null, 2));
            // Print summary
            console.log('\nSummary:');
            console.log(`Total expressions: ${sqlExpressions.length}`);
            console.log(`Successful expressions: ${sqlExpressions.filter(expr => expr.success).length}`);
            console.log(`Failed expressions: ${sqlExpressions.filter(expr => !expr.success).length}`);
            console.log(`Results saved to: ${CONFIG.OUTPUT_FILE}`);
            // Print successful expressions
            console.log('\nSuccessful SQL Expressions:');
            sqlExpressions.filter(expr => expr.success).forEach(expr => {
                console.log(`\n${expr.name}:`);
                console.log(`SQL: ${expr.sql}`);
                console.log(`Result: ${JSON.stringify(expr.result)}`);
            });
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
