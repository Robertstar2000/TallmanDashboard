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
export class P21ConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'P21ConnectionError';
    }
}
export function checkP21Connection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/p21-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'test',
                    config: {
                        type: 'P21'
                    }
                }),
            });
            const result = yield response.json();
            return result.success;
        }
        catch (error) {
            console.error('Failed to check P21 connection:', error);
            return false;
        }
    });
}
/**
 * Execute a query against the P21 database
 * @param sqlExpression The SQL expression to execute
 * @param serverName The server name (P21)
 * @returns The result of the query as a string, or null if there's an error
 */
export function executeP21Query(sqlExpression, serverName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Executing P21 query: ${sqlExpression}`);
            // Call the API endpoint to execute the query
            const response = yield fetch('/api/executeQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: serverName,
                    query: sqlExpression,
                }),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error(`P21 query execution error: ${errorText}`);
                return null;
            }
            const result = yield response.json();
            console.log(`P21 query response (full):`, JSON.stringify(result));
            if (!result.success) {
                console.error(`P21 query execution error: ${result.message || 'Unknown error'}`);
                return null;
            }
            // Handle different result formats
            if (result.data && result.data.length > 0) {
                const firstRow = result.data[0];
                // Check if there's a 'value' column
                if (firstRow.value !== undefined) {
                    console.log(`P21 query result has 'value' column with value: ${firstRow.value}`);
                    return String(firstRow.value);
                }
                // Otherwise, use the first column
                const firstColumnName = Object.keys(firstRow)[0];
                if (firstColumnName) {
                    const value = firstRow[firstColumnName];
                    console.log(`P21 query result using first column '${firstColumnName}' with value: ${value}`);
                    return String(value);
                }
            }
            // If we couldn't extract a value, return 0
            console.log(`P21 query result couldn't extract a value, returning 0`);
            return "0";
        }
        catch (error) {
            console.error(`Error in executeP21Query:`, error);
            return null;
        }
    });
}
