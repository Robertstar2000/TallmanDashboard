const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Define SQL expressions for Key Metrics variables
const keyMetricsSQL = [
  {
    variableName: 'Total Orders',
    sqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE DATEDIFF(day, ORDER_DATE, GETDATE()) <= 7"
  },
  {
    variableName: 'Open Orders',
    sqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE COMPLETED = 'N'"
  },
  {
    variableName: 'Daily Revenue',
    sqlExpression: "SELECT ISNULL(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE CONVERT(date, INVOICE_DATE) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    variableName: 'Open Invoices',
    sqlExpression: "SELECT COUNT(*) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE OPEN_CLOSED_FLAG = 'O'"
  },
  {
    variableName: 'Orders Backlogged',
    sqlExpression: "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE ORDER_STATUS = 'H' AND DATEDIFF(day, ORDER_DATE, GETDATE()) <= 30"
  },
  {
    variableName: 'Total Monthly Sales',
    sqlExpression: "SELECT ISNULL(SUM(EXTENDED_PRICE), 0) as value FROM OE_HDR h WITH (NOLOCK) JOIN OE_LINE l WITH (NOLOCK) ON h.ORDER_NO = l.ORDER_NO WHERE DATEDIFF(day, h.ORDER_DATE, GETDATE()) <= 30"
  },
  {
    variableName: 'Total Items',
    sqlExpression: "SELECT COUNT(*) as value FROM INV_MAST WITH (NOLOCK)"
  }
];

// Update SQL expressions for Key Metrics variables
let updatedCount = 0;

for (const metric of keyMetricsSQL) {
  // Find the start of the entry for this variable
  const variableNamePattern = new RegExp(`variableName:\\s*['"]${metric.variableName}['"]`, 'g');
  let match;
  
  while ((match = variableNamePattern.exec(content)) !== null) {
    // Check if this is part of the Key Metrics chart group
    const startPos = content.lastIndexOf('chartGroup:', match.index);
    const chartGroupLine = content.substring(startPos, content.indexOf('\n', startPos));
    
    if (chartGroupLine.includes('Key Metrics')) {
      // Find the productionSqlExpression line
      const sqlExprStart = content.indexOf('productionSqlExpression:', match.index);
      const sqlExprEnd = content.indexOf(',', sqlExprStart);
      if (sqlExprStart !== -1 && sqlExprEnd !== -1) {
        // Extract the current SQL expression
        const currentSqlExpr = content.substring(sqlExprStart, sqlExprEnd);
        
        // Create the new SQL expression
        const newSqlExpr = `productionSqlExpression: \`${metric.sqlExpression}\``;
        
        // Replace the SQL expression
        content = content.substring(0, sqlExprStart) + newSqlExpr + content.substring(sqlExprEnd);
        
        updatedCount++;
        console.log(`Updated SQL expression for '${metric.variableName}'`);
      }
    }
  }
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\nUpdated ${updatedCount} SQL expressions in Key Metrics chart group`);
