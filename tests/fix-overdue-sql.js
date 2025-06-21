import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, 'lib', 'db', 'single-source-data.ts');

let content = fs.readFileSync(FILE, 'utf8');

// Replace due_date with net_due_date in productionSqlExpression for target rows
let updated = content.replace(
  /({\s*"rowId":\s*"(3[0-9]|4[01])",[\s\S]*?"productionSqlExpression":\s*")(.*?)(".*?})/g,
  (match, p1, rowId, sql, p4) => {
    let newSql = sql.replace(/due_date/g, 'net_due_date');
    return `${p1}${newSql}${p4}`;
  }
);

// Ensure tableName is correct for those rows
updated = updated.replace(
  /({\s*"rowId":\s*"(3[0-9]|4[01])",[\s\S]*?"tableName":\s*)\"[^\"]*\"(,[\s\S]*?"productionSqlExpression":)/g,
  `$1"dbo.invoice_hdr"$2`
);

fs.writeFileSync(FILE, updated, 'utf8');
console.log('Overdue Accounts SQL expressions updated successfully!');