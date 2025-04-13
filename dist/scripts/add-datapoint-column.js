/**
 * Add DataPoint Column to Chart Data Table
 *
 * This script adds a DataPoint column to the chart data table
 * in the SQLite database.
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
import * as path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
function addDataPointColumn() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('Starting database schema update...');
            // Path to the SQLite database
            const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
            console.log(`Using database at: ${dbPath}`);
            // Open database connection
            const db = yield open({
                filename: dbPath,
                driver: sqlite3.Database
            });
            // List all tables in the database
            console.log('Listing all tables in the database:');
            const tables = yield db.all(`SELECT name FROM sqlite_master WHERE type='table';`);
            tables.forEach(table => {
                console.log(`- ${table.name}`);
            });
            // Determine the chart data table name (likely chart_data based on previous code)
            const chartDataTable = (_a = tables.find(table => table.name.toLowerCase().includes('chart') ||
                table.name.toLowerCase().includes('admin') ||
                table.name.toLowerCase().includes('variables'))) === null || _a === void 0 ? void 0 : _a.name;
            if (!chartDataTable) {
                console.error('Could not find chart data table in the database');
                yield db.close();
                return;
            }
            console.log(`Found chart data table: ${chartDataTable}`);
            // Check the schema of the identified table
            console.log(`Schema for ${chartDataTable}:`);
            const tableInfo = yield db.all(`PRAGMA table_info(${chartDataTable})`);
            tableInfo.forEach(column => {
                console.log(`- ${column.name} (${column.type})`);
            });
            // Check if the DataPoint column already exists
            const dataPointExists = tableInfo.some(column => column.name === 'DataPoint');
            if (dataPointExists) {
                console.log('DataPoint column already exists in the table.');
            }
            else {
                // Add the DataPoint column
                yield db.exec(`ALTER TABLE ${chartDataTable} ADD COLUMN DataPoint TEXT;`);
                console.log(`Successfully added DataPoint column to ${chartDataTable} table.`);
            }
            // Close the database connection
            yield db.close();
            console.log('Database connection closed.');
        }
        catch (error) {
            console.error('Error updating database schema:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the script
addDataPointColumn().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
