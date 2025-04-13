/**
 * Initialize Admin Database
 *
 * This script initializes the admin database with the necessary tables
 * for storing admin variables, including the POR Overview queries.
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
function initializeAdminDb() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Initializing Admin Database...');
        try {
            // Create the admin_variables table if it doesn't exist
            const createTableSql = `
      CREATE TABLE IF NOT EXISTS admin_variables (
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
            // Check if the table was created successfully
            const checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
            const tables = yield executeWrite(checkTableSql);
            if (Array.isArray(tables) && tables.length > 0) {
                console.log('Verified admin_variables table exists');
                // Check if there are any rows in the table
                const countSql = "SELECT COUNT(*) as count FROM admin_variables";
                const countResult = yield executeWrite(countSql);
                if (Array.isArray(countResult) && countResult.length > 0) {
                    const count = countResult[0].count;
                    console.log(`Found ${count} rows in admin_variables table`);
                }
            }
            else {
                console.error('Failed to create admin_variables table');
            }
            console.log('Admin database initialization complete');
        }
        catch (error) {
            console.error('Error initializing admin database:', error instanceof Error ? error.message : String(error));
        }
    });
}
// Run the initialization
initializeAdminDb().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
