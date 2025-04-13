/**
 * Update POR Historical Data
 *
 * This script updates the admin_variables table with the correct SQL queries
 * for the POR Historical Data rows, using the verified PurchaseOrder table.
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
import { executeWrite } from '../lib/db/sqlite';
import fs from 'fs';
function updatePorHistoricalData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Updating POR Historical Data...');
            // First, check if the admin_variables table exists
            const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
            const tableResult = yield executeWrite(tableCheckSql);
            if (!Array.isArray(tableResult) || tableResult.length === 0) {
                console.log('admin_variables table does not exist, creating it...');
                // Create the admin_variables table
                const createTableSql = `
        CREATE TABLE admin_variables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          value TEXT,
          category TEXT,
          chart_group TEXT,
          chart_name TEXT,
          variable_name TEXT,
          server_name TEXT,
          sql_expression TEXT,
          sql_expression TEXT,
          table_name TEXT,
          timeframe TEXT
        )
      `;
                yield executeWrite(createTableSql);
                console.log('Created admin_variables table');
            }
            // Check if there are any Historical Data POR rows
            const checkSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
            const checkResult = yield executeWrite(checkSql);
            const count = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].count : 0;
            // Create the POR Historical Data rows with the correct SQL queries
            const porHistoricalRows = [];
            for (let i = 1; i <= 12; i++) {
                const monthOffset = i === 1 ? 0 : -(i - 1);
                // MS Access SQL for the month - using the verified PurchaseOrder table and Total column
                const msAccessSql = `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
                // SQL Server equivalent (for reference)
                const sqlServerSql = `SELECT ISNULL(SUM([Total]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`;
                porHistoricalRows.push({
                    name: `Historical Data - POR - Month ${i}`,
                    value: "0",
                    category: "POR",
                    chart_group: "Historical Data",
                    chart_name: "Historical Data",
                    variable_name: "POR",
                    server_name: "POR",
                    sql_expression: sqlServerSql,
                    sql_expression: msAccessSql,
                    table_name: "PurchaseOrder",
                    timeframe: `Month ${i}`
                });
            }
            if (count === 0) {
                console.log('No Historical Data POR rows found, creating them...');
                // Insert the rows
                for (const row of porHistoricalRows) {
                    const insertSql = `
          INSERT INTO admin_variables (
            name, 
            value, 
            category, 
            chart_group, 
            chart_name, 
            variable_name, 
            server_name, 
            sql_expression, 
            sql_expression,
            table_name,
            timeframe
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                    yield executeWrite(insertSql, [
                        row.name,
                        row.value.toString(),
                        row.category,
                        row.chart_group,
                        row.chart_name,
                        row.variable_name,
                        row.server_name,
                        row.sql_expression,
                        row.sql_expression,
                        row.table_name,
                        row.timeframe
                    ]);
                }
                console.log(`Created ${porHistoricalRows.length} Historical Data POR rows`);
            }
            else {
                console.log(`Found ${count} existing Historical Data POR rows, updating them...`);
                // Get the existing rows
                const existingRowsSql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
                const existingRowsResult = yield executeWrite(existingRowsSql);
                const existingRows = Array.isArray(existingRowsResult) ? existingRowsResult : [];
                // Update each row
                for (const existingRow of existingRows) {
                    // Extract month number from name or timeframe
                    let monthNumber = 1;
                    if (existingRow.timeframe) {
                        const monthMatch = existingRow.timeframe.match(/Month (\d+)/);
                        if (monthMatch) {
                            monthNumber = parseInt(monthMatch[1]);
                        }
                    }
                    else if (existingRow.name) {
                        const monthMatch = existingRow.name.match(/Month (\d+)/);
                        if (monthMatch) {
                            monthNumber = parseInt(monthMatch[1]);
                        }
                    }
                    // Find the corresponding new row
                    const newRow = porHistoricalRows.find(r => r.timeframe === `Month ${monthNumber}`);
                    if (newRow) {
                        // Update the row
                        const updateSql = `
            UPDATE admin_variables 
            SET sql_expression = ?, 
                sql_expression = ?,
                table_name = ?
            WHERE id = ?
          `;
                        yield executeWrite(updateSql, [
                            newRow.sql_expression,
                            newRow.sql_expression,
                            newRow.table_name,
                            existingRow.id
                        ]);
                        console.log(`Updated Historical Data POR row for Month ${monthNumber}`);
                    }
                }
            }
            // Save the POR Historical Data SQL to a file for reference
            const porHistoricalSql = porHistoricalRows.map(row => ({
                name: row.name,
                timeframe: row.timeframe,
                sqlExpression: row.sql_expression,
                sqlExpression: row.sql_expression
            }));
            fs.writeFileSync('por-historical-data-sql.json', JSON.stringify(porHistoricalSql, null, 2));
            console.log('\nSaved POR Historical Data SQL to por-historical-data-sql.json');
            // Verify the rows
            const verifySql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
            const verifyResult = yield executeWrite(verifySql);
            const verifyCount = Array.isArray(verifyResult) && verifyResult.length > 0 ? verifyResult[0].count : 0;
            console.log(`\nVerified ${verifyCount} Historical Data POR rows in the admin_variables table`);
            // Display a sample row
            const sampleSql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' LIMIT 1";
            const sampleResult = yield executeWrite(sampleSql);
            if (Array.isArray(sampleResult) && sampleResult.length > 0) {
                console.log('\nSample POR Historical Data row:');
                console.log(`Name: ${sampleResult[0].name}`);
                console.log(`Timeframe: ${sampleResult[0].timeframe}`);
                console.log(`Production SQL: ${sampleResult[0].sql_expression}`);
            }
            console.log('\nPOR Historical Data update complete');
        }
        catch (error) {
            console.error('Error updating POR Historical Data:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the update
updatePorHistoricalData().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
