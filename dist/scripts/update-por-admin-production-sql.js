/**
 * Update POR Admin Production SQL
 *
 * This script updates the admin spreadsheet with MS Access compatible SQL queries
 * for the POR Overview chart. It focuses on updating the sql_expression
 * column with properly formatted SQL for MS Access.
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
import { executeRead } from '../lib/db/sqlite';
function updatePORAdminProductionSQL() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Updating POR Admin Production SQL...');
        try {
            // Path to the POR overview rows JSON file
            const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-values.json');
            if (!fs.existsSync(queriesPath)) {
                console.error(`Error: File not found: ${queriesPath}`);
                console.error('Please run the test-por-overview-queries.ts script first to generate this file.');
                return;
            }
            // Load and ensure all rows have sqlExpression
            const rawData = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
            const porOverviewRows = rawData.map((row) => (Object.assign(Object.assign({}, row), { sqlExpression: row.sqlExpression || row.sqlExpression })));
            console.log(`Loaded ${porOverviewRows.length} POR Overview rows from ${queriesPath}`);
            // Get the current admin rows to find existing POR Overview rows
            console.log('Checking for existing POR Overview rows in admin spreadsheet...');
            const sql = 'SELECT * FROM admin_variables WHERE chart_group = "POR Overview"';
            const currentPORRows = yield executeRead(sql);
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
                    const result = yield executeWrite(insertSql, [
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
                    if (!result) {
                        console.error(`Failed to insert row for ${row.variableName}`);
                    }
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
                    const result = yield executeWrite(updateSql, [msAccessSQL, adminRow.id]);
                    if (result) {
                        updatedCount++;
                    }
                    else {
                        console.error(`Failed to update row for ${row.variableName}`);
                    }
                }
                console.log(`Successfully updated ${updatedCount} POR Overview rows with MS Access compatible SQL.`);
            }
            // Create a log file with the changes
            let logContent = '# POR Overview Production SQL Update Log\n\n';
            logContent += `Update Date: ${new Date().toLocaleString()}\n\n`;
            logContent += `Updated POR Overview rows with MS Access compatible SQL for production use.\n\n`;
            logContent += '## MS Access SQL Queries\n\n';
            for (const row of porOverviewRows) {
                logContent += `### ${row.variableName}\n\n`;
                logContent += '```sql\n';
                logContent += formatSQLForMSAccess(row.sqlExpression);
                logContent += '\n```\n\n';
            }
            const logPath = path.join(process.cwd(), 'por-overview-production-sql-log.md');
            fs.writeFileSync(logPath, logContent);
            console.log(`Created update log at: ${logPath}`);
            console.log('\nPOR Overview queries have been successfully integrated into the admin spreadsheet.');
            console.log('The queries will be executed against the POR database when the admin spreadsheet is run in production mode.');
        }
        catch (error) {
            console.error('Error updating POR Admin Production SQL:', error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * Format SQL for MS Access
 *
 * This function formats SQL queries to be compatible with MS Access.
 * It replaces SQL Server specific syntax with MS Access compatible syntax.
 */
function formatSQLForMSAccess(sql) {
    if (!sql)
        return '';
    let msAccessSQL = sql;
    // Replace schema prefixes (dbo.)
    msAccessSQL = msAccessSQL.replace(/dbo\./g, '');
    // Replace table hints (WITH (NOLOCK))
    msAccessSQL = msAccessSQL.replace(/WITH\s*\(\s*NOLOCK\s*\)/gi, '');
    // Replace GETDATE() with Date()
    msAccessSQL = msAccessSQL.replace(/GETDATE\(\)/gi, 'Date()');
    // Replace DATEADD syntax
    // DATEADD(day, -7, GETDATE()) -> DateAdd('d', -7, Date())
    msAccessSQL = msAccessSQL.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (match, interval, number, date) => {
        // Convert interval to MS Access format
        let msAccessInterval = 'd'; // default to day
        if (interval.toLowerCase() === 'day' || interval.toLowerCase() === 'd') {
            msAccessInterval = 'd';
        }
        else if (interval.toLowerCase() === 'month' || interval.toLowerCase() === 'm') {
            msAccessInterval = 'm';
        }
        else if (interval.toLowerCase() === 'year' || interval.toLowerCase() === 'yyyy') {
            msAccessInterval = 'yyyy';
        }
        else if (interval.toLowerCase() === 'quarter' || interval.toLowerCase() === 'q') {
            msAccessInterval = 'q';
        }
        else if (interval.toLowerCase() === 'hour' || interval.toLowerCase() === 'hh') {
            msAccessInterval = 'h';
        }
        else if (interval.toLowerCase() === 'minute' || interval.toLowerCase() === 'mi') {
            msAccessInterval = 'n';
        }
        else if (interval.toLowerCase() === 'second' || interval.toLowerCase() === 'ss') {
            msAccessInterval = 's';
        }
        // Replace GETDATE() in the date parameter
        const msAccessDate = date.replace(/GETDATE\(\)/gi, 'Date()');
        return `DateAdd('${msAccessInterval}', ${number}, ${msAccessDate})`;
    });
    // Replace DATEDIFF syntax
    // DATEDIFF(day, order_date, GETDATE()) -> DateDiff('d', order_date, Date())
    msAccessSQL = msAccessSQL.replace(/DATEDIFF\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (match, interval, date1, date2) => {
        // Convert interval to MS Access format
        let msAccessInterval = 'd'; // default to day
        if (interval.toLowerCase() === 'day' || interval.toLowerCase() === 'd') {
            msAccessInterval = 'd';
        }
        else if (interval.toLowerCase() === 'month' || interval.toLowerCase() === 'm') {
            msAccessInterval = 'm';
        }
        else if (interval.toLowerCase() === 'year' || interval.toLowerCase() === 'yyyy') {
            msAccessInterval = 'yyyy';
        }
        else if (interval.toLowerCase() === 'quarter' || interval.toLowerCase() === 'q') {
            msAccessInterval = 'q';
        }
        else if (interval.toLowerCase() === 'hour' || interval.toLowerCase() === 'hh') {
            msAccessInterval = 'h';
        }
        else if (interval.toLowerCase() === 'minute' || interval.toLowerCase() === 'mi') {
            msAccessInterval = 'n';
        }
        else if (interval.toLowerCase() === 'second' || interval.toLowerCase() === 'ss') {
            msAccessInterval = 's';
        }
        // Replace GETDATE() in the date parameters
        const msAccessDate1 = date1.replace(/GETDATE\(\)/gi, 'Date()');
        const msAccessDate2 = date2.replace(/GETDATE\(\)/gi, 'Date()');
        return `DateDiff('${msAccessInterval}', ${msAccessDate1}, ${msAccessDate2})`;
    });
    // Replace date literals (convert YYYY-MM-DD to #MM/DD/YYYY#)
    msAccessSQL = msAccessSQL.replace(/'(\d{4})-(\d{2})-(\d{2})'/g, (match, year, month, day) => {
        return `#${month}/${day}/${year}#`;
    });
    // Replace ISNULL with Nz
    msAccessSQL = msAccessSQL.replace(/ISNULL\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'Nz($1, $2)');
    // Clean up any double spaces
    msAccessSQL = msAccessSQL.replace(/\s+/g, ' ').trim();
    return msAccessSQL;
}
// Run the update script
updatePORAdminProductionSQL().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
