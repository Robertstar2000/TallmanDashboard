/**
 * Reset Admin Database
 *
 * This script resets the admin database by dropping and recreating the admin_variables table,
 * then populates it with the POR Overview queries.
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
import path from 'path';
import { executeWrite } from '../lib/db/sqlite';
function resetAdminDb() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Resetting Admin Database...');
        try {
            // Drop the admin_variables table if it exists
            const dropTableSql = "DROP TABLE IF EXISTS admin_variables";
            yield executeWrite(dropTableSql);
            console.log('Dropped admin_variables table if it existed');
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
        table_name TEXT
      )
    `;
            yield executeWrite(createTableSql);
            console.log('Created admin_variables table');
            // Check if the POR Overview queries file exists
            const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-ms-access-sql.json');
            if (fs.existsSync(queriesPath)) {
                console.log(`Loading POR Overview queries from ${queriesPath}`);
                const porOverviewRows = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
                // Insert the POR Overview queries into the admin_variables table
                for (const row of porOverviewRows) {
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
            table_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                    yield executeWrite(insertSql, [
                        row.variableName,
                        row.value.toString(),
                        'POR',
                        'POR Overview',
                        row.chartName,
                        row.variableName,
                        'POR', // Always use POR as the server name
                        row.sqlExpression,
                        row.sqlExpression || row.sqlExpression,
                        row.tableName || 'PurchaseOrder'
                    ]);
                }
                console.log(`Inserted ${porOverviewRows.length} POR Overview rows into admin_variables table`);
            }
            else {
                console.log(`POR Overview queries file not found at ${queriesPath}`);
                console.log('Creating sample admin variables...');
                // Create some sample admin variables
                const sampleVariables = [
                    {
                        name: 'Open POs',
                        value: '0',
                        category: 'POR',
                        chart_group: 'POR Overview',
                        chart_name: 'POR Overview',
                        variable_name: 'Open POs',
                        server_name: 'POR',
                        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'",
                        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Open'",
                        table_name: 'PurchaseOrder'
                    },
                    {
                        name: 'Closed POs',
                        value: '0',
                        category: 'POR',
                        chart_group: 'POR Overview',
                        chart_name: 'POR Overview',
                        variable_name: 'Closed POs',
                        server_name: 'POR',
                        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Closed'",
                        sql_expression: "SELECT COUNT(*) FROM PurchaseOrder WHERE Status = 'Closed'",
                        table_name: 'PurchaseOrder'
                    }
                ];
                for (const variable of sampleVariables) {
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
            table_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                    yield executeWrite(insertSql, [
                        variable.name,
                        variable.value,
                        variable.category,
                        variable.chart_group,
                        variable.chart_name,
                        variable.variable_name,
                        variable.server_name,
                        variable.sql_expression,
                        variable.sql_expression,
                        variable.table_name
                    ]);
                }
                console.log(`Inserted ${sampleVariables.length} sample admin variables`);
            }
            // Verify the admin_variables table was created and populated
            const countSql = "SELECT COUNT(*) as count FROM admin_variables";
            const countResult = yield executeWrite(countSql);
            if (Array.isArray(countResult) && countResult.length > 0) {
                const count = countResult[0].count;
                console.log(`Verified admin_variables table has ${count} rows`);
            }
            console.log('Admin database reset complete');
        }
        catch (error) {
            console.error('Error resetting admin database:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the reset
resetAdminDb().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
