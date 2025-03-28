/**
 * Setup POR Overview Group
 * 
 * This script sets up the POR Overview Group in the admin_variables table
 * with MS Access compatible SQL queries.
 */

import { executeWrite } from '../lib/db/sqlite';
import fs from 'fs';

interface AdminVariable {
  id?: string;
  name: string;
  value: string | number;
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

async function setupPorOverviewGroup() {
  try {
    console.log('Setting up POR Overview Group...');
    
    // Check if the admin_variables table exists
    const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_variables'";
    const tableResult = await executeWrite(tableCheckSql);
    
    if (!Array.isArray(tableResult) || tableResult.length === 0) {
      console.log('admin_variables table does not exist, creating it...');
      
      // Create the admin_variables table
      const createTableSql = `
        CREATE TABLE admin_variables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          value TEXT,
          category TEXT,
          chart_group TEXT,
          chart_name TEXT,
          variable_name TEXT,
          server_name TEXT,
          sql_expression TEXT,
          production_sql_expression TEXT,
          table_name TEXT,
          timeframe TEXT
        )
      `;
      
      await executeWrite(createTableSql);
      console.log('Created admin_variables table');
    }
    
    // Check if there are any POR Overview Group rows
    const checkSql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
    const checkResult = await executeWrite(checkSql);
    const count = Array.isArray(checkResult) && checkResult.length > 0 ? checkResult[0].count : 0;
    
    console.log(`Found ${count} existing POR Overview Group rows`);
    
    // Define the POR Overview Group rows
    const porOverviewRows: AdminVariable[] = [
      {
        name: "POR - Total Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Total Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder]",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder]",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Open Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Open Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE [Status] = 'O'",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE [Status] = 'O'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Completed Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Completed Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE [Status] = 'C'",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE [Status] = 'C'",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Total Purchase Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Total Purchase Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder]",
        production_sql_expression: "SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder]",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Average Purchase Order Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Average Purchase Order Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(AVG([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE [TotalAmount] > 0",
        production_sql_expression: "SELECT Avg(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE [TotalAmount] > 0",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Current Month Purchase Orders",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Current Month Purchase Orders",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT COUNT(*) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')",
        production_sql_expression: "SELECT Count(*) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')",
        table_name: "PurchaseOrder"
      },
      {
        name: "POR - Current Month Purchase Amount",
        value: "0",
        category: "POR",
        chart_group: "Overview",
        chart_name: "Current Month Purchase Amount",
        variable_name: "POR",
        server_name: "POR",
        sql_expression: "SELECT ISNULL(SUM([TotalAmount]), 0) as value FROM [PurchaseOrder] WHERE FORMAT([Date], 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')",
        production_sql_expression: "SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')",
        table_name: "PurchaseOrder"
      }
    ];
    
    if (count === 0) {
      console.log('No POR Overview Group rows found, creating them...');
      
      // Insert the rows
      for (const row of porOverviewRows) {
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
            table_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await executeWrite(insertSql, [
          row.name,
          row.value.toString(),
          row.category,
          row.chart_group,
          row.chart_name,
          row.variable_name,
          row.server_name,
          row.sql_expression,
          row.production_sql_expression,
          row.table_name
        ]);
        
        console.log(`Created POR Overview row: ${row.name}`);
      }
      
      console.log(`Created ${porOverviewRows.length} POR Overview Group rows`);
    } else {
      console.log(`Found ${count} existing POR Overview Group rows, updating them...`);
      
      // Get the existing rows
      const existingRowsSql = "SELECT * FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
      const existingRowsResult = await executeWrite(existingRowsSql);
      const existingRows = Array.isArray(existingRowsResult) ? existingRowsResult : [];
      
      // Update each row
      for (const existingRow of existingRows) {
        // Find the corresponding new row
        const newRow = porOverviewRows.find(r => r.chart_name === existingRow.chart_name);
        
        if (newRow) {
          // Update the row
          const updateSql = `
            UPDATE admin_variables 
            SET production_sql_expression = ?, 
                sql_expression = ?,
                table_name = ?
            WHERE id = ?
          `;
          
          await executeWrite(updateSql, [
            newRow.production_sql_expression,
            newRow.sql_expression,
            newRow.table_name,
            existingRow.id
          ]);
          
          console.log(`Updated POR Overview row: ${existingRow.name}`);
        }
      }
    }
    
    // Save the POR Overview Group SQL to a file for reference
    const porOverviewSql = porOverviewRows.map(row => ({
      name: row.name,
      chart_name: row.chart_name,
      sqlExpression: row.sql_expression,
      productionSqlExpression: row.production_sql_expression
    }));
    
    fs.writeFileSync('por-overview-group-sql.json', JSON.stringify(porOverviewSql, null, 2));
    console.log('\nSaved POR Overview Group SQL to por-overview-group-sql.json');
    
    // Verify the rows
    const verifySql = "SELECT COUNT(*) as count FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
    const verifyResult = await executeWrite(verifySql);
    const verifyCount = Array.isArray(verifyResult) && verifyResult.length > 0 ? verifyResult[0].count : 0;
    
    console.log(`\nVerified ${verifyCount} POR Overview Group rows in the admin_variables table`);
    
    // Display a sample row
    const sampleSql = "SELECT * FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR' LIMIT 1";
    const sampleResult = await executeWrite(sampleSql);
    
    if (Array.isArray(sampleResult) && sampleResult.length > 0) {
      console.log('\nSample POR Overview Group row:');
      console.log(`Name: ${sampleResult[0].name}`);
      console.log(`Chart Name: ${sampleResult[0].chart_name}`);
      console.log(`Production SQL: ${sampleResult[0].production_sql_expression}`);
    }
    
    console.log('\nPOR Overview Group setup complete');
  } catch (error) {
    console.error('Error setting up POR Overview Group:', error instanceof Error ? error.message : String(error));
  }
}

// Run the setup
setupPorOverviewGroup().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
