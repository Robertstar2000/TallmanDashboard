// Script to fix the Open Invoices SQL expression
const fs = require('fs');
const path = require('path');

// Path to the complete-chart-data.ts file
const chartDataFilePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

// Fixed SQL expression for Open Invoices
const fixedExpression = {
  id: "121",
  name: "Open Invoices",
  sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE delete_flag <> 'Y' AND invoice_date >= DATEADD(month, -1, GETDATE())"
};

// Read the complete-chart-data.ts file
fs.readFile(chartDataFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Create a backup of the original file
  const backupFilePath = `${chartDataFilePath}.backup-fix-${new Date().toISOString().replace(/:/g, '-')}`;
  fs.writeFileSync(backupFilePath, data);
  console.log(`Backup created at: ${backupFilePath}`);

  // Update the Open Invoices SQL expression
  const regex = new RegExp(`"id":\\s*"${fixedExpression.id}"[\\s\\S]*?productionSqlExpression":\\s*"[^"]*"`);
  const match = data.match(regex);
  
  if (match) {
    // Replace the SQL expression
    const oldSql = match[0];
    const newSql = oldSql.replace(/"productionSqlExpression":\s*"[^"]*"/, `"productionSqlExpression": "${fixedExpression.sql}"`);
    const updatedData = data.replace(oldSql, newSql);
    
    // Write the updated data back to the file
    fs.writeFile(chartDataFilePath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log(`Fixed SQL expression for ${fixedExpression.name} (ID: ${fixedExpression.id})`);
    });
  } else {
    console.log(`Could not find entry for ${fixedExpression.name} (ID: ${fixedExpression.id})`);
  }
});
