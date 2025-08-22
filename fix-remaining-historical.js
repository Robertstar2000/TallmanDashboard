// Fix remaining HISTORICAL_DATA SQL expressions for P21 syntax
const fs = require('fs');

// Load allData.json
let allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

console.log('=== Fixing Remaining HISTORICAL_DATA SQL Expressions ===\n');

// Fix all remaining historical data entries (IDs 79-108)
const historicalEntries = allData.filter(entry => 
    entry.chartGroup === 'HISTORICAL_DATA' && 
    entry.id >= 79 && 
    entry.id <= 108
);

let fixedCount = 0;

historicalEntries.forEach(entry => {
    const oldSql = entry.productionSqlExpression;
    
    // Extract month number from current SQL or variable name
    let month = 1;
    if (oldSql.includes('MONTH(date_created) = ')) {
        const monthMatch = oldSql.match(/MONTH\(date_created\) = (\d+)/);
        if (monthMatch) month = parseInt(monthMatch[1]);
    }
    
    // Create proper P21 SQL expression
    entry.productionSqlExpression = `SELECT ISNULL(SUM(order_total), 0) AS value FROM dbo.sales_orders WITH (NOLOCK) WHERE YEAR(order_date) = YEAR(GETDATE())-1 AND MONTH(order_date) = ${month};`;
    
    console.log(`Fixed ID ${entry.id} (${entry.dataPoint}):`);
    console.log(`  Month: ${month}`);
    console.log(`  New SQL: ${entry.productionSqlExpression}\n`);
    fixedCount++;
});

// Save changes
fs.writeFileSync('allData.json', JSON.stringify(allData, null, 2));
console.log(`✅ Fixed ${fixedCount} HISTORICAL_DATA SQL expressions`);
console.log('✅ Updated allData.json with corrected P21 syntax');
