var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * MS Access connection class for POR database
 */
export class AccessConnection {
    constructor(config) {
        this.status = {
            isConnected: false,
            lastChecked: new Date(),
            details: {
                server: 'TS03',
                database: 'POR',
                fileAccessible: false
            }
        };
        this.connectionId = null;
        this.config = config;
        this.status.details = {
            server: 'TS03',
            database: 'POR',
            fileAccessible: false
        };
    }
    /**
     * Execute a query against the MS Access database
     */
    executeQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // We'll use ODBC to connect to Access database
                // This is a server-side operation that will be implemented in the API
                const response = yield fetch('/api/executeAccessQuery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath: this.config.filePath,
                        sql
                    }),
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    throw new Error(`Failed to execute query: ${errorText}`);
                }
                return yield response.json();
            }
            catch (error) {
                console.error('Error executing Access query:', error);
                throw error;
            }
        });
    }
    /**
     * Get the current connection status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Connect to the MS Access database
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = yield this.checkConnection();
                this.status = status;
                return status.isConnected;
            }
            catch (error) {
                console.error('Error connecting to Access database:', error);
                this.status.isConnected = false;
                this.status.error = error instanceof Error ? error.message : 'Unknown error';
                return false;
            }
        });
    }
    /**
     * Check the connection to the MS Access database
     */
    checkConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // We'll check if we can access the file
                const response = yield fetch('/api/testAccessConnection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath: this.config.filePath
                    }),
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    throw new Error(`Failed to test connection: ${errorText}`);
                }
                const result = yield response.json();
                this.status = {
                    isConnected: result.isConnected,
                    lastChecked: new Date(),
                    error: result.error,
                    details: {
                        server: 'TS03',
                        database: 'POR',
                        fileAccessible: result.isConnected
                    }
                };
                return this.status;
            }
            catch (error) {
                console.error('Error checking Access connection:', error);
                return {
                    isConnected: false,
                    lastChecked: new Date(),
                    error: error instanceof Error ? error.message : 'Unknown error',
                    details: {
                        server: 'TS03',
                        database: 'POR',
                        fileAccessible: false
                    }
                };
            }
        });
    }
    /**
     * Test the connection to the MS Access database
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.checkConnection();
        });
    }
}
