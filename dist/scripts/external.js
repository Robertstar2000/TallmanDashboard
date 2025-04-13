// This file is deprecated. All database functionality has been moved to server.ts
// Please use server.ts for all database operations
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import BetterSQLite3 from 'better-sqlite3';
import path from 'path';
let p21Pool = null;
let porPool = null;
function getConnectionConfig(serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // In this version, we'll use local SQLite databases for both P21 and POR
            const dbName = serverType === 'P21' ? 'p21_test.db' : 'por_test.db';
            return {
                dbPath: path.join(process.cwd(), 'data', dbName)
            };
        }
        catch (error) {
            console.error(`Error getting ${serverType} config:`, error);
            return null;
        }
    });
}
export function executeP21Query(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // In test mode or if no connection config, return mock data
            const config = yield getConnectionConfig('P21');
            if (!config) {
                // Generate realistic mock data based on query type
                if (query.toLowerCase().includes('count(*)')) {
                    return { value: Math.floor(Math.random() * 1000) };
                }
                else if (query.toLowerCase().includes('sum(')) {
                    return { value: Math.floor(Math.random() * 1000000) };
                }
                else if (query.toLowerCase().includes('avg(')) {
                    return { value: Math.floor(Math.random() * 1000) };
                }
                else {
                    return { value: Math.floor(Math.random() * 100) };
                }
            }
            if (!p21Pool) {
                yield connectToP21();
            }
            if (!p21Pool) {
                throw new Error('Could not establish P21 connection');
            }
            const result = p21Pool.prepare(query).all();
            const value = result.length > 0 ? result[0] : null;
            return { value: value };
        }
        catch (error) {
            console.error('Error executing P21 query:', error);
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
}
export function executePORQuery(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // In test mode or if no connection config, return mock data
            const config = yield getConnectionConfig('POR');
            if (!config) {
                // Generate realistic mock data based on query type
                if (query.toLowerCase().includes('count(*)')) {
                    return { value: Math.floor(Math.random() * 1000) };
                }
                else if (query.toLowerCase().includes('sum(')) {
                    return { value: Math.floor(Math.random() * 1000000) };
                }
                else if (query.toLowerCase().includes('avg(')) {
                    return { value: Math.floor(Math.random() * 1000) };
                }
                else {
                    return { value: Math.floor(Math.random() * 100) };
                }
            }
            if (!porPool) {
                yield connectToPOR();
            }
            if (!porPool) {
                throw new Error('Could not establish POR connection');
            }
            const result = porPool.prepare(query).all();
            const value = result.length > 0 ? result[0] : null;
            return { value: value };
        }
        catch (error) {
            console.error('Error executing POR query:', error);
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
}
export function connectToP21() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = yield getConnectionConfig('P21');
            if (!config) {
                console.warn('No P21 connection config found, using test mode');
                return false;
            }
            if (p21Pool) {
                return true;
            }
            p21Pool = new BetterSQLite3(config.dbPath);
            return true;
        }
        catch (error) {
            console.error('Error connecting to P21:', error);
            return false;
        }
    });
}
export function connectToPOR() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = yield getConnectionConfig('POR');
            if (!config) {
                console.warn('No POR connection config found, using test mode');
                return false;
            }
            if (porPool) {
                return true;
            }
            porPool = new BetterSQLite3(config.dbPath);
            return true;
        }
        catch (error) {
            console.error('Error connecting to POR:', error);
            return false;
        }
    });
}
export function closeConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (p21Pool) {
                p21Pool.close();
            }
            if (porPool) {
                porPool.close();
            }
        }
        catch (error) {
            console.error('Error closing connections:', error);
        }
    });
}
export function checkConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            p21Connected: !!p21Pool,
            porConnected: !!porPool
        };
    });
}
