/**
 * POR SQL Expression Repair Tool
 *
 * This script analyzes non-working POR SQL expressions and attempts to create
 * working replacements by intelligently matching tables and columns from the POR schema.
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
import fs from 'fs';
import path from 'path';
import { getPORTableNames, getPORTableColumnNames } from '../lib/db/por-schema';
import fetch from 'node-fetch';
import readline from 'readline';
// Configuration
const CONFIG = {
    MAX_TABLE_TRIES: 10,
    MAX_COLUMN_TRIES: 10,
    SIMILARITY_THRESHOLD: 0.3,
    OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'fixed-por-sql-expressions.json'),
    SOURCE_FILE: path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts'),
    BACKUP_FILE: path.join(process.cwd(), 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`),
    SERVER_URL: 'http://localhost:3004'
};
/**
 * Main function to process and fix SQL expressions
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('POR SQL Expression Repair Tool');
            console.log('============================\n');
            // Create a backup of the source file
            console.log(`Creating backup of source file to: ${CONFIG.BACKUP_FILE}`);
            fs.copyFileSync(CONFIG.SOURCE_FILE, CONFIG.BACKUP_FILE);
            console.log('Backup created successfully.\n');
            // Load chart data
            const chartData = yield loadChartData();
            console.log(`Loaded ${chartData.length} SQL expressions from chart data`);
            // Filter to only POR expressions (IDs 127-174)
            const porExpressions = chartData.filter(expr => expr.serverName === 'POR' ||
                (expr.id && parseInt(expr.id) >= 127 && parseInt(expr.id) <= 174));
            console.log(`Filtered to ${porExpressions.length} POR SQL expressions`);
            // Get available tables from POR schema
            const availableTables = getPORTableNames();
            console.log(`Found ${availableTables.length} tables in POR schema`);
            // Create readline interface for user interaction
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            // Process each expression
            const fixedExpressions = [];
            let currentIndex = 0;
            // Function to process the next expression
            function processNextExpression() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (currentIndex >= porExpressions.length) {
                        // Save results and exit
                        yield saveResults(fixedExpressions);
                        rl.close();
                        console.log('\nAll expressions processed. Results saved to:', CONFIG.OUTPUT_FILE);
                        return;
                    }
                    const expression = porExpressions[currentIndex];
                    console.log(`\nProcessing expression ${currentIndex + 1}/${porExpressions.length}`);
                    console.log(`ID: ${expression.id}`);
                    console.log(`DataPoint: ${expression.DataPoint || expression.name}`);
                    console.log(`Original SQL: ${expression.sqlExpression}`);
                    // Skip if the expression is already working
                    const testResult = yield testSqlExpression(expression.sqlExpression);
                    if (testResult.success && testResult.value !== null && testResult.value !== undefined && !testResult.error) {
                        console.log('✅ Expression is already working. Skipping...');
                        fixedExpressions.push(expression);
                        currentIndex++;
                        processNextExpression();
                        return;
                    }
                    // Extract columns from the original SQL
                    const extractedColumns = extractColumnsFromSql(expression.sqlExpression);
                    console.log('Extracted columns:', extractedColumns);
                    // Extract table name from the original SQL
                    const extractedTable = extractTableFromSql(expression.sqlExpression);
                    console.log('Extracted table:', extractedTable);
                    // Rank tables by similarity to the expression
                    const rankedTables = rankTablesByRelevance(availableTables, expression.DataPoint || expression.name || '', expression.variableName || '', expression.chartGroup || '', extractedColumns, extractedTable);
                    console.log(`Found ${rankedTables.length} potential tables`);
                    // Try tables in order of relevance
                    let tableIndex = 0;
                    yield tryNextTable();
                    // Function to try the next table
                    function tryNextTable() {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (tableIndex >= rankedTables.length || tableIndex >= CONFIG.MAX_TABLE_TRIES) {
                                console.log('❌ No working replacement found after trying multiple tables');
                                currentIndex++;
                                processNextExpression();
                                return;
                            }
                            const tableInfo = rankedTables[tableIndex];
                            console.log(`\nTrying table ${tableIndex + 1}/${Math.min(rankedTables.length, CONFIG.MAX_TABLE_TRIES)}: ${tableInfo.tableName} (score: ${tableInfo.score.toFixed(2)})`);
                            // Get columns for this table from the POR schema
                            const columns = getPORTableColumnNames(tableInfo.tableName);
                            if (!columns || columns.length === 0) {
                                console.log('❌ No columns available for this table. Trying next table...');
                                tableIndex++;
                                tryNextTable();
                                return;
                            }
                            console.log(`Found ${columns.length} columns in table ${tableInfo.tableName}`);
                            // Rank columns by relevance
                            const rankedColumns = rankColumnsByRelevance(columns, expression.DataPoint || expression.name || '', expression.variableName || '', extractedColumns);
                            // Generate and test SQL expressions with different column combinations
                            let columnTries = 0;
                            let bestSql = '';
                            let bestResult = null;
                            for (let i = 0; i < Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length); i++) {
                                columnTries++;
                                // Generate SQL with these columns
                                const generatedSql = generateSqlExpression(tableInfo.tableName, rankedColumns, expression.DataPoint || expression.name || '', expression.variableName || '');
                                console.log(`\nTrying SQL ${columnTries}/${Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length)}:`);
                                console.log(generatedSql);
                                // Test the generated SQL
                                const result = yield testSqlExpression(generatedSql);
                                if (result.success && !result.error) {
                                    console.log('✅ SQL test successful! Result:', result.value);
                                    // If this is our first success or the result is better than previous
                                    if (!bestResult || (result.value !== null && result.value !== undefined)) {
                                        bestSql = generatedSql;
                                        bestResult = result;
                                        // Ask user if this result is acceptable
                                        rl.question('Accept this SQL expression? (y/n): ', (answer) => __awaiter(this, void 0, void 0, function* () {
                                            if (answer.toLowerCase() === 'y') {
                                                // Save the fixed expression
                                                const fixedExpression = Object.assign(Object.assign({}, expression), { sqlExpression: bestSql });
                                                fixedExpressions.push(fixedExpression);
                                                currentIndex++;
                                                processNextExpression();
                                            }
                                            else {
                                                // Try next column combination or table
                                                if (columnTries >= CONFIG.MAX_COLUMN_TRIES) {
                                                    tableIndex++;
                                                    tryNextTable();
                                                }
                                                else {
                                                    // Continue with next column combination
                                                    i++; // Move to next column combination
                                                    if (i >= Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length)) {
                                                        tableIndex++;
                                                        tryNextTable();
                                                    }
                                                }
                                            }
                                        }));
                                        // Break the loop to wait for user input
                                        break;
                                    }
                                }
                                else {
                                    console.log('❌ SQL test failed:', result.error);
                                }
                                // If we've tried all column combinations for this table, move to next table
                                if (columnTries >= CONFIG.MAX_COLUMN_TRIES) {
                                    tableIndex++;
                                    tryNextTable();
                                    break;
                                }
                            }
                        });
                    }
                });
            }
            // Start processing
            processNextExpression();
        }
        catch (error) {
            console.error('Error in main function:', error);
        }
    });
}
/**
 * Load chart data from the file
 */
