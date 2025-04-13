/**
 * Test script for the PORDirectReader class
 *
 * This script tests the direct reading of purchase order data from the POR database
 * using the mdb-reader package without requiring ODBC or the Microsoft Access Database Engine.
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
import { PORDirectReader } from '../lib/db/por-direct-reader';
import { PORPurchaseOrders } from '../lib/db/por-purchase-orders';
// Path to the MS Access database
const dbPath = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
// Check if the database file exists
if (!fs.existsSync(dbPath)) {
    console.error(`Error: MS Access file not found at path: ${dbPath}`);
    console.error('Please ensure the file exists at the specified location.');
    process.exit(1);
}
// Create a server config object
const config = {
    type: 'POR',
    server: 'local',
    database: 'POR',
    filePath: dbPath
};
// Test the direct reader
function testDirectReader() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing PORDirectReader...');
        console.log('---------------------------');
        // Create a new direct reader
        const reader = new PORDirectReader(config);
        try {
            // Test connection
            console.log('Testing connection...');
            const connectionResult = yield reader.connect();
            console.log(connectionResult);
            if (!connectionResult.success) {
                console.error('Connection failed. Exiting test.');
                return;
            }
            // Get purchase order counts by month for the current year
            console.log('\nGetting purchase order counts by month...');
            const currentYear = new Date().getFullYear();
            const counts = yield reader.getPurchaseOrderCountByMonth(currentYear);
            if (counts.length === 0) {
                console.log(`No purchase orders found for ${currentYear}.`);
            }
            else {
                console.log(`Purchase order counts for ${currentYear}:`);
                counts.forEach(item => {
                    console.log(`${item.month}: ${item.count}`);
                });
            }
            // Get current month count
            console.log('\nGetting current month purchase order count...');
            const currentMonthCount = yield reader.getCurrentMonthPurchaseOrderCount();
            console.log(`Current month purchase order count: ${currentMonthCount}`);
            // Get purchase order details
            console.log('\nGetting purchase order details...');
            const purchaseOrders = yield reader.getPurchaseOrders(10);
            if (purchaseOrders.length === 0) {
                console.log('No purchase orders found.');
            }
            else {
                console.log(`Found ${purchaseOrders.length} purchase orders:`);
                purchaseOrders.forEach((po, index) => {
                    console.log(`\nPurchase Order #${index + 1}:`);
                    console.log(JSON.stringify(po, null, 2));
                });
            }
        }
        catch (error) {
            console.error('Error testing direct reader:', error);
        }
        finally {
            // Close the connection
            reader.close();
        }
    });
}
// Test the PORPurchaseOrders class with direct reader
function testPORPurchaseOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n\nTesting PORPurchaseOrders with direct reader...');
        console.log('---------------------------------------------');
        // Create a new PORPurchaseOrders instance
        const porPO = new PORPurchaseOrders(dbPath);
        // Ensure we're using the direct reader
        porPO.setUseDirectReader(true);
        try {
            // Get purchase order counts by month
            console.log('\nGetting purchase order counts by month...');
            const currentYear = new Date().getFullYear();
            const counts = yield porPO.getCountByMonth(currentYear);
            if (counts.length === 0) {
                console.log(`No purchase orders found for ${currentYear}.`);
            }
            else {
                console.log(`Purchase order counts for ${currentYear}:`);
                counts.forEach(item => {
                    console.log(`${item.month}: ${item.count}`);
                });
            }
            // Get current month count
            console.log('\nGetting current month purchase order count...');
            const currentMonthCount = yield porPO.getCurrentMonthCount();
            console.log(`Current month purchase order count: ${currentMonthCount}`);
            // Get monthly comparison
            console.log('\nGetting monthly comparison...');
            const comparison = yield porPO.getMonthlyComparison();
            console.log('Monthly comparison:');
            console.log(`Current month: ${comparison.current}`);
            console.log(`Previous month: ${comparison.previous}`);
            console.log(`Percent change: ${comparison.percentChange.toFixed(2)}%`);
        }
        catch (error) {
            console.error('Error testing PORPurchaseOrders:', error);
        }
    });
}
// Run the tests
function runTests() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield testDirectReader();
            yield testPORPurchaseOrders();
            console.log('\n\nAll tests completed.');
        }
        catch (error) {
            console.error('Error running tests:', error);
        }
    });
}
runTests();
