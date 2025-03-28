const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Replace 'Y' with "Y" in SQL expressions
content = content.replace(/PROSPECT_FLAG = 'Y'/g, 'PROSPECT_FLAG = "Y"');

// Fix 2: Fix Plumbing string issues
content = content.replace(/'%Plumbing%'/g, '"%Plumbing%"');
content = content.replace(/'%HVAC%'/g, '"%HVAC%"');
content = content.replace(/'%Electrical%'/g, '"%Electrical%"');
content = content.replace(/'%Tools%'/g, '"%Tools%"');

// Fix 3: Fix the specific Daily Revenue SQL expression that has a syntax error
content = content.replace(/productionSqlExpression: `SELECT ISNULL\(SUM\(INVOICE_AMT\), 0\) as value FROM INVOICE_HDR WITH \(NOLOCK\) WHERE CONVERT\(date, INVOICE_DATE\) = CONVERT\(date, DATEADD\(day, -1, GETDATE\(\)\)\)`, 0\) as value FROM invoice_hdr`/g,
                         'productionSqlExpression: `SELECT ISNULL(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE CONVERT(date, INVOICE_DATE) = CONVERT(date, DATEADD(day, -1, GETDATE()))`');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed SQL syntax issues in initial-data.ts');
