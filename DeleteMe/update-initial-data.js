const fs = require('fs');
const path = require('path');

// Define the updated key metrics with their descriptions and SQL queries
const keyMetrics = [
  {
    id: '1',
    name: "Total Orders",
    description: "Total number of orders in the last 7 days",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
          WHERE order_date >= DATEADD(day, -7, GETDATE())`,
    value: "18"
  },
  {
    id: '2',
    name: "Open Orders",
    description: "Total number of orders that are not closed",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N'`,
    value: "2034"
  },
  {
    id: '3',
    name: "Open Orders 2",
    description: "Total dollar value of all open orders",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE h.completed = 'N'`,
    value: "24643150.24"
  },
  {
    id: '4',
    name: "Daily Revenue",
    description: "Total dollar value of orders shipped today (using yesterday's data)",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`,
    value: "75500"
  },
  {
    id: '5',
    name: "Open Invoices",
    description: "Total number of open invoices outstanding",
    sql: `SELECT COUNT(*) as value 
          FROM invoice_hdr WITH (NOLOCK) 
          WHERE invoice_date >= DATEADD(month, -1, GETDATE())`,
    value: "1"
  },
  {
    id: '6',
    name: "Orders Backlogged",
    description: "Total number of orders that are on hold or backlogged",
    sql: `SELECT COUNT(*) as value 
          FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N' 
          AND order_date >= DATEADD(day, -30, GETDATE())`,
    value: "27"
  },
  {
    id: '7',
    name: "Total Monthly Sales",
    description: "Total dollar amount of all orders for the last 30 days",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE h.order_date >= DATEADD(day, -30, GETDATE())`,
    value: "1708263.24"
  }
];

// Function to update the initial-data.ts file
function updateInitialData() {
  const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
  
  // Read the current file
  let content = fs.readFileSync(initialDataPath, 'utf8');
  
  // Generate the updated key metrics section
  let updatedKeyMetrics = '// Key Metrics - These are single data points\n';
  
  for (const metric of keyMetrics) {
    updatedKeyMetrics += `  {
    id: '${metric.id}',
    name: "${metric.name}",
    chartName: "Key Metrics",
    variableName: "${metric.name}",
    serverName: 'P21',
    value: "${metric.value}",
    chartGroup: "Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM orders",
    productionSqlExpression: "${metric.sql.replace(/\n\s+/g, ' ')}",
    tableName: "oe_hdr"
  },\n`;
  }
  
  // Find the key metrics section in the file and replace it
  const keyMetricsStartPattern = /\/\/ Key Metrics - These are single data points/;
  const keyMetricsEndPattern = /\/\/ Site Distribution - 3 data points/;
  
  const startMatch = content.match(keyMetricsStartPattern);
  const endMatch = content.match(keyMetricsEndPattern);
  
  if (startMatch && endMatch) {
    const startIndex = startMatch.index;
    const endIndex = endMatch.index;
    
    // Replace the key metrics section
    const newContent = content.substring(0, startIndex) + 
                       updatedKeyMetrics + 
                       '  ' + content.substring(endIndex);
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.bak';
    fs.writeFileSync(backupPath, content);
    console.log(`✅ Backup created at ${backupPath}`);
    
    // Write the updated content
    fs.writeFileSync(initialDataPath, newContent);
    console.log(`✅ Updated ${initialDataPath} with working queries`);
    
    return true;
  } else {
    console.error(`❌ Could not find key metrics section in ${initialDataPath}`);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Updating Key Metrics in initial-data.ts ===');
  
  try {
    // Update the initial-data.ts file
    const success = updateInitialData();
    
    if (success) {
      console.log('\n✅ Successfully updated initial-data.ts with working queries');
      
      // Generate a summary file
      const summaryPath = path.join(__dirname, 'key-metrics-summary.txt');
      let summary = '=== KEY METRICS SUMMARY ===\n\n';
      
      for (const metric of keyMetrics) {
        summary += `${metric.name} (${metric.description}):\n`;
        summary += `Value: ${metric.value}\n`;
        summary += `SQL: ${metric.sql.replace(/\n\s+/g, ' ')}\n\n`;
      }
      
      fs.writeFileSync(summaryPath, summary);
      console.log(`✅ Summary written to ${summaryPath}`);
    } else {
      console.error('❌ Failed to update initial-data.ts');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n=== Update completed ===');
}

// Run the script
main();
