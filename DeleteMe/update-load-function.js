const fs = require('fs');
const path = require('path');

// Path to the sqlite.ts file
const filePath = path.join(process.cwd(), 'lib', 'db', 'sqlite.ts');

// Read the current content
console.log('Reading sqlite.ts file...');
let content = fs.readFileSync(filePath, 'utf8');

// Update the loadDbFromInitFile function to handle the merged chart group field
console.log('Updating loadDbFromInitFile function...');

// Replace the INSERT statement in the loadDbFromInitFile function
const insertStatementRegex = /await db\.run\(\s*`INSERT INTO chart_data \(id, chart_name, variable_name, server_name, db_table_name, sql_expression, production_sql_expression, value, transformer, last_updated\)\s*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)`,\s*\[\s*row\.id,\s*row\.chartName \|\| row\.name\.split\(' - '\)\[0\],/;

const newInsertStatement = "await db.run(\n            `INSERT INTO chart_data (id, chart_group, variable_name, server_name, db_table_name, sql_expression, production_sql_expression, value, transformer, last_updated)\n             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,\n            [\n              row.id,\n              row.chartGroup || row.name.split(' - ')[0],";

content = content.replace(insertStatementRegex, newInsertStatement);

// Replace the console.log statement in the loadDbFromInitFile function
const consoleLogRegex = /console\.log\(`Inserted row: \$\{row\.chartName \|\| row\.name\.split\(' - '\)\[0\]\} - \$\{row\.variableName \|\| row\.name\.split\(' - '\)\.slice\(1\)\.join\(' - '\)\}`\);/;

const newConsoleLog = "console.log(`Inserted row: ${row.chartGroup || row.name.split(' - ')[0]} - ${row.variableName || row.name.split(' - ').slice(1).join(' - ')}`);";

content = content.replace(consoleLogRegex, newConsoleLog);

// Replace the defaultSql variable in the loadDbFromInitFile function
const defaultSqlRegex = /const defaultSql = `SELECT 0 \/\* Default SQL for \$\{row\.chart_name\} - \$\{row\.variable_name\} \*\/`;/;

const newDefaultSql = "const defaultSql = `SELECT 0 /* Default SQL for ${row.chart_group} - ${row.variable_name} */`;";

content = content.replace(defaultSqlRegex, newDefaultSql);

// Write the updated content back to the file
console.log('Writing updated content back to sqlite.ts...');
fs.writeFileSync(filePath, content);

console.log('Successfully updated loadDbFromInitFile function in sqlite.ts');
