import { NextResponse } from 'next/server';
import fs from 'fs';
import { ConnectionManager } from '@/lib/db/connection-manager';
import { fixPORSqlExpression, getAllPORSqlExpressions } from '@/lib/db/por-sql-fixer';

// Default POR file path
const DEFAULT_POR_FILE_PATH = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

export async function GET() {
  try {
    // Check if POR file exists
    if (!fs.existsSync(DEFAULT_POR_FILE_PATH)) {
      return NextResponse.json({
        error: `POR file not found at: ${DEFAULT_POR_FILE_PATH}`
      }, { status: 404 });
    }

    // POR configuration
    const porConfig = {
      filePath: DEFAULT_POR_FILE_PATH
    };

    // Get available tables
    const tablesResult = await ConnectionManager.executeAccessQuery(porConfig, 'SHOW TABLES');
    const availableTables = tablesResult.map((t: any) => t.TableName || t.value);

    // Test a few sample expressions with the fixed SQL
    const testResults = [];

    // Get all tables
    testResults.push({
      id: 'tables',
      description: 'List all tables in POR database',
      sql: 'SHOW TABLES',
      result: tablesResult
    });

    // Test a simple count query on AccountingTransaction table
    try {
      const accountingTransactionCountSql = "SELECT Count(*) AS value FROM AccountingTransaction";
      const accountingTransactionCountResult = await ConnectionManager.executeAccessQuery(porConfig, accountingTransactionCountSql);
      
      testResults.push({
        id: 'accountingTransactionCount',
        description: 'Count all records in AccountingTransaction table',
        sql: accountingTransactionCountSql,
        result: accountingTransactionCountResult
      });
    } catch (error: any) {
      testResults.push({
        id: 'accountingTransactionCount',
        description: 'Count all records in AccountingTransaction table',
        sql: "SELECT Count(*) AS value FROM AccountingTransaction",
        error: error.message
      });
    }

    // Test a sample of fixed POR SQL expressions
    const porExpressions = getAllPORSqlExpressions().slice(0, 5); // Just test first 5
    
    for (const expr of porExpressions) {
      try {
        const fixedSql = fixPORSqlExpression(expr.sql, availableTables);
        const result = await ConnectionManager.executeAccessQuery(porConfig, fixedSql);
        
        testResults.push({
          id: expr.id,
          description: expr.dataPoint,
          originalSql: expr.sql,
          fixedSql,
          result
        });
      } catch (error: any) {
        testResults.push({
          id: expr.id,
          description: expr.dataPoint,
          originalSql: expr.sql,
          fixedSql: fixPORSqlExpression(expr.sql, availableTables),
          error: error.message
        });
      }
    }

    // Return results
    return NextResponse.json({
      results: testResults,
      availableTables,
      porFilePath: DEFAULT_POR_FILE_PATH
    });
  } catch (error: any) {
    console.error('Error in test-por-sql:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
