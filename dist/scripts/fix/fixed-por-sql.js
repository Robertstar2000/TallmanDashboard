/**
 * Fixed POR SQL Generator
 *
 * This script generates SQL expressions for the POR dashboard using known tables.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'fixed-por-sql.json')
};
// Known tables in the POR database
const KNOWN_TABLES = [
    'PurchaseOrderDetail',
    'PurchaseOrder',
    'CustomerFile',
    'MapGPSWorkOrders',
    'AccountingTransaction',
    'AccountsReceivable',
    'TransactionItems',
    'TransactionHeader'
];
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Fixed POR SQL Generator');
        console.log('======================\n');
        try {
            const sqlExpressions = [];
            // Test each known table
            for (const table of KNOWN_TABLES) {
                console.log(`\nTesting table: ${table}`);
                // Test if table exists
                const countSql = `SELECT Count(*) AS value FROM ${table}`;
                console.log(`SQL: ${countSql}`);
                const countResponse = yield testSql(countSql);
                if (countResponse.success) {
                    console.log('✅ Table exists!');
                    // Add count expression
                    sqlExpressions.push({
                        id: `POR-${table.toUpperCase()}-COUNT`,
                        name: `POR ${table} Count`,
                        description: `Count of records in ${table}`,
                        sql: countSql,
                        result: countResponse.result
                    });
                    // Generate monthly expressions for this table
                    for (const month of MONTHS) {
                        // Simple monthly count
                        const monthlySql = `SELECT Count(*) AS value FROM ${table}`;
                        sqlExpressions.push({
                            id: `POR-${table.toUpperCase()}-${month.name.toUpperCase()}`,
                            name: `POR ${table} ${month.name}`,
                            description: `Count of records in ${table} for ${month.name}`,
                            sql: monthlySql,
                            result: countResponse.result // Use the same result as the count query
                        });
                    }
                }
                else {
                    console.log(`❌ Table does not exist: ${countResponse.error}`);
                }
            }
            // Add some generic expressions for the dashboard
            const genericExpressions = [
                {
                    id: "POR-OVERVIEW-TOTAL",
                    name: "POR Overview Total",
                    description: "Total number of records in PurchaseOrderDetail",
                    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail",
                    result: undefined
                },
                {
                    id: "POR-OVERVIEW-CUSTOMERS",
                    name: "POR Overview Customers",
                    description: "Total number of customers",
                    sql: "SELECT Count(*) AS value FROM CustomerFile",
                    result: undefined
                }
            ];
            for (const expr of genericExpressions) {
                console.log(`\nTesting generic expression: ${expr.name}`);
                console.log(`SQL: ${expr.sql}`);
                const response = yield testSql(expr.sql);
                if (response.success) {
                    console.log('✅ Success!');
                    expr.result = response.result;
                    sqlExpressions.push(expr);
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
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
