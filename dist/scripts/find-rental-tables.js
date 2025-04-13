/**
 * Find Rental-Related Tables
 *
 * This script searches for tables in the POR database that might contain rental-related data
 * and tests them for the presence of key columns.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'rental-tables-report.md')
};
// Key columns we're looking for
const KEY_COLUMNS = [
    { name: "ID", alternateNames: ["RentalID", "OrderID", "CustomerID", "Key"] },
    { name: "Status", alternateNames: ["RentalStatus", "OrderStatus", "State", "Type"] },
    { name: "CreatedDate", alternateNames: ["Date", "OrderDate", "RentalDate", "EntryDate"] },
    { name: "CustomerID", alternateNames: ["Customer", "CustID", "ClientID"] },
    { name: "Amount", alternateNames: ["Value", "Price", "Cost", "Total"] }
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Find Rental-Related Tables');
        console.log('=========================\n');
        try {
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database.`);
            // Filter tables that might be related to rentals
            const potentialRentalTables = availableTables.filter(table => table.toLowerCase().includes('rent') ||
                table.toLowerCase().includes('order') ||
                table.toLowerCase().includes('customer') ||
                table.toLowerCase().includes('job') ||
                table.toLowerCase().includes('work') ||
                table.toLowerCase().includes('sale') ||
                table.toLowerCase().includes('invoice'));
            console.log(`\nFound ${potentialRentalTables.length} potential rental-related tables:`);
            console.log(potentialRentalTables.join(', '));
            // Analyze each potential rental table
            const tableInfos = [];
            for (const table of potentialRentalTables) {
                console.log(`\nAnalyzing table: ${table}`);
                // Get row count
                const countSql = `SELECT Count(*) AS value FROM ${table}`;
                const countResponse = yield testSql(countSql);
                let rowCount = 0;
                if (countResponse.success && countResponse.result) {
                    rowCount = countResponse.result.value || 0;
                    console.log(`Row count: ${rowCount}`);
                }
                else {
                    console.log(`Failed to get row count: ${countResponse.error}`);
                    continue; // Skip this table if we can't get the row count
                }
                // Get columns
                const sampleSql = `SELECT TOP 1 * FROM ${table}`;
                const sampleResponse = yield testSql(sampleSql);
                let columns = [];
                let sampleData = null;
                if (sampleResponse.success && sampleResponse.result) {
                    sampleData = sampleResponse.result;
                    columns = Object.keys(sampleData);
                    console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
                }
                else {
                    console.log(`Failed to get columns: ${sampleResponse.error}`);
                    // Try alternative approach to get columns
                    const columnsSql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`;
                    const columnsResponse = yield testSql(columnsSql);
                    if (columnsResponse.success && columnsResponse.result) {
                        const columnData = Array.isArray(columnsResponse.result) ? columnsResponse.result : [columnsResponse.result];
                        columns = columnData.map(col => col.COLUMN_NAME);
                        console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
                    }
                    else {
                        console.log(`Failed to get columns using schema: ${columnsResponse.error}`);
                        continue; // Skip this table if we can't get the columns
                    }
                }
                // Check for matching columns
                const matchingColumns = [];
                for (const keyCol of KEY_COLUMNS) {
                    // Check for exact match
                    if (columns.includes(keyCol.name)) {
                        matchingColumns.push({ keyColumn: keyCol.name, foundColumn: keyCol.name });
                        continue;
                    }
                    // Check for alternate names
                    for (const altName of keyCol.alternateNames) {
                        const matchingColumn = columns.find(col => col === altName || col.toLowerCase() === altName.toLowerCase());
                        if (matchingColumn) {
                            matchingColumns.push({ keyColumn: keyCol.name, foundColumn: matchingColumn });
                            break;
                        }
                    }
                    // Check for partial matches
                    if (!matchingColumns.some(match => match.keyColumn === keyCol.name)) {
                        const partialMatches = columns.filter(col => col.toLowerCase().includes(keyCol.name.toLowerCase()) ||
                            keyCol.alternateNames.some(alt => col.toLowerCase().includes(alt.toLowerCase())));
                        if (partialMatches.length > 0) {
                            matchingColumns.push({ keyColumn: keyCol.name, foundColumn: partialMatches[0] });
                        }
                    }
                }
                console.log(`Matching columns (${matchingColumns.length}):`);
                for (const match of matchingColumns) {
                    console.log(`  ${match.keyColumn} -> ${match.foundColumn}`);
                }
                // Save table info
                tableInfos.push({
                    tableName: table,
                    rowCount: rowCount,
                    columns: columns,
                    matchingColumns: matchingColumns,
                    sampleData: sampleData
                });
            }
            // Sort tables by number of matching columns (descending)
            tableInfos.sort((a, b) => b.matchingColumns.length - a.matchingColumns.length);
            // Generate a markdown report
            let markdownReport = '# Rental-Related Tables Report\n\n';
            markdownReport += 'This report shows tables in the POR database that might contain rental-related data.\n\n';
            // Summary table
            markdownReport += '## Summary\n\n';
            markdownReport += '| Table Name | Row Count | Matching Columns | Total Columns |\n';
            markdownReport += '|------------|-----------|------------------|---------------|\n';
            for (const tableInfo of tableInfos) {
                markdownReport += `| ${tableInfo.tableName} | ${tableInfo.rowCount} | ${tableInfo.matchingColumns.length} | ${tableInfo.columns.length} |\n`;
            }
            // Detailed information for each table
            markdownReport += '\n## Detailed Information\n\n';
            for (const tableInfo of tableInfos) {
                markdownReport += `### ${tableInfo.tableName}\n\n`;
                markdownReport += `- Row Count: ${tableInfo.rowCount}\n`;
                markdownReport += `- Total Columns: ${tableInfo.columns.length}\n`;
                markdownReport += `- Matching Columns: ${tableInfo.matchingColumns.length}\n\n`;
                if (tableInfo.matchingColumns.length > 0) {
                    markdownReport += '#### Matching Columns\n\n';
                    markdownReport += '| Key Column | Found Column |\n';
                    markdownReport += '|------------|-------------|\n';
                    for (const match of tableInfo.matchingColumns) {
                        markdownReport += `| ${match.keyColumn} | ${match.foundColumn} |\n`;
                    }
                    markdownReport += '\n';
                }
                markdownReport += '#### All Columns\n\n';
                markdownReport += tableInfo.columns.join(', ') + '\n\n';
                if (tableInfo.sampleData) {
                    markdownReport += '#### Sample Data\n\n';
                    markdownReport += '```json\n';
                    markdownReport += JSON.stringify(tableInfo.sampleData, null, 2);
                    markdownReport += '\n```\n\n';
                }
                // Test SQL expressions for this table
                markdownReport += '#### Test SQL Expressions\n\n';
                markdownReport += '```sql\n';
                // Count all rows
                markdownReport += `-- Count all rows\n`;
                markdownReport += `SELECT Count(*) AS value FROM ${tableInfo.tableName}\n\n`;
                // Count by status if status column exists
                const statusMatch = tableInfo.matchingColumns.find(match => match.keyColumn === 'Status');
                if (statusMatch) {
                    markdownReport += `-- Count by status\n`;
                    markdownReport += `SELECT ${statusMatch.foundColumn}, Count(*) AS value FROM ${tableInfo.tableName} GROUP BY ${statusMatch.foundColumn}\n\n`;
                }
                // Count by month if date column exists
                const dateMatch = tableInfo.matchingColumns.find(match => match.keyColumn === 'CreatedDate');
                if (dateMatch) {
                    markdownReport += `-- Count by month (current year)\n`;
                    markdownReport += `SELECT Month(${dateMatch.foundColumn}) AS Month, Count(*) AS value FROM ${tableInfo.tableName} WHERE Year(${dateMatch.foundColumn}) = Year(Date()) GROUP BY Month(${dateMatch.foundColumn})\n\n`;
                }
                // Sum amount if amount column exists
                const amountMatch = tableInfo.matchingColumns.find(match => match.keyColumn === 'Amount');
                if (amountMatch) {
                    markdownReport += `-- Sum amount\n`;
                    markdownReport += `SELECT Sum(${amountMatch.foundColumn}) AS value FROM ${tableInfo.tableName}\n\n`;
                    // Sum amount by month if date column also exists
                    if (dateMatch) {
                        markdownReport += `-- Sum amount by month (current year)\n`;
                        markdownReport += `SELECT Month(${dateMatch.foundColumn}) AS Month, Sum(${amountMatch.foundColumn}) AS value FROM ${tableInfo.tableName} WHERE Year(${dateMatch.foundColumn}) = Year(Date()) GROUP BY Month(${dateMatch.foundColumn})\n`;
                    }
                }
                markdownReport += '```\n\n';
            }
            // Recommended SQL expressions
            markdownReport += '## Recommended SQL Expressions\n\n';
            if (tableInfos.length > 0) {
                const bestTable = tableInfos[0]; // The table with the most matching columns
                markdownReport += `Based on our analysis, the best table for rental-related data appears to be \`${bestTable.tableName}\`.\n\n`;
                markdownReport += '### SQL Expressions for Monthly Metrics\n\n';
                markdownReport += '```sql\n';
                // Open Rentals
                markdownReport += '-- Open Rentals\n';
                const statusMatch = bestTable.matchingColumns.find(match => match.keyColumn === 'Status');
                if (statusMatch) {
                    markdownReport += `SELECT Count(*) AS value FROM ${bestTable.tableName} WHERE ${statusMatch.foundColumn} = 'Open'\n\n`;
                }
                else {
                    markdownReport += `SELECT Count(*) AS value FROM ${bestTable.tableName}\n\n`;
                }
                // New Rentals by Month
                markdownReport += '-- New Rentals by Month\n';
                const dateMatch = bestTable.matchingColumns.find(match => match.keyColumn === 'CreatedDate');
                if (dateMatch && statusMatch) {
                    markdownReport += `SELECT Count(*) AS value FROM ${bestTable.tableName} WHERE ${statusMatch.foundColumn} = 'Open' AND Month(${dateMatch.foundColumn}) = [MONTH] AND Year(${dateMatch.foundColumn}) = Year(Date())\n\n`;
                }
                else if (dateMatch) {
                    markdownReport += `SELECT Count(*) AS value FROM ${bestTable.tableName} WHERE Month(${dateMatch.foundColumn}) = [MONTH] AND Year(${dateMatch.foundColumn}) = Year(Date())\n\n`;
                }
                else {
                    markdownReport += `-- Cannot generate expression without date column\n\n`;
                }
                // Rental Value
                markdownReport += '-- Rental Value\n';
                const amountMatch = bestTable.matchingColumns.find(match => match.keyColumn === 'Amount');
                if (amountMatch && statusMatch) {
                    markdownReport += `SELECT Sum(${amountMatch.foundColumn}) AS value FROM ${bestTable.tableName} WHERE ${statusMatch.foundColumn} = 'Open'\n\n`;
                }
                else if (amountMatch) {
                    markdownReport += `SELECT Sum(${amountMatch.foundColumn}) AS value FROM ${bestTable.tableName}\n\n`;
                }
                else {
                    markdownReport += `-- Cannot generate expression without amount column\n`;
                }
                markdownReport += '```\n';
            }
            else {
                markdownReport += 'No suitable tables found for rental-related data.\n';
            }
            // Save the markdown report to a file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, markdownReport);
            console.log(`\nReport saved to ${CONFIG.OUTPUT_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Analyzed ${tableInfos.length} potential rental-related tables.`);
            if (tableInfos.length > 0) {
                console.log('\nTop 5 tables by matching columns:');
                for (let i = 0; i < Math.min(5, tableInfos.length); i++) {
                    const tableInfo = tableInfos[i];
                    console.log(`${i + 1}. ${tableInfo.tableName}: ${tableInfo.matchingColumns.length} matching columns, ${tableInfo.rowCount} rows`);
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
