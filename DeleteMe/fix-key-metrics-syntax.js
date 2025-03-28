const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing commas after productionSqlExpression in the Key Metrics section
content = content.replace(/productionSqlExpression: (`.*?`)(\s*\n\s*tableName)/g, 'productionSqlExpression: $1,$2');

// Fix the truncated SQL expression at line 1958
content = content.replace(/productionSqlExpression: 'SELECT COALESCE\(SUM\(QTY_ON_HAND\), 0\) as value[^']*?(?=\s*,\s*tableName:|$)/g, 
                         "productionSqlExpression: 'SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN PRODUCT_LINE pl ON im.PROD_LINE = pl.PROD_LINE WHERE pl.DESCRIPTION LIKE \"%Plumbing%\"'");

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed syntax errors in Key Metrics section');
