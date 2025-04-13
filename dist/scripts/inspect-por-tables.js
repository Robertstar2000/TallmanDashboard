/**
 * Inspect POR Tables
 *
 * This script inspects the structure and content of key tables
 * in the POR database to better understand what data is available.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-table-inspection.json')
};
// Tables to inspect
const TABLES_TO_INSPECT = [
    'CustomerJobSite',
    'MapGPSWorkOrders',
    'CustomerFile',
    'PurchaseOrder',
    'CustomerEdit',
    'MapGPSFences',
    'AccountingCustomer',
    'SFSync_CustomerFileAccounts',
    'SFSync_SalesmanUsers',
    'CustomerComments',
    'CustomerGroup',
    'CustomerStatus'
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Inspect POR Tables');
        console.log('=================\n');
        try {
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database.`);
            // Inspect each table
            const tableInfos = [];
            for (const table of TABLES_TO_INSPECT) {
                console.log(`\nInspecting table: ${table}`);
                const tableExists = availableTables.includes(table);
                console.log(`Table exists: ${tableExists}`);
                if (!tableExists) {
                    tableInfos.push({
                        tableName: table,
                        exists: false,
                        rowCount: 0,
                        columns: [],
                        sampleData: null,
                        error: 'Table does not exist'
                    });
                    continue;
                }
                // Get row count
                console.log('Getting row count...');
                const countSql = `SELECT Count(*) AS value FROM ${table}`;
                const countResponse = yield testSql(countSql);
                let rowCount = 0;
                if (countResponse.success && countResponse.result) {
                    rowCount = countResponse.result.value || 0;
                    console.log(`Row count: ${rowCount}`);
                }
                else {
                    console.log(`Failed to get row count: ${countResponse.error}`);
                }
                // Get columns and sample data
                console.log('Getting columns and sample data...');
                const sampleSql = `SELECT TOP 1 * FROM ${table}`;
                const sampleResponse = yield testSql(sampleSql);
                let columns = [];
                let sampleData = null;
                let error = undefined;
                if (sampleResponse.success && sampleResponse.result) {
                    sampleData = sampleResponse.result;
                    columns = Object.keys(sampleData);
                    console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
                    console.log('Sample data:', sampleData);
                }
                else {
                    error = sampleResponse.error;
                    console.log(`Failed to get columns and sample data: ${error}`);
                    // Try alternative approach to get columns
                    console.log('Trying alternative approach to get columns...');
                    const columnsSql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`;
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
                // If we have rows but couldn't get sample data, try with specific columns
                if (rowCount > 0 && !sampleData && columns.length > 0) {
                    console.log('Trying to get sample data with specific columns...');
                    const specificColumnsSql = `SELECT TOP 1 ${columns.slice(0, 5).join(', ')} FROM ${table}`;
                    const specificColumnsResponse = yield testSql(specificColumnsSql);
                    if (specificColumnsResponse.success && specificColumnsResponse.result) {
                        sampleData = specificColumnsResponse.result;
                        console.log('Sample data (partial):', sampleData);
                    }
                    else {
                        console.log(`Failed to get sample data with specific columns: ${specificColumnsResponse.error}`);
                    }
                }
                // If we have rows, try to get data with date filters
                if (rowCount > 0) {
                    console.log('Checking for date columns...');
                    const dateColumns = columns.filter(col => col.toLowerCase().includes('date') ||
                        col.toLowerCase().includes('time') ||
                        col.toLowerCase().includes('created') ||
                        col.toLowerCase().includes('modified'));
                    if (dateColumns.length > 0) {
                        console.log(`Found date columns: ${dateColumns.join(', ')}`);
                        for (const dateCol of dateColumns) {
                            console.log(`Checking data by month using ${dateCol}...`);
                            for (let month = 1; month <= 12; month++) {
                                const monthSql = `SELECT Count(*) AS value FROM ${table} WHERE Month(${dateCol}) = ${month} AND Year(${dateCol}) = Year(Date())`;
                                const monthResponse = yield testSql(monthSql);
                                if (monthResponse.success && monthResponse.result) {
                                    const monthCount = monthResponse.result.value || 0;
                                    console.log(`  Month ${month}: ${monthCount} rows`);
                                    if (monthCount > 0) {
                                        console.log(`  Found data for month ${month}!`);
                                        // Get sample data for this month
                                        const monthSampleSql = `SELECT TOP 1 * FROM ${table} WHERE Month(${dateCol}) = ${month} AND Year(${dateCol}) = Year(Date())`;
                                        const monthSampleResponse = yield testSql(monthSampleSql);
                                        if (monthSampleResponse.success && monthSampleResponse.result) {
                                            console.log(`  Sample data for month ${month}:`, monthSampleResponse.result);
                                        }
                                    }
                                }
                                else {
                                    console.log(`  Failed to check month ${month}: ${monthResponse.error}`);
                                    break; // Stop checking months if one fails
                                }
                            }
                        }
                    }
                    // Check for status columns
                    console.log('Checking for status columns...');
                    const statusColumns = columns.filter(col => col.toLowerCase().includes('status') ||
                        col.toLowerCase().includes('state') ||
                        col.toLowerCase().includes('type'));
                    if (statusColumns.length > 0) {
                        console.log(`Found status columns: ${statusColumns.join(', ')}`);
                        for (const statusCol of statusColumns) {
                            console.log(`Checking distinct values for ${statusCol}...`);
                            const distinctSql = `SELECT DISTINCT ${statusCol} FROM ${table}`;
                            const distinctResponse = yield testSql(distinctSql);
                            if (distinctResponse.success && distinctResponse.result) {
                                const distinctValues = Array.isArray(distinctResponse.result)
                                    ? distinctResponse.result.map(r => r[statusCol]).filter(Boolean)
                                    : [distinctResponse.result[statusCol]].filter(Boolean);
                                console.log(`  Distinct values for ${statusCol}: ${distinctValues.join(', ')}`);
                                // Check counts for each status value
                                for (const value of distinctValues) {
                                    if (!value)
                                        continue;
                                    const statusCountSql = `SELECT Count(*) AS value FROM ${table} WHERE ${statusCol} = '${value}'`;
                                    const statusCountResponse = yield testSql(statusCountSql);
                                    if (statusCountResponse.success && statusCountResponse.result) {
                                        const statusCount = statusCountResponse.result.value || 0;
                                        console.log(`    ${value}: ${statusCount} rows`);
                                    }
                                }
                            }
                            else {
                                console.log(`  Failed to get distinct values: ${distinctResponse.error}`);
                            }
                        }
                    }
                }
                // Save table info
                tableInfos.push({
                    tableName: table,
                    exists: true,
                    rowCount: rowCount,
                    columns: columns,
                    sampleData: sampleData,
                    error: error
                });
            }
            // Save results to file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(tableInfos, null, 2));
            console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Inspected ${tableInfos.length} tables.`);
            console.log(`Tables that exist: ${tableInfos.filter(t => t.exists).length}`);
            console.log(`Tables with rows: ${tableInfos.filter(t => t.rowCount > 0).length}`);
            // Print tables with rows
            const tablesWithRows = tableInfos.filter(t => t.rowCount > 0);
            if (tablesWithRows.length > 0) {
                console.log('\nTables with data:');
                for (const table of tablesWithRows) {
                    console.log(`  ${table.tableName}: ${table.rowCount} rows, ${table.columns.length} columns`);
                }
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
