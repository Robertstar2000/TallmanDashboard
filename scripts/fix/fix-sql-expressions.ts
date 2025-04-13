/**
 * SQL Expression Repair Tool
 * 
 * This script analyzes non-working SQL expressions and attempts to create
 * working replacements by intelligently matching tables and columns
 * based on semantic similarity and testing against the database.
 */

import fs from 'fs';
import path from 'path';
import { SpreadsheetRow } from '../../lib/db/types';
import readline from 'readline';
// Import node-fetch for making HTTP requests
import fetch from 'node-fetch';

// Type definitions
interface TableInfo {
  tableName: string;
  columns: string[];
  score: number;
}

interface ColumnMatch {
  originalColumn: string;
  matchedColumn: string;
  score: number;
}

interface SqlTestResult {
  success: boolean;
  value: any;
  error?: string;
}

// Configuration
const CONFIG = {
  MAX_TABLE_TRIES: 10,
  MAX_COLUMN_TRIES: 10,
  SIMILARITY_THRESHOLD: 0.3,
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'fixed-sql-expressions.json'),
  SOURCE_FILE: path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts'),
  BACKUP_FILE: path.join(process.cwd(), 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`)
};

/**
 * Main function to process and fix SQL expressions
 */
async function main() {
  try {
    console.log('SQL Expression Repair Tool');
    console.log('==========================\n');

    // Create a backup of the source file
    console.log(`Creating backup of source file to: ${CONFIG.BACKUP_FILE}`);
    fs.copyFileSync(CONFIG.SOURCE_FILE, CONFIG.BACKUP_FILE);
    console.log('Backup created successfully.\n');

    // Load chart data
    const chartData = await loadChartData();
    console.log(`Loaded ${chartData.length} SQL expressions from chart data`);

    // Filter to only POR expressions (IDs 127-174)
    const porExpressions = chartData.filter(expr => 
      expr.serverName === 'POR' || 
      (expr.id && parseInt(expr.id) >= 127 && parseInt(expr.id) <= 174)
    );
    console.log(`Filtered to ${porExpressions.length} POR SQL expressions`);

    // Create readline interface for user interaction
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Process each expression
    const fixedExpressions: SpreadsheetRow[] = [];
    let currentIndex = 0;

    // Function to process the next expression
    async function processNextExpression() {
      if (currentIndex >= porExpressions.length) {
        // Save results and exit
        await saveResults(fixedExpressions);
        rl.close();
        console.log('\nAll expressions processed. Results saved to:', CONFIG.OUTPUT_FILE);
        return;
      }

      const expression = porExpressions[currentIndex];
      console.log(`\nProcessing expression ${currentIndex + 1}/${porExpressions.length}`);
      console.log(`ID: ${expression.id}`);
      console.log(`DataPoint: ${expression.DataPoint || expression.name}`);
      console.log(`Server: ${expression.serverName}`);
      console.log(`Original SQL: ${expression.sqlExpression}`);

      // Skip if the expression is already working
      const testResult = await testSqlExpression(expression.sqlExpression, 'POR');
      if (testResult.success) {
        console.log('Expression is already working. Skipping...');
        fixedExpressions.push(expression);
        currentIndex++;
        processNextExpression();
        return;
      }

      // Get available tables for POR
      const tables = await getAvailableTables('POR');
      if (!tables || tables.length === 0) {
        console.log('No tables available for POR. Skipping...');
        currentIndex++;
        processNextExpression();
        return;
      }

      // Extract columns from the original SQL
      const extractedColumns = extractColumnsFromSql(expression.sqlExpression);
      console.log('Extracted columns:', extractedColumns);

      // Rank tables by similarity to the expression
      const rankedTables = rankTablesByRelevance(
        tables, 
        expression.DataPoint || expression.name || '', 
        expression.variableName || '',
        expression.chartGroup || '',
        extractedColumns
      );

      console.log(`Found ${rankedTables.length} potential tables`);

      // Try tables in order of relevance
      let tableIndex = 0;
      
      await tryNextTable();
      
      // Function to try the next table
      async function tryNextTable() {
        if (tableIndex >= rankedTables.length || tableIndex >= CONFIG.MAX_TABLE_TRIES) {
          console.log('No working replacement found after trying multiple tables');
          currentIndex++;
          processNextExpression();
          return;
        }

        const tableInfo = rankedTables[tableIndex];
        console.log(`\nTrying table ${tableIndex + 1}/${Math.min(rankedTables.length, CONFIG.MAX_TABLE_TRIES)}: ${tableInfo.tableName} (score: ${tableInfo.score.toFixed(2)})`);

        // Get columns for this table
        const columns = await getTableColumns('POR', tableInfo.tableName);
        if (!columns || columns.length === 0) {
          console.log('No columns available for this table. Trying next table...');
          tableIndex++;
          tryNextTable();
          return;
        }

        // Rank columns by relevance
        const rankedColumns = rankColumnsByRelevance(
          columns,
          expression.DataPoint || expression.name || '',
          expression.variableName || '',
          extractedColumns
        );

        // Generate and test SQL expressions with different column combinations
        let columnTries = 0;
        let bestSql = '';
        let bestResult: SqlTestResult | null = null;

        for (let i = 0; i < Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length); i++) {
          columnTries++;
          
          // Generate SQL with these columns
          const generatedSql = generateSqlExpression(
            'POR',
            tableInfo.tableName,
            rankedColumns,
            expression.DataPoint || expression.name || '',
            expression.variableName || ''
          );

          console.log(`\nTrying SQL ${columnTries}/${Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length)}:`);
          console.log(generatedSql);

          // Test the generated SQL
          const result = await testSqlExpression(generatedSql, 'POR');
          
          if (result.success) {
            console.log('SQL test successful! Result:', result.value);
            
            // If this is our first success or the result is better than previous
            if (!bestResult || (result.value !== null && result.value !== 0)) {
              bestSql = generatedSql;
              bestResult = result;
              
              // Ask user if this result is acceptable
              rl.question('Accept this SQL expression? (y/n): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                  // Save the fixed expression
                  const fixedExpression = { ...expression, sqlExpression: bestSql };
                  fixedExpressions.push(fixedExpression);
                  currentIndex++;
                  processNextExpression();
                } else {
                  // Try next column combination or table
                  if (columnTries >= CONFIG.MAX_COLUMN_TRIES) {
                    tableIndex++;
                    tryNextTable();
                  } else {
                    // Continue with next column combination
                    i++; // Move to next column combination
                    if (i >= Math.min(CONFIG.MAX_COLUMN_TRIES, rankedColumns.length)) {
                      tableIndex++;
                      tryNextTable();
                    }
                  }
                }
              });
              
              // Break the loop to wait for user input
              break;
            }
          } else {
            console.log('SQL test failed:', result.error);
          }
          
          // If we've tried all column combinations for this table, move to next table
          if (columnTries >= CONFIG.MAX_COLUMN_TRIES) {
            tableIndex++;
            tryNextTable();
            break;
          }
        }
      }
    }

    // Start processing
    processNextExpression();

  } catch (error) {
    console.error('Error in main function:', error);
  }
}

/**
 * Load chart data from the file
 */
async function loadChartData(): Promise<SpreadsheetRow[]> {
  try {
    const filePath = CONFIG.SOURCE_FILE;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract the array from the file using regex
    const match = fileContent.match(/export const initialSpreadsheetData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
    if (!match || !match[1]) {
      throw new Error('Could not extract chart data from file');
    }
    
    // Evaluate the array (safer than using eval)
    const chartData = new Function(`return ${match[1]}`)();
    return chartData;
  } catch (error) {
    console.error('Error loading chart data:', error);
    return [];
  }
}

/**
 * Get available tables for a server
 */
async function getAvailableTables(serverName: string): Promise<string[]> {
  try {
    // Use the actual API endpoint to get available tables
    const baseUrl = 'http://localhost:3004';
    let endpoint = '';
    
    if (serverName === 'P21') {
      endpoint = '/api/get-p21-tables';
    } else if (serverName === 'POR') {
      endpoint = '/api/test-por-sql'; // This endpoint returns availableTables
    }
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (serverName === 'P21') {
        return data.tables || [];
      } else if (serverName === 'POR') {
        return data.availableTables || [];
      }
      
      return [];
    } catch (fetchError) {
      console.error(`Error fetching tables for ${serverName}:`, fetchError);
      
      // Return some sample tables as fallback
      if (serverName === 'P21') {
        return [
          'dbo.ar_open_items',
          'dbo.oe_hdr',
          'dbo.oe_line',
          'dbo.customer',
          'dbo.vendor',
          'dbo.inventory'
        ];
      } else if (serverName === 'POR') {
        return [
          'PurchaseOrder',
          'Rentals',
          'Customers',
          'Inventory',
          'Vendors',
          'Transactions'
        ];
      }
      return [];
    }
  } catch (error) {
    console.error(`Error in getAvailableTables for ${serverName}:`, error);
    return [];
  }
}

/**
 * Get columns for a specific table
 */
async function getTableColumns(serverName: string, tableName: string): Promise<string[]> {
  // This would normally call an API endpoint to get columns
  // For now, we'll simulate with a fetch to our API endpoint
  try {
    const baseUrl = 'http://localhost:3004'; // Adjust to your actual server URL
    const response = await fetch(`${baseUrl}/api/get-table-columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, serverType: serverName })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch columns: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.columns || [];
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    
    // Return some sample columns as fallback
    if (serverName === 'P21') {
      return ['id', 'name', 'date', 'amount', 'customer_id', 'status', 'created_at', 'updated_at'];
    } else if (serverName === 'POR') {
      return ['ID', 'Name', 'Date', 'Amount', 'CustomerID', 'Status', 'CreatedDate', 'UpdatedDate'];
    }
    return [];
  }
}

