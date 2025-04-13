/**
 * Script to update P21 SQL expressions in the complete-chart-data.ts file
 * This script will:
 * 1. Read the existing chart data from complete-chart-data.ts
 * 2. Group the entries by chart group
 * 3. For each chart group, use the existing connection functionality to verify tables and columns
 * 4. Update the SQL expressions with the correct tables and columns
 * 5. Write the updated data back to complete-chart-data.ts
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
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { ConnectionManager } from '../lib/db/connection-manager';
// Configuration
const filePath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts.bak');
const logPath = path.join(process.cwd(), 'scripts', 'p21-chart-data-update.log');
// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Promisify readline question
function question(query) {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}
// Function to execute a P21 query
function executeP21Query(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Configure the P21 connection
            const config = {
                server: process.env.P21_SERVER || 'localhost',
                database: process.env.P21_DATABASE || 'P21Play',
                username: process.env.P21_USERNAME,
                password: process.env.P21_PASSWORD,
                trustedConnection: !process.env.P21_USERNAME
            };
            // Execute the query
            const result = yield ConnectionManager.executeQuery(config, query);
            return result;
        }
        catch (error) {
            console.error('Error executing P21 query:', error);
            return null;
        }
    });
}
// Function to check if a table exists in P21
function testP21Table(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT TOP 1 * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`;
        const result = yield executeP21Query(query);
        return result && result.length > 0;
    });
}
// Function to get columns for a P21 table
function getP21TableColumns(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`;
        const result = yield executeP21Query(query);
        if (result && result.length > 0) {
            return result.map((row) => row.COLUMN_NAME);
        }
        return [];
    });
}
// Function to extract table name from SQL expression
function extractTableName(sqlExpression) {
    // Regular expression to match the table name after FROM
    const fromMatch = sqlExpression.match(/FROM\s+(\w+\.\w+)/i);
    if (fromMatch && fromMatch[1]) {
        return fromMatch[1];
    }
    return null;
}
// Function to extract column names from SQL expression
function extractColumnNames(sqlExpression) {
    const columns = [];
    // Extract columns from SELECT clause
    const selectMatch = sqlExpression.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch && selectMatch[1]) {
        const selectClause = selectMatch[1];
        // Handle COUNT(*), SUM(), etc.
        const aggregateFunctions = selectClause.match(/(\w+)\s*\(\s*(.+?)\s*\)/gi);
        if (aggregateFunctions) {
            aggregateFunctions.forEach(func => {
                const columnMatch = func.match(/\(\s*(.+?)\s*\)/i);
                if (columnMatch && columnMatch[1] && columnMatch[1] !== '*') {
                    columns.push(columnMatch[1]);
                }
            });
        }
    }
    // Extract columns from WHERE clause
    const whereMatch = sqlExpression.match(/WHERE\s+(.+?)(\s+GROUP BY|\s+ORDER BY|$)/i);
    if (whereMatch && whereMatch[1]) {
        const whereClause = whereMatch[1];
        // Extract column names from conditions
        const conditions = whereClause.split(/\s+AND\s+|\s+OR\s+/i);
        conditions.forEach(condition => {
            const columnMatch = condition.match(/(\w+)\s*[=<>!]/i);
            if (columnMatch && columnMatch[1]) {
                columns.push(columnMatch[1]);
            }
        });
    }
    return [...new Set(columns)]; // Remove duplicates
}
// Main function to update P21 chart expressions
function updateP21ChartExpressions() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Starting P21 chart data update at ${new Date().toISOString()}`);
        // Create a backup of the original file
        fs.copyFileSync(filePath, backupPath);
        console.log(`Created backup at ${backupPath}`);
        // Read the file content
        const content = fs.readFileSync(filePath, 'utf8');
        // Extract the data array
        const startMarker = "export const initialSpreadsheetData: SpreadsheetRow[] = [";
        const endMarker = "];";
        const startIndex = content.indexOf(startMarker);
        const endIndex = content.indexOf(endMarker, startIndex);
        if (startIndex === -1 || endIndex === -1) {
            console.error("Could not find the spreadsheet data in the file");
            return;
        }
        // Extract the JSON array text
        const jsonArrayText = content.substring(startIndex + startMarker.length, endIndex);
        // Convert to valid JSON
        let jsonText = `[${jsonArrayText}]`;
        // Replace JavaScript-style trailing commas
        jsonText = jsonText.replace(/,\s*]/g, ']');
        jsonText = jsonText.replace(/,\s*}/g, '}');
        // Parse the JSON
        let data;
        try {
            // Use eval instead of JSON.parse to handle JavaScript object format
            data = eval(jsonText);
            console.log(`Successfully parsed data with ${data.length} entries`);
        }
        catch (error) {
            console.error("Failed to parse data:", error);
            return;
        }
        // Group the data by chart group
        const chartGroups = new Map();
        data.forEach(entry => {
            const group = entry.chartGroup || 'Unknown';
            if (!chartGroups.has(group)) {
                chartGroups.set(group, []);
            }
            chartGroups.get(group).push(entry);
        });
        console.log(`Found ${chartGroups.size} chart groups`);
        // Process each chart group
        for (const [chartGroup, entries] of chartGroups.entries()) {
            console.log(`Processing chart group: ${chartGroup} with ${entries.length} entries`);
            // Only process P21 entries (IDs 1-126)
            const p21Entries = entries.filter(entry => parseInt(entry.id) <= 126);
            if (p21Entries.length === 0) {
                console.log(`No P21 entries found in chart group: ${chartGroup}`);
                continue;
            }
            console.log(`Found ${p21Entries.length} P21 entries in chart group: ${chartGroup}`);
            // Prompt the user to continue with this chart group
            const continue_ = yield question(`Process chart group '${chartGroup}'? (Y/N): `);
            if (continue_.toUpperCase() !== 'Y') {
                console.log(`Skipping chart group: ${chartGroup}`);
                continue;
            }
            // For each entry in the chart group, check the table and update the SQL expression if needed
            for (const entry of p21Entries) {
                console.log(`Processing entry ID: ${entry.id} - ${entry.DataPoint}`);
                // Extract the table name from the current SQL expression
                const currentTable = extractTableName(entry.sqlExpression);
                if (currentTable) {
                    console.log(`Current table: ${currentTable}`);
                    // Extract the table name without schema
                    const tableName = currentTable.split('.')[1];
                    // Check if the table exists
                    const tableExists = yield testP21Table(tableName);
                    if (tableExists) {
                        console.log(`Table ${tableName} exists in P21`);
                        // Get the columns for the table
                        const columns = yield getP21TableColumns(tableName);
                        console.log(`Columns for table ${tableName}: ${columns.join(', ')}`);
                        // Extract column names from the SQL expression
                        const sqlColumns = extractColumnNames(entry.sqlExpression);
                        console.log(`Columns used in SQL: ${sqlColumns.join(', ')}`);
                        // Check if all columns exist
                        const missingColumns = sqlColumns.filter(col => !columns.includes(col));
                        if (missingColumns.length > 0) {
                            console.log(`Missing columns: ${missingColumns.join(', ')}`);
                            // Prompt the user for each missing column
                            for (const missingCol of missingColumns) {
                                const newColumn = yield question(`Enter a replacement column for '${missingCol}' (or press Enter to skip): `);
                                if (newColumn && newColumn !== missingCol) {
                                    // Update the SQL expression with the new column name
                                    entry.sqlExpression = entry.sqlExpression.replace(new RegExp(`\\b${missingCol}\\b`, 'g'), newColumn);
                                    console.log(`Updated SQL expression with new column: ${newColumn}`);
                                }
                            }
                        }
                        else {
                            console.log(`All columns exist in the table`);
                        }
                    }
                    else {
                        console.log(`Table ${tableName} does not exist in P21`);
                        // Prompt the user for a new table name
                        const newTableName = yield question(`Enter a new table name for entry ID ${entry.id} (or press Enter to skip): `);
                        if (newTableName) {
                            // Update the SQL expression with the new table name
                            entry.sqlExpression = entry.sqlExpression.replace(currentTable, `dbo.${newTableName}`);
                            console.log(`Updated SQL expression for entry ID ${entry.id} with new table: dbo.${newTableName}`);
                        }
                    }
                }
                else {
                    console.log(`Could not extract table name from SQL expression for entry ID ${entry.id}`);
                }
            }
        }
        // Convert the data back to a string in the original format
        let updatedJsonText = JSON.stringify(data, null, 2);
        // Format the JSON to match the original file format
        updatedJsonText = updatedJsonText
            .replace(/"([^"]+)":/g, '$1:') // Remove quotes around property names
            .replace(/"/g, "'") // Replace double quotes with single quotes
            .replace(/\[/g, '[') // Format arrays
            .replace(/\]/g, ']')
            .replace(/\{/g, '{') // Format objects
            .replace(/\}/g, '}')
            .replace(/,\n\s*/g, ',\n  '); // Format commas
        // Remove the outer brackets
        updatedJsonText = updatedJsonText.substring(1, updatedJsonText.length - 1);
        // Update the file with the new data
        const updatedContent = content.substring(0, startIndex + startMarker.length) +
            updatedJsonText +
            content.substring(endIndex);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated ${filePath} with new SQL expressions`);
        console.log(`P21 chart data update completed at ${new Date().toISOString()}`);
        // Close the readline interface
        rl.close();
    });
}
// Run the main function
updateP21ChartExpressions().catch(error => {
    console.error('Error updating P21 chart expressions:', error);
    rl.close();
});
