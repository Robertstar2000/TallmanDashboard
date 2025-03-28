/**
 * Test POR Overview Queries
 * 
 * This script tests the SQL queries generated for the POR Overview chart
 * by executing them against the POR database and displaying the results.
 */

import { PORDirectReader } from '../lib/db/por-direct-reader';
import { ServerConfig } from '../lib/db/connections';
import fs from 'fs';
import path from 'path';

interface AdminRow {
  chartName: string;
  variableName: string;
  server: string;
  tableName: string;
  sqlExpression?: string;
  productionSqlExpression: string;
  value: number;
}

async function testPOROverviewQueries() {
  console.log('Testing POR Overview Queries...');
  
  // Path to the MS Access database
  const dbPath = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.mdb';

  // Check if the database file exists
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: MS Access file not found at path: ${dbPath}`);
    console.error('Please ensure the file exists at the specified location.');
    return;
  }
  
  // Create a basic server config for POR
  const config: ServerConfig = {
    server: 'POR',
    database: 'POR',
    type: 'POR',
    username: '',
    password: '',
    port: 0,
    filePath: dbPath,
    options: {
      trustServerCertificate: true
    }
  };
  
  // Initialize POR Direct Reader
  const porReader = new PORDirectReader(dbPath);
  const connectionResult = await porReader.connect();
  
  if (!connectionResult.success) {
    console.error(`Failed to connect to POR database: ${connectionResult.message}`);
    return;
  }
  
  try {
    console.log('Connected to POR database');
    
    // Read the generated queries from the JSON file
    const rawQueriesData = JSON.parse(fs.readFileSync('por-overview-rows.json', 'utf8'));
    
    // Convert sqlExpression to productionSqlExpression
    const queriesData: AdminRow[] = rawQueriesData.map((row: any) => ({
      ...row,
      productionSqlExpression: row.sqlExpression,
      value: 0
    }));
    
    // Group queries by type
    const queryGroups = {
      'New Rentals': queriesData.filter(row => row.variableName.startsWith('New Rentals')),
      'Open Rentals': queriesData.filter(row => row.variableName.startsWith('Open Rentals')),
      'Rental Value': queriesData.filter(row => row.variableName.startsWith('Rental Value'))
    };
    
    // Prepare a report file
    let reportContent = '# POR Overview Queries Test Report\n\n';
    reportContent += `Test Date: ${new Date().toLocaleString()}\n\n`;
    
    // Test each group of queries
    for (const [groupName, queries] of Object.entries(queryGroups)) {
      console.log(`\n=== Testing ${groupName} Queries ===`);
      reportContent += `## ${groupName}\n\n`;
      
      for (const query of queries) {
        try {
          // Log to console (minimal output to avoid display issues)
          process.stdout.write(`Testing: ${query.variableName}... `);
          
          // Execute the query
          const result = await porReader.executeQuery(query.productionSqlExpression);
          
          // Get the result value
          const value = result && result.length > 0 ? Object.values(result[0])[0] : null;
          
          // Update the value in the query object
          query.value = value !== null ? Number(value) : 0;
          
          // Log success to console
          process.stdout.write(`Result: ${query.value}\n`);
          
          // Add to report
          reportContent += `### ${query.variableName}\n\n`;
          reportContent += `**SQL:**\n\`\`\`sql\n${query.productionSqlExpression}\n\`\`\`\n\n`;
          reportContent += `**Result:** ${query.value}\n\n`;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Log error to console
          process.stdout.write(`ERROR: ${errorMessage}\n`);
          
          // Add error to report
          reportContent += `### ${query.variableName}\n\n`;
          reportContent += `**SQL:**\n\`\`\`sql\n${query.productionSqlExpression}\n\`\`\`\n\n`;
          reportContent += `**Error:** ${errorMessage}\n\n`;
          
          console.error(`Error executing query for ${query.variableName}:`, errorMessage);
        }
      }
    }
    
    // Create a summary of the results
    console.log('\n=== Query Results Summary ===');
    reportContent += '## Summary of Results\n\n';
    
    for (const [groupName, queries] of Object.entries(queryGroups)) {
      console.log(`\n${groupName}:`);
      reportContent += `### ${groupName}\n\n`;
      reportContent += '| Month | Value |\n|-------|-------|\n';
      
      for (const query of queries) {
        console.log(`  ${query.variableName}: ${query.value}`);
        
        // Extract month from variable name
        const monthMatch = query.variableName.match(/([A-Za-z]+\s+'[0-9]{2})/);
        const month = monthMatch ? monthMatch[1] : query.variableName;
        
        reportContent += `| ${month} | ${query.value} |\n`;
      }
      
      reportContent += '\n';
    }
    
    // Save the updated queries with actual values
    fs.writeFileSync('por-overview-rows-with-values.json', JSON.stringify(queriesData, null, 2));
    
    // Create updated CSV with actual values
    const csvHeader = 'ChartName,VariableName,Server,TableName,ProductionSqlExpression,Value\n';
    const csvRows = queriesData.map(row => {
      return `"${row.chartName}","${row.variableName}","${row.server}","${row.tableName}","${row.productionSqlExpression.replace(/"/g, '""')}",${row.value}`;
    }).join('\n');
    
    fs.writeFileSync('por-overview-rows-with-values.csv', csvHeader + csvRows);
    
    // Save the detailed report
    fs.writeFileSync('por-overview-test-report.md', reportContent);
    
    console.log('\nTest completed. Results saved to:');
    console.log('- por-overview-rows-with-values.json');
    console.log('- por-overview-rows-with-values.csv');
    console.log('- por-overview-test-report.md');
  } catch (error) {
    console.error('Error testing POR Overview queries:', error instanceof Error ? error.message : String(error));
  } finally {
    // Close the connection
    await porReader.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testPOROverviewQueries().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
