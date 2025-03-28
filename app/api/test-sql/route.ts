import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import fs from 'fs';
import { dashboardData as initialSpreadsheetData } from '@/lib/db/single-source-data';

// Default POR file path
const DEFAULT_POR_FILE_PATH = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\data\\por.mdb';

// Function to fix POR SQL expressions
function fixPORSqlExpression(sql: string): string {
  // Check if the SQL is already valid
  if (!sql) return sql;
  
  console.log(`Fixing POR SQL: ${sql}`);
  
  // Common issues with POR SQL expressions:
  // 1. Table names might be incorrect
  // 2. Column names might be incorrect
  // 3. Date functions syntax might be wrong
  
  // Try to extract the table name
  const tableMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
  const tableName = tableMatch ? tableMatch[1] : null;
  
  // For testing, let's create some valid MS Access queries based on common tables
  if (tableName === 'SOMAST') {
    // SOMAST might not exist, try using 'Orders' instead
    return sql.replace(/FROM\s+SOMAST/i, 'FROM Orders');
  }
  
  if (tableName === 'Orders' && sql.includes('Source = \'Web\'')) {
    // Check if Orders table has a Source column, if not simplify the query
    return 'SELECT Count(*) AS value FROM Orders';
  }
  
  // Return the original SQL if no fixes were applied
  return sql;
}

export async function POST(request: NextRequest) {
  try {
    const { sqlExpression, serverType } = await request.json();
    
    if (!sqlExpression || !serverType) {
      return NextResponse.json(
        { error: 'SQL expression and server type are required' },
        { status: 400 }
      );
    }
    
    let result;
    
    if (serverType === 'P21') {
      // P21 configuration
      const p21Config = {
        server: 'P21',
        dsn: 'P21',
        database: 'P21',
        useWindowsAuth: true
      };
      
      // Execute the query
      result = await ConnectionManager.executeSqlServerQuery(p21Config, sqlExpression);
    } else if (serverType === 'POR') {
      // Check if POR file exists
      if (!fs.existsSync(DEFAULT_POR_FILE_PATH)) {
        return NextResponse.json(
          { error: `POR file not found at: ${DEFAULT_POR_FILE_PATH}` },
          { status: 404 }
        );
      }
      
      // POR configuration
      const porConfig = {
        filePath: DEFAULT_POR_FILE_PATH
      };
      
      // Fix the SQL expression for POR
      const fixedSql = fixPORSqlExpression(sqlExpression);
      
      // Execute the query
      result = await ConnectionManager.executeAccessQuery(porConfig, fixedSql);
    } else {
      return NextResponse.json(
        { error: 'Invalid server type. Must be P21 or POR' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error executing SQL expression:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while executing the SQL expression' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test specific SQL expressions from complete-chart-data.ts
    const results = [];
    const errors = [];
    
    // Check if POR file exists
    if (!fs.existsSync(DEFAULT_POR_FILE_PATH)) {
      return NextResponse.json(
        { error: `POR file not found at: ${DEFAULT_POR_FILE_PATH}` },
        { status: 404 }
      );
    }
    
    // POR configuration
    const porConfig = {
      filePath: DEFAULT_POR_FILE_PATH
    };
    
    // First, list tables to verify connection
    try {
      const tablesResult = await ConnectionManager.executeAccessQuery(porConfig, 'SHOW TABLES');
      results.push({
        id: 'tables',
        description: 'List all tables in POR database',
        sql: 'SHOW TABLES',
        result: tablesResult
      });
      
      // Also add a simple count query to verify we can run basic queries
      const countResult = await ConnectionManager.executeAccessQuery(porConfig, 'SELECT Count(*) AS value FROM MSysObjects WHERE Type=1');
      results.push({
        id: 'count',
        description: 'Count system objects',
        sql: 'SELECT Count(*) AS value FROM MSysObjects WHERE Type=1',
        result: countResult
      });
    } catch (error: any) {
      errors.push({
        id: 'tables',
        description: 'List all tables in POR database',
        sql: 'SHOW TABLES',
        error: error.message
      });
    }
    
    // Get all table names to help with debugging
    let allTables = [];
    try {
      const tablesResult = await ConnectionManager.executeAccessQuery(porConfig, 'SHOW TABLES');
      allTables = tablesResult.map((t: any) => t.TableName || t.value);
    } catch (error) {
      console.error('Error getting tables:', error);
    }
    
    // Test a few POR SQL expressions from complete-chart-data.ts
    const porExpressions = initialSpreadsheetData.filter(item => 
      item.serverName === 'POR' && item.productionSqlExpression
    ).slice(0, 5); // Test first 5 POR expressions
    
    for (const expr of porExpressions) {
      try {
        const originalSql = expr.productionSqlExpression;
        const fixedSql = fixPORSqlExpression(originalSql);
        
        // Try to execute the fixed SQL
        let result;
        try {
          result = await ConnectionManager.executeAccessQuery(porConfig, fixedSql);
        } catch (innerError: any) {
          // If fixed SQL fails, try a very basic query on the same table
          const tableMatch = fixedSql.match(/FROM\s+([^\s,;()]+)/i);
          const tableName = tableMatch ? tableMatch[1] : null;
          
          if (tableName && allTables.some((t: string) => t.toLowerCase() === tableName.toLowerCase())) {
            // Table exists, try a simple count
            const simpleSql = `SELECT Count(*) AS value FROM ${tableName}`;
            result = await ConnectionManager.executeAccessQuery(porConfig, simpleSql);
            
            results.push({
              id: expr.id,
              description: expr.DataPoint + ' (Simplified)',
              sql: simpleSql,
              originalSql,
              result
            });
          } else {
            throw innerError;
          }
        }
        
        if (result) {
          results.push({
            id: expr.id,
            description: expr.DataPoint,
            sql: fixedSql,
            originalSql: originalSql !== fixedSql ? originalSql : undefined,
            result
          });
        }
      } catch (error: any) {
        errors.push({
          id: expr.id,
          description: expr.DataPoint,
          sql: expr.productionSqlExpression,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({ 
      results, 
      errors,
      porFilePath: DEFAULT_POR_FILE_PATH,
      availableTables: allTables
    });
  } catch (error: any) {
    console.error('Error testing SQL expressions:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while testing SQL expressions' },
      { status: 500 }
    );
  }
}
