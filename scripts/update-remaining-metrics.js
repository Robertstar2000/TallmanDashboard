// Script to update remaining Key Metrics SQL expressions
const fs = require('fs');
const path = require('path');

// Path to the complete-chart-data.ts file
const chartDataFilePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

// Updated Key Metrics SQL expressions for the remaining metrics
const remainingKeyMetrics = [
  {
    id: "119",
    name: "All Open Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE completed = 'N' AND invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    id: "122",
    name: "OrdersBackloged",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  }
];

// Read the complete-chart-data.ts file
fs.readFile(chartDataFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Create a backup of the original file
  const backupFilePath = `${chartDataFilePath}.backup-remaining-${new Date().toISOString().replace(/:/g, '-')}`;
  fs.writeFileSync(backupFilePath, data);
  console.log(`Backup created at: ${backupFilePath}`);

  // Update each remaining Key Metrics SQL expression
  let updatedData = data;
  let updatedCount = 0;

  for (const metric of remainingKeyMetrics) {
    // Find the corresponding entry in the file
    const regex = new RegExp(`"id":\\s*"${metric.id}"[\\s\\S]*?productionSqlExpression":\\s*"[^"]*"`);
    const match = updatedData.match(regex);
    
    if (match) {
      // Replace the SQL expression
      const oldSql = match[0];
      const newSql = oldSql.replace(/"productionSqlExpression":\s*"[^"]*"/, `"productionSqlExpression": "${metric.sql}"`);
      updatedData = updatedData.replace(oldSql, newSql);
      updatedCount++;
      console.log(`Updated SQL for ${metric.name} (ID: ${metric.id})`);
    } else {
      console.log(`Could not find entry for ${metric.name} (ID: ${metric.id})`);
    }
  }

  // Write the updated data back to the file
  fs.writeFile(chartDataFilePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`Updated ${updatedCount} remaining Key Metrics SQL expressions in ${chartDataFilePath}`);
  });
});
