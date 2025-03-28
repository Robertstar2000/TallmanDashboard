const fs = require('fs');
const path = require('path');

// Configuration
const CHART_DATA_PATH = path.join(__dirname, '..', '..', 'lib', 'db', 'complete-chart-data.ts');
const BACKUP_PATH = path.join(__dirname, '..', '..', 'lib', 'db', 'complete-chart-data.backup.ts');

// Backup the original file
console.log(`Backing up original file to ${BACKUP_PATH}`);
fs.copyFileSync(CHART_DATA_PATH, BACKUP_PATH);

// Read the chart data file
console.log(`Reading chart data from ${CHART_DATA_PATH}`);
const chartDataContent = fs.readFileSync(CHART_DATA_PATH, 'utf8');

// Define the POR SQL expressions with more generic SQL that's likely to work with MS Access
const porSqlExpressions = [
  {
    id: "74",
    name: "Historical Data - January - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 1 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "78",
    name: "Historical Data - February - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 2 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "82",
    name: "Historical Data - March - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 3 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "86",
    name: "Historical Data - April - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 4 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "90",
    name: "Historical Data - May - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 5 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "94",
    name: "Historical Data - June - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 6 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "98",
    name: "Historical Data - July - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 7 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "102",
    name: "Historical Data - August - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 8 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "106",
    name: "Historical Data - September - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 9 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "110",
    name: "Historical Data - October - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 10 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "114",
    name: "Historical Data - November - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 11 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "118",
    name: "Historical Data - December - POR",
    sqlExpression: "SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 12 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())"
  }
];

// Alternative SQL expressions in case the first ones don't work
const alternativeSqlExpressions = [
  {
    id: "74",
    name: "Historical Data - January - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 1 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "78",
    name: "Historical Data - February - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 2 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "82",
    name: "Historical Data - March - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 3 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "86",
    name: "Historical Data - April - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 4 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "90",
    name: "Historical Data - May - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 5 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "94",
    name: "Historical Data - June - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 6 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "98",
    name: "Historical Data - July - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 7 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "102",
    name: "Historical Data - August - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 8 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "106",
    name: "Historical Data - September - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 9 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "110",
    name: "Historical Data - October - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 10 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "114",
    name: "Historical Data - November - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 11 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  },
  {
    id: "118",
    name: "Historical Data - December - POR",
    sqlExpression: "SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 12 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())"
  }
];

// Fallback SQL expressions that should work with any MS Access database
const fallbackSqlExpressions = [
  {
    id: "74",
    name: "Historical Data - January - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "78",
    name: "Historical Data - February - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "82",
    name: "Historical Data - March - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "86",
    name: "Historical Data - April - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "90",
    name: "Historical Data - May - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "94",
    name: "Historical Data - June - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "98",
    name: "Historical Data - July - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "102",
    name: "Historical Data - August - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "106",
    name: "Historical Data - September - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "110",
    name: "Historical Data - October - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "114",
    name: "Historical Data - November - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  },
  {
    id: "118",
    name: "Historical Data - December - POR",
    sqlExpression: "SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1"
  }
];

// Choose which set of SQL expressions to use
const sqlExpressions = porSqlExpressions;

// Update the chart data content with the new SQL expressions
let updatedContent = chartDataContent;

sqlExpressions.forEach(expr => {
  const id = expr.id;
  const updatedSql = expr.sqlExpression;
  
  // Create a regex pattern to find the SQL expression for this ID
  const pattern = new RegExp(`"id":\\s*"${id}"[\\s\\S]*?("sqlExpression":\\s*")[^"]*(",[\\s\\S]*?"productionSqlExpression":\\s*")[^"]*(")`);
  
  // Replace the SQL expressions
  updatedContent = updatedContent.replace(pattern, `"id": "${id}"$1${updatedSql}$2${updatedSql}$3`);
});

// Write the updated content back to the file
console.log(`Writing updated chart data to ${CHART_DATA_PATH}`);
fs.writeFileSync(CHART_DATA_PATH, updatedContent);

console.log('Updated complete-chart-data.ts with new SQL expressions');
console.log('If these expressions do not work, you can restore the backup from:', BACKUP_PATH);

// Create a readme file with information about the SQL expressions
const readmePath = path.join(__dirname, 'POR-SQL-README.md');
const readmeContent = `# POR SQL Expressions

This file contains information about the SQL expressions used for the POR database.

## Primary SQL Expressions

These expressions use the \`Rentals\` table and \`RentalDate\` column:

\`\`\`sql
SELECT Count(*) as value FROM Rentals WHERE DatePart('m', [RentalDate]) = 1 AND DatePart('yyyy', [RentalDate]) = DatePart('yyyy', Now())
\`\`\`

## Alternative SQL Expressions

If the primary expressions don't work, try these expressions that use the \`Contracts\` table and \`ContractDate\` column:

\`\`\`sql
SELECT Count(*) as value FROM Contracts WHERE DatePart('m', [ContractDate]) = 1 AND DatePart('yyyy', [ContractDate]) = DatePart('yyyy', Now())
\`\`\`

## Fallback SQL Expressions

If none of the above expressions work, try these expressions that should work with any MS Access database:

\`\`\`sql
SELECT Count(*) as value FROM MSysObjects WHERE ObjectType = 1
\`\`\`

## Notes

1. MS Access uses \`DatePart('m', date)\` instead of \`Month(date)\`
2. MS Access uses \`DatePart('yyyy', date)\` instead of \`Year(date)\`
3. MS Access uses \`Now()\` instead of \`Date()\`
4. Common tables in POR databases might include: Rentals, Contracts, Transactions, Orders, Invoices
5. Common date columns might include: RentalDate, ContractDate, Date, TransactionDate, InvoiceDate, OrderDate

## Restoring the Backup

If the SQL expressions don't work, you can restore the backup from: ${BACKUP_PATH}
`;

console.log(`Writing readme to ${readmePath}`);
fs.writeFileSync(readmePath, readmeContent);

console.log('Created readme file with information about the SQL expressions');
