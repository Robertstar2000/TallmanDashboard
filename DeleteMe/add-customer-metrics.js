/**
 * Add Customer Metrics Script
 * This script:
 * 1. Adds 24 rows for the Customer Metrics chart group
 */

const fs = require('fs');
const path = require('path');

// Template for customer metrics rows
const customerMetricsTemplate = {
  name: "Customer Metrics",
  chartName: "Customers",
  variableName: "Customer",
  serverName: "P21",
  value: "0",
  chartGroup: "Customer Metrics",
  calculation: "COUNT(*)",
  sqlExpression: "SELECT COUNT(*) as value FROM customers",
  productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)",
  tableName: "customer"
};

// Main function to add customer metrics
async function addCustomerMetrics() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-add-customers-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find where to insert the customer metrics rows (after Historical Data)
    const historicalDataEndMarker = 'chartGroup: "Historical Data"';
    const lastHistoricalDataIndex = fileContent.lastIndexOf(historicalDataEndMarker);
    
    if (lastHistoricalDataIndex === -1) {
      console.error('Could not find Historical Data chart group in the file');
      return;
    }
    
    // Find the end of the object containing the last Historical Data row
    let braceCount = 0;
    let endIndex = lastHistoricalDataIndex;
    let inString = false;
    
    for (let i = lastHistoricalDataIndex; i < fileContent.length; i++) {
      const char = fileContent[i];
      
      if (char === '"' && fileContent[i-1] !== '\\') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
    }
    
    // Generate 24 customer metrics rows (12 months × 2 metrics: New, Returning)
    const customerMetricsRows = [];
    let nextId = 1000; // Start with a high ID to avoid conflicts
    
    // Find the highest ID in the file
    const idRegex = /id:\s*["'](\d+)["']/g;
    let match;
    while ((match = idRegex.exec(fileContent)) !== null) {
      const id = parseInt(match[1], 10);
      if (id >= nextId) {
        nextId = id + 1;
      }
    }
    
    console.log(`Starting with ID ${nextId} for new customer metrics rows`);
    
    // Generate rows for New Customers (12 months)
    for (let month = 0; month < 12; month++) {
      const row = {
        ...customerMetricsTemplate,
        id: nextId.toString(),
        name: `Customer Metrics - New - Month ${month + 1}`,
        variableName: `New - Month ${month + 1}`,
        sqlExpression: `SELECT COUNT(*) as value FROM customers WHERE strftime('%Y-%m', created_date) = strftime('%Y-%m', 'now', '-${month} month')`,
        productionSqlExpression: `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE YEAR(created) = YEAR(DATEADD(month, -${month}, GETDATE())) AND MONTH(created) = MONTH(DATEADD(month, -${month}, GETDATE()))`
      };
      customerMetricsRows.push(row);
      nextId++;
    }
    
    // Generate rows for Returning Customers (12 months)
    for (let month = 0; month < 12; month++) {
      const row = {
        ...customerMetricsTemplate,
        id: nextId.toString(),
        name: `Customer Metrics - Returning - Month ${month + 1}`,
        variableName: `Returning - Month ${month + 1}`,
        sqlExpression: `SELECT COUNT(*) as value FROM customers WHERE strftime('%Y-%m', last_order_date) = strftime('%Y-%m', 'now', '-${month} month') AND customer_id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 1)`,
        productionSqlExpression: `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE YEAR(last_order_date) = YEAR(DATEADD(month, -${month}, GETDATE())) AND MONTH(last_order_date) = MONTH(DATEADD(month, -${month}, GETDATE())) AND customer_id IN (SELECT customer_id FROM dbo.oe_hdr WITH (NOLOCK) GROUP BY customer_id HAVING COUNT(*) > 1)`
      };
      customerMetricsRows.push(row);
      nextId++;
    }
    
    console.log(`Generated ${customerMetricsRows.length} customer metrics rows`);
    
    // Convert rows to string format
    const rowsString = customerMetricsRows.map(row => {
      return `    {
      id: "${row.id}",
      name: "${row.name}",
      chartName: "${row.chartName}",
      variableName: "${row.variableName}",
      serverName: "${row.serverName}",
      value: "${row.value}",
      chartGroup: "${row.chartGroup}",
      calculation: "${row.calculation}",
      sqlExpression: "${row.sqlExpression}",
      productionSqlExpression: "${row.productionSqlExpression}",
      tableName: "${row.tableName}"
    }`;
    }).join(',\n');
    
    // Insert the rows after the last Historical Data row
    const updatedContent = 
      fileContent.substring(0, endIndex) + 
      ',\n' + 
      rowsString + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedContent);
    console.log('\n✅ Successfully added customer metrics rows to the file');
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart groups in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartGroupCounts = {
      'Key Metrics': (updatedFileContent.match(/chartGroup:\s*["']Key Metrics["']/g) || []).length,
      'Customer Metrics': (updatedFileContent.match(/chartGroup:\s*["']Customer Metrics["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartGroup:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartGroup:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartGroup:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartGroup:\s*["']Por Overview["']/g) || []).length,
      'Daily Orders': (updatedFileContent.match(/chartGroup:\s*["']Daily Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartGroup:\s*["']Web Orders["']/g) || []).length,
      'Ar Aging': (updatedFileContent.match(/chartGroup:\s*["']Ar Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartGroup:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Group Counts After Update:');
    Object.entries(chartGroupCounts).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
    });
    
    // Count chart names in the updated file
    const chartNameCounts = {
      'Key Metrics': (updatedFileContent.match(/chartName:\s*["']Key Metrics["']/g) || []).length,
      'Customers': (updatedFileContent.match(/chartName:\s*["']Customers["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartName:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartName:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartName:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartName:\s*["']Por Overview["']/g) || []).length,
      'Orders': (updatedFileContent.match(/chartName:\s*["']Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartName:\s*["']Web Orders["']/g) || []).length,
      'AR Aging': (updatedFileContent.match(/chartName:\s*["']AR Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartName:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Name Counts After Update:');
    Object.entries(chartNameCounts).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
addCustomerMetrics();
