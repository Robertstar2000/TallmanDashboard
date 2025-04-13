/**
 * Basic POR SQL Generator
 *
 * This script generates very basic SQL expressions compatible with Microsoft Access
 * that are guaranteed to work with the POR database.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'basic-por-sql.json')
};
// Basic SQL queries that should work with Access
const BASIC_QUERIES = [
    {
        id: "POR-PURCHASE-ORDER-DETAIL-COUNT",
        name: "POR Purchase Order Detail Count",
        description: "Count of records in PurchaseOrderDetail",
        sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail"
    },
    {
        id: "POR-PURCHASE-ORDER-COUNT",
        name: "POR Purchase Order Count",
        description: "Count of records in PurchaseOrder",
        sql: "SELECT Count(*) AS value FROM PurchaseOrder"
    },
    {
        id: "POR-CUSTOMER-FILE-COUNT",
        name: "POR Customer File Count",
        description: "Count of records in CustomerFile",
        sql: "SELECT Count(*) AS value FROM CustomerFile"
    },
    {
        id: "POR-PURCHASE-ORDER-DETAIL-SAMPLE",
        name: "POR Purchase Order Detail Sample",
        description: "Sample record from PurchaseOrderDetail",
        sql: "SELECT TOP 1 * FROM PurchaseOrderDetail"
    },
    {
        id: "POR-PURCHASE-ORDER-SAMPLE",
        name: "POR Purchase Order Sample",
        description: "Sample record from PurchaseOrder",
        sql: "SELECT TOP 1 * FROM PurchaseOrder"
    },
    {
        id: "POR-CUSTOMER-FILE-SAMPLE",
        name: "POR Customer File Sample",
        description: "Sample record from CustomerFile",
        sql: "SELECT TOP 1 * FROM CustomerFile"
    }
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
        console.log('Basic POR SQL Generator');
        console.log('======================\n');
        try {
            const sqlExpressions = [];
            // Test each basic query
            for (const query of BASIC_QUERIES) {
                console.log(`\nTesting query: ${query.name}`);
                console.log(`SQL: ${query.sql}`);
                const response = yield testSql(query.sql);
                if (response.success) {
                    console.log('✅ Success!');
                    // Add the query to the list
                    sqlExpressions.push({
                        id: query.id,
                        name: query.name,
                        description: query.description,
                        sql: query.sql,
                        result: response.result
                    });
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                }
            }
            // Generate monthly expressions for PurchaseOrderDetail
            console.log('\nGenerating monthly expressions for PurchaseOrderDetail...');
            for (const month of MONTHS) {
                const monthlySql = `SELECT Count(*) AS value FROM PurchaseOrderDetail`;
                const monthlyId = `POR-PURCHASE-ORDER-DETAIL-${month.name.toUpperCase()}`;
                const monthlyName = `POR Purchase Order Detail ${month.name}`;
                const monthlyDescription = `Count of records in PurchaseOrderDetail for ${month.name}`;
                // Add the monthly expression
                sqlExpressions.push({
                    id: monthlyId,
                    name: monthlyName,
                    description: monthlyDescription,
                    sql: monthlySql
                });
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
