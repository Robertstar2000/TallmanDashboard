/**
 * POR SQL Expression Tester
 *
 * This script tests POR SQL expressions against the database and reports which ones work
 * and which ones need fixing. It doesn't require user interaction and outputs results
 * to a JSON file.
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
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
// Configuration
const CONFIG = {
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-sql-test-results.json'),
    SOURCE_FILE: path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts'),
    SERVER_URL: 'http://localhost:3004',
    MAX_EXPRESSIONS: 10 // Limit to first 10 expressions for testing
};
/**
 * Main function to test SQL expressions
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('POR SQL Expression Tester');
            console.log('==========================\n');
            // Load chart data
            const chartData = yield loadChartData();
            console.log(`Loaded ${chartData.length} SQL expressions from chart data`);
            // Filter to only POR expressions (IDs 127-174)
            const porExpressions = chartData.filter(expr => expr.serverName === 'POR' ||
                (expr.id && parseInt(expr.id) >= 127 && parseInt(expr.id) <= 174));
            console.log(`Filtered to ${porExpressions.length} POR SQL expressions`);
            // Limit to a smaller number for testing
            const testExpressions = porExpressions.slice(0, CONFIG.MAX_EXPRESSIONS);
            console.log(`Testing first ${testExpressions.length} POR SQL expressions`);
            // Test each expression
            const results = [];
            let workingCount = 0;
            let failedCount = 0;
            for (let i = 0; i < testExpressions.length; i++) {
                const expression = testExpressions[i];
                console.log(`\nTesting expression ${i + 1}/${testExpressions.length}`);
                console.log(`ID: ${expression.id}`);
                console.log(`DataPoint: ${expression.DataPoint || expression.name}`);
                console.log(`SQL: ${expression.sqlExpression}`);
                // Test the SQL expression
                try {
                    const testResult = yield testSqlExpression(expression.sqlExpression);
                    if (testResult.success) {
                        console.log('✅ SQL test SUCCESSFUL! Result:', testResult.value);
                        workingCount++;
                    }
                    else {
                        console.log('❌ SQL test FAILED:', testResult.error);
                        failedCount++;
                    }
                    // Add to results
                    results.push({
                        id: expression.id || '',
                        dataPoint: expression.DataPoint || expression.name || '',
                        sql: expression.sqlExpression,
                        success: testResult.success,
                        value: testResult.value,
                        error: testResult.error
                    });
                }
                catch (error) {
                    console.error('Error testing SQL expression:', error);
                    // Add to results
                    results.push({
                        id: expression.id || '',
                        dataPoint: expression.DataPoint || expression.name || '',
                        sql: expression.sqlExpression,
                        success: false,
                        error: error.message
                    });
                    failedCount++;
                }
            }
            // Save results
            yield saveResults(results);
            // Print summary
            console.log('\nTest Summary:');
            console.log(`Total expressions tested: ${testExpressions.length}`);
            console.log(`Working expressions: ${workingCount}`);
            console.log(`Failed expressions: ${failedCount}`);
            console.log(`Success rate: ${(workingCount / testExpressions.length * 100).toFixed(1)}%`);
            console.log(`Results saved to: ${CONFIG.OUTPUT_FILE}`);
        }
        catch (error) {
            console.error('Error in main function:', error);
        }
    });
}
/**
 * Load chart data from the file
 */
function loadChartData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileContent = fs.readFileSync(CONFIG.SOURCE_FILE, 'utf8');
            // Extract the array from the file using regex
            const match = fileContent.match(/export const initialSpreadsheetData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
            if (!match || !match[1]) {
                throw new Error('Could not extract chart data from file');
            }
            // Evaluate the array (safer than using eval)
            const chartData = new Function(`return ${match[1]}`)();
            return chartData;
        }
        catch (error) {
            console.error('Error loading chart data:', error);
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
            console.log(`Testing SQL: ${sql}`);
            // Use the actual API endpoint for testing SQL expressions
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
                return {
                    success: true,
                    value: value
                };
            }
            else if (data.result && !Array.isArray(data.result)) {
                // Handle case where result is a single value or object
                const value = data.result.value !== undefined ? data.result.value : data.result;
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
            console.error('Error testing SQL expression:', error);
            return {
                success: false,
                error: `Error: ${error.message}`
            };
        }
    });
}
/**
 * Save the results to a file
 */
function saveResults(results) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
        }
        catch (error) {
            console.error('Error saving results:', error);
        }
    });
}
// Run the main function
main().catch(console.error);
