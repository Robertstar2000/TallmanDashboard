var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import fs from 'fs';
import { getDb, initializeDatabaseTables } from './sqlite';
import { checkAllConnections } from './connections';
import { initializeTestData } from './initialize-test-data';
// Ensure data directory exists
function ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`Created data directory at ${dataDir}`);
        }
        catch (error) {
            console.error(`Failed to create data directory: ${error}`);
            throw error;
        }
    }
    console.log(`Data directory exists at ${dataDir}`);
    return dataDir;
}
// Initialize all database connections
export function initializeDatabases() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting database initialization...');
        try {
            // 1. Ensure data directory exists
            const dataDir = ensureDataDirectory();
            // 2. Initialize SQLite database
            console.log('Initializing SQLite database...');
            const sqliteDb = yield getDb();
            // 3. Initialize database tables
            console.log('Initializing database tables...');
            try {
                yield initializeDatabaseTables(sqliteDb);
                console.log('Database tables initialized successfully');
            }
            catch (tableError) {
                console.error('Error initializing database tables:', tableError);
                return {
                    success: false,
                    message: `Failed to initialize database tables: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`
                };
            }
            // 4. Initialize test data mappings
            console.log('Initializing test data mappings...');
            try {
                yield initializeTestData();
                console.log('Test data mappings initialized successfully');
            }
            catch (testDataError) {
                console.error('Error initializing test data mappings:', testDataError);
                // Continue even if test data initialization fails
            }
            // 5. Check and initialize P21 and POR connections
            console.log('Checking P21 and POR connections...');
            try {
                const { p21Status, porStatus } = yield checkAllConnections();
                console.log('P21 connection status:', p21Status.isConnected ? 'Connected' : 'Not connected');
                console.log('POR connection status:', porStatus.isConnected ? 'Connected' : 'Not connected');
                if (!p21Status.isConnected && p21Status.error) {
                    console.warn('P21 connection error:', p21Status.error);
                }
                if (!porStatus.isConnected && porStatus.error) {
                    console.warn('POR connection error:', porStatus.error);
                }
            }
            catch (connError) {
                console.error('Error checking external database connections:', connError);
                // Continue even if external connections fail
            }
            console.log('Database initialization complete');
            return {
                success: true,
                message: 'Database initialization completed successfully'
            };
        }
        catch (error) {
            console.error('Database initialization failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error during database initialization',
                error
            };
        }
    });
}
// Function to check all database connections
export function checkDatabaseConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking SQLite database connection...');
            const db = yield getDb();
            console.log('SQLite database connection successful');
            // Check P21 and POR
            const { p21Status, porStatus } = yield checkAllConnections();
            return {
                sqlite: { connected: true },
                p21: {
                    connected: p21Status.isConnected,
                    error: p21Status.error
                },
                por: {
                    connected: porStatus.isConnected,
                    error: porStatus.error
                }
            };
        }
        catch (error) {
            console.error('Error checking database connections:', error);
            return {
                sqlite: {
                    connected: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                p21: { connected: false, error: 'SQLite connection failed' },
                por: { connected: false, error: 'SQLite connection failed' }
            };
        }
    });
}
