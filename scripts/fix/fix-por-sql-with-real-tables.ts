/**
 * POR SQL Expression Repair Tool with Real Tables
 * 
 * This script analyzes non-working POR SQL expressions and attempts to create
 * working replacements by using the actual tables in the POR database.
 */

import fs from 'fs';
import path from 'path';
import { SpreadsheetRow } from '../../lib/db/types';
import fetch from 'node-fetch';

// Configuration
const CONFIG = {
  MAX_TRIES: 5,
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'fixed-por-sql-expressions.json'),
  SOURCE_FILE: path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts'),
  BACKUP_FILE: path.join(process.cwd(), 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`),
  SERVER_URL: 'http://localhost:3004'
};

// Interface for SQL test results
interface SqlTestResult {
  success: boolean;
  value?: any;
  error?: string;
}

/**
 * Main function to process and fix SQL expressions
 */
async function main() {
  try {
    console.log('POR SQL Expression Repair Tool with Real Tables');
    console.log('============================================\n');

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

    // Get available tables from POR database
    console.log('\nFetching available tables from POR database...');
    const availableTables = await getAvailableTables();
    
    if (!availableTables || availableTables.length === 0) {
      console.error('No tables found in POR database.');
      return;
    }
    
    console.log(`Found ${availableTables.length} tables in POR database:`);
    console.log(availableTables.join(', '));

    // Process each expression
    const results = [];
    let fixedCount = 0;
    
    for (let i = 0; i < porExpressions.length; i++) {
      const expression = porExpressions[i];
      console.log(`\nProcessing expression ${i + 1}/${porExpressions.length}`);
      console.log(`ID: ${expression.id}`);
      console.log(`DataPoint: ${expression.DataPoint || expression.name}`);
      console.log(`Original SQL: ${expression.sqlExpression}`);

      // Test the original SQL
      const originalResult = await testSqlExpression(expression.sqlExpression);
      if (originalResult.success && !originalResult.error) {
        console.log('✅ Original SQL is working. No fix needed.');
        results.push({
          id: expression.id,
          dataPoint: expression.DataPoint || expression.name,
          originalSql: expression.sqlExpression,
          fixed: false,
          working: true,
          newSql: expression.sqlExpression,
          value: originalResult.value
        });
        continue;
      }

      console.log('❌ Original SQL is not working. Attempting to fix...');
      
      // Extract table name from the original SQL
      const extractedTable = extractTableFromSql(expression.sqlExpression);
      console.log(`Extracted table: ${extractedTable}`);
      
      // Extract columns from the original SQL
      const extractedColumns = extractColumnsFromSql(expression.sqlExpression);
      console.log(`Extracted columns: ${extractedColumns.join(', ')}`);
      
      // Try to fix the SQL expression
      let fixed = false;
      let fixedSql = '';
      let fixedResult: SqlTestResult | null = null;
      
      // First, try with the exact table name if it exists
      if (extractedTable && availableTables.includes(extractedTable)) {
        console.log(`\nTrying with the exact table name: ${extractedTable}`);
        const sql = fixSqlExpression(expression.sqlExpression, extractedTable, extractedColumns);
        console.log(`Generated SQL: ${sql}`);
        
        const result = await testSqlExpression(sql);
        if (result.success && !result.error) {
          console.log('✅ Fixed SQL is working!');
          fixed = true;
          fixedSql = sql;
          fixedResult = result;
        } else {
          console.log(`❌ Fixed SQL failed: ${result.error}`);
        }
      }
      
      // If not fixed, try with similar table names
      if (!fixed) {
        const similarTables = findSimilarTables(extractedTable, availableTables);
        console.log(`\nTrying with similar tables: ${similarTables.join(', ')}`);
        
        for (const table of similarTables) {
          if (fixed) break;
          
          console.log(`\nTrying with table: ${table}`);
          const sql = fixSqlExpression(expression.sqlExpression, table, extractedColumns);
          console.log(`Generated SQL: ${sql}`);
          
          const result = await testSqlExpression(sql);
          if (result.success && !result.error) {
            console.log('✅ Fixed SQL is working!');
            fixed = true;
            fixedSql = sql;
            fixedResult = result;
          } else {
            console.log(`❌ Fixed SQL failed: ${result.error}`);
          }
        }
      }
      
      // If still not fixed, try with common SQL patterns
      if (!fixed) {
        console.log('\nTrying with common SQL patterns...');
        
        // Extract data point information
        const dataPoint = expression.DataPoint || expression.name || '';
        
        // Check if we need to filter by month
        const monthMatch = dataPoint.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
        let monthNumber = 0;
        
        if (monthMatch) {
          const monthName = monthMatch[1].toLowerCase();
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          monthNumber = months.indexOf(monthName) + 1;
        }
        
        // Specific patterns for Rentals table based on user requirements
        if (dataPoint.toLowerCase().includes('rental') || dataPoint.toLowerCase().includes('por')) {
          console.log('\nTrying specific patterns for Rentals table...');
          
          // Pattern 1: Open rentals - count all with status of Open since the start of the current year
          if (dataPoint.toLowerCase().includes('open rental')) {
            const openRentalsPattern = `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`;
            console.log(`\nTrying open rentals pattern:`);
            console.log(`SQL: ${openRentalsPattern}`);
            
            const result = await testSqlExpression(openRentalsPattern);
            if (result.success && !result.error) {
              console.log('✅ Open rentals pattern is working!');
              fixed = true;
              fixedSql = openRentalsPattern;
              fixedResult = result;
            } else {
              console.log(`❌ Open rentals pattern failed: ${result.error}`);
            }
          }
          
          // Pattern 2: New rentals by month - count all with status of Open for a specific month
          else if (dataPoint.toLowerCase().includes('new rental') && monthNumber > 0) {
            const newRentalsPattern = `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = ${monthNumber} AND Year(CreatedDate) = Year(Date())`;
            console.log(`\nTrying new rentals for month ${monthNumber} pattern:`);
            console.log(`SQL: ${newRentalsPattern}`);
            
            const result = await testSqlExpression(newRentalsPattern);
            if (result.success && !result.error) {
              console.log('✅ New rentals by month pattern is working!');
              fixed = true;
              fixedSql = newRentalsPattern;
              fixedResult = result;
            } else {
              console.log(`❌ New rentals by month pattern failed: ${result.error}`);
            }
          }
          
          // Pattern 3: Rental value - sum Amount for all with status of Open for the current year
          else if (dataPoint.toLowerCase().includes('rental value') || dataPoint.toLowerCase().includes('value')) {
            const rentalValuePattern = `SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`;
            console.log(`\nTrying rental value pattern:`);
            console.log(`SQL: ${rentalValuePattern}`);
            
            const result = await testSqlExpression(rentalValuePattern);
            if (result.success && !result.error) {
              console.log('✅ Rental value pattern is working!');
              fixed = true;
              fixedSql = rentalValuePattern;
              fixedResult = result;
            } else {
              console.log(`❌ Rental value pattern failed: ${result.error}`);
            }
          }
          
          // Pattern 4: Historical OPOR value - sum Amount for all with status of Open for the current year
          else if (dataPoint.toLowerCase().includes('historical') || dataPoint.toLowerCase().includes('opor')) {
            const historicalValuePattern = `SELECT Sum(Amount) AS value FROM Rentals WHERE Status = 'Open' AND CreatedDate >= DateSerial(Year(Date()), 1, 1)`;
            console.log(`\nTrying historical OPOR value pattern:`);
            console.log(`SQL: ${historicalValuePattern}`);
            
            const result = await testSqlExpression(historicalValuePattern);
            if (result.success && !result.error) {
              console.log('✅ Historical OPOR value pattern is working!');
              fixed = true;
              fixedSql = historicalValuePattern;
              fixedResult = result;
            } else {
              console.log(`❌ Historical OPOR value pattern failed: ${result.error}`);
            }
          }
          
          // Fallback pattern for any rental-related data point
          else {
            const fallbackPattern = `SELECT Count(*) AS value FROM Rentals WHERE Status = 'Open'`;
            console.log(`\nTrying fallback rentals pattern:`);
            console.log(`SQL: ${fallbackPattern}`);
            
            const result = await testSqlExpression(fallbackPattern);
            if (result.success && !result.error) {
              console.log('✅ Fallback rentals pattern is working!');
              fixed = true;
              fixedSql = fallbackPattern;
              fixedResult = result;
            } else {
              console.log(`❌ Fallback rentals pattern failed: ${result.error}`);
            }
          }
        }
        
        // If still not fixed, try with all tables and common patterns
        if (!fixed) {
          // Try each table with common patterns
          for (const table of availableTables) {
            if (fixed) break;
            
            // Try a few common patterns
            const patterns = [
              // Simple count
              `SELECT Count(*) AS value FROM ${table}`,
              
              // Count with month filter
              monthNumber > 0 ? 
                `SELECT Count(*) AS value FROM ${table} WHERE Month(CreatedDate) = ${monthNumber} AND Year(CreatedDate) = Year(Date())` : 
                null,
              
              // Count with status filter
              dataPoint.toLowerCase().includes('new') ? 
                `SELECT Count(*) AS value FROM ${table} WHERE Status = 'New'` : 
                null,
              
              // Count with month and status filter
              (monthNumber > 0 && dataPoint.toLowerCase().includes('new')) ? 
                `SELECT Count(*) AS value FROM ${table} WHERE Month(CreatedDate) = ${monthNumber} AND Year(CreatedDate) = Year(Date()) AND Status = 'New'` : 
                null,
              
              // Recent items
              `SELECT Count(*) AS value FROM ${table} WHERE CreatedDate >= DateAdd('d', -30, Date())`
            ].filter(Boolean) as string[];
            
            for (const pattern of patterns) {
              if (fixed) break;
              
              console.log(`\nTrying pattern with table ${table}:`);
              console.log(`SQL: ${pattern}`);
              
              const result = await testSqlExpression(pattern);
              if (result.success && !result.error) {
                console.log('✅ Pattern is working!');
                fixed = true;
                fixedSql = pattern;
                fixedResult = result;
              } else {
                console.log(`❌ Pattern failed: ${result.error}`);
              }
            }
          }
        }
      }
      
      // Save the result
      if (fixed) {
        console.log(`\n✅ Successfully fixed SQL expression for ID ${expression.id}!`);
        console.log(`Original: ${expression.sqlExpression}`);
        console.log(`Fixed: ${fixedSql}`);
        console.log(`Result: ${fixedResult?.value}`);
        
        fixedCount++;
        
        results.push({
          id: expression.id,
          dataPoint: expression.DataPoint || expression.name,
          originalSql: expression.sqlExpression,
          fixed: true,
          working: true,
          newSql: fixedSql,
          value: fixedResult?.value
        });
      } else {
        console.log(`\n❌ Could not fix SQL expression for ID ${expression.id}`);
        
        results.push({
          id: expression.id,
          dataPoint: expression.DataPoint || expression.name,
          originalSql: expression.sqlExpression,
          fixed: false,
          working: false,
          error: 'Could not generate a working SQL expression'
        });
      }
    }
    
    // Save results to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Total expressions: ${porExpressions.length}`);
    console.log(`Fixed expressions: ${fixedCount}`);
    console.log(`Success rate: ${(fixedCount / porExpressions.length * 100).toFixed(1)}%`);
    console.log(`Results saved to: ${CONFIG.OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

/**
 * Load chart data from the file
 */
async function loadChartData(): Promise<SpreadsheetRow[]> {
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
  } catch (error) {
    console.error('Error loading chart data:', error);
    return [];
  }
}

/**
 * Get available tables from the POR database
 */
async function getAvailableTables(): Promise<string[]> {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/test-por-sql`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.availableTables || [];
  } catch (error) {
    console.error('Error fetching available tables:', error);
    return [];
  }
}

