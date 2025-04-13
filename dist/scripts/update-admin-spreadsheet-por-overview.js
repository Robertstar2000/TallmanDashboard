/**
 * Update Admin Spreadsheet with POR Overview Queries
 *
 * This script updates the admin spreadsheet with the POR Overview queries
 * that have been tested and verified to work with the MS Access database.
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
function updateAdminSpreadsheet() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Updating Admin Spreadsheet with POR Overview Queries...');
        try {
            // Read the tested queries with values
            const queriesPath = path.join(process.cwd(), 'por-overview-rows-with-values.json');
            if (!fs.existsSync(queriesPath)) {
                console.error(`Error: File not found: ${queriesPath}`);
                console.error('Please run the test-por-overview-queries.ts script first to generate this file.');
                return;
            }
            // Load and ensure all rows have sqlExpression
            const rawData = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
            const queriesData = rawData.map((row) => (Object.assign(Object.assign({}, row), { sqlExpression: row.sqlExpression || row.sqlExpression })));
            // Group queries by type
            const queryGroups = {
                'New Rentals': queriesData.filter(row => row.variableName.startsWith('New Rentals')),
                'Open Rentals': queriesData.filter(row => row.variableName.startsWith('Open Rentals')),
                'Rental Value': queriesData.filter(row => row.variableName.startsWith('Rental Value'))
            };
            // Create a markdown file with instructions for the admin spreadsheet
            let markdownContent = '# POR Overview Queries for Admin Spreadsheet\n\n';
            markdownContent += 'This document contains the SQL queries for the POR Overview chart that should be added to the admin spreadsheet.\n\n';
            markdownContent += 'These queries have been tested and verified to work with the MS Access database.\n\n';
            // Add each query group to the markdown file
            for (const [groupName, queries] of Object.entries(queryGroups)) {
                markdownContent += `## ${groupName}\n\n`;
                markdownContent += '| Month | SQL Expression |\n|-------|---------------|\n';
                for (const query of queries) {
                    // Extract month from variable name
                    const monthMatch = query.variableName.match(/New Rentals (.+)/) ||
                        query.variableName.match(/Open Rentals (.+)/) ||
                        query.variableName.match(/Rental Value (.+)/);
                    const month = monthMatch ? monthMatch[1] : query.variableName;
                    // Format SQL for better readability
                    const formattedSql = query.sqlExpression.replace(/\n\s+/g, ' ');
                    markdownContent += `| ${month} | \`${formattedSql}\` |\n`;
                }
                markdownContent += '\n';
            }
            // Add implementation instructions
            markdownContent += '## Implementation Instructions\n\n';
            markdownContent += '1. Open the admin spreadsheet in the dashboard.\n';
            markdownContent += '2. For each row in the POR Overview section, update the SQL Expression field with the corresponding query from this document.\n';
            markdownContent += '3. Make sure the Server field is set to "POR" for all rows.\n';
            markdownContent += '4. Make sure the Table Name field is set to "PurchaseOrder" for all rows.\n';
            markdownContent += '5. Click the "Run" button to execute the queries and update the values.\n\n';
            markdownContent += '## Important Notes\n\n';
            markdownContent += '- These queries use MS Access SQL syntax, which is different from SQL Server syntax.\n';
            markdownContent += '- Date literals in MS Access are enclosed in # characters, e.g., #3/1/2025#.\n';
            markdownContent += '- Column names in MS Access are enclosed in square brackets, e.g., [Date].\n';
            // Write the markdown file
            fs.writeFileSync('por-overview-admin-implementation.md', markdownContent);
            console.log('\nAdmin spreadsheet update instructions have been written to:');
            console.log('- por-overview-admin-implementation.md');
            // Create a SQL script for direct database execution
            let sqlScript = '-- POR Overview SQL Queries\n';
            sqlScript += '-- These queries have been tested and verified to work with the MS Access database.\n\n';
            for (const [groupName, queries] of Object.entries(queryGroups)) {
                sqlScript += `-- ${groupName}\n`;
                for (const query of queries) {
                    sqlScript += `-- ${query.variableName}\n`;
                    sqlScript += `${query.sqlExpression};\n\n`;
                }
            }
            // Write the SQL script
            fs.writeFileSync('por-overview-queries.sql', sqlScript);
            console.log('- por-overview-queries.sql');
            console.log('\nThese files contain the SQL queries that should be added to the admin spreadsheet.');
        }
        catch (error) {
            console.error('Error updating admin spreadsheet:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the update
updateAdminSpreadsheet().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
