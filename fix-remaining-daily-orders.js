// Fix remaining DAILY_ORDERS SQL expressions for P21 syntax
const fs = require('fs');

// Load allData.json
let allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

console.log('=== Fixing Remaining DAILY_ORDERS SQL Expressions ===\n');

// Fix entries 68-72 (2 Days Ago through 6 Days Ago)
const dailyOrderFixes = [
    { id: 68, days: -2, name: "2 Days Ago" },
    { id: 69, days: -3, name: "3 Days Ago" },
    { id: 70, days: -4, name: "4 Days Ago" },
    { id: 71, days: -5, name: "5 Days Ago" },
    { id: 72, days: -6, name: "6 Days Ago" }
];

dailyOrderFixes.forEach(fix => {
    const entry = allData.find(item => item.id === fix.id);
    if (entry) {
        const oldSql = entry.productionSqlExpression;
        entry.productionSqlExpression = `SELECT COUNT(order_id) AS value FROM dbo.sales_orders WITH (NOLOCK) WHERE CAST(order_date AS DATE) = CAST(DATEADD(day, ${fix.days}, GETDATE()) AS DATE);`;
        console.log(`Fixed ID ${fix.id} (${fix.name}):`);
        console.log(`  Old: ${oldSql}`);
        console.log(`  New: ${entry.productionSqlExpression}\n`);
    }
});

// Save changes
fs.writeFileSync('allData.json', JSON.stringify(allData, null, 2));
console.log('✅ Fixed remaining DAILY_ORDERS SQL expressions');
console.log('✅ Updated allData.json with corrected syntax');
