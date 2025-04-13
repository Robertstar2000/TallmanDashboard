/**
 * Test POR Direct Queries
 *
 * This script tests direct queries against the POR database
 * using queries that are known to work correctly.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-direct-test-results.json')
};
// Known working queries to test
const TEST_QUERIES = [
    {
        name: 'PurchaseOrderDetail',
        query: 'SELECT * FROM PurchaseOrderDetail'
    },
    {
        name: 'PurchaseOrderDetail Count',
        query: 'SELECT Count(*) AS value FROM PurchaseOrderDetail'
    },
    {
        name: 'PurchaseOrder',
        query: 'SELECT * FROM PurchaseOrder'
    },
    {
        name: 'PurchaseOrder Count',
        query: 'SELECT Count(*) AS value FROM PurchaseOrder'
    },
    {
        name: 'CustomerFile',
        query: 'SELECT * FROM CustomerFile'
    },
    {
        name: 'CustomerFile Count',
        query: 'SELECT Count(*) AS value FROM CustomerFile'
    },
    {
        name: 'Show Tables',
        query: 'SHOW TABLES'
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Test POR Direct Queries');
        console.log('======================\n');
        try {
            // Test each query
            const results = [];
            for (const test of TEST_QUERIES) {
                console.log(`\nTesting query: ${test.name}`);
                console.log(`SQL: ${test.query}`);
                const response = yield testSql(test.query);
                if (response.success) {
                    console.log('✅ Success!');
                    // For result sets, show count of rows
                    if (Array.isArray(response.result)) {
                        console.log(`Result: ${response.result.length} rows returned`);
                    }
                    else {
                        console.log(`Result: ${JSON.stringify(response.result)}`);
                    }
                    results.push({
                        name: test.name,
                        query: test.query,
                        success: true,
                        result: response.result
                    });
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    results.push({
                        name: test.name,
                        query: test.query,
                        success: false,
                        error: response.error
                    });
                }
            }
            // Test queries for rental-related tables
            console.log('\nTesting queries for potential rental-related tables...');
            const rentalQueries = [
                'SELECT * FROM Rentals',
                'SELECT * FROM Orders',
                'SELECT * FROM Contracts',
                'SELECT * FROM WorkOrders',
                'SELECT * FROM MapGPSWorkOrders'
            ];
            for (const query of rentalQueries) {
                console.log(`\nTesting query: ${query}`);
                const response = yield testSql(query);
                if (response.success) {
                    console.log('✅ Success!');
                    // For result sets, show count of rows
                    if (Array.isArray(response.result)) {
                        console.log(`Result: ${response.result.length} rows returned`);
                    }
                    else {
                        console.log(`Result: ${JSON.stringify(response.result)}`);
                    }
                    results.push({
                        name: query,
                        query: query,
                        success: true,
                        result: response.result
                    });
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    results.push({
                        name: query,
                        query: query,
                        success: false,
                        error: response.error
                    });
                }
            }
            // Try to get a list of tables from the database
            console.log('\nTrying to get a list of tables from the database...');
            // Method 1: Using SHOW TABLES
            console.log('\nMethod 1: Using SHOW TABLES');
            const showTablesResponse = yield testSql('SHOW TABLES');
            if (showTablesResponse.success) {
                console.log('✅ Success!');
                console.log(`Result: ${JSON.stringify(showTablesResponse.result)}`);
            }
            else {
                console.log(`❌ Failed: ${showTablesResponse.error}`);
            }
            // Method 2: Using INFORMATION_SCHEMA
            console.log('\nMethod 2: Using INFORMATION_SCHEMA');
            const infoSchemaResponse = yield testSql('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');
            if (infoSchemaResponse.success) {
                console.log('✅ Success!');
                console.log(`Result: ${JSON.stringify(infoSchemaResponse.result)}`);
            }
            else {
                console.log(`❌ Failed: ${infoSchemaResponse.error}`);
            }
            // Method 3: Using MSysObjects (Access specific)
            console.log('\nMethod 3: Using MSysObjects (Access specific)');
            const msysObjectsResponse = yield testSql("SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0");
            if (msysObjectsResponse.success) {
                console.log('✅ Success!');
                console.log(`Result: ${JSON.stringify(msysObjectsResponse.result)}`);
            }
            else {
                console.log(`❌ Failed: ${msysObjectsResponse.error}`);
            }
            // Save results to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
            console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Total queries: ${results.length}`);
            console.log(`Successful queries: ${results.filter(r => r.success).length}`);
            console.log(`Failed queries: ${results.filter(r => !r.success).length}`);
            // Print successful queries
            const successfulQueries = results.filter(r => r.success);
            if (successfulQueries.length > 0) {
                console.log('\nSuccessful queries:');
                for (const result of successfulQueries) {
                    console.log(`  ${result.name}: ${result.query}`);
                }
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
            if (data.result) {
                return {
                    success: true,
                    result: data.result
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