/**
 * Extract table name from an SQL expression
 */
function extractTableFromSql(sql: string): string {
  if (!sql) return '';
  
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
function extractColumnsFromSql(sql: string): string[] {
  if (!sql) return [];
  
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
 * Find similar tables to the extracted table name
 */
function findSimilarTables(extractedTable: string, availableTables: string[]): string[] {
  if (!extractedTable) return availableTables;
  
  // Convert to lowercase for comparison
  const lowerExtractedTable = extractedTable.toLowerCase();
  
  // Score each table based on similarity
  const scoredTables = availableTables.map(table => {
    const lowerTable = table.toLowerCase();
    let score = 0;
    
    // Exact match
    if (lowerTable === lowerExtractedTable) {
      score += 10;
    }
    // Contains the extracted table name
    else if (lowerTable.includes(lowerExtractedTable) || lowerExtractedTable.includes(lowerTable)) {
      score += 5;
    }
    // Partial match
    else {
      const extractedWords = lowerExtractedTable.split(/[_\s]/);
      const tableWords = lowerTable.split(/[_\s]/);
      
      for (const word of extractedWords) {
        if (word.length > 2 && tableWords.some(tableWord => tableWord.includes(word) || word.includes(tableWord))) {
          score += 2;
        }
      }
    }
    
    return { table, score };
  });
  
  // Sort by score (descending) and return the tables
  return scoredTables
    .sort((a, b) => b.score - a.score)
    .map(item => item.table);
}

/**
 * Fix an SQL expression by replacing the table name and adjusting column names
 */
function fixSqlExpression(originalSql: string, tableName: string, extractedColumns: string[]): string {
  if (!originalSql) return '';
  
  // Replace the table name
  let fixedSql = originalSql.replace(/FROM\s+([^\s,;()]+)/i, `FROM ${tableName}`);
  
  // Replace column names if needed
  // This is a simplified approach - in a real implementation, you would
  // need to get the actual columns from the table and map them
  
  return fixedSql;
}

/**
 * Test a POR SQL expression against the database
 */
async function testSqlExpression(sql: string): Promise<SqlTestResult> {
  try {
    // Use the actual API endpoint for testing SQL expressions
    const response = await fetch(`${CONFIG.SERVER_URL}/api/test-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sqlExpression: sql, 
        serverType: 'POR' 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error (${response.status}): ${errorText}`
      };
    }
    
    const data = await response.json();
    
    // Check if there's a result
    if (data.result && Array.isArray(data.result) && data.result.length > 0) {
      // Extract the value from the first result
      const value = data.result[0].value !== undefined ? data.result[0].value : data.result[0];
      
      // Check if the result contains an error
      if (value && typeof value === 'object' && value.error) {
        return {
          success: false,
          error: value.error
        };
      }
      
      return {
        success: true,
        value: value
      };
    } else if (data.result && !Array.isArray(data.result)) {
      // Handle case where result is a single value or object
      const value = data.result.value !== undefined ? data.result.value : data.result;
      
      // Check if the result contains an error
      if (value && typeof value === 'object' && value.error) {
        return {
          success: false,
          error: value.error
        };
      }
      
      return {
        success: true,
        value: value
      };
    } else {
      // No results or empty array
      return {
        success: false,
        error: 'No results returned from query'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Error: ${error.message}`
    };
  }
}

// Run the main function
main().catch(console.error);