function loadChartData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileContent = fs.readFileSync(CONFIG.SOURCE_FILE, 'utf8');
            // Extract the array from the file using regex
            const match = fileContent.match(/export const initialSpreadsheetData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
            if (!match || !match[1]) {
                throw new Error('Could not extract chart data from file');
            }
            // Evaluate the array (safer than using eval)
            const chartData = new Function(`return ${match[1]}`)();
            return chartData;
        }
        catch (error) {
            console.error('Error loading chart data:', error);
            return [];
        }
    });
}
/**
 * Extract table name from an SQL expression
 */
function extractTableFromSql(sql) {
    if (!sql)
        return '';
    // Extract table name from FROM clause
    const fromMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
    if (fromMatch && fromMatch[1]) {
        return fromMatch[1].replace(/[\[\]"`']/g, '');
    }
    return '';
}
/**
 * Extract column names from an SQL expression
 */
function extractColumnsFromSql(sql) {
    if (!sql)
        return [];
    const columns = [];
    // Extract columns from SELECT clause
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (selectMatch && selectMatch[1]) {
        const selectClause = selectMatch[1];
        // Skip if it's just * or COUNT(*)
        if (selectClause.trim() !== '*' && !selectClause.toUpperCase().includes('COUNT(*)')) {
            const selectColumns = selectClause.split(',').map(col => {
                // Extract column name, handling aliases
                const colName = col.trim().split(/\s+AS\s+|\s+/i)[0].trim();
                // Remove any functions
                return colName.replace(/^.*\(([^)]*)\).*$/, '$1').trim();
            });
            columns.push(...selectColumns);
        }
    }
    // Extract columns from WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:GROUP BY|ORDER BY|$)/i);
    if (whereMatch && whereMatch[1]) {
        const whereClause = whereMatch[1];
        const whereColumns = whereClause.split(/AND|OR/i).map(condition => {
            const parts = condition.trim().split(/[=<>!]/);
            return parts[0].trim();
        });
        columns.push(...whereColumns);
    }
    // Extract columns from GROUP BY clause
    const groupByMatch = sql.match(/GROUP BY\s+(.*?)(?:ORDER BY|$)/i);
    if (groupByMatch && groupByMatch[1]) {
        const groupByClause = groupByMatch[1];
        const groupByColumns = groupByClause.split(',').map(col => col.trim());
        columns.push(...groupByColumns);
    }
    // Extract columns from ORDER BY clause
    const orderByMatch = sql.match(/ORDER BY\s+(.*?)(?:$)/i);
    if (orderByMatch && orderByMatch[1]) {
        const orderByClause = orderByMatch[1];
        const orderByColumns = orderByClause.split(',').map(col => {
            return col.trim().split(/\s+/)[0].trim();
        });
        columns.push(...orderByColumns);
    }
    // Filter out common SQL keywords and functions
    const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
    return columns
        .filter(col => col && !sqlKeywords.includes(col.toUpperCase()))
        .map(col => {
        // Remove table prefixes and brackets
        return col.replace(/^.*\./, '').replace(/[\[\]"`']/g, '');
    })
        .filter((col, index, self) => self.indexOf(col) === index); // Remove duplicates
}
/**
 * Rank tables by relevance to the expression
 */
function rankTablesByRelevance(tables, dataPoint, variableName, chartGroup, extractedColumns, extractedTable) {
    const rankedTables = [];
    for (const tableName of tables) {
        let score = 0;
        // Clean table name for comparison
        const cleanTableName = tableName.toLowerCase();
        // If the table name exactly matches the extracted table, give it a high score
        if (extractedTable && cleanTableName === extractedTable.toLowerCase()) {
            score += 10;
        }
        // Score based on data point
        const dataPointWords = dataPoint.toLowerCase().split(/\s+/);
        for (const word of dataPointWords) {
            if (word.length > 2 && cleanTableName.includes(word.toLowerCase())) {
                score += 2;
            }
        }
        // Score based on variable name
        const variableWords = variableName.toLowerCase().split(/\s+/);
        for (const word of variableWords) {
            if (word.length > 2 && cleanTableName.includes(word.toLowerCase())) {
                score += 1.5;
            }
        }
        // Score based on chart group
        const chartGroupWords = chartGroup.toLowerCase().split(/\s+/);
        for (const word of chartGroupWords) {
            if (word.length > 2 && cleanTableName.includes(word.toLowerCase())) {
                score += 1;
            }
        }
        // Get columns for this table
        const tableColumns = getPORTableColumnNames(tableName);
        // Score based on extracted columns
        for (const column of extractedColumns) {
            if (tableColumns.some(col => col.toLowerCase() === column.toLowerCase())) {
                // Exact column match
                score += 3;
            }
            else if (tableColumns.some(col => col.toLowerCase().includes(column.toLowerCase()) || column.toLowerCase().includes(col.toLowerCase()))) {
                // Partial column match
                score += 1;
            }
        }
        // Add table to ranked list if it has a minimum score
        if (score > 0) {
            rankedTables.push({
                tableName,
                columns: tableColumns,
                score
            });
        }
        else {
            // Add with a minimal score for tables that don't match any keywords
            rankedTables.push({
                tableName,
                columns: tableColumns,
                score: 0.1
            });
        }
    }
    // Sort tables by score (descending)
    return rankedTables.sort((a, b) => b.score - a.score);
}
/**
 * Rank columns by relevance to the expression
 */
function rankColumnsByRelevance(columns, dataPoint, variableName, extractedColumns) {
    const rankedColumns = [];
    // First, try to match extracted columns to actual columns
    for (const extractedColumn of extractedColumns) {
        const cleanExtractedColumn = extractedColumn.toLowerCase();
        for (const column of columns) {
            const cleanColumn = column.toLowerCase();
            let score = 0;
            // Exact match
            if (cleanExtractedColumn === cleanColumn) {
                score = 10;
            }
            // Partial match
            else if (cleanColumn.includes(cleanExtractedColumn) || cleanExtractedColumn.includes(cleanColumn)) {
                score = 5;
            }
            // Word match
            else {
                const extractedWords = cleanExtractedColumn.split(/[_\s]/);
                const columnWords = cleanColumn.split(/[_\s]/);
                for (const word of extractedWords) {
                    if (word.length > 2 && columnWords.some(colWord => colWord.includes(word) || word.includes(colWord))) {
                        score += 2;
                    }
                }
            }
            if (score > 0) {
                rankedColumns.push({
                    originalColumn: extractedColumn,
                    matchedColumn: column,
                    score
                });
            }
        }
    }
    // Then, score remaining columns based on data point and variable name
    const scoredColumns = new Map();
    for (const column of columns) {
        const cleanColumn = column.toLowerCase();
        let score = 0;
        // Score based on data point
        const dataPointWords = dataPoint.toLowerCase().split(/\s+/);
        for (const word of dataPointWords) {
            if (word.length > 2 && cleanColumn.includes(word.toLowerCase())) {
                score += 1.5;
            }
        }
        // Score based on variable name
        const variableWords = variableName.toLowerCase().split(/\s+/);
        for (const word of variableWords) {
            if (word.length > 2 && cleanColumn.includes(word.toLowerCase())) {
                score += 1;
            }
        }
        // Add to map if not already matched
        if (score > 0 && !rankedColumns.some(rc => rc.matchedColumn === column)) {
            scoredColumns.set(column, score);
        }
    }
    // Add remaining scored columns to the ranked list
    for (const [column, score] of scoredColumns.entries()) {
        rankedColumns.push({
            originalColumn: '',
            matchedColumn: column,
            score
        });
    }
    // Add any remaining columns with minimal score
    for (const column of columns) {
        if (!rankedColumns.some(rc => rc.matchedColumn === column)) {
            rankedColumns.push({
                originalColumn: '',
                matchedColumn: column,
                score: 0.1
            });
        }
    }
    // Sort columns by score (descending)
    return rankedColumns.sort((a, b) => b.score - a.score);
}
/**
 * Generate an SQL expression for POR (MS Access/Jet SQL)
 */
function generateSqlExpression(tableName, rankedColumns, dataPoint, variableName) {
    // Find potential value columns (numeric columns that might represent the value we want)
    const valueColumns = rankedColumns.filter(col => {
        const colName = col.matchedColumn.toLowerCase();
        return colName.includes('amount') ||
            colName.includes('value') ||
            colName.includes('total') ||
            colName.includes('count') ||
            colName.includes('sum') ||
            colName.includes('price') ||
            colName.includes('cost') ||
            colName.includes('qty') ||
            colName.includes('quantity');
    });
    // Find potential date columns for filtering
    const dateColumns = rankedColumns.filter(col => {
        const colName = col.matchedColumn.toLowerCase();
        return colName.includes('date') ||
            colName.includes('time') ||
            colName.includes('created') ||
            colName.includes('updated') ||
            colName.includes('timestamp');
    });
    // Find potential status columns for filtering
    const statusColumns = rankedColumns.filter(col => {
        const colName = col.matchedColumn.toLowerCase();
        return colName.includes('status') ||
            colName.includes('state') ||
            colName.includes('type') ||
            colName.includes('category');
    });
    // Determine if we need aggregation based on data point
    const needsAggregation = dataPoint.toLowerCase().includes('total') ||
        dataPoint.toLowerCase().includes('sum') ||
        dataPoint.toLowerCase().includes('count') ||
        dataPoint.toLowerCase().includes('average') ||
        dataPoint.toLowerCase().includes('avg');
    // MS Access/Jet SQL syntax
    let sql = 'SELECT ';
    if (needsAggregation) {
        // If we need aggregation, use SUM, COUNT, or AVG
        if (dataPoint.toLowerCase().includes('count')) {
            sql += 'Count(*) as value';
        }
        else if (valueColumns.length > 0) {
            sql += `Sum(${valueColumns[0].matchedColumn}) as value`;
        }
        else {
            sql += 'Count(*) as value';
        }
    }
    else {
        // Otherwise, just select the first value column or a count
        if (valueColumns.length > 0) {
            sql += `${valueColumns[0].matchedColumn} as value`;
        }
        else {
            sql += 'Count(*) as value';
        }
    }
    // Add FROM clause
    sql += ` FROM ${tableName}`;
    // Check if we need to filter by month/year based on dataPoint
    const monthMatch = dataPoint.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
    let monthNumber = 0;
    if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase();
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        monthNumber = months.indexOf(monthName) + 1;
    }
    // Add WHERE clause with date filter if available
    if (dateColumns.length > 0) {
        sql += ` WHERE `;
        if (monthNumber > 0) {
            sql += `Month(${dateColumns[0].matchedColumn}) = ${monthNumber} AND Year(${dateColumns[0].matchedColumn}) = Year(Date())`;
        }
        else {
            sql += `${dateColumns[0].matchedColumn} >= DateAdd('d', -30, Date())`;
        }
        // Add status filter if available
        if (statusColumns.length > 0) {
            // Check if dataPoint contains status information
            if (dataPoint.toLowerCase().includes('new')) {
                sql += ` AND ${statusColumns[0].matchedColumn} = 'New'`;
            }
            else if (dataPoint.toLowerCase().includes('open')) {
                sql += ` AND ${statusColumns[0].matchedColumn} = 'Open'`;
            }
            else if (dataPoint.toLowerCase().includes('closed')) {
                sql += ` AND ${statusColumns[0].matchedColumn} = 'Closed'`;
            }
            else if (dataPoint.toLowerCase().includes('pending')) {
                sql += ` AND ${statusColumns[0].matchedColumn} = 'Pending'`;
            }
            else {
                sql += ` AND ${statusColumns[0].matchedColumn} = 'Active'`;
            }
        }
    }
    else if (statusColumns.length > 0) {
        sql += ` WHERE `;
        // Check if dataPoint contains status information
        if (dataPoint.toLowerCase().includes('new')) {
            sql += `${statusColumns[0].matchedColumn} = 'New'`;
        }
        else if (dataPoint.toLowerCase().includes('open')) {
            sql += `${statusColumns[0].matchedColumn} = 'Open'`;
        }
        else if (dataPoint.toLowerCase().includes('closed')) {
            sql += `${statusColumns[0].matchedColumn} = 'Closed'`;
        }
        else if (dataPoint.toLowerCase().includes('pending')) {
            sql += `${statusColumns[0].matchedColumn} = 'Pending'`;
        }
        else {
            sql += `${statusColumns[0].matchedColumn} = 'Active'`;
        }
    }
    return sql;
}
/**
 * Test a POR SQL expression against the database
 */
function testSqlExpression(sql) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Testing SQL: ${sql}`);
            // Use the actual API endpoint for testing SQL expressions
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
                    value: null,
                    error: `API error (${response.status}): ${errorText}`
                };
            }
            const data = yield response.json();
            // Check if there's a result
            if (data.result && Array.isArray(data.result) && data.result.length > 0) {
                // Extract the value from the first result
                const value = data.result[0].value !== undefined ? data.result[0].value : data.result[0];
                // Check if the result contains an error
                if (value && typeof value === 'object' && value.error) {
                    return {
                        success: false,
                        value: null,
                        error: value.error
                    };
                }
                return {
                    success: true,
                    value: value
                };
            }
            else if (data.result && !Array.isArray(data.result)) {
                // Handle case where result is a single value or object
                const value = data.result.value !== undefined ? data.result.value : data.result;
                // Check if the result contains an error
                if (value && typeof value === 'object' && value.error) {
                    return {
                        success: false,
                        value: null,
                        error: value.error
                    };
                }
                return {
                    success: true,
                    value: value
                };
            }
            else {
                // No results or empty array
                return {
                    success: false,
                    value: null,
                    error: 'No results returned from query'
                };
            }
        }
        catch (error) {
            console.error('Error testing SQL expression:', error);
            return {
                success: false,
                value: null,
                error: `Error: ${error.message}`
            };
        }
    });
}
/**
 * Save the fixed expressions to a file
 */
function saveResults(fixedExpressions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(fixedExpressions, null, 2));
        }
        catch (error) {
            console.error('Error saving results:', error);
        }
    });
}
// Run the main function
main().catch(console.error);
