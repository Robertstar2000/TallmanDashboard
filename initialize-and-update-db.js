const Database = require('better-sqlite3');
const odbc = require('odbc');

const P21_DSN = process.env.P21_DSN || 'p21';
const POR_DSN = process.env.POR_DSN || 'por';

const DB_PATH = 'c:/Users/BobM/Desktop/TallmanDashboard/data/dashboard.db';

async function executeQuery(dsn, sql) {
    let connection;
    try {
        console.log(`Connecting to ${dsn}...`);
        connection = await odbc.connect(`DSN=${dsn}`);
        console.log(`Executing query on ${dsn}: ${sql}`);
        const result = await connection.query(sql);
        console.log(`Query result:`, result);

        if (result && result.length > 0 && result[0].value !== null) {
            const value = Number(result[0].value);
            return isNaN(value) ? 0 : value;
        }
        return 0;
    } catch (error) {
        console.error(`Error executing query on ${dsn}:`, error);
        return 0;
    } finally {
        if (connection) {
            await connection.close();
            console.log(`Connection to ${dsn} closed.`);
        }
    }
}

async function main() {
    const db = new Database(DB_PATH);
    console.log('Connected to SQLite database.');

    try {
        // Step 1: Initialize all values to 0
        console.log('Initializing all chart data values to 0...');
        const initStmt = db.prepare('UPDATE chart_data SET value = 0');
        const initInfo = initStmt.run();
        console.log(`${initInfo.changes} rows initialized to 0.`);

        // Step 2: Fetch all chart data rows
        const rows = db.prepare('SELECT id, production_sql_expression, server_name FROM chart_data').all();
        console.log(`Found ${rows.length} charts to update.`);

        // Step 3: Iterate and update each row
        for (const row of rows) {
            if (!row.production_sql_expression) {
                console.log(`Skipping row ${row.id} due to empty SQL expression.`);
                continue;
            }

            let value = 0;
            if (row.server_name === 'P21') {
                value = await executeQuery(P21_DSN, row.production_sql_expression);
            } else if (row.server_name === 'POR') {
                // POR connection logic might differ, assuming DSN for now
                value = await executeQuery(POR_DSN, row.production_sql_expression);
            } else {
                console.log(`Skipping row ${row.id} due to unknown server: ${row.server_name}`);
                continue;
            }

            const updateStmt = db.prepare('UPDATE chart_data SET value = ? WHERE id = ?');
            updateStmt.run(value, row.id);
            console.log(`Updated row ${row.id} with value: ${value}`);
        }

        console.log('Database update process completed.');

    } catch (error) {
        console.error('An error occurred during the database update process:', error);
    } finally {
        db.close();
        console.log('SQLite database connection closed.');
    }
}

main();
