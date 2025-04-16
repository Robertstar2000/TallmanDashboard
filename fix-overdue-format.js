import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, 'lib', 'db', 'single-source-data.ts');
let content = fs.readFileSync(FILE, 'utf8');

// Regex to fix merged tableName/productionSqlExpression lines for rowId 30-41
content = content.replace(
  /("tableName":\s*"dbo\.invoice_hdr")\d+\s*"SELECT\sISNULL/g,
  '$1,\n    "productionSqlExpression": "SELECT ISNULL'
);

// Also ensure all due_date are net_due_date in those expressions
content = content.replace(
  /("productionSqlExpression":\s*".*?)(due_date)(.*?")/g,
  (match, p1, _due, p2) => `${p1}net_due_date${p2}`
);

fs.writeFileSync(FILE, content, 'utf8');
console.log('Formatting of Accounts Overdue rows fixed!');
