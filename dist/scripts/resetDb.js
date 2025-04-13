var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Database from 'better-sqlite3';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { singleSourceData } from '../lib/db/single-source-data';
// Define __dirname for ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const dbPath = path.resolve(__dirname, '..', 'data', 'dashboard.db');
        console.log(`Attempting to connect to database at: ${dbPath}`);
        const db = new Database(dbPath, { verbose: console.log });
        try {
            console.log('Dropping chart_data table if it exists...');
            db.exec('DROP TABLE IF EXISTS chart_data');
            console.log('Table dropped (if existed).');
            console.log('Creating chart_data table with new schema...');
            db.exec(`
        CREATE TABLE chart_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rowId TEXT UNIQUE NOT NULL,
            chartGroup TEXT,
            variableName TEXT,
            DataPoint TEXT,
            serverName TEXT,
            tableName TEXT,
            productionSqlExpression TEXT,
            value REAL DEFAULT 0,
            lastUpdated TEXT,
            calculationType TEXT,
            chartName TEXT,
            axisStep TEXT
        )`);
            console.log('Ensured chart_data table exists with correct schema.');
            console.log('Preparing insert statement...');
            const insert = db.prepare(`
            INSERT INTO chart_data (
                rowId, chartGroup, variableName, DataPoint, serverName, tableName,
                productionSqlExpression, value, lastUpdated, calculationType, chartName, axisStep
            ) VALUES (
                @rowId, @chartGroup, @variableName, @DataPoint, @serverName, @tableName,
                @productionSqlExpression, @value, @lastUpdated, @calculationType, @chartName, @axisStep
            )
        `);
            console.log('Insert statement prepared.');
            console.log(`Processing ${singleSourceData.length} items for insertion...`);
            const insertMany = db.transaction((data) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                for (const item of data) {
                    console.log(`Attempting to insert item with rowId: ${item.rowId}`);
                    const params = {
                        rowId: item.rowId,
                        chartGroup: (_a = item.chartGroup) !== null && _a !== void 0 ? _a : null,
                        variableName: (_b = item.variableName) !== null && _b !== void 0 ? _b : null,
                        DataPoint: (_c = item.DataPoint) !== null && _c !== void 0 ? _c : null,
                        serverName: (_d = item.serverName) !== null && _d !== void 0 ? _d : null,
                        tableName: (_e = item.tableName) !== null && _e !== void 0 ? _e : null,
                        productionSqlExpression: (_f = item.productionSqlExpression) !== null && _f !== void 0 ? _f : null,
                        value: 0,
                        lastUpdated: new Date().toISOString(),
                        calculationType: (_g = item.calculationType) !== null && _g !== void 0 ? _g : null,
                        chartName: (_h = item.chartName) !== null && _h !== void 0 ? _h : null,
                        axisStep: (_j = item.axisStep) !== null && _j !== void 0 ? _j : null,
                    };
                    try {
                        insert.run(params);
                    }
                    catch (innerErr) {
                        console.error(`Error inserting item with rowId: ${item.rowId}`, innerErr);
                        throw innerErr;
                    }
                }
            });
            console.log('Starting database transaction...');
            insertMany(singleSourceData);
            console.log('Transaction completed successfully. Data inserted.');
        }
        catch (err) {
            console.error('Error during database reset:', err);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            process.exitCode = 1;
        }
        finally {
            console.log('Closing database connection.');
            db.close();
            console.log('Database connection closed.');
        }
    });
}
main().catch(err => {
    console.error("Unhandled error in main execution:", err);
    process.exitCode = 1;
});
