/**
 * Check Specific Tables in POR Database
 *
 * This script checks specific tables in the POR database that might be relevant
 * for rental metrics and reports which ones have data.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'specific-tables-check.json')
};
// Specific tables to check (based on common names for rental/order related tables)
const TABLES_TO_CHECK = [
    'Orders', 'Order', 'OrderHeader', 'OrderDetail',
    'Rentals', 'Rental', 'RentalHeader', 'RentalDetail',
    'Customers', 'Customer', 'CustomerFile', 'CustomerOrder',
    'Sales', 'SalesOrder', 'SalesHeader', 'SalesDetail',
    'Invoices', 'Invoice', 'InvoiceHeader', 'InvoiceDetail',
    'Contracts', 'Contract', 'ContractHeader', 'ContractDetail',
    'Jobs', 'Job', 'JobHeader', 'JobDetail',
    'WorkOrders', 'WorkOrder', 'WorkOrderHeader', 'WorkOrderDetail',
    'Transactions', 'Transaction', 'TransactionHeader', 'TransactionDetail',
    'Items', 'Item', 'ItemMaster', 'ItemDetail',
    'Products', 'Product', 'ProductMaster', 'ProductDetail',
    'Inventory', 'InventoryMaster', 'InventoryDetail',
    'PurchaseOrders', 'PurchaseOrder', 'PurchaseOrderHeader', 'PurchaseOrderDetail'
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Check Specific Tables in POR Database');
        console.log('====================================\n');
        try {
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database.`);
            // Filter to only check tables that exist
            const tablesToCheck = TABLES_TO_CHECK.filter(table => availableTables.some(t => t.toLowerCase() === table.toLowerCase()));
            // Add exact matches from available tables
            for (const availableTable of availableTables) {
                if (availableTable.toLowerCase().includes('order') ||
                    availableTable.toLowerCase().includes('rent') ||
                    availableTable.toLowerCase().includes('customer') ||
                    availableTable.toLowerCase().includes('sale') ||
                    availableTable.toLowerCase().includes('invoice') ||
                    availableTable.toLowerCase().includes('contract') ||
                    availableTable.toLowerCase().includes('job') ||
                    availableTable.toLowerCase().includes('work')) {
                    if (!tablesToCheck.some(t => t.toLowerCase() === availableTable.toLowerCase())) {
                        tablesToCheck.push(availableTable);
                    }
                }
            }
            console.log(`Checking ${tablesToCheck.length} specific tables...`);
            // Check each table
            const tableInfos = [];
            for (const table of tablesToCheck) {
                console.log(`\nChecking table: ${table}`);
                // Check if table exists
                const tableExists = availableTables.some(t => t.toLowerCase() === table.toLowerCase());
                console.log(`Table exists: ${tableExists}`);
                if (!tableExists) {
                    tableInfos.push({
                        name: table,
                        exists: false,
                        rowCount: 0,
                        columns: [],
                        error: 'Table does not exist'
                    });
                    continue;
                }
                // Find the exact table name (with correct case)
                const exactTableName = availableTables.find(t => t.toLowerCase() === table.toLowerCase()) || table;
                // Get row count
                console.log('Getting row count...');
                const countSql = `SELECT Count(*) AS value FROM ${exactTableName}`;
                const countResponse = yield testSql(countSql);
                let rowCount = 0;
                let error = undefined;
                if (countResponse.success && countResponse.result) {
                    rowCount = countResponse.result.value || 0;
                    console.log(`Row count: ${rowCount}`);
                }
                else {
                    error = countResponse.error;
                    console.log(`Failed to get row count: ${error}`);
                    tableInfos.push({
                        name: exactTableName,
                        exists: true,
                        rowCount: 0,
                        columns: [],
                        error: error
                    });
                    continue;
                }
                // Get columns
                console.log('Getting columns...');
                const sampleSql = `SELECT TOP 1 * FROM ${exactTableName}`;
                const sampleResponse = yield testSql(sampleSql);
                let columns = [];
                if (sampleResponse.success && sampleResponse.result) {
                    columns = Object.keys(sampleResponse.result);
                    console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
                }
                else {
                    error = sampleResponse.error;
                    console.log(`Failed to get columns: ${error}`);
                    // Try alternative approach to get columns
                    const columnsSql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${exactTableName}'`;
                    const columnsResponse = yield testSql(columnsSql);
                    if (columnsResponse.success && columnsResponse.result) {
                        const columnData = Array.isArray(columnsResponse.result) ? columnsResponse.result : [columnsResponse.result];
                        columns = columnData.map(col => col.COLUMN_NAME);
                        console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
                    }
                    else {
                        console.log(`Failed to get columns using schema: ${columnsResponse.error}`);
                    }
                }
                // Save table info
                tableInfos.push({
                    name: exactTableName,
                    exists: true,
                    rowCount: rowCount,
                    columns: columns,
                    error: error
                });
            }
            // Sort tables by row count (descending)
            tableInfos.sort((a, b) => b.rowCount - a.rowCount);
            // Save results to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(tableInfos, null, 2));
            console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Checked ${tableInfos.length} tables.`);
            console.log(`Tables that exist: ${tableInfos.filter(t => t.exists).length}`);
            console.log(`Tables with rows: ${tableInfos.filter(t => t.rowCount > 0).length}`);
            // Print tables with rows
            const tablesWithRows = tableInfos.filter(t => t.rowCount > 0);
            if (tablesWithRows.length > 0) {
                console.log('\nTables with data:');
                for (const table of tablesWithRows) {
                    console.log(`  ${table.name}: ${table.rowCount} rows, ${table.columns.length} columns`);
                    console.log(`  Columns: ${table.columns.join(', ')}`);
                }
            }
            else {
                console.log('\nNo tables with data found.');
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
