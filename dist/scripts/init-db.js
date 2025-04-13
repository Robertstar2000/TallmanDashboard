var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initializeDatabaseTables, getDb } from '../lib/db/sqlite';
import * as fs from 'fs';
import * as path from 'path';
// Initialize the database with test data
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Initializing database...');
        try {
            // Force delete the existing database file
            const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
            if (fs.existsSync(dbPath)) {
                console.log(`Removing existing database at ${dbPath}`);
                fs.unlinkSync(dbPath);
                console.log('Database file removed successfully');
            }
            // Make sure the data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                console.log(`Creating data directory at ${dataDir}`);
                fs.mkdirSync(dataDir, { recursive: true });
            }
            const db = yield getDb();
            yield initializeDatabaseTables(db);
            console.log('Database initialized successfully');
        }
        catch (error) {
            console.error('Error initializing database:', error);
            process.exit(1);
        }
    });
}
main();
