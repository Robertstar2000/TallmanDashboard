const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Define SQL expressions for Key Metrics variables
const keyMetricsSQL = {
  'Total Orders': "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE ORDER_DATE >= DATEADD(day, -7, GETDATE())",
  'Open Orders': "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE COMPLETED = 'N'",
  'Daily Revenue': "SELECT ISNULL(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE CONVERT(date, INVOICE_DATE) = CONVERT(date, DATEADD(day, -1, GETDATE()))",
  'Open Invoices': "SELECT COUNT(*) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE OPEN_CLOSED_FLAG = 'O'",
  'Orders Backlogged': "SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE ORDER_STATUS = 'H' AND ORDER_DATE >= DATEADD(day, -30, GETDATE())",
  'Total Monthly Sales': "SELECT ISNULL(SUM(EXTENDED_PRICE), 0) as value FROM OE_HDR h WITH (NOLOCK) JOIN OE_LINE l WITH (NOLOCK) ON h.ORDER_NO = l.ORDER_NO WHERE h.ORDER_DATE >= DATEADD(day, -30, GETDATE())",
  'Total Items': "SELECT COUNT(*) as value FROM INV_MAST WITH (NOLOCK)"
};

// Update SQL expressions for Key Metrics variables
let updatedCount = 0;

for (const [variableName, sqlExpression] of Object.entries(keyMetricsSQL)) {
  // Create a regex pattern to find the variable in the Key Metrics chart group
  const pattern = new RegExp(`chartGroup:\\s*['"]Key Metrics['"]\\s*,[\\s\\S]*?variableName:\\s*['"]${variableName}['"][\\s\\S]*?productionSqlExpression:\\s*['"\`].*?['"\`]`, 'g');
  
  // Replace the SQL expression
  const newContent = content.replace(pattern, (match) => {
    updatedCount++;
    return match.replace(
      /productionSqlExpression:\s*['"]\`?.*?['"]\`?/,
      `productionSqlExpression: "${sqlExpression}"`
    );
  });
  
  // Update the content if changes were made
  if (newContent !== content) {
    content = newContent;
    console.log(`Updated SQL expression for '${variableName}'`);
  } else {
    console.log(`Could not find or update SQL expression for '${variableName}'`);
  }
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\nUpdated ${updatedCount} SQL expressions in Key Metrics chart group`);
