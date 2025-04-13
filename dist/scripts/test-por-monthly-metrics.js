/**
 * Test POR Monthly Metrics
 *
 * This script tests specific SQL patterns for monthly metrics
 * against the POR database and reports non-zero results.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-monthly-metrics.json')
};
// Month mapping
const MONTHS = [
    { name: "Jan", number: 1 },
    { name: "Feb", number: 2 },
    { name: "Mar", number: 3 },
    { name: "Apr", number: 4 },
    { name: "May", number: 5 },
    { name: "Jun", number: 6 },
    { name: "Jul", number: 7 },
    { name: "Aug", number: 8 },
    { name: "Sep", number: 9 },
    { name: "Oct", number: 10 },
    { name: "Nov", number: 11 },
    { name: "Dec", number: 12 }
];
// Specific tables to test based on our previous analysis
const TABLES_TO_TEST = [
    'CustomerJobSite',
    'MapGPSWorkOrders',
    'CustomerFile',
    'PurchaseOrder',
    'CustomerEdit',
    'MapGPSFences'
];
// SQL patterns to test for each month
const SQL_PATTERNS = [
    // New Rentals patterns
    {
        metricType: 'New Rentals',
        patterns: [
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Month(Date) = ${month} AND Year(Date) = Year(Date())`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Source = 'Web' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
        ]
    },
    // Open Rentals patterns
    {
        metricType: 'Open Rentals',
        patterns: [
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active'`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Open'`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
        ]
    },
    // Rental Value patterns
    {
        metricType: 'Rental Value',
        patterns: [
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active'`,
            (table, month) => `SELECT Count(*) AS value FROM ${table} WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
        ]
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Test POR Monthly Metrics');
        console.log('=======================\n');
        try {
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database.`);
            // Filter to only use tables that exist in the database
            const tablesToTest = TABLES_TO_TEST.filter(table => availableTables.includes(table));
            console.log(`\nTesting ${tablesToTest.length} tables: ${tablesToTest.join(', ')}`);
            // Test patterns for each month
            const results = [];
            for (const month of MONTHS) {
                console.log(`\nTesting patterns for ${month.name} (month ${month.number})...`);
                for (const patternGroup of SQL_PATTERNS) {
                    console.log(`\nTesting ${patternGroup.metricType} patterns...`);
                    for (const table of tablesToTest) {
                        console.log(`\nTesting table: ${table}`);
                        for (const patternFn of patternGroup.patterns) {
                            const sql = patternFn(table, month.number);
                            console.log(`SQL: ${sql}`);
                            try {
                                const response = yield testSql(sql);
                                if (response.success) {
                                    const value = response.result && response.result.value !== undefined ? response.result.value : 0;
                                    console.log(`✅ Result: ${value}`);
                                    results.push({
                                        month: month.name,
                                        monthNumber: month.number,
                                        metricType: patternGroup.metricType,
                                        sql: sql,
                                        value: value,
                                        nonZero: value > 0
                                    });
                                }
                                else {
                                    console.log(`❌ Failed: ${response.error}`);
                                    // Try with alternative column names
                                    if (response.error && response.error.includes('not found')) {
                                        const alternativeColumns = {
                                            'CreatedDate': ['Date', 'OrderDate', 'EntryDate'],
                                            'Status': ['State', 'Type']
                                        };
                                        for (const [originalCol, alternatives] of Object.entries(alternativeColumns)) {
                                            if (sql.includes(originalCol)) {
                                                for (const altCol of alternatives) {
                                                    const altSql = sql.replace(new RegExp(originalCol, 'g'), altCol);
                                                    console.log(`Trying with alternative column ${altCol}:`);
                                                    console.log(`SQL: ${altSql}`);
                                                    const altResponse = yield testSql(altSql);
                                                    if (altResponse.success) {
                                                        const value = altResponse.result && altResponse.result.value !== undefined ? altResponse.result.value : 0;
                                                        console.log(`✅ Result with alternative column: ${value}`);
                                                        results.push({
                                                            month: month.name,
                                                            monthNumber: month.number,
                                                            metricType: patternGroup.metricType,
                                                            sql: altSql,
                                                            value: value,
                                                            nonZero: value > 0
                                                        });
                                                        break;
                                                    }
                                                    else {
                                                        console.log(`❌ Failed with alternative column: ${altResponse.error}`);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                console.error(`Error testing SQL: ${error.message}`);
                            }
                        }
                    }
                }
            }
            // Save results to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
            console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
            // Print non-zero results
            const nonZeroResults = results.filter(r => r.nonZero);
            console.log(`\nFound ${nonZeroResults.length} patterns with non-zero results.`);
            if (nonZeroResults.length > 0) {
                // Group by metric type and month
                const byMetricAndMonth = {};
                for (const result of nonZeroResults) {
                    if (!byMetricAndMonth[result.metricType]) {
                        byMetricAndMonth[result.metricType] = {};
                    }
                    if (!byMetricAndMonth[result.metricType][result.month]) {
                        byMetricAndMonth[result.metricType][result.month] = [];
                    }
                    byMetricAndMonth[result.metricType][result.month].push(result);
                }
                // Print best SQL expression for each metric and month
                console.log('\nBest SQL expressions for each metric and month:');
                for (const [metricType, monthResults] of Object.entries(byMetricAndMonth)) {
                    console.log(`\n${metricType}:`);
                    for (const month of MONTHS) {
                        const results = monthResults[month.name] || [];
                        if (results.length > 0) {
                            // Sort by value (descending) to find the best result
                            const bestResult = results.sort((a, b) => b.value - a.value)[0];
                            console.log(`  ${month.name}: ${bestResult.value}`);
                            console.log(`    SQL: ${bestResult.sql}`);
                        }
                        else {
                            console.log(`  ${month.name}: No non-zero results`);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in main function:', error.message);
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
            console.error('Error fetching available tables:', error.message);
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
