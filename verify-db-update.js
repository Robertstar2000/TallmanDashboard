const Database = require('better-sqlite3');
const DB_PATH = 'c:/Users/BobM/Desktop/TallmanDashboard/data/dashboard.db';

function verifyUpdate() {
    let db;
    try {
        db = new Database(DB_PATH, { readonly: true });
        console.log('Connected to SQLite database for verification.');

        const stmt = db.prepare('SELECT id, variable_name, value FROM chart_data LIMIT 20');
        const rows = stmt.all();

        if (rows.length === 0) {
            console.log('Verification failed: chart_data table is empty.');
            return;
        }

        console.log('--- Verification Results ---');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Variable: ${row.variable_name}, Value: ${row.value}`);
        });
        console.log('--------------------------');

        const nonZero = rows.filter(r => r.value !== 0).length;
        const areAllZeros = rows.every(r => r.value === 0);

        if (areAllZeros) {
            console.log('Verification result: All checked values are still 0. The update script may not have run correctly.');
        } else if (nonZero > 0) {
            console.log('Verification result: It appears the database has been updated with new non-zero values.');
        } else {
            console.log('Verification result: All checked values are 0. The script may be pending data or failed to fetch updates.');
        }

    } catch (error) {
        console.error('An error occurred during verification:', error.message);
    } finally {
        if (db) {
            db.close();
            console.log('SQLite verification connection closed.');
        }
    }
}

verifyUpdate();
