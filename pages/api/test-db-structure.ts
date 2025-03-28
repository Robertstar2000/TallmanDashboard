import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/sqlite';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing database structure...');
    const db = await getDb();
    
    // Get all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    
    // Check chart_data table structure
    let chartDataColumns: any[] = [];
    let sampleRow: any = null;
    let missingProdSqlCount = 0;
    
    if (tables.some((t: any) => t.name === 'chart_data')) {
      chartDataColumns = await db.all("PRAGMA table_info(chart_data)");
      
      // Get a sample row
      sampleRow = await db.get("SELECT * FROM chart_data LIMIT 1");
      
      // Check for rows missing production_sql_expression
      const missingResult = await db.get(
        "SELECT COUNT(*) as count FROM chart_data WHERE production_sql_expression IS NULL OR production_sql_expression = ''"
      );
      missingProdSqlCount = missingResult.count;
    }
    
    // Check test_data_mapping table
    let testDataExists = tables.some((t: any) => t.name === 'test_data_mapping');
    let testDataCount = 0;
    let testDataSample: any[] = [];
    
    if (testDataExists) {
      const countResult = await db.get("SELECT COUNT(*) as count FROM test_data_mapping");
      testDataCount = countResult.count;
      
      if (testDataCount > 0) {
        testDataSample = await db.all("SELECT * FROM test_data_mapping LIMIT 5");
      }
    }
    
    // Return the results
    res.status(200).json({
      success: true,
      tables: tables.map((t: any) => t.name),
      chartDataColumns: chartDataColumns.map((c: any) => ({ 
        name: c.name, 
        type: c.type 
      })),
      hasProdSqlExpr: chartDataColumns.some((c: any) => c.name === 'production_sql_expression'),
      sampleRow,
      missingProdSqlCount,
      testDataExists,
      testDataCount,
      testDataSample
    });
  } catch (error) {
    console.error('Error testing database structure:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
