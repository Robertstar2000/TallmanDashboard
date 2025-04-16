// fix-new-customers-metrics.js
import fs from 'fs';
import path from 'path';

const targetFile = path.join('lib', 'db', 'single-source-data.ts');
const fullPath = path.resolve(process.cwd(), targetFile);

fs.readFile(fullPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }

  // Match all objects with variableName: "New Customers"
  const updated = data.replace(/({[\s\S]*?"variableName"\s*:\s*"New Customers"[\s\S]*?"axisStep"\s*:\s*"Month (\d+)"[\s\S]*?"productionSqlExpression"\s*:\s*")[^"]*("[\s\S]*?})/g,
    (match, prefix, monthNum, suffix) => {
      // Calculate offsets: Month 1 = -12, Month 2 = -11, ..., Month 12 = -1
      const offset = 1 - parseInt(monthNum, 10) - 11;
      const startOffset = offset;
      const endOffset = offset + 1;
      const sql = `SELECT COUNT(customer_id) AS value FROM dbo.customer WITH (NOLOCK) WHERE date_created >= DATEADD(month, ${startOffset}, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) AND date_created < DATEADD(month, ${endOffset}, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0));`;
      return `${prefix}${sql}${suffix}`;
    }
  );

  if (updated !== data) {
    fs.writeFile(fullPath, updated, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        process.exit(1);
      }
      console.log('New Customers metrics updated successfully!');
    });
  } else {
    console.log('No changes made. No matching patterns found.');
  }
});
