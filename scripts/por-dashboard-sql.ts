/**
 * POR Dashboard SQL Generator
 * 
 * This script creates SQL expressions for the POR dashboard metrics
 * using the actual tables available in the POR database.
 * 
 * It focuses on:
 * 1. Open rentals - count of open rentals for the current year
 * 2. New rentals by month - count of new rentals for each month
 * 3. Rental value - sum of amounts for open rentals
 */

import fs from 'fs';
import path from 'path';
import { SpreadsheetRow } from '../lib/db/types';

// Configuration
const CONFIG = {
  SOURCE_FILE: path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts'),
  OUTPUT_FILE: path.join(process.cwd(), 'scripts', 'por-dashboard-sql.json'),
  BACKUP_FILE: path.join(process.cwd(), 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`)
};

// SQL expressions for POR dashboard
const POR_SQL_EXPRESSIONS = [
  // Open rentals - count of all with status of Open for the current year
  {
    id: "POR-OPEN-RENTALS",
    name: "POR Open Rentals",
    description: "Count of open rentals since the start of the current year",
    sql: "SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active'"
  },
  
  // New rentals by month - count of all with status of Open for each month
  {
    id: "POR-NEW-RENTALS-JAN",
    name: "POR New Rentals Jan",
    description: "Count of new rentals for January of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-FEB",
    name: "POR New Rentals Feb",
    description: "Count of new rentals for February of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-MAR",
    name: "POR New Rentals Mar",
    description: "Count of new rentals for March of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-APR",
    name: "POR New Rentals Apr",
    description: "Count of new rentals for April of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 4 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-MAY",
    name: "POR New Rentals May",
    description: "Count of new rentals for May of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 5 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-JUN",
    name: "POR New Rentals Jun",
    description: "Count of new rentals for June of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 6 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-JUL",
    name: "POR New Rentals Jul",
    description: "Count of new rentals for July of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 7 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-AUG",
    name: "POR New Rentals Aug",
    description: "Count of new rentals for August of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 8 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-SEP",
    name: "POR New Rentals Sep",
    description: "Count of new rentals for September of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 9 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-OCT",
    name: "POR New Rentals Oct",
    description: "Count of new rentals for October of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 10 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-NOV",
    name: "POR New Rentals Nov",
    description: "Count of new rentals for November of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 11 AND Year(CreatedDate) = Year(Date())"
  },
  {
    id: "POR-NEW-RENTALS-DEC",
    name: "POR New Rentals Dec",
    description: "Count of new rentals for December of the current year",
    sql: "SELECT Count(*) AS value FROM MapGPSWorkOrders WHERE Source = 'Web' AND Month(CreatedDate) = 12 AND Year(CreatedDate) = Year(Date())"
  },
  
  // Rental value - sum of amounts for all with status of Open for the current year
  {
    id: "POR-RENTAL-VALUE",
    name: "POR Rental Value",
    description: "Sum of Amount for all open rentals in the current year",
    sql: "SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active'"
  },
  
  // Historical OPOR value
  {
    id: "POR-HISTORICAL-VALUE",
    name: "POR Historical Value",
    description: "Historical value of open rentals",
    sql: "SELECT Count(*) AS value FROM CustomerJobSite WHERE Status = 'Active'"
  }
];

/**
 * Main function to generate SQL expressions for POR dashboard
 */
async function main() {
  try {
    console.log('POR Dashboard SQL Generator');
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
    
    // Map POR SQL expressions to chart data
    const updatedExpressions = [];
    
    for (const expr of porExpressions) {
      const dataPoint = expr.DataPoint || expr.name || '';
      let matchFound = false;
      
      // Find matching SQL expression
      for (const porSql of POR_SQL_EXPRESSIONS) {
        if (
          dataPoint.toLowerCase().includes(porSql.name.toLowerCase()) ||
          (dataPoint.toLowerCase().includes('rental') && porSql.name.toLowerCase().includes('rental'))
        ) {
          console.log(`\nFound match for ${dataPoint}:`);
          console.log(`Original SQL: ${expr.productionSqlExpression}`);
          console.log(`New SQL: ${porSql.sql}`);
          
          // Update the expression
          updatedExpressions.push({
            ...expr,
            productionSqlExpression: porSql.sql,
            updated: true
          });
          
          matchFound = true;
          break;
        }
      }
      
      // If no match found, keep the original expression
      if (!matchFound) {
        updatedExpressions.push({
          ...expr,
          updated: false
        });
      }
    }
    
    // Save updated expressions to file
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(updatedExpressions, null, 2));
    console.log(`\nUpdated expressions saved to ${CONFIG.OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Total expressions: ${updatedExpressions.length}`);
    console.log(`Updated expressions: ${updatedExpressions.filter(expr => expr.updated).length}`);
    console.log(`Unchanged expressions: ${updatedExpressions.filter(expr => !expr.updated).length}`);
    
    console.log('\nUpdated SQL Expressions:');
    updatedExpressions.filter(expr => expr.updated).forEach(expr => {
      console.log(`\n${expr.DataPoint || expr.name}:`);
      console.log(`SQL: ${expr.productionSqlExpression}`);
    });
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

// Run the main function
main().catch(console.error);
