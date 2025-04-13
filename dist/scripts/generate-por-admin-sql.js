/**
 * Generate SQL Statements for POR Overview Admin Integration
 *
 * This script generates SQL statements to insert or update the POR Overview queries
 * in the admin database. The SQL can be executed using the SQLite client.
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
function generatePORAdminSQL() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Generating SQL statements for POR Overview Admin integration...');
        try {
            // Read the tested queries with values
            const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-values.json');
            if (!fs.existsSync(queriesPath)) {
                console.error(`Error: File not found: ${queriesPath}`);
                console.error('Please run the test-por-overview-queries.ts script first to generate this file.');
                return;
            }
            const porOverviewRows = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
            // Generate SQL statements
            let sqlContent = '-- POR Overview Admin Integration SQL\n';
            sqlContent += '-- Generated: ' + new Date().toLocaleString() + '\n\n';
            // First, create a backup of the current admin_variables table
            sqlContent += '-- Create a backup of the current admin_variables table\n';
            sqlContent += 'CREATE TABLE IF NOT EXISTS admin_variables_backup AS SELECT * FROM admin_variables;\n\n';
            // Generate INSERT statements for each row
            sqlContent += '-- Insert POR Overview rows\n';
            for (const row of porOverviewRows) {
                const id = Math.floor(Math.random() * 10000);
                const name = row.variableName;
                const value = row.value || 0;
                const category = 'POR';
                const chartGroup = 'POR Overview';
                const variableName = row.variableName;
                const serverName = row.server;
                const sqlExpression = row.sqlExpression.replace(/'/g, "''"); // Escape single quotes for SQL
                const tableName = row.tableName;
                sqlContent += `
-- ${row.variableName}
INSERT OR REPLACE INTO admin_variables (
  id, name, value, category, chart_group, variable_name, server_name, sql_expression, table_name
) VALUES (
  ${id},
  '${name}',
  '${value}',
  '${category}',
  '${chartGroup}',
  '${variableName}',
  '${serverName}',
  '${sqlExpression}',
  '${tableName}'
);
`;
            }
            // Write the SQL file
            const sqlPath = path.join(process.cwd(), 'por-overview-admin-integration.sql');
            fs.writeFileSync(sqlPath, sqlContent);
            console.log(`SQL statements have been written to: ${sqlPath}`);
            console.log('\nTo execute these SQL statements:');
            console.log('1. Use the SQLite client to connect to your admin database');
            console.log('2. Run the SQL statements in the generated file');
            console.log('3. Verify the POR Overview rows have been added to the admin_variables table');
            // Create a log file with the changes
            let logContent = '# POR Overview Integration Log\n\n';
            logContent += `Integration Date: ${new Date().toLocaleString()}\n\n`;
            logContent += `Generated SQL statements for ${porOverviewRows.length} POR Overview rows.\n\n`;
            logContent += '## SQL Queries Added\n\n';
            for (const row of porOverviewRows) {
                logContent += `### ${row.variableName}\n\n`;
                logContent += '```sql\n';
                logContent += row.sqlExpression;
                logContent += '\n```\n\n';
            }
            const logPath = path.join(process.cwd(), 'por-overview-integration-log.md');
            fs.writeFileSync(logPath, logContent);
            console.log(`Created integration log at: ${logPath}`);
        }
        catch (error) {
            console.error('Error generating SQL statements:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the generator
generatePORAdminSQL().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
