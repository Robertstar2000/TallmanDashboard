/**
 * Setup Admin Database with Historical Data
 *
 * This script sets up the admin database with the proper schema and
 * populates it with Historical Data rows for both P21 and POR.
 * It ensures that all P21 rows use the correct table names and SQL expressions.
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
// Function to setup the admin database with historical data
function setupAdminDbWithHistoricalData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Setting up admin database with historical data...');
            // Drop the admin_variables table if it exists
            const dropTableSql = `DROP TABLE IF EXISTS admin_variables`;
            yield executeWrite(dropTableSql);
            console.log('Dropped admin_variables table if it existed');
            // Create the admin_variables table with the proper schema
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
            console.log('Created admin_variables table with proper schema');
            // Create Historical Data rows for P21 and POR
            const historicalDataRows = [];
            // Create 12 months of data for both P21 and POR
            for (let i = 1; i <= 12; i++) {
                const monthOffset = i === 1 ? 0 : -(i - 1);
                // P21 row for the month
                historicalDataRows.push({
                    name: `Historical Data - P21 - Month ${i}`,
                    value: "0",
                    category: "P21",
                    chart_group: "Historical Data",
                    chart_name: "Historical Data",
                    variable_name: "P21",
                    server_name: "P21",
                    sql_expression: `SELECT COALESCE(SUM(value), 0) as value FROM historical_data WHERE source = 'p21' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '${monthOffset === 0 ? '' : monthOffset + ' month'}'))`,
                    sql_expression: `SELECT ISNULL(SUM(order_amt), 0) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE FORMAT(order_date, 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`,
                    table_name: "oe_hdr",
                    timeframe: `Month ${i}`
                });
                // POR row for the month with MS Access SQL
                historicalDataRows.push({
                    name: `Historical Data - POR - Month ${i}`,
                    value: "0",
                    category: "POR",
                    chart_group: "Historical Data",
                    chart_name: "Historical Data",
                    variable_name: "POR",
                    server_name: "POR",
                    sql_expression: `SELECT COALESCE(SUM(value), 0) as value FROM historical_data WHERE source = 'por' AND strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '${monthOffset === 0 ? '' : monthOffset + ' month'}'))`,
                    sql_expression: `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`,
                    table_name: "PurchaseOrder",
                    timeframe: `Month ${i}`
                });
            }
            // Add additional P21 metrics
            const additionalP21Metrics = [
                {
                    name: "Total Orders",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Orders",
                    variable_name: "Total",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM orders",
                    sql_expression: "SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)",
                    table_name: "oe_hdr"
                },
                {
                    name: "Open Orders",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Orders",
                    variable_name: "Open",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM orders WHERE status = 'open'",
                    sql_expression: "SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = 'O'",
                    table_name: "oe_hdr"
                },
                {
                    name: "Average Order Value",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Orders",
                    variable_name: "Average Value",
                    server_name: "P21",
                    sql_expression: "SELECT AVG(total) FROM orders",
                    sql_expression: "SELECT ISNULL(AVG(order_amt), 0) FROM dbo.oe_hdr WITH (NOLOCK)",
                    table_name: "oe_hdr"
                },
                {
                    name: "Total Invoices",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Invoices",
                    variable_name: "Total",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM invoices",
                    sql_expression: "SELECT COUNT(*) FROM dbo.invoice_hdr WITH (NOLOCK)",
                    table_name: "invoice_hdr"
                },
                {
                    name: "Average Invoice Value",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Invoices",
                    variable_name: "Average Value",
                    server_name: "P21",
                    sql_expression: "SELECT AVG(total) FROM invoices",
                    sql_expression: "SELECT ISNULL(AVG(invoice_amt), 0) FROM dbo.invoice_hdr WITH (NOLOCK)",
                    table_name: "invoice_hdr"
                },
                {
                    name: "Total Inventory Items",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Inventory",
                    variable_name: "Total Items",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM inventory",
                    sql_expression: "SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)",
                    table_name: "inv_mast"
                },
                {
                    name: "Active Inventory Items",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Inventory",
                    variable_name: "Active Items",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM inventory WHERE status = 'active'",
                    sql_expression: "SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK) WHERE status = 'A'",
                    table_name: "inv_mast"
                },
                {
                    name: "Total Inventory Value",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Inventory",
                    variable_name: "Total Value",
                    server_name: "P21",
                    sql_expression: "SELECT SUM(value) FROM inventory",
                    sql_expression: "SELECT ISNULL(SUM(qty_on_hand * unit_cost), 0) FROM dbo.inv_loc WITH (NOLOCK)",
                    table_name: "inv_loc"
                },
                {
                    name: "Total Customers",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Customers",
                    variable_name: "Total",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM customers",
                    sql_expression: "SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)",
                    table_name: "customer"
                },
                {
                    name: "Active Customers",
                    value: "0",
                    category: "P21",
                    chart_group: "Overview",
                    chart_name: "Customers",
                    variable_name: "Active",
                    server_name: "P21",
                    sql_expression: "SELECT COUNT(*) FROM customers WHERE status = 'active'",
                    sql_expression: "SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK) WHERE status = 'A'",
                    table_name: "customer"
                }
            ];
            // Add the additional metrics to the historicalDataRows array
            historicalDataRows.push(...additionalP21Metrics);
            // Insert the rows into the admin_variables table
            for (const row of historicalDataRows) {
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
            console.log(`Inserted ${historicalDataRows.length} rows (${historicalDataRows.length - additionalP21Metrics.length} Historical Data rows and ${additionalP21Metrics.length} additional P21 metrics)`);
            // Verify the insertion
            const verifyResult = yield executeWrite("SELECT COUNT(*) as count FROM admin_variables");
            const count = Array.isArray(verifyResult) && verifyResult.length > 0 ? verifyResult[0].count : 0;
            console.log(`\nVerified ${count} total rows in the admin_variables table`);
            // Display some sample rows
            const sampleP21Result = yield executeWrite("SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'P21' LIMIT 1");
            const samplePORResult = yield executeWrite("SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' LIMIT 1");
            const sampleP21MetricResult = yield executeWrite("SELECT * FROM admin_variables WHERE category = 'P21' AND chart_name != 'Historical Data' LIMIT 1");
            if (Array.isArray(sampleP21Result) && sampleP21Result.length > 0) {
                console.log('\nSample P21 Historical Data row:');
                console.log(`Name: ${sampleP21Result[0].name}`);
                console.log(`SQL: ${sampleP21Result[0].sql_expression}`);
                console.log(`Production SQL: ${sampleP21Result[0].sql_expression}`);
                console.log(`Table Name: ${sampleP21Result[0].table_name}`);
            }
            if (Array.isArray(samplePORResult) && samplePORResult.length > 0) {
                console.log('\nSample POR Historical Data row:');
                console.log(`Name: ${samplePORResult[0].name}`);
                console.log(`SQL: ${samplePORResult[0].sql_expression}`);
                console.log(`Production SQL: ${samplePORResult[0].sql_expression}`);
                console.log(`Table Name: ${samplePORResult[0].table_name}`);
            }
            if (Array.isArray(sampleP21MetricResult) && sampleP21MetricResult.length > 0) {
                console.log('\nSample P21 Metric row:');
                console.log(`Name: ${sampleP21MetricResult[0].name}`);
                console.log(`SQL: ${sampleP21MetricResult[0].sql_expression}`);
                console.log(`Production SQL: ${sampleP21MetricResult[0].sql_expression}`);
                console.log(`Table Name: ${sampleP21MetricResult[0].table_name}`);
            }
            console.log('\nAdmin database setup with historical data completed successfully.');
        }
        catch (error) {
            console.error('Error setting up admin database:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the setup
setupAdminDbWithHistoricalData().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
