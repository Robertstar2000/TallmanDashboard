/**
 * Execute Query Module
 *
 * This module provides functions to execute queries against different database servers.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
// Set the correct POR database path from memory
const POR_DB_PATH = 'C:\\Users\\BobM\\OneDrive\\Desktop\\POR.MDB';
/**
 * Execute a query against a database server
 *
 * @param serverName The server to execute the query against (P21 or POR)
 * @param query The SQL query to execute
 * @param tableName Optional table name for context
 * @returns The query result
 */
export function executeQuery(serverName, query, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Executing query on ${serverName} server: ${query}`);
            if (serverName === 'POR') {
                return executeAccessQuery(query);
            }
            else {
                return executeP21Query(query);
            }
        }
        catch (error) {
            console.error(`Error executing query on ${serverName}:`, error);
            throw error;
        }
    });
}
/**
 * Execute a query against the P21 database
 *
 * @param query The SQL query to execute
 * @returns The query result
 */
function executeP21Query(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://localhost:5500/api/executeQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    server: 'P21',
                    query
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`P21 query execution failed: ${errorText}`);
            }
            const result = yield response.json();
            if (result.error) {
                throw new Error(`P21 query execution failed: ${result.error}`);
            }
            return result.data || result;
        }
        catch (error) {
            console.error('Error executing P21 query:', error);
            throw error;
        }
    });
}
/**
 * Execute a query against the POR database
 *
 * @param query The SQL query to execute
 * @returns The query result
 */
function executeAccessQuery(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://localhost:5500/api/executeAccessQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: process.env.POR_FILE_PATH || POR_DB_PATH,
                    sql: query
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`POR query execution failed: ${errorText}`);
            }
            const result = yield response.json();
            if (result.error) {
                throw new Error(`POR query execution failed: ${result.error}`);
            }
            return result;
        }
        catch (error) {
            console.error('Error executing POR query:', error);
            throw error;
        }
    });
}
