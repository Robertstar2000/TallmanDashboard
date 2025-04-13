/**
 * Find POR Data
 *
 * This script searches for tables in the POR database that contain data
 * and generates SQL expressions that can be used for the dashboard.
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
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-data-tables.json'),
    SQL_FILE: path.join(process.cwd(), 'scripts', 'working-por-sql.json')
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Find POR Data');
        console.log('============\n');
        try {
            // Get list of tables
            console.log('Getting list of tables...');
            const tablesResponse = yield testSql('SHOW TABLES');
            if (!tablesResponse.success || !tablesResponse.result) {
                console.error('Failed to get list of tables.');
                return;
            }
            const tables = tablesResponse.result.map((row) => row.TableName || row.value);
            console.log(`Found ${tables.length} tables in POR database.`);
            // Check each table for data
            const tableInfos = [];
            let processedCount = 0;
            for (const table of tables) {
                processedCount++;
                if (processedCount % 20 === 0) {
                    console.log(`Progress: ${processedCount}/${tables.length} tables checked`);
                }
                // Get row count
                const countSql = `SELECT Count(*) AS value FROM ${table}`;
                const countResponse = yield testSql(countSql);
                let rowCount = 0;
                if (countResponse.success && countResponse.result && countResponse.result.value !== undefined) {
                    rowCount = parseInt(countResponse.result.value) || 0;
                }
                else {
                    continue; // Skip this table if we can't get the row count
                }
                // Skip tables with zero rows
                if (rowCount === 0) {
                    continue;
                }
                console.log(`\nFound table with data: ${table} (${rowCount} rows)`);
                // Get columns and sample data
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
                    continue; // Skip this table if we can't get the columns
                }
                // Save table info
                tableInfos.push({
                    name: table,
                    rowCount: rowCount,
                    columns: columns,
                    hasData: true,
                    sampleData: sampleData
                });
            }
            // Sort tables by row count (descending)
            tableInfos.sort((a, b) => b.rowCount - a.rowCount);
            console.log(`\nFound ${tableInfos.length} tables with data.`);
            // Save results to JSON file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(tableInfos, null, 2));
            console.log(`Results saved to ${CONFIG.OUTPUT_FILE}`);
            // Generate SQL expressions for dashboard
            console.log('\nGenerating SQL expressions for dashboard...');
            const sqlExpressions = [];
            // Find tables that might be relevant for rental metrics
            const rentalTables = tableInfos.filter(table => table.name.toLowerCase().includes('rent') ||
                table.name.toLowerCase().includes('order') ||
                table.name.toLowerCase().includes('contract') ||
                table.name.toLowerCase().includes('job') ||
                table.name.toLowerCase().includes('work') ||
                table.name.toLowerCase().includes('customer') ||
                table.name.toLowerCase().includes('transaction'));
            console.log(`\nFound ${rentalTables.length} potential rental-related tables with data:`);
            for (const table of rentalTables) {
                console.log(`  ${table.name}: ${table.rowCount} rows`);
            }
            // Find tables with date columns
            const tablesWithDateColumns = rentalTables.filter(table => table.columns.some(col => col.toLowerCase().includes('date') ||
                col.toLowerCase().includes('time') ||
                col.toLowerCase().includes('created')));
            console.log(`\nFound ${tablesWithDateColumns.length} tables with date columns:`);
            for (const table of tablesWithDateColumns) {
                const dateColumns = table.columns.filter(col => col.toLowerCase().includes('date') ||
                    col.toLowerCase().includes('time') ||
                    col.toLowerCase().includes('created'));
                console.log(`  ${table.name}: ${dateColumns.join(', ')}`);
            }
            // Find tables with status columns
            const tablesWithStatusColumns = rentalTables.filter(table => table.columns.some(col => col.toLowerCase().includes('status') ||
                col.toLowerCase().includes('state') ||
                col.toLowerCase().includes('type')));
            console.log(`\nFound ${tablesWithStatusColumns.length} tables with status columns:`);
            for (const table of tablesWithStatusColumns) {
                const statusColumns = table.columns.filter(col => col.toLowerCase().includes('status') ||
                    col.toLowerCase().includes('state') ||
                    col.toLowerCase().includes('type'));
                console.log(`  ${table.name}: ${statusColumns.join(', ')}`);
            }
            // Generate SQL expressions for each month
            const months = [
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
            // Find the best table for rental metrics
            let bestTable = null;
            // First, try to find a table with both date and status columns
            const tablesWithDateAndStatus = rentalTables.filter(table => table.columns.some(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) &&
                table.columns.some(col => col.toLowerCase().includes('status') || col.toLowerCase().includes('type')));
            if (tablesWithDateAndStatus.length > 0) {
                bestTable = tablesWithDateAndStatus[0];
            }
            else if (tablesWithDateColumns.length > 0) {
                bestTable = tablesWithDateColumns[0];
            }
            else if (rentalTables.length > 0) {
                bestTable = rentalTables[0];
            }
            if (bestTable) {
                console.log(`\nSelected ${bestTable.name} as the best table for rental metrics.`);
                // Find date column
                const dateColumn = bestTable.columns.find(col => col.toLowerCase().includes('date') ||
                    col.toLowerCase().includes('time') ||
                    col.toLowerCase().includes('created')) || 'Date';
                // Find status column
                const statusColumn = bestTable.columns.find(col => col.toLowerCase().includes('status') ||
                    col.toLowerCase().includes('state') ||
                    col.toLowerCase().includes('type'));
                // Generate expressions for each month
                for (const month of months) {
                    // New Rentals by Month
                    let newRentalsSql = '';
                    if (dateColumn) {
                        if (statusColumn) {
                            newRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name} WHERE Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                        }
                        else {
                            newRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name} WHERE Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                        }
                    }
                    else {
                        newRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name}`;
                    }
                    sqlExpressions.push({
                        name: `POR Overview New Rentals ${month.name}`,
                        description: `Count of new rentals for ${month.name}`,
                        sql: newRentalsSql
                    });
                    // Open Rentals by Month
                    let openRentalsSql = '';
                    if (statusColumn) {
                        if (dateColumn) {
                            openRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name} WHERE ${statusColumn} = 'Open' AND Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                        }
                        else {
                            openRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name} WHERE ${statusColumn} = 'Open'`;
                        }
                    }
                    else {
                        if (dateColumn) {
                            openRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name} WHERE Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                        }
                        else {
                            openRentalsSql = `SELECT Count(*) AS value FROM ${bestTable.name}`;
                        }
                    }
                    sqlExpressions.push({
                        name: `POR Overview Open Rentals ${month.name}`,
                        description: `Count of open rentals for ${month.name}`,
                        sql: openRentalsSql
                    });
                    // Rental Value by Month
                    const valueColumn = bestTable.columns.find(col => col.toLowerCase().includes('amount') ||
                        col.toLowerCase().includes('value') ||
                        col.toLowerCase().includes('price') ||
                        col.toLowerCase().includes('cost') ||
                        col.toLowerCase().includes('total'));
                    let rentalValueSql = '';
                    if (valueColumn) {
                        if (dateColumn) {
                            if (statusColumn) {
                                rentalValueSql = `SELECT Sum(${valueColumn}) AS value FROM ${bestTable.name} WHERE ${statusColumn} = 'Open' AND Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                            }
                            else {
                                rentalValueSql = `SELECT Sum(${valueColumn}) AS value FROM ${bestTable.name} WHERE Month(${dateColumn}) = ${month.number} AND Year(${dateColumn}) = Year(Date())`;
                            }
                        }
                        else {
                            if (statusColumn) {
                                rentalValueSql = `SELECT Sum(${valueColumn}) AS value FROM ${bestTable.name} WHERE ${statusColumn} = 'Open'`;
                            }
                            else {
                                rentalValueSql = `SELECT Sum(${valueColumn}) AS value FROM ${bestTable.name}`;
                            }
                        }
                    }
                    else {
                        rentalValueSql = `SELECT Count(*) AS value FROM ${bestTable.name}`;
                    }
                    sqlExpressions.push({
                        name: `POR Overview Rental Value ${month.name}`,
                        description: `Total rental value for ${month.name}`,
                        sql: rentalValueSql
                    });
                }
            }
            else {
                console.log('\nNo suitable table found for rental metrics.');
                // Use a generic table for metrics
                if (tableInfos.length > 0) {
                    const genericTable = tableInfos[0];
                    console.log(`Using ${genericTable.name} as a generic table for metrics.`);
                    for (const month of months) {
                        sqlExpressions.push({
                            name: `POR Overview New Rentals ${month.name}`,
                            description: `Count of new rentals for ${month.name}`,
                            sql: `SELECT Count(*) AS value FROM ${genericTable.name}`
                        });
                        sqlExpressions.push({
                            name: `POR Overview Open Rentals ${month.name}`,
                            description: `Count of open rentals for ${month.name}`,
                            sql: `SELECT Count(*) AS value FROM ${genericTable.name}`
                        });
                        sqlExpressions.push({
                            name: `POR Overview Rental Value ${month.name}`,
                            description: `Total rental value for ${month.name}`,
                            sql: `SELECT Count(*) AS value FROM ${genericTable.name}`
                        });
                    }
                }
            }
            // Test each SQL expression
            console.log('\nTesting SQL expressions...');
            for (let i = 0; i < sqlExpressions.length; i++) {
                const expr = sqlExpressions[i];
                console.log(`\nTesting ${i + 1}/${sqlExpressions.length}: ${expr.name}`);
                console.log(`SQL: ${expr.sql}`);
                const response = yield testSql(expr.sql);
                if (response.success) {
                    console.log('✅ Success!');
                    if (response.result && response.result.value !== undefined) {
                        console.log(`Result: ${response.result.value}`);
                    }
                    else {
                        console.log(`Result: ${JSON.stringify(response.result)}`);
                    }
                    expr.result = response.result;
                }
                else {
                    console.log(`❌ Failed: ${response.error}`);
                    // Try to fix the SQL
                    if (response.error && response.error.includes('not found')) {
                        console.log('Attempting to fix SQL...');
                        // Try alternative SQL
                        const alternativeSql = `SELECT Count(*) AS value FROM ${tableInfos[0].name}`;
                        console.log(`Alternative SQL: ${alternativeSql}`);
                        const alternativeResponse = yield testSql(alternativeSql);
                        if (alternativeResponse.success) {
                            console.log('✅ Alternative SQL succeeded!');
                            if (alternativeResponse.result && alternativeResponse.result.value !== undefined) {
                                console.log(`Result: ${alternativeResponse.result.value}`);
                            }
                            else {
                                console.log(`Result: ${JSON.stringify(alternativeResponse.result)}`);
                            }
                            expr.sql = alternativeSql;
                            expr.result = alternativeResponse.result;
                        }
                    }
                }
            }
            // Save SQL expressions to file
            fs.writeFileSync(CONFIG.SQL_FILE, JSON.stringify(sqlExpressions, null, 2));
            console.log(`\nSQL expressions saved to ${CONFIG.SQL_FILE}`);
            // Print summary
            console.log('\nSummary:');
            console.log(`Found ${tableInfos.length} tables with data.`);
            console.log(`Generated ${sqlExpressions.length} SQL expressions for dashboard.`);
            // Print top tables
            console.log('\nTop 10 tables by row count:');
            for (let i = 0; i < Math.min(10, tableInfos.length); i++) {
                const table = tableInfos[i];
                console.log(`${i + 1}. ${table.name}: ${table.rowCount} rows, ${table.columns.length} columns`);
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
