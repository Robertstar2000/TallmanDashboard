// Script to update specific Key Metrics SQL expressions with corrections
const fs = require('fs');
const path = require('path');

// Path to the complete-chart-data.ts file
const chartDataFilePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

// Corrected Key Metrics SQL expressions
const correctedKeyMetrics = [
  {
    id: "117",
    name: "Total Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  }
];

// Read the complete-chart-data.ts file
fs.readFile(chartDataFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Create a backup of the original file
  const backupFilePath = `${chartDataFilePath}.backup-corrections-${new Date().toISOString().replace(/:/g, '-')}`;
  fs.writeFileSync(backupFilePath, data);
  console.log(`Backup created at: ${backupFilePath}`);

  // Update each Key Metrics SQL expression
  let updatedData = data;
  let updatedCount = 0;

  for (const metric of correctedKeyMetrics) {
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
    console.log(`Updated ${updatedCount} Key Metrics SQL expressions in ${chartDataFilePath}`);
  });
});
