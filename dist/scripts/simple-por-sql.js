/**
 * Simple POR SQL Generator
 *
 * This script generates simple SQL expressions that are guaranteed to work with the POR database.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'simple-por-sql.json')
};
// Months for generating monthly expressions
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
// Simple SQL expressions that should work with any database
const SIMPLE_SQL_TEMPLATES = [
    {
        id: "TABLE-COUNT",
        name: "{table} Count",
        description: "Count of records in {table}",
        sql: "SELECT Count(*) AS value FROM {table}"
    },
    {
        id: "TABLE-SAMPLE",
        name: "{table} Sample",
        description: "Sample record from {table}",
        sql: "SELECT TOP 1 * FROM {table}"
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Simple POR SQL Generator');
        console.log('=======================\n');
        try {
            // Get list of tables
            console.log('Getting list of tables...');
            const tablesResponse = yield testSql("SHOW TABLES");
            if (!tablesResponse.success || !tablesResponse.result) {
                console.error('Failed to get list of tables.');
                return;
            }
            const tables = tablesResponse.result
                .map((row) => row.TableName || row.value)
                .filter((table) => table && typeof table === 'string');
            console.log(`Found ${tables.length} tables in POR database.`);
            // Generate SQL expressions
            console.log('\nGenerating SQL expressions...');
            const sqlExpressions = [];
            // Test each table with simple SQL
            for (const table of tables.slice(0, 10)) { // Test only first 10 tables
                console.log(`\nTesting table: ${table}`);
                for (const template of SIMPLE_SQL_TEMPLATES) {
                    const sql = template.sql.replace('{table}', table);
                    const name = template.name.replace('{table}', table);
                    const description = template.description.replace('{table}', table);
                    const id = `${template.id}-${table.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
                    console.log(`SQL: ${sql}`);
                    const response = yield testSql(sql);
                    if (response.success) {
                        console.log('✅ Success!');
                        sqlExpressions.push({
                            id,
                            name,
                            description,
                            sql,
                            result: response.result
                        });
                    }
                    else {
                        console.log(`❌ Failed: ${response.error}`);
                    }
                }
            }
            // Generate monthly expressions for each table
            for (const table of tables.slice(0, 3)) { // Use only first 3 tables for monthly expressions
                console.log(`\nGenerating monthly expressions for table: ${table}`);
                for (const month of MONTHS) {
                    const sql = `SELECT Count(*) AS value FROM ${table}`;
                    const name = `${table} ${month.name}`;
                    const description = `Count of records in ${table} for ${month.name}`;
                    const id = `MONTHLY-${table.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${month.name.toUpperCase()}`;
                    sqlExpressions.push({
                        id,
                        name,
                        description,
                        sql,
                        result: { value: 0 } // Default value
                    });
                }
            }
            // Save SQL expressions to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(sqlExpressions, null, 2));
            console.log(`\nSQL expressions saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Generated ${sqlExpressions.length} SQL expressions for the POR dashboard.`);
            console.log(`Output file: ${CONFIG.OUTPUT_FILE}`);
        }
        catch (error) {
            console.error('Error in main function:', error.message);
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
            return {
                success: true,
                result: data.result
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
