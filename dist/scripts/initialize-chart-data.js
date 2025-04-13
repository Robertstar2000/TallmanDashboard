/**
 * Initialize Chart Data
 *
 * This script initializes the chart_data table with data from the initialSpreadsheetData array.
 * It ensures that the database has all 174 rows of data with the correct schema.
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
import { dashboardData as initialSpreadsheetData } from '../lib/db/single-source-data';
function initializeChartData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting chart_data initialization...');
            console.log(`Found ${initialSpreadsheetData.length} rows of data to initialize`);
            // Path to the SQLite database
            const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
            console.log(`Using database at: ${dbPath}`);
            // Open database connection
            const db = yield open({
                filename: dbPath,
                driver: sqlite3.Database
            });
            // Check if chart_data table exists
            const tableExists = yield db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_data'
    `);
            if (tableExists) {
                console.log('chart_data table exists, dropping it to recreate with correct schema...');
                yield db.exec('DROP TABLE IF EXISTS chart_data');
            }
            console.log('Creating chart_data table with the correct schema...');
            // Create the table with the correct schema
            // Include rowid as an alias for the primary key
            yield db.exec(`
      CREATE TABLE chart_data (
        id TEXT PRIMARY KEY,
        DataPoint TEXT,
        chart_group TEXT,
        chart_name TEXT,
        variable_name TEXT,
        server_name TEXT,
        table_name TEXT,
        calculation TEXT,
        sql_expression TEXT,
        value TEXT,
        last_updated TEXT,
        transformer TEXT,
        timeframe TEXT
      )
    `);
            console.log('Successfully created chart_data table with the correct schema.');
            // Insert data from initialSpreadsheetData
            console.log('Inserting data into chart_data table...');
            // Prepare the SQL statement
            const stmt = yield db.prepare(`
      INSERT INTO chart_data (
        id,
        DataPoint,
        chart_group,
        chart_name,
        variable_name,
        server_name,
        table_name,
        calculation,
        sql_expression,
        value,
        last_updated,
        transformer,
        timeframe
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
            // Insert each row
            let insertedCount = 0;
            for (const row of initialSpreadsheetData) {
                try {
                    yield stmt.run(row.id, row.DataPoint || '', row.chartGroup || '', row.chartName || '', row.variableName || '', row.serverName || '', row.tableName || '', row.calculation || '', row.sqlExpression || '', row.value || '0', row.lastUpdated || new Date().toISOString(), row.transformer || null, row.timeframe || null);
                    insertedCount++;
                }
                catch (error) {
                    console.error(`Error inserting row with ID ${row.id}:`, error instanceof Error ? error.message : String(error));
                }
            }
            // Finalize the statement
            yield stmt.finalize();
            console.log(`Successfully inserted ${insertedCount} rows into chart_data table.`);
            // Verify the data was inserted
            const count = yield db.get('SELECT COUNT(*) as count FROM chart_data');
            console.log(`Total rows in chart_data table: ${count.count}`);
            // Close the database connection
            yield db.close();
            console.log('Database connection closed.');
            console.log('Chart data initialization completed successfully.');
        }
        catch (error) {
            console.error('Error initializing chart data:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the script
initializeChartData().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
