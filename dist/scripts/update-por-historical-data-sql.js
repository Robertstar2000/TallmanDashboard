/**
 * Update POR Historical Data SQL
 *
 * This script updates the admin_variables table with MS Access compatible SQL
 * for the Historical Data POR rows.
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
function updatePorHistoricalDataSql() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('Updating POR Historical Data SQL...');
            // Get all Historical Data POR rows
            const sql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
            const result = yield executeWrite(sql);
            const porHistoricalRows = Array.isArray(result) ? result : [];
            console.log(`Found ${porHistoricalRows.length} Historical Data POR rows`);
            if (porHistoricalRows.length === 0) {
                console.log('No Historical Data POR rows found. Creating them...');
                // Create 12 months of Historical Data POR rows
                for (let i = 1; i <= 12; i++) {
                    const monthOffset = i === 1 ? 0 : -(i - 1);
                    // MS Access SQL for the month
                    const msAccessSql = `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
                    // SQL Server SQL for the month (for reference)
                    const sqlServerSql = `SELECT ISNULL(SUM([Total]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`;
                    // Insert the row
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
                        `Historical Data - POR - Month ${i}`,
                        "0",
                        "POR",
                        "Historical Data",
                        "Historical Data",
                        "POR",
                        "POR",
                        sqlServerSql,
                        msAccessSql,
                        "PurchaseOrder",
                        `Month ${i}`
                    ]);
                    console.log(`Created Historical Data POR row for Month ${i}`);
                }
            }
            else {
                // Update existing rows
                for (const row of porHistoricalRows) {
                    // Extract month number from timeframe
                    const monthMatch = (_a = row.timeframe) === null || _a === void 0 ? void 0 : _a.match(/Month (\d+)/);
                    if (!monthMatch) {
                        console.log(`Skipping row ${row.id} - could not determine month number`);
                        continue;
                    }
                    const monthNumber = parseInt(monthMatch[1]);
                    const monthOffset = monthNumber === 1 ? 0 : -(monthNumber - 1);
                    // MS Access SQL for the month
                    const msAccessSql = `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
                    // Update the row
                    const updateSql = `
          UPDATE admin_variables 
          SET sql_expression = ?, table_name = ?
          WHERE id = ?
        `;
                    yield executeWrite(updateSql, [msAccessSql, "PurchaseOrder", row.id]);
                    console.log(`Updated Historical Data POR row for Month ${monthNumber}`);
                }
            }
            console.log('POR Historical Data SQL update complete');
            // Verify the update
            const verifyResult = yield executeWrite("SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'");
            const updatedRows = Array.isArray(verifyResult) ? verifyResult : [];
            console.log(`\nVerified ${updatedRows.length} Historical Data POR rows`);
            // Display the updated rows
            if (updatedRows.length > 0) {
                updatedRows.forEach(row => {
                    console.log(`\n${row.name} (${row.timeframe}):`);
                    console.log(`Production SQL: ${row.sql_expression}`);
                });
            }
        }
        catch (error) {
            console.error('Error updating POR Historical Data SQL:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the update
updatePorHistoricalDataSql().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
