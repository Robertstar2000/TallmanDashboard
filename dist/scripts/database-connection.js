'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from 'react';
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
export class DatabaseManager {
    constructor() {
        this.p21Pool = null;
        this.porPool = null;
        this.connectionState = {
            isConnected: false,
            p21Connected: false,
            porConnected: false
        };
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    connect(connections) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (connections.p21) {
                    // Connect to P21
                    this.p21Pool = connections.p21;
                    this.connectionState.p21Connected = true;
                }
                if (connections.por) {
                    // Connect to POR
                    this.porPool = connections.por;
                    this.connectionState.porConnected = true;
                }
                // Overall connection state is true if either database is connected
                this.connectionState.isConnected = !!this.connectionState.p21Connected || !!this.connectionState.porConnected;
                return Object.assign({}, this.connectionState);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown database connection error';
                this.connectionState = {
                    isConnected: false,
                    p21Connected: false,
                    porConnected: false,
                    lastError: errorMessage
                };
                throw new DatabaseError(errorMessage);
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            // Clean up connections
            this.p21Pool = null;
            this.porPool = null;
            this.connectionState = {
                isConnected: false,
                p21Connected: false,
                porConnected: false
            };
        });
    }
    executeQuery(sqlExpression, dictionary) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if we have the required connection for this dictionary
            const isP21Dictionary = dictionary.toLowerCase().includes('p21');
            const isPORDictionary = dictionary.toLowerCase().includes('por');
            if (isP21Dictionary && !this.connectionState.p21Connected) {
                throw new DatabaseError('P21 database not connected');
            }
            if (isPORDictionary && !this.connectionState.porConnected) {
                throw new DatabaseError('POR database not connected');
            }
            try {
                // In real implementation, you would:
                // 1. Use the appropriate connection pool based on the dictionary
                // 2. Execute the query on that database
                // 3. Return the result
                // Mock implementation for demonstration
                return Math.floor(Math.random() * 1000).toString();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown query execution error';
                throw new DatabaseError(errorMessage);
            }
        });
    }
    getConnectionState() {
        return Object.assign({}, this.connectionState);
    }
}
export function useDatabase() {
    const [connectionState, setConnectionState] = useState({
        isConnected: false,
        p21Connected: false,
        porConnected: false
    });
    const connect = (connections) => __awaiter(this, void 0, void 0, function* () {
        try {
            const dbManager = DatabaseManager.getInstance();
            const newState = yield dbManager.connect(connections);
            setConnectionState(newState);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
            setConnectionState({
                isConnected: false,
                p21Connected: false,
                porConnected: false,
                lastError: errorMessage
            });
            throw new DatabaseError(errorMessage);
        }
    });
    const disconnect = () => __awaiter(this, void 0, void 0, function* () {
        const dbManager = DatabaseManager.getInstance();
        yield dbManager.disconnect();
        setConnectionState({
            isConnected: false,
            p21Connected: false,
            porConnected: false
        });
    });
    const executeQueries = (adminData) => __awaiter(this, void 0, void 0, function* () {
        const dbManager = DatabaseManager.getInstance();
        if (!connectionState.isConnected) {
            throw new DatabaseError('Database not connected');
        }
        return Promise.all(adminData.map((item) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!item.sqlExpression) {
                    return Object.assign(Object.assign({}, item), { extractedValue: 'No SQL expression', updateTime: new Date().toISOString(), connectionState: dbManager.getConnectionState() });
                }
                const sqlExpressions = item.sqlExpression.split('-- Second Query ------------------------------------------');
                const primaryValue = yield dbManager.executeQuery(sqlExpressions[0].trim(), item.tableName || '');
                if (sqlExpressions.length > 1 && sqlExpressions[1].trim()) {
                    const secondaryValue = yield dbManager.executeQuery(sqlExpressions[1].trim(), item.tableName || '');
                    return Object.assign(Object.assign({}, item), { extractedValue: primaryValue, secondaryValue, updateTime: new Date().toISOString(), connectionState: dbManager.getConnectionState() });
                }
                else {
                    return Object.assign(Object.assign({}, item), { extractedValue: primaryValue, updateTime: new Date().toISOString(), connectionState: dbManager.getConnectionState() });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown query execution error';
                return Object.assign(Object.assign({}, item), { connectionState: Object.assign(Object.assign({}, dbManager.getConnectionState()), { lastError: errorMessage }) });
            }
        })));
    });
    return {
        connectionState,
        connect,
        disconnect,
        executeQueries
    };
}
