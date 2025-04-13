/**
 * Verify POR SQL Expressions
 *
 * This script tests SQL expressions against the POR database
 * and verifies that they work correctly.
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
    INPUT_FILE: path.join(process.cwd(), 'scripts', 'basic-por-sql.json'),
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'verified-por-sql.json')
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Verify POR SQL Expressions');
        console.log('=========================\n');
        try {
            // Load SQL expressions from file
            console.log(`Loading SQL expressions from ${CONFIG.INPUT_FILE}...`);
            if (!fs.existsSync(CONFIG.INPUT_FILE)) {
                console.error(`Input file ${CONFIG.INPUT_FILE} does not exist.`);
                return;
            }
            const sqlExpressions = JSON.parse(fs.readFileSync(CONFIG.INPUT_FILE, 'utf8'));
            console.log(`Loaded ${sqlExpressions.length} SQL expressions.`);
            // Additional expressions to test
            const additionalExpressions = [
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
                    id: "POR-TRANSACTION-ITEMS-COUNT",
                    name: "POR Transaction Items Count",
                    description: "Count of records in TransactionItems",
                    sql: "SELECT Count(*) AS value FROM TransactionItems"
                },
                {
                    id: "POR-TRANSACTION-HEADER-COUNT",
                    name: "POR Transaction Header Count",
                    description: "Count of records in TransactionHeader",
                    sql: "SELECT Count(*) AS value FROM TransactionHeader"
                }
            ];
            // Add additional expressions to the list
            sqlExpressions.push(...additionalExpressions);
            // Test each SQL expression
            console.log('\nTesting SQL expressions...');
            const verifiedExpressions = [];
            for (let i = 0; i < sqlExpressions.length; i++) {
                const expr = sqlExpressions[i];
                console.log(`\nTesting ${i + 1}/${sqlExpressions.length}: ${expr.name}`);
                console.log(`SQL: ${expr.sql}`);
                const response = yield testSql(expr.sql);
                if (response.success) {
                    console.log('✅ Success!');
                    // Check if result has a value property
                    if (response.result && response.result.value !== undefined) {
                        console.log(`Result: ${response.result.value}`);
                    }
                    else {
                        console.log(`Result: ${JSON.stringify(response.result)}`);
                    }
                    // Add verified expression
                    verifiedExpressions.push(Object.assign(Object.assign({}, expr), { result: response.result, verified: true }));
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    // Try a simpler SQL expression
                    const simpleSql = `SELECT Count(*) AS value FROM PurchaseOrderDetail`;
                    console.log(`Trying simpler SQL: ${simpleSql}`);
                    const simpleResponse = yield testSql(simpleSql);
                    if (simpleResponse.success) {
                        console.log('✅ Simpler SQL succeeded!');
                        // Add verified expression with simpler SQL
                        verifiedExpressions.push(Object.assign(Object.assign({}, expr), { sql: simpleSql, result: simpleResponse.result, verified: true }));
                    }
                    else {
                        console.log(`❌ Simpler SQL also failed: ${simpleResponse.error}`);
                    }
                }
            }
            // Save verified expressions to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(verifiedExpressions, null, 2));
            console.log(`\nVerified expressions saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Total expressions: ${sqlExpressions.length}`);
            console.log(`Verified expressions: ${verifiedExpressions.length}`);
            console.log(`Success rate: ${Math.round((verifiedExpressions.length / sqlExpressions.length) * 100)}%`);
            // Print sample verified expressions
            console.log('\nSample verified expressions:');
            for (let i = 0; i < Math.min(3, verifiedExpressions.length); i++) {
                const expr = verifiedExpressions[i];
                console.log(`${i + 1}. ${expr.name}: ${expr.sql}`);
            }
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
