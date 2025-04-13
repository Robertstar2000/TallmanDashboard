/**
 * Find POR Tables With Data
 *
 * This script tests tables in the POR database to find which ones
 * have non-zero row counts, indicating they contain actual data.
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
    SERVER_URL: 'http://localhost:3003', // Using the dev server port
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-tables-with-data.json')
};
// Tables to test - expanding the list to cover more potential tables
const TABLES_TO_TEST = [
    'PurchaseOrderDetail',
    'PurchaseOrder',
    'CustomerFile',
    'MapGPSWorkOrders',
    'AccountingTransaction',
    'AccountsReceivable',
    'TransactionItems',
    'TransactionHeader',
    'ContractHeader',
    'ContractDetail',
    'Invoice',
    'InvoiceDetail',
    'Customer',
    'Vendor',
    'Item',
    'ItemMaster',
    'Inventory',
    'Sales',
    'SalesDetail',
    'Order',
    'OrderDetail',
    'Rental',
    'RentalDetail',
    'Job',
    'JobDetail',
    'WorkOrder',
    'WorkOrderDetail',
    'Payment',
    'PaymentDetail',
    'Employee',
    'EmployeeDetail',
    'Location',
    'LocationDetail',
    'Department',
    'DepartmentDetail',
    'Category',
    'CategoryDetail',
    'Class',
    'ClassDetail',
    'Group',
    'GroupDetail',
    'Type',
    'TypeDetail',
    'Status',
    'StatusDetail',
    'Code',
    'CodeDetail',
    'Ledger',
    'LedgerDetail',
    'Journal',
    'JournalDetail',
    'Account',
    'AccountDetail',
    'Transaction',
    'TransactionDetail',
    'Report',
    'ReportDetail',
    'Document',
    'DocumentDetail',
    'File',
    'FileDetail',
    'Note',
    'NoteDetail',
    'Comment',
    'CommentDetail',
    'Attachment',
    'AttachmentDetail',
    'Image',
    'ImageDetail',
    'Log',
    'LogDetail',
    'History',
    'HistoryDetail',
    'Audit',
    'AuditDetail',
    'Setting',
    'SettingDetail',
    'Configuration',
    'ConfigurationDetail',
    'Preference',
    'PreferenceDetail',
    'Option',
    'OptionDetail',
    'Parameter',
    'ParameterDetail',
    'Value',
    'ValueDetail',
    'Field',
    'FieldDetail',
    'Column',
    'ColumnDetail',
    'Row',
    'RowDetail',
    'Cell',
    'CellDetail',
    'Grid',
    'GridDetail',
    'Table',
    'TableDetail',
    'View',
    'ViewDetail',
    'Query',
    'QueryDetail',
    'Form',
    'FormDetail',
    'Report',
    'ReportDetail',
    'Dashboard',
    'DashboardDetail'
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Find POR Tables With Data');
        console.log('========================\n');
        try {
            const tableInfos = [];
            // Test each table for data
            for (let i = 0; i < TABLES_TO_TEST.length; i++) {
                const table = TABLES_TO_TEST[i];
                console.log(`\nTesting table ${i + 1}/${TABLES_TO_TEST.length}: ${table}`);
                // Test with square brackets around table name (Access SQL style)
                const countSql = `SELECT Count(*) AS value FROM [${table}]`;
                console.log(`SQL: ${countSql}`);
                const response = yield testSql(countSql);
                if (response.success) {
                    // Check if result has a value property and it's greater than 0
                    const rowCount = response.result && response.result.value !== undefined
                        ? parseInt(response.result.value) || 0
                        : 0;
                    const hasData = rowCount > 0;
                    if (hasData) {
                        console.log(`✅ Table has data! Row count: ${rowCount}`);
                    }
                    else {
                        console.log(`⚠️ Table exists but has no data. Row count: ${rowCount}`);
                    }
                    tableInfos.push({
                        name: table,
                        rowCount: rowCount,
                        hasData: hasData
                    });
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    // Try without square brackets
                    const simpleSql = `SELECT Count(*) AS value FROM ${table}`;
                    console.log(`Trying without brackets: ${simpleSql}`);
                    const simpleResponse = yield testSql(simpleSql);
                    if (simpleResponse.success) {
                        // Check if result has a value property and it's greater than 0
                        const rowCount = simpleResponse.result && simpleResponse.result.value !== undefined
                            ? parseInt(simpleResponse.result.value) || 0
                            : 0;
                        const hasData = rowCount > 0;
                        if (hasData) {
                            console.log(`✅ Table has data! Row count: ${rowCount}`);
                        }
                        else {
                            console.log(`⚠️ Table exists but has no data. Row count: ${rowCount}`);
                        }
                        tableInfos.push({
                            name: table,
                            rowCount: rowCount,
                            hasData: hasData
                        });
                    }
                    else {
                        console.log(`❌ Table does not exist: ${simpleResponse.error}`);
                        tableInfos.push({
                            name: table,
                            rowCount: 0,
                            hasData: false,
                            error: simpleResponse.error
                        });
                    }
                }
            }
            // Sort tables by row count (descending)
            tableInfos.sort((a, b) => b.rowCount - a.rowCount);
            // Filter tables with data
            const tablesWithData = tableInfos.filter(table => table.hasData);
            // Save results to JSON file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(tableInfos, null, 2));
            console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Total tables tested: ${tableInfos.length}`);
            console.log(`Tables with data: ${tablesWithData.length}`);
            console.log(`Tables without data: ${tableInfos.length - tablesWithData.length}`);
            // Print tables with data
            if (tablesWithData.length > 0) {
                console.log('\nTables with data:');
                for (let i = 0; i < tablesWithData.length; i++) {
                    const table = tablesWithData[i];
                    console.log(`${i + 1}. ${table.name}: ${table.rowCount} rows`);
                }
                // Generate SQL expressions for tables with data
                console.log('\nGenerating SQL expressions for tables with data...');
                const sqlExpressions = [];
                for (const table of tablesWithData) {
                    // Basic count query
                    sqlExpressions.push({
                        id: `POR-${table.name.toUpperCase()}-COUNT`,
                        name: `POR ${table.name} Count`,
                        description: `Count of records in ${table.name}`,
                        sql: `SELECT Count(*) AS value FROM [${table.name}]`,
                        rowCount: table.rowCount
                    });
                }
                // Save SQL expressions to file
                const sqlFile = path.join(process.cwd(), 'scripts', 'por-sql-with-data.json');
                fs.writeFileSync(sqlFile, JSON.stringify(sqlExpressions, null, 2));
                console.log(`SQL expressions saved to ${sqlFile}`);
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
