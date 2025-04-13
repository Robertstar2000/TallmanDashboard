/**
 * Find Populated Tables in POR Database
 *
 * This script scans the POR database for tables that have more than zero rows
 * and captures them in a list to start building a valid schema.
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
import fs from 'fs';
import path from 'path';
// Configuration
const CONFIG = {
    SERVER_URL: 'http://localhost:3004',
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'populated-tables.json'),
    SCHEMA_FILE: path.join(process.cwd(), 'scripts', 'por-schema-populated.ts')
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Find Populated Tables in POR Database');
        console.log('====================================\n');
        try {
            // Get available tables
            console.log('Fetching available tables from POR database...');
            const availableTables = yield getAvailableTables();
            if (!availableTables || availableTables.length === 0) {
                console.error('No tables found in POR database.');
                return;
            }
            console.log(`Found ${availableTables.length} tables in POR database.`);
            // Check each table for row count
            const tableInfos = [];
            let processedCount = 0;
            for (const table of availableTables) {
                processedCount++;
                if (processedCount % 10 === 0) {
                    console.log(`Progress: ${processedCount}/${availableTables.length} tables checked`);
                }
                // Get row count
                const countSql = `SELECT Count(*) AS value FROM ${table}`;
                const countResponse = yield testSql(countSql);
                let rowCount = 0;
                if (countResponse.success && countResponse.result) {
                    rowCount = countResponse.result.value || 0;
                }
                else {
                    continue; // Skip this table if we can't get the row count
                }
                // Skip tables with zero rows
                if (rowCount === 0) {
                    continue;
                }
                console.log(`\nFound populated table: ${table} (${rowCount} rows)`);
                // Get columns and sample data
                const columns = [];
                let sampleData = null;
                // Try to get column information from schema
                const columnsSql = `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`;
                const columnsResponse = yield testSql(columnsSql);
                if (columnsResponse.success && columnsResponse.result) {
                    const columnData = Array.isArray(columnsResponse.result) ? columnsResponse.result : [columnsResponse.result];
                    for (const col of columnData) {
                        columns.push({
                            name: col.COLUMN_NAME,
                            dataType: col.DATA_TYPE
                        });
                    }
                    console.log(`Found ${columns.length} columns`);
                }
                else {
                    // Alternative approach: get columns from sample data
                    const sampleSql = `SELECT TOP 1 * FROM ${table}`;
                    const sampleResponse = yield testSql(sampleSql);
                    if (sampleResponse.success && sampleResponse.result) {
                        sampleData = sampleResponse.result;
                        for (const colName of Object.keys(sampleData)) {
                            // Guess data type based on value
                            let dataType = 'VARCHAR';
                            const value = sampleData[colName];
                            if (value === null || value === undefined) {
                                dataType = 'VARCHAR';
                            }
                            else if (typeof value === 'number') {
                                if (Number.isInteger(value)) {
                                    dataType = 'INTEGER';
                                }
                                else {
                                    dataType = 'FLOAT';
                                }
                            }
                            else if (typeof value === 'boolean') {
                                dataType = 'BOOLEAN';
                            }
                            else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                                dataType = 'DATE';
                            }
                            columns.push({
                                name: colName,
                                dataType: dataType
                            });
                        }
                        console.log(`Found ${columns.length} columns from sample data`);
                    }
                    else {
                        console.log(`Failed to get columns: ${sampleResponse.error}`);
                        continue; // Skip this table if we can't get the columns
                    }
                }
                // Save table info
                tableInfos.push({
                    name: table,
                    rowCount: rowCount,
                    columns: columns,
                    sampleData: sampleData
                });
            }
            // Sort tables by row count (descending)
            tableInfos.sort((a, b) => b.rowCount - a.rowCount);
            console.log(`\nFound ${tableInfos.length} populated tables.`);
            // Save results to JSON file
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(tableInfos, null, 2));
            console.log(`Results saved to ${CONFIG.OUTPUT_FILE}`);
            // Generate schema file
            const schemaContent = generateSchemaFile(tableInfos);
            fs.writeFileSync(CONFIG.SCHEMA_FILE, schemaContent);
            console.log(`Schema file generated at ${CONFIG.SCHEMA_FILE}`);
            // Print summary
            console.log('\nTop 20 populated tables:');
            for (let i = 0; i < Math.min(20, tableInfos.length); i++) {
                const tableInfo = tableInfos[i];
                console.log(`${i + 1}. ${tableInfo.name}: ${tableInfo.rowCount} rows, ${tableInfo.columns.length} columns`);
            }
        }
        catch (error) {
            console.error('Error in main function:', error.message);
        }
    });
}
/**
 * Generate a TypeScript schema file from table information
 */
function generateSchemaFile(tableInfos) {
    let content = `/**
 * POR Database Schema (Populated Tables)
 * 
 * This file contains the schema for tables in the POR database that have data.
 * Generated on ${new Date().toISOString()}
 */

export interface PORColumnDefinition {
  name: string;
  dataType: string;
}

export interface PORTableDefinition {
  name: string;
  columns: PORColumnDefinition[];
}

export interface PORDatabaseSchema {
  tables: PORTableDefinition[];
  databaseName: string;
  lastUpdated: string;
}

export const porSchema: PORDatabaseSchema = {
  "tables": [
`;
    for (const tableInfo of tableInfos) {
        content += `    {
      "name": "${tableInfo.name}",
      "columns": [
`;
        for (const column of tableInfo.columns) {
            content += `        {
          "name": "${column.name}",
          "dataType": "${column.dataType}"
        },
`;
        }
        // Remove trailing comma from the last column
        if (tableInfo.columns.length > 0) {
            content = content.slice(0, -2) + '\n';
        }
        content += `      ]
    },
`;
    }
    // Remove trailing comma from the last table
    if (tableInfos.length > 0) {
        content = content.slice(0, -2) + '\n';
    }
    content += `  ],
  "databaseName": "POR",
  "lastUpdated": "${new Date().toISOString()}"
};
`;
    return content;
}
function getAvailableTables() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${CONFIG.SERVER_URL}/api/test-por-sql`);
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = yield response.json();
            return data.availableTables || [];
        }
        catch (error) {
            console.error('Error fetching available tables:', error.message);
            return [];
        }
    });
}
function testSql(sql) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${CONFIG.SERVER_URL}/api/test-sql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sqlExpression: sql,
                    serverType: 'POR'
                })
            });
            if (!response.ok) {
                const errorText = yield response.text();
                return {
                    success: false,
                    error: `API error (${response.status}): ${errorText}`
                };
            }
            const data = yield response.json();
            if (data.error) {
                return {
                    success: false,
                    error: data.error
                };
            }
            if (data.result) {
                // Handle array or single result
                const result = Array.isArray(data.result) ? data.result[0] : data.result;
                return {
                    success: true,
                    result: result
                };
            }
            return {
                success: false,
                error: 'No results returned'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    });
}
main().catch(console.error);
