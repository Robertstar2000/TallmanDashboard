import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.join(__dirname, 'lib', 'db', 'single-source-data.ts');
const BACKUP_FILE_PATH = `${FILE_PATH}.bak`;

function getSqlForMonth(index) {
  const start = -13 + index;
  const end = -12 + index;
  return `SELECT ISNULL(SUM(total_amount), 0) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, ${start}, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)) AND invoice_date < DATEADD(month, ${end}, DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0));`;
}

function updateMetrics(content) {
  const lines = content.split(/\r?\n/);
  for (let i = 1; i <= 12; i++) {
    const rowId = 96 + i;
    let inTarget = false;
    let axisStepLine = `"axisStep": "Month ${i}"`;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes(`"rowId": "${rowId}"`)) {
        inTarget = true;
      }
      // Always update for these rowIds
      if (inTarget && lines[j].includes('"tableName":')) {
        lines[j] = '    "tableName": "dbo.invoice_hdr",';
      }
      if (inTarget && lines[j].includes('"productionSqlExpression":')) {
        lines[j] = `    "productionSqlExpression": "${getSqlForMonth(i)}",`;
      }
      if (inTarget && lines[j].includes(axisStepLine)) {
        inTarget = false;
      }
    }
  }
  return lines.join('\n');
}

function main() {
  let content = fs.readFileSync(FILE_PATH, 'utf8');
  fs.copyFileSync(FILE_PATH, BACKUP_FILE_PATH);
  const updated = updateMetrics(content);
  if (updated !== content) {
    fs.writeFileSync(FILE_PATH, updated, 'utf8');
    console.log('Historical sales metrics updated successfully!');
  } else {
    console.log('No changes made.');
  }
}

main();
