/**
 * Update POR Historical Data SQL
 * 
 * This script updates the admin_variables table with MS Access compatible SQL
 * for the Historical Data POR rows.
 */

import { executeWrite } from '../lib/db/sqlite';

interface AdminVariable {
  id: string;
  name: string;
  value: string;
  category: string;
  chart_group: string;
  chart_name: string;
  variable_name: string;
  server_name: string;
  sql_expression: string;
  production_sql_expression: string;
  table_name: string;
  timeframe?: string;
}

async function updatePorHistoricalDataSql() {
  try {
    console.log('Updating POR Historical Data SQL...');
    
    // Get all Historical Data POR rows
    const sql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'";
    const result = await executeWrite(sql);
    const porHistoricalRows = Array.isArray(result) ? result as AdminVariable[] : [];
    
    console.log(`Found ${porHistoricalRows.length} Historical Data POR rows`);
    
    if (porHistoricalRows.length === 0) {
      console.log('No Historical Data POR rows found. Creating them...');
      
      // Create 12 months of Historical Data POR rows
      for (let i = 1; i <= 12; i++) {
        const monthOffset = i === 1 ? 0 : -(i - 1);
        
        // MS Access SQL for the month
        const msAccessSql = `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
        
        // SQL Server SQL for the month (for reference)
        const sqlServerSql = `SELECT ISNULL(SUM([Total]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(DATEADD(month, ${monthOffset}, GETDATE()), 'yyyy-MM')`;
        
        // Insert the row
        const insertSql = `
          INSERT INTO admin_variables (
            name, 
            value, 
            category, 
            chart_group, 
            chart_name, 
            variable_name, 
            server_name, 
            sql_expression, 
            production_sql_expression,
            table_name,
            timeframe
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await executeWrite(insertSql, [
          `Historical Data - POR - Month ${i}`,
          "0",
          "POR",
          "Historical Data",
          "Historical Data",
          "POR",
          "POR",
          sqlServerSql,
          msAccessSql,
          "PurchaseOrder",
          `Month ${i}`
        ]);
        
        console.log(`Created Historical Data POR row for Month ${i}`);
      }
    } else {
      // Update existing rows
      for (const row of porHistoricalRows) {
        // Extract month number from timeframe
        const monthMatch = row.timeframe?.match(/Month (\d+)/);
        if (!monthMatch) {
          console.log(`Skipping row ${row.id} - could not determine month number`);
          continue;
        }
        
        const monthNumber = parseInt(monthMatch[1]);
        const monthOffset = monthNumber === 1 ? 0 : -(monthNumber - 1);
        
        // MS Access SQL for the month
        const msAccessSql = `SELECT Sum(Nz([Total],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
        
        // Update the row
        const updateSql = `
          UPDATE admin_variables 
          SET production_sql_expression = ?, table_name = ?
          WHERE id = ?
        `;
        
        await executeWrite(updateSql, [msAccessSql, "PurchaseOrder", row.id]);
        
        console.log(`Updated Historical Data POR row for Month ${monthNumber}`);
      }
    }
    
    console.log('POR Historical Data SQL update complete');
    
    // Verify the update
    const verifyResult = await executeWrite("SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR'");
    const updatedRows = Array.isArray(verifyResult) ? verifyResult as AdminVariable[] : [];
    
    console.log(`\nVerified ${updatedRows.length} Historical Data POR rows`);
    
    // Display the updated rows
    if (updatedRows.length > 0) {
      updatedRows.forEach(row => {
        console.log(`\n${row.name} (${row.timeframe}):`);
        console.log(`Production SQL: ${row.production_sql_expression}`);
      });
    }
  } catch (error) {
    console.error('Error updating POR Historical Data SQL:', error instanceof Error ? error.message : String(error));
  }
}

// Run the update
updatePorHistoricalDataSql().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
