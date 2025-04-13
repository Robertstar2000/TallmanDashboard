/**
 * Update Chart Data Schema
 *
 * This script updates the chart_data table schema to match the required structure:
 * - id: Unique identifier for the data point
 * - DataPoint: Descriptive field describing one data point
 * - chart_group: Category the data belongs to
 * - variable_name: Specific metric being measured
 * - server_name: Data source (P21 or POR)
 * - table_name: Reference to database schema tables
 * - sql_expression: Query to execute in production environment
 * - value: Current value of the metric
 * - last_updated: Timestamp of last update
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
function updateChartDataSchema() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting chart_data schema update...');
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
            if (!tableExists) {
                console.log('chart_data table does not exist, creating it...');
                // Create the table with the correct schema
                yield db.exec(`
        CREATE TABLE chart_data (
          id TEXT PRIMARY KEY,
          DataPoint TEXT,
          chart_group TEXT,
          variable_name TEXT,
          server_name TEXT,
          table_name TEXT,
          sql_expression TEXT,
          value TEXT,
          last_updated TEXT
        )
      `);
                console.log('Successfully created chart_data table with the correct schema.');
            }
            else {
                console.log('chart_data table exists, checking schema...');
                // Get current schema
                const columns = yield db.all(`PRAGMA table_info(chart_data)`);
                console.log('Current chart_data schema:');
                columns.forEach(col => console.log(`- ${col.name} (${col.type})`));
                // Define the correct schema
                const correctSchema = [
                    { name: 'id', type: 'TEXT' },
                    { name: 'DataPoint', type: 'TEXT' },
                    { name: 'chart_group', type: 'TEXT' },
                    { name: 'variable_name', type: 'TEXT' },
                    { name: 'server_name', type: 'TEXT' },
                    { name: 'table_name', type: 'TEXT' },
                    { name: 'sql_expression', type: 'TEXT' },
                    { name: 'value', type: 'TEXT' },
                    { name: 'last_updated', type: 'TEXT' }
                ];
                // Check if we need to update the schema
                const needsUpdate = columns.some(col => {
                    // Check if column name is 'serverName' instead of 'server_name'
                    if (col.name === 'serverName')
                        return true;
                    // Check if column name is 'db_table_name' instead of 'table_name'
                    if (col.name === 'db_table_name')
                        return true;
                    return false;
                });
                // Check for missing columns
                const missingColumns = correctSchema.filter(correctCol => !columns.some(col => col.name === correctCol.name));
                if (needsUpdate || missingColumns.length > 0) {
                    console.log('Schema needs updating. Creating new table with correct schema...');
                    // Create a mapping of old column names to new column names
                    const columnMap = {
                        'id': 'id',
                        'DataPoint': 'DataPoint',
                        'chart_group': 'chart_group',
                        'variable_name': 'variable_name',
                        'serverName': 'server_name',
                        'db_table_name': 'table_name',
                        'sql_expression': 'sql_expression', // Map sql_expression to sql_expression
                        'sql_expression': 'sql_expression',
                        'value': 'value',
                        'last_updated': 'last_updated',
                        'transformer': 'transformer' // Keep any additional columns
                    };
                    // Build the column mapping for the SELECT statement
                    const selectColumns = columns.map(col => {
                        const newName = columnMap[col.name];
                        if (newName && newName !== col.name) {
                            return `${col.name} AS ${newName}`;
                        }
                        return col.name;
                    }).join(', ');
                    // Create a new table with the correct schema
                    yield db.exec(`
          BEGIN TRANSACTION;
          
          -- Create a new table with the correct schema
          CREATE TABLE chart_data_new (
            id TEXT PRIMARY KEY,
            DataPoint TEXT,
            chart_group TEXT,
            variable_name TEXT,
            server_name TEXT,
            table_name TEXT,
            sql_expression TEXT,
            value TEXT,
            last_updated TEXT,
            transformer TEXT
          );
          
          -- Copy data from the old table with column mapping
          INSERT INTO chart_data_new (
            id, 
            DataPoint,
            chart_group,
            variable_name,
            server_name,
            table_name,
            sql_expression,
            value,
            last_updated,
            transformer
          )
          SELECT 
            id,
            DataPoint,
            chart_group,
            variable_name,
            ${columns.some(col => col.name === 'serverName') ? 'serverName' : 'NULL'} AS server_name,
            ${columns.some(col => col.name === 'db_table_name') ? 'db_table_name' : 'NULL'} AS table_name,
            ${columns.some(col => col.name === 'sql_expression') ? 'sql_expression' :
                        columns.some(col => col.name === 'sql_expression') ? 'sql_expression' : 'NULL'} AS sql_expression,
            value,
            last_updated,
            ${columns.some(col => col.name === 'transformer') ? 'transformer' : 'NULL'} AS transformer
          FROM chart_data;
          
          -- Drop the old table
          DROP TABLE chart_data;
          
          -- Rename the new table
          ALTER TABLE chart_data_new RENAME TO chart_data;
          
          COMMIT;
        `);
                    console.log('Successfully updated chart_data schema.');
                }
                else {
                    console.log('Schema is already correct, no update needed.');
                }
                // Add any missing columns
                for (const missingCol of missingColumns) {
                    console.log(`Adding missing column ${missingCol.name}...`);
                    yield db.exec(`ALTER TABLE chart_data ADD COLUMN ${missingCol.name} ${missingCol.type};`);
                    console.log(`Successfully added column ${missingCol.name}.`);
                }
            }
            // Check the updated schema
            const updatedColumns = yield db.all(`PRAGMA table_info(chart_data)`);
            console.log('Updated chart_data schema:');
            updatedColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
            // Close the database connection
            yield db.close();
            console.log('Database connection closed.');
            console.log('Schema update completed successfully.');
        }
        catch (error) {
            console.error('Error updating chart_data schema:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the script
updateChartDataSchema().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
