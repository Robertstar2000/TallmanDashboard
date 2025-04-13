/**
 * Test script for direct access to POR database
 *
 * This script tests the PORDirectReader class which provides direct access to the
 * Point of Rental MS Access database without requiring ODBC or the Microsoft Access Database Engine.
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
import { PORDirectReader } from '../lib/db/por-direct-reader';
import fs from 'fs';
// Define the path to the POR database
const porDbPath = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
// Create a server configuration
const config = {
    server: 'POR',
    database: 'POR',
    filePath: porDbPath,
    username: '',
    password: ''
};
function testPORDirectAccess() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing POR Direct Access...');
        console.log('Database path:', porDbPath);
        // Check if the file exists
        if (!fs.existsSync(porDbPath)) {
            console.error(`Error: POR database file not found at ${porDbPath}`);
            return;
        }
        // Create a PORDirectReader instance
        const reader = new PORDirectReader(config);
        // Connect to the database
        console.log('Connecting to POR database...');
        const connectionResult = yield reader.connect();
        if (!connectionResult.success) {
            console.error(`Error connecting to POR database: ${connectionResult.message}`);
            return;
        }
        console.log(`Successfully connected to POR database: ${connectionResult.message}`);
        // Get all potential PO tables
        console.log('\nSearching for purchase order tables...');
        const poTables = yield reader.findPurchaseOrderTables();
        if (poTables.length === 0) {
            console.log('No purchase order tables found.');
        }
        else {
            console.log(`Found ${poTables.length} potential purchase order tables:`);
            // Create a markdown file to document the tables
            let markdownContent = '# POR Database Tables\n\n';
            markdownContent += 'This document lists tables in the POR database that may contain purchase order information.\n\n';
            for (const poTable of poTables) {
                console.log(`\nTable: ${poTable.name} (Confidence: ${poTable.confidence}%)`);
                console.log('Relevant columns:');
                console.log(`- PO Number: ${poTable.poNumberColumn}`);
                if (poTable.dateColumn)
                    console.log(`- Date: ${poTable.dateColumn}`);
                if (poTable.vendorNumberColumn)
                    console.log(`- Vendor Number: ${poTable.vendorNumberColumn}`);
                if (poTable.vendorNameColumn)
                    console.log(`- Vendor Name: ${poTable.vendorNameColumn}`);
                if (poTable.totalAmountColumn)
                    console.log(`- Total Amount: ${poTable.totalAmountColumn}`);
                if (poTable.statusColumn)
                    console.log(`- Status: ${poTable.statusColumn}`);
                if (poTable.storeColumn)
                    console.log(`- Store: ${poTable.storeColumn}`);
                if (poTable.notesColumn)
                    console.log(`- Notes: ${poTable.notesColumn}`);
                // Add to markdown
                markdownContent += `## ${poTable.name}\n\n`;
                markdownContent += `Confidence score: ${poTable.confidence}%\n\n`;
                markdownContent += '### Relevant columns:\n\n';
                markdownContent += `- PO Number: ${poTable.poNumberColumn}\n`;
                if (poTable.dateColumn)
                    markdownContent += `- Date: ${poTable.dateColumn}\n`;
                if (poTable.vendorNumberColumn)
                    markdownContent += `- Vendor Number: ${poTable.vendorNumberColumn}\n`;
                if (poTable.vendorNameColumn)
                    markdownContent += `- Vendor Name: ${poTable.vendorNameColumn}\n`;
                if (poTable.totalAmountColumn)
                    markdownContent += `- Total Amount: ${poTable.totalAmountColumn}\n`;
                if (poTable.statusColumn)
                    markdownContent += `- Status: ${poTable.statusColumn}\n`;
                if (poTable.storeColumn)
                    markdownContent += `- Store: ${poTable.storeColumn}\n`;
                if (poTable.notesColumn)
                    markdownContent += `- Notes: ${poTable.notesColumn}\n`;
                markdownContent += '\n';
            }
            // Write the markdown file
            fs.writeFileSync('PORTables.md', markdownContent);
            console.log('\nTable information has been written to PORTables.md');
        }
        // Get purchase orders
        console.log('\nRetrieving purchase orders...');
        const purchaseOrders = yield reader.getPurchaseOrders(10);
        if (purchaseOrders.length === 0) {
            console.log('No purchase orders found.');
        }
        else {
            console.log(`Found ${purchaseOrders.length} purchase orders:`);
            for (const po of purchaseOrders) {
                console.log('\nPurchase Order:');
                console.log(`- PO Number: ${po.PONumber}`);
                console.log(`- Source Table: ${po.Source}`);
                if (po.Date)
                    console.log(`- Date: ${po.Date.toISOString().split('T')[0]}`);
                if (po.VendorNumber)
                    console.log(`- Vendor Number: ${po.VendorNumber}`);
                if (po.VendorName)
                    console.log(`- Vendor Name: ${po.VendorName}`);
                if (po.TotalAmount)
                    console.log(`- Total Amount: ${po.TotalAmount}`);
                if (po.Status)
                    console.log(`- Status: ${po.Status}`);
                if (po.Store)
                    console.log(`- Store: ${po.Store}`);
                if (po.Notes)
                    console.log(`- Notes: ${po.Notes}`);
            }
        }
        // Get purchase order count by month
        console.log('\nRetrieving purchase order counts by month...');
        const currentYear = new Date().getFullYear();
        const counts = yield reader.getPurchaseOrderCountByMonth(currentYear);
        if (counts.length === 0) {
            console.log(`No purchase orders found for ${currentYear}.`);
        }
        else {
            console.log(`Purchase order counts for ${currentYear}:`);
            for (const count of counts) {
                console.log(`- ${count.month}: ${count.count}`);
            }
        }
        // Get monthly comparison
        console.log('\nRetrieving monthly purchase order comparison...');
        const comparison = yield reader.getMonthlyPurchaseOrderComparison();
        console.log('Monthly comparison:');
        console.log(`- Current month: ${comparison.currentMonth}`);
        console.log(`- Previous month: ${comparison.previousMonth}`);
        console.log(`- Same month last year: ${comparison.sameMonthLastYear}`);
        console.log(`- Change from previous month: ${comparison.changeFromPreviousMonth}%`);
        console.log(`- Change from last year: ${comparison.changeFromLastYear}%`);
        // Close the connection
        reader.close();
        console.log('\nConnection closed.');
    });
}
// Run the test
testPORDirectAccess().catch(error => {
    console.error('Error running test:', error);
});
