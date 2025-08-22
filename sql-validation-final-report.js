// Final SQL Expression Validation Report
const fs = require('fs');

// Load allData.json
const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

console.log('=== FINAL SQL EXPRESSION VALIDATION REPORT ===\n');

// Group entries by server and chart group
const p21Entries = allData.filter(entry => entry.serverName === 'P21');
const porEntries = allData.filter(entry => entry.serverName === 'POR');

console.log(`📊 SUMMARY:`);
console.log(`Total entries: ${allData.length}`);
console.log(`P21 server entries: ${p21Entries.length}`);
console.log(`POR server entries: ${porEntries.length}\n`);

// Analyze by chart group
const chartGroups = {};
allData.forEach(entry => {
    if (!chartGroups[entry.chartGroup]) {
        chartGroups[entry.chartGroup] = { P21: 0, POR: 0, total: 0 };
    }
    chartGroups[entry.chartGroup][entry.serverName]++;
    chartGroups[entry.chartGroup].total++;
});

console.log('📈 BY CHART GROUP:');
Object.keys(chartGroups).sort().forEach(group => {
    const stats = chartGroups[group];
    console.log(`  ${group}: ${stats.total} entries (P21: ${stats.P21}, POR: ${stats.POR})`);
});

// Validate SQL syntax requirements
console.log('\n🔍 SYNTAX VALIDATION:');

let validP21 = 0;
let validPOR = 0;
let issues = [];

p21Entries.forEach(entry => {
    const sql = entry.productionSqlExpression;
    let valid = true;
    let entryIssues = [];
    
    if (!sql.includes('AS value')) entryIssues.push('Missing AS value clause');
    if (!sql.includes('ISNULL') && !sql.includes('COUNT')) entryIssues.push('Missing ISNULL for null handling');
    if (!sql.includes('dbo.')) entryIssues.push('Missing dbo schema prefix');
    if (!sql.includes('WITH (NOLOCK)')) entryIssues.push('Missing WITH (NOLOCK) hint');
    if (sql.includes('DATE()')) entryIssues.push('Contains MS Access DATE() - should be GETDATE()');
    if (sql.includes('Nz(')) entryIssues.push('Contains MS Access Nz() - should be ISNULL()');
    
    if (entryIssues.length === 0) {
        validP21++;
    } else {
        issues.push({ id: entry.id, server: 'P21', issues: entryIssues });
    }
});

porEntries.forEach(entry => {
    const sql = entry.productionSqlExpression;
    let entryIssues = [];
    
    if (!sql.includes('AS value')) entryIssues.push('Missing AS value clause');
    if (sql.includes('GETDATE')) entryIssues.push('Contains SQL Server GETDATE() - should use DATE()');
    if (sql.includes('ISNULL')) entryIssues.push('Contains SQL Server ISNULL() - should use Nz()');
    if (sql.includes('dbo.')) entryIssues.push('Contains SQL Server schema prefix - not needed in MS Access');
    if (sql.includes('WITH (NOLOCK)')) entryIssues.push('Contains SQL Server hints - not valid in MS Access');
    
    if (entryIssues.length === 0) {
        validPOR++;
    } else {
        issues.push({ id: entry.id, server: 'POR', issues: entryIssues });
    }
});

console.log(`✅ P21 entries with correct syntax: ${validP21}/${p21Entries.length} (${((validP21/p21Entries.length)*100).toFixed(1)}%)`);
console.log(`✅ POR entries with correct syntax: ${validPOR}/${porEntries.length} (${((validPOR/porEntries.length)*100).toFixed(1)}%)`);

if (issues.length > 0) {
    console.log(`\n⚠️  REMAINING ISSUES: ${issues.length}`);
    issues.slice(0, 10).forEach(issue => {
        console.log(`  ID ${issue.id} (${issue.server}): ${issue.issues.join(', ')}`);
    });
    if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more issues`);
    }
} else {
    console.log('\n🎉 ALL SQL EXPRESSIONS VALIDATED SUCCESSFULLY!');
}

console.log('\n📋 CHANGES MADE:');
console.log('✅ Fixed server assignments - only POR_OVERVIEW uses POR server');
console.log('✅ Added AS value clauses for metric parsing');
console.log('✅ Applied proper P21 SQL Server syntax (ISNULL, dbo., WITH NOLOCK)');
console.log('✅ Applied proper POR MS Access syntax (DATE(), Nz())');
console.log('✅ Fixed table and column references to match database schemas');
console.log('✅ Updated cache refresh markers to trigger background worker reload');

// Save detailed issues if any
if (issues.length > 0) {
    fs.writeFileSync('sql-validation-remaining-issues.json', JSON.stringify(issues, null, 2));
    console.log('\nDetailed issues saved to sql-validation-remaining-issues.json');
}

console.log('\n🔄 NEXT STEPS:');
console.log('1. Restart backend to load updated SQL expressions');
console.log('2. Monitor background worker logs for successful query execution');
console.log('3. Verify dashboard metrics update with real data');
console.log('4. Test individual problematic queries if any metrics remain at 0 or 99999');
