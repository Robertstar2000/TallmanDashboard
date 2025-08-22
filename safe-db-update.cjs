const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const odbc = require('odbc');

const P21_DSN = process.env.P21_DSN || 'p21';
const POR_DSN = process.env.POR_DSN || 'por';
const DB_PATH = 'c:/Users/BobM/Desktop/TallmanDashboard/data/dashboard.db';

console.log('--- Starting Database Update Script ---');

async function executeQuery(dsn, sql) {
    let connection;
    try {
        console.log(`[ODBC] Connecting to DSN: ${dsn}`);
        connection = await odbc.connect(`DSN=${dsn}`);
        console.log(`[ODBC] Connected. Executing SQL: ${sql}`);
        const result = await connection.query(sql);
        console.log(`[ODBC] Query returned ${result.length} rows.`);

        if (result && result.length > 0 && result[0].value !== null && result[0].value !== undefined) {
            const value = Number(result[0].value);
            if (isNaN(value)) {
                console.warn(`[ODBC] Warning: Query result is not a number. Returning 99999.`);
                return 99999;
            }
            console.log(`[ODBC] Success. Returning value: ${value}`);
            return value;
        }
        console.warn(`[ODBC] Warning: Query returned no valid result. Returning 99999.`);
        return 99999;
    } catch (error) {
        console.error(`[ODBC] FATAL ERROR executing query on ${dsn}. SQL: ${sql}`, error);
        return 99999;
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`[ODBC] Connection to ${dsn} closed.`);
            } catch (closeError) {
                console.error(`[ODBC] Error closing connection to ${dsn}:`, closeError);
            }
        }
    }
}

async function main() {
    // 1. Verify DB file exists
    console.log(`[SQLite] Checking for database file at: ${DB_PATH}`);
    if (!fs.existsSync(DB_PATH)) {
        console.error(`[SQLite] FATAL ERROR: Database file not found at ${DB_PATH}. Script cannot continue.`);
        return;
    }
    console.log('[SQLite] Database file found.');

    // 2. Connect to DB
    let db;
    try {
        db = new Database(DB_PATH);
        console.log('[SQLite] Successfully connected to database.');

        // 3. Initialize all values to 0
        console.log('[SQLite] Initializing all chart values to 0...');
        const initStmt = db.prepare('UPDATE chart_data SET value = 0');
        const initInfo = initStmt.run();
        console.log(`[SQLite] ${initInfo.changes} rows were initialized to 0.`);

        // 4. Fetch all chart data rows
        const rows = db.prepare('SELECT id, production_sql_expression, server_name FROM chart_data').all();
        console.log(`[Updater] Found ${rows.length} chart expressions to process.`);

        // 5. Iterate and update each row
        for (const [index, row] of rows.entries()) {
            console.log(`\n--- Processing row ${index + 1}/${rows.length} (ID: ${row.id}) ---`);
            if (!row.production_sql_expression || !row.production_sql_expression.trim()) {
                console.log(`[Updater] Skipping row ${row.id} due to empty SQL expression.`);
                continue;
            }

            let value = 99999;
            if (row.server_name === 'P21') {
                value = await executeQuery(P21_DSN, row.production_sql_expression);
            } else if (row.server_name === 'POR') {
                value = await executeQuery(POR_DSN, row.production_sql_expression);
            } else {
                console.log(`[Updater] Skipping row ${row.id} due to unknown server: ${row.server_name}`);
                continue;
            }

            db.prepare('UPDATE chart_data SET value = ? WHERE id = ?').run(value, row.id);
            console.log(`[Updater] Updated row ${row.id} with new value: ${value}`);
        }

        console.log('\n--- Update Process Completed ---');

        // 6. Verification Step
        console.log('\n--- Final Verification ---');
        const verifyRows = db.prepare('SELECT id, variable_name, value FROM chart_data LIMIT 20').all();
        console.log('Sample of updated data:');
        console.table(verifyRows);

    } catch (error) {
        console.error('[SQLite] A fatal error occurred during the database update process:', error);
    } finally {
        if (db) {
            db.close();
            console.log('[SQLite] Database connection closed.');
        }
        console.log('--- Script Finished ---');
    }
}

main();
