// Manual SQL Expression Validation for allData.json
const fs = require('fs');

// Load allData.json
const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

console.log('=== SQL Expression Validation Report ===\n');

// Group entries by server
const p21Entries = allData.filter(entry => entry.serverName === 'P21');
const porEntries = allData.filter(entry => entry.serverName === 'POR');

console.log(`Total entries: ${allData.length}`);
console.log(`P21 entries: ${p21Entries.length}`);
console.log(`POR entries: ${porEntries.length}\n`);

// Common issues to check for
function analyzeSQL(entry) {
    const sql = entry.productionSqlExpression;
    const issues = [];
    
    // Check for missing AS value clause
    if (!sql.includes('AS value') && !sql.includes('as value')) {
        issues.push('Missing "AS value" clause - required for metric parsing');
    }
    
    // Check for P21 specific syntax issues
    if (entry.serverName === 'P21') {
        if (!sql.includes('ISNULL')) {
            issues.push('Missing ISNULL() for null handling');
        }
        if (!sql.includes('dbo.')) {
            issues.push('Missing dbo. schema prefix');
        }
        if (!sql.includes('WITH (NOLOCK)')) {
            issues.push('Missing WITH (NOLOCK) hint');
        }
        if (sql.includes('Nz(')) {
            issues.push('Contains MS Access Nz() function - should be ISNULL()');
        }
        if (sql.includes('DATE()')) {
            issues.push('Contains MS Access DATE() function - should be GETDATE()');
        }
    }
    
    // Check for POR specific syntax issues
    if (entry.serverName === 'POR') {
        if (sql.includes('ISNULL')) {
            issues.push('Contains SQL Server ISNULL() - should be Nz() for MS Access');
        }
        if (sql.includes('GETDATE')) {
            issues.push('Contains SQL Server GETDATE() - should be DATE() for MS Access');
        }
        if (sql.includes('dbo.')) {
            issues.push('Contains SQL Server schema prefix - not needed in MS Access');
        }
    }
    
    return issues;
}

// Analyze each entry
console.log('=== ISSUE ANALYSIS ===\n');

let totalIssues = 0;
const entriesWithIssues = [];

allData.forEach(entry => {
    const issues = analyzeSQL(entry);
    if (issues.length > 0) {
        totalIssues += issues.length;
        entriesWithIssues.push({
            id: entry.id,
            variableName: entry.variableName,
            serverName: entry.serverName,
            issues: issues,
            sql: entry.productionSqlExpression
        });
        
        console.log(`ID ${entry.id}: ${entry.variableName} (${entry.serverName})`);
        issues.forEach(issue => console.log(`  - ${issue}`));
        console.log(`  SQL: ${entry.productionSqlExpression}\n`);
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Entries with issues: ${entriesWithIssues.length} / ${allData.length}`);
console.log(`Total issues found: ${totalIssues}`);

// Save detailed report
fs.writeFileSync('sql-validation-report.json', JSON.stringify(entriesWithIssues, null, 2));
console.log('\nDetailed report saved to sql-validation-report.json');