/**
 * Extract column names from an SQL expression
 */
function extractColumnsFromSql(sql: string): string[] {
  const columns: string[] = [];
  
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
function rankTablesByRelevance(
  tables: string[],
  dataPoint: string,
  variableName: string,
  chartGroup: string,
  extractedColumns: string[]
): TableInfo[] {
  const rankedTables: TableInfo[] = [];
  
  for (const tableName of tables) {
    let score = 0;
    
    // Clean table name for comparison
    const cleanTableName = tableName.replace(/^dbo\./, '').toLowerCase();
    
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
    
    // Score based on extracted columns (we'll need to get actual columns later)
    // For now, just add a small score if the table name contains parts of column names
    for (const column of extractedColumns) {
      if (column.length > 2 && cleanTableName.includes(column.toLowerCase())) {
        score += 0.5;
      }
    }
    
    // Add table to ranked list if it has a minimum score
    if (score > 0) {
      rankedTables.push({
        tableName,
        columns: [], // Will be populated later
        score
      });
    } else {
      // Add with a minimal score for tables that don't match any keywords
      rankedTables.push({
        tableName,
        columns: [],
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
function rankColumnsByRelevance(
  columns: string[],
  dataPoint: string,
  variableName: string,
  extractedColumns: string[]
): ColumnMatch[] {
  const rankedColumns: ColumnMatch[] = [];
  
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
  const scoredColumns = new Map<string, number>();
  
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
 * Generate an SQL expression based on the server, table, and columns
 */
function generateSqlExpression(
  serverName: string,
  tableName: string,
  rankedColumns: ColumnMatch[],
  dataPoint: string,
  variableName: string
): string {
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
  
  // For POR (MS Access/Jet SQL syntax)
  // MS Access/Jet SQL syntax
  let sql = 'SELECT ';
  
  if (needsAggregation) {
    // If we need aggregation, use SUM, COUNT, or AVG
    if (dataPoint.toLowerCase().includes('count')) {
      sql += 'Count(*) as value';
    } else if (valueColumns.length > 0) {
      sql += `Sum(${valueColumns[0].matchedColumn}) as value`;
    } else {
      sql += 'Count(*) as value';
    }
  } else {
    // Otherwise, just select the first value column or a count
    if (valueColumns.length > 0) {
      sql += `${valueColumns[0].matchedColumn} as value`;
    } else {
      sql += 'Count(*) as value';
    }
  }
  
  // Add FROM clause
  sql += ` FROM ${tableName}`;
  
  // Add WHERE clause with date filter if available
  if (dateColumns.length > 0) {
    sql += ` WHERE ${dateColumns[0].matchedColumn} >= DateAdd('d', -30, Date())`;
    
    // Add status filter if available
    if (statusColumns.length > 0) {
      sql += ` AND ${statusColumns[0].matchedColumn} = 'Open'`;
    }
  } else if (statusColumns.length > 0) {
    sql += ` WHERE ${statusColumns[0].matchedColumn} = 'Open'`;
  }
  
  return sql;
}

/**
 * Test an SQL expression against the database
 */
async function testSqlExpression(sql: string, serverName: string): Promise<SqlTestResult> {
  try {
    console.log(`Testing SQL against ${serverName}: ${sql}`);
    
    // Use the actual API endpoint for testing SQL expressions
    const baseUrl = 'http://localhost:3004'; // Adjust if your server runs on a different port
    
    try {
      const response = await fetch(`${baseUrl}/api/test-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sqlExpression: sql, 
          serverType: serverName 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          value: null,
          error: `API error (${response.status}): ${errorText}`
        };
      }
      
      const data = await response.json();
      
      // Check if there's a result
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        // Extract the value from the first result
        const value = data.result[0].value !== undefined ? data.result[0].value : data.result[0];
        
        return {
          success: true,
          value: value
        };
      } else if (data.result && !Array.isArray(data.result)) {
        // Handle case where result is a single value or object
        const value = data.result.value !== undefined ? data.result.value : data.result;
        
        return {
          success: true,
          value: value
        };
      } else {
        // No results or empty array
        return {
          success: false,
          value: null,
          error: 'No results returned from query'
        };
      }
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      return {
        success: false,
        value: null,
        error: `Fetch error: ${fetchError.message}`
      };
    }
  } catch (error: any) {
    console.error('Error testing SQL expression:', error);
    return {
      success: false,
      value: null,
      error: `Error: ${error.message}`
    };
  }
}

/**
 * Save the fixed expressions to a file
 */
async function saveResults(fixedExpressions: SpreadsheetRow[]): Promise<void> {
  try {
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(fixedExpressions, null, 2));
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Run the main function
main().catch(console.error);
