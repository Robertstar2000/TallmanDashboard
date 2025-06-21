// fix-prospect-metrics.js
import fs from 'fs';
import path from 'path';

const targetFile = path.join('lib', 'db', 'single-source-data.ts');
const fullPath = path.resolve(process.cwd(), targetFile);

fs.readFile(fullPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }

  let updated = data;

  // Replace text-based prospect filters with correct numeric code
  updated = updated.replace(
    /customer_type_cd\s*=\s*'Prospect'/gi,
    'customer_type_cd = 1203'
  );
  updated = updated.replace(
    /cust_type\s*=\s*'Prospect'/gi,
    'customer_type_cd = 1203'
  );
  updated = updated.replace(
    /status\s*=\s*'Prospect'/gi,
    'customer_type_cd = 1203'
  );

  // Replace wrong date fields with correct one
  updated = updated.replace(
    /\bcreate_date\b/gi,
    'date_created'
  );

  // Optionally, replace other variants (if any)
  updated = updated.replace(
    /\bcreated_on\b/gi,
    'date_created'
  );

  if (updated !== data) {
    fs.writeFile(fullPath, updated, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        process.exit(1);
      }
      console.log('Prospect customer metrics updated successfully!');
    });
  } else {
    console.log('No changes made. No matching patterns found.');
  }
});
