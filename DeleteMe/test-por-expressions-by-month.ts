/**
 * Test POR Expressions By Month
 * 
 * This script tests each POR SQL expression against the database
 * and reports non-zero results for each time period.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3004',
  POR_SQL_FILE: path.join(process.cwd(), 'scripts', 'por-dashboard-sql.json'),
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-nonzero-results.json')
};

// Alternative SQL expressions to try for each month
const ALTERNATIVE_EXPRESSIONS = [
  // For New Rentals by month
  {
    pattern: "New Rentals",
    expressions: [
      (month: number) => `SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM CustomerJobSite WHERE Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM CustomerFile WHERE Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM PurchaseOrder WHERE Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
    ]
  },
  // For Open Rentals by month
  {
    pattern: "Open Rentals",
    expressions: [
      (month: number) => `SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM CustomerFile WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM PurchaseOrder WHERE Status = 'Open' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
    ]
  },
  // For Rental Value by month
  {
    pattern: "Rental Value",
    expressions: [
      (month: number) => `SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`,
      (month: number) => `SELECT Count(*) AS value FROM PurchaseOrder WHERE Status = 'Open' AND Month(CreatedDate) = ${month} AND Year(CreatedDate) = Year(Date())`
    ]
  }
];

// Month mapping
const MONTHS = [
  { name: "Jan", number: 1 },
  { name: "Feb", number: 2 },
  { name: "Mar", number: 3 },
  { name: "Apr", number: 4 },
  { name: "May", number: 5 },
  { name: "Jun", number: 6 },
  { name: "Jul", number: 7 },
  { name: "Aug", number: 8 },
  { name: "Sep", number: 9 },
  { name: "Oct", number: 10 },
  { name: "Nov", number: 11 },
  { name: "Dec", number: 12 }
];

// Define interfaces for type safety
interface PorSqlExpression {
  id: string;
  DataPoint: string;
  productionSqlExpression: string;
  [key: string]: any;
}

interface TestResult {
  id: string;
  dataPoint: string;
  month: string;
  metricType: string;
  originalSql: string;
  bestSql: string;
  value: number;
  nonZero: boolean;
}

interface SqlResponse {
  success: boolean;
  result?: any;
  error?: string;
}

async function main() {
  console.log('Test POR Expressions By Month');
  console.log('============================\n');
  
  try {
    // Load POR SQL expressions
    console.log('Loading POR SQL expressions...');
    const porSqlData = JSON.parse(fs.readFileSync(CONFIG.POR_SQL_FILE, 'utf8')) as PorSqlExpression[];
    console.log(`Loaded ${porSqlData.length} POR SQL expressions.`);
    
    // Get available tables
    console.log('\nFetching available tables from POR database...');
    const availableTables = await getAvailableTables();
    console.log(`Found ${availableTables.length} tables in POR database.`);
    
    // Test each expression
    console.log('\nTesting SQL expressions for non-zero results...');
    
    const results: TestResult[] = [];
    
    for (const expr of porSqlData) {
      const dataPoint = expr.DataPoint || '';
      console.log(`\nTesting: ${dataPoint}`);
      
      // Extract month from data point
      let month = 0;
      for (const m of MONTHS) {
        if (dataPoint.includes(m.name)) {
          month = m.number;
          break;
        }
      }
      
      // Extract metric type (New Rentals, Open Rentals, Rental Value)
      let metricType = '';
      if (dataPoint.includes('New Rentals')) {
        metricType = 'New Rentals';
      } else if (dataPoint.includes('Open Rentals')) {
        metricType = 'Open Rentals';
      } else if (dataPoint.includes('Rental Value')) {
        metricType = 'Rental Value';
      }
      
      // Test original SQL
      console.log(`Original SQL: ${expr.productionSqlExpression}`);
      let originalResult = null;
      let originalSuccess = false;
      
      try {
        const response = await testSql(expr.productionSqlExpression);
        originalResult = response.result;
        originalSuccess = response.success;
        
        if (originalSuccess) {
          const value = originalResult && originalResult.value !== undefined ? originalResult.value : 0;
          console.log(`✅ Original SQL result: ${value}`);
        } else {
          console.log(`❌ Original SQL failed: ${response.error}`);
        }
      } catch (error: any) {
        console.error(`Error testing original SQL: ${error.message}`);
      }
      
      // Test alternative expressions if original failed or returned zero
      let bestResult = originalResult;
      let bestSql = expr.productionSqlExpression;
      let bestSuccess = originalSuccess;
      
      if (!originalSuccess || (originalResult && originalResult.value === 0)) {
        console.log('Testing alternative expressions...');
        
        // Find matching alternative expressions
        const alternatives = ALTERNATIVE_EXPRESSIONS.find(alt => dataPoint.includes(alt.pattern));
        
        if (alternatives && month > 0) {
          for (const altExprFn of alternatives.expressions) {
            const altSql = altExprFn(month);
            console.log(`Alternative SQL: ${altSql}`);
            
            try {
              const response = await testSql(altSql);
              
              if (response.success) {
                const value = response.result && response.result.value !== undefined ? response.result.value : 0;
                console.log(`✅ Alternative SQL result: ${value}`);
                
                // If this result is better (non-zero), use it
                if (value > 0 && (!bestSuccess || (bestResult && bestResult.value === 0))) {
                  bestResult = response.result;
                  bestSql = altSql;
                  bestSuccess = true;
                }
              } else {
                console.log(`❌ Alternative SQL failed: ${response.error}`);
              }
            } catch (error: any) {
              console.error(`Error testing alternative SQL: ${error.message}`);
            }
          }
        }
      }
      
      // Save result
      const value = bestResult && bestResult.value !== undefined ? bestResult.value : 0;
      
      results.push({
        id: expr.id,
        dataPoint: dataPoint,
        month: month > 0 ? MONTHS.find(m => m.number === month)?.name || '' : '',
        metricType: metricType,
        originalSql: expr.productionSqlExpression,
        bestSql: bestSql,
        value: value,
        nonZero: value > 0
      });
    }
    
    // Save results to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print non-zero results
    const nonZeroResults = results.filter(r => r.nonZero);
    console.log(`\nFound ${nonZeroResults.length} expressions with non-zero results:`);
    
    // Group by metric type and month
    const groupedResults: Record<string, TestResult[]> = {};
    
    for (const result of nonZeroResults) {
      const key = result.metricType || 'Other';
      if (!groupedResults[key]) {
        groupedResults[key] = [];
      }
      groupedResults[key].push(result);
    }
    
    // Print grouped results
    for (const [metricType, metricResults] of Object.entries(groupedResults)) {
      console.log(`\n${metricType}:`);
      
      // Sort by month
      const sortedResults = metricResults.sort((a: TestResult, b: TestResult) => {
        const aMonth = a.month ? MONTHS.findIndex(m => m.name === a.month) : -1;
        const bMonth = b.month ? MONTHS.findIndex(m => m.name === b.month) : -1;
        return aMonth - bMonth;
      });
      
      for (const result of sortedResults) {
        console.log(`  ${result.dataPoint}: ${result.value}`);
        console.log(`  SQL: ${result.bestSql}`);
      }
    }
  } catch (error: any) {
    console.error('Error in main function:', error.message);
  }
}

async function getAvailableTables(): Promise<string[]> {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/test-por-sql`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.availableTables || [];
  } catch (error: any) {
    console.error('Error fetching available tables:', error.message);
    return [];
  }
}

async function testSql(sql: string): Promise<SqlResponse> {
  try {
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

main().catch(console.error);
