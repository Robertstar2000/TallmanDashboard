/**
 * Update POR Admin with MDB Reader
 *
 * This script uses the mdb-reader package to read the MS Access file
 * and update the admin spreadsheet with the POR Overview queries.
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
import MDBReader from 'mdb-reader';
function updatePORAdminWithMDBReader() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Updating POR Admin with MDB Reader...');
        try {
            // Path to the POR overview rows JSON file
            const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-values.json');
            if (!fs.existsSync(queriesPath)) {
                console.error(`Error: File not found: ${queriesPath}`);
                console.error('Please run the test-por-overview-queries.ts script first to generate this file.');
                return;
            }
            const porOverviewRows = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
            // Prompt for the MS Access file path if not provided
            let accessFilePath = process.env.POR_ACCESS_FILE_PATH;
            if (!accessFilePath) {
                accessFilePath = 'C:\\path\\to\\por\\database.mdb'; // Default path, should be changed
                console.log(`Using default MS Access file path: ${accessFilePath}`);
                console.log('Set the POR_ACCESS_FILE_PATH environment variable to change this path.');
            }
            // Verify MS Access file exists
            const accessFileExists = fs.existsSync(accessFilePath);
            if (!accessFileExists) {
                console.warn(`Warning: MS Access file not found at path: ${accessFilePath}`);
                console.warn('Will continue without verifying MS Access database structure.');
            }
            else {
                // Read the MS Access file using mdb-reader
                console.log(`Reading MS Access file: ${accessFilePath}`);
                const buffer = fs.readFileSync(accessFilePath);
                const reader = new MDBReader(buffer);
                // Get the table names to verify the database structure
                const tableNames = reader.getTableNames();
                console.log('Tables in MS Access database:', tableNames);
                // Verify the PurchaseOrder table exists
                if (!tableNames.includes('PurchaseOrder')) {
                    console.warn('Warning: PurchaseOrder table not found in MS Access database.');
                }
                else {
                    // Get the PurchaseOrder table to verify its structure
                    const purchaseOrderTable = reader.getTable('PurchaseOrder');
                    const columns = purchaseOrderTable.getColumnNames();
                    console.log('PurchaseOrder table columns:', columns);
                    // Verify required columns exist
                    const requiredColumns = ['Date', 'Status'];
                    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
                    if (missingColumns.length > 0) {
                        console.warn(`Warning: Missing required columns in PurchaseOrder table: ${missingColumns.join(', ')}`);
                    }
                }
            }
            // Get the current admin rows to find existing POR Overview rows
            const sql = 'SELECT * FROM admin_variables WHERE chart_group = "POR Overview"';
            const currentPORRows = yield executeWrite(sql);
            if (!Array.isArray(currentPORRows) || currentPORRows.length === 0) {
                console.log('No POR Overview rows found in the admin spreadsheet.');
                console.log('Creating new POR Overview rows...');
                // Insert new rows for POR Overview
                for (const row of porOverviewRows) {
                    // Format the SQL for MS Access
                    const msAccessSQL = formatSQLForMSAccess(row.sqlExpression);
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
            table_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                    yield executeWrite(insertSql, [
                        row.variableName,
                        row.value.toString(),
                        'POR',
                        'POR Overview',
                        row.chartName,
                        row.variableName,
                        'POR', // Always use POR as the server name
                        msAccessSQL,
                        row.tableName || 'PurchaseOrder'
                    ]);
                }
                console.log(`Created ${porOverviewRows.length} new POR Overview rows.`);
            }
            else {
                console.log(`Found ${currentPORRows.length} POR Overview rows in the admin spreadsheet.`);
                // Update existing rows with production SQL
                let updatedCount = 0;
                for (const row of porOverviewRows) {
                    // Find the matching row in the admin spreadsheet
                    const adminRow = currentPORRows.find(r => r.variable_name === row.variableName &&
                        r.chart_name === row.chartName);
                    if (!adminRow) {
                        console.warn(`Warning: No matching row found for ${row.variableName}`);
                        continue;
                    }
                    // Format the SQL for MS Access
                    const msAccessSQL = formatSQLForMSAccess(row.sqlExpression);
                    // Update the production SQL in the admin spreadsheet
                    const updateSql = `
          UPDATE admin_variables 
          SET sql_expression = ?
          WHERE id = ?
        `;
                    yield executeWrite(updateSql, [msAccessSQL, adminRow.id]);
                    updatedCount++;
                }
                console.log(`Updated ${updatedCount} POR Overview rows with production SQL.`);
            }
            console.log('POR Admin update completed successfully.');
        }
        catch (error) {
            console.error('Error updating POR Admin:', error);
        }
    });
}
// Format SQL for MS Access
// 
// This function ensures SQL queries are compatible with MS Access:
// - Uses # for date literals instead of single quotes
// - Uses [] for column names with spaces
// - Adjusts other syntax as needed
function formatSQLForMSAccess(sql) {
    // Replace date literals with # format
    let formattedSql = sql.replace(/'(\d{4}-\d{2}-\d{2})'/g, '#$1#');
    // Replace GETDATE() with Date()
    formattedSql = formattedSql.replace(/GETDATE\(\)/gi, 'Date()');
    // Replace DATEADD with DateAdd
    formattedSql = formattedSql.replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, interval, number, date) => {
        return `DateAdd('${interval}', ${number}, ${date})`;
    });
    return formattedSql;
}
// Run the update script
updatePORAdminWithMDBReader().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
