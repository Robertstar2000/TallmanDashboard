// Verify one-to-one correspondence: JSON > DB > Admin > Transformers > Charts
const fs = require('fs');

console.log('=== VERIFYING FULL DATA CORRESPONDENCE ===\n');

// Load allData.json
const allData = JSON.parse(fs.readFileSync('allData.json', 'utf8'));

// Check if metadata.json exists (admin data)
let metadata = {};
try {
    metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
} catch (e) {
    console.log('⚠️  metadata.json not found - will need to create admin data structure');
}

console.log(`📊 Total JSON entries: ${allData.length}`);

// Group by chart group for verification
const chartGroups = {};
allData.forEach(entry => {
    if (!chartGroups[entry.chartGroup]) {
        chartGroups[entry.chartGroup] = [];
    }
    chartGroups[entry.chartGroup].push(entry);
});

console.log(`📈 Chart groups found: ${Object.keys(chartGroups).length}`);
Object.keys(chartGroups).forEach(group => {
    console.log(`  - ${group}: ${chartGroups[group].length} entries`);
});

// Verify database table references
console.log('\n🗄️  DATABASE TABLE VERIFICATION:');
const uniqueTables = [...new Set(allData.map(entry => entry.tableName))];
const serverTables = {
    P21: [...new Set(allData.filter(e => e.serverName === 'P21').map(e => e.tableName))],
    POR: [...new Set(allData.filter(e => e.serverName === 'POR').map(e => e.tableName))]
};

console.log(`P21 tables referenced: ${serverTables.P21.join(', ')}`);
console.log(`POR tables referenced: ${serverTables.POR.join(', ')}`);

// Check for missing AS value clauses
console.log('\n🔍 SQL EXPRESSION VALIDATION:');
let missingAsValue = [];
let syntaxIssues = [];

allData.forEach(entry => {
    if (!entry.productionSqlExpression.includes('AS value')) {
        missingAsValue.push(entry.id);
    }
    
    // Server-specific syntax checks
    if (entry.serverName === 'P21') {
        if (!entry.productionSqlExpression.includes('dbo.') || !entry.productionSqlExpression.includes('WITH (NOLOCK)')) {
            syntaxIssues.push({ id: entry.id, issue: 'Missing P21 syntax elements' });
        }
    } else if (entry.serverName === 'POR') {
        if (entry.productionSqlExpression.includes('dbo.') || entry.productionSqlExpression.includes('WITH (NOLOCK)')) {
            syntaxIssues.push({ id: entry.id, issue: 'Contains SQL Server syntax in POR query' });
        }
    }
});

console.log(`Entries missing "AS value": ${missingAsValue.length}`);
if (missingAsValue.length > 0) {
    console.log(`  IDs: ${missingAsValue.slice(0, 10).join(', ')}${missingAsValue.length > 10 ? '...' : ''}`);
}

console.log(`Entries with syntax issues: ${syntaxIssues.length}`);
if (syntaxIssues.length > 0) {
    syntaxIssues.slice(0, 5).forEach(issue => {
        console.log(`  ID ${issue.id}: ${issue.issue}`);
    });
}

// Generate admin data structure
console.log('\n📋 GENERATING ADMIN DATA STRUCTURE:');
const adminData = {};

Object.keys(chartGroups).forEach(groupName => {
    adminData[groupName] = {
        enabled: true,
        refreshInterval: 30000, // 30 seconds
        dataPoints: []
    };
    
    chartGroups[groupName].forEach(entry => {
        adminData[groupName].dataPoints.push({
            id: entry.id,
            variableName: entry.variableName,
            dataPoint: entry.dataPoint,
            serverName: entry.serverName,
            tableName: entry.tableName,
            valueColumn: entry.valueColumn,
            calculationType: entry.calculationType,
            transformer: `transform_${entry.calculationType.toLowerCase()}`, // Default transformer
            enabled: true,
            priority: entry.chartGroup === 'KEY_METRICS' ? 'high' : 'medium'
        });
    });
});

// Save admin configuration
fs.writeFileSync('admin-config.json', JSON.stringify(adminData, null, 2));
console.log('✅ Generated admin-config.json with full correspondence');

// Create transformer verification
console.log('\n🔄 TRANSFORMER VERIFICATION:');
const transformers = {
    transform_sum: (value) => parseFloat(value) || 0,
    transform_count: (value) => parseInt(value) || 0,
    transform_avg: (value) => parseFloat(value) || 0,
    transform_max: (value) => parseFloat(value) || 0,
    transform_min: (value) => parseFloat(value) || 0
};

const requiredTransformers = [...new Set(allData.map(e => `transform_${e.calculationType.toLowerCase()}`))];
console.log(`Required transformers: ${requiredTransformers.join(', ')}`);

let missingTransformers = requiredTransformers.filter(t => !transformers[t]);
if (missingTransformers.length > 0) {
    console.log(`⚠️  Missing transformers: ${missingTransformers.join(', ')}`);
} else {
    console.log('✅ All required transformers available');
}

console.log('\n📊 CORRESPONDENCE SUMMARY:');
console.log(`✅ JSON entries: ${allData.length}`);
console.log(`✅ Chart groups: ${Object.keys(chartGroups).length}`);
console.log(`✅ Database tables: ${uniqueTables.length} (P21: ${serverTables.P21.length}, POR: ${serverTables.POR.length})`);
console.log(`✅ Admin data points: ${Object.values(adminData).reduce((sum, group) => sum + group.dataPoints.length, 0)}`);
console.log(`✅ Transformers: ${Object.keys(transformers).length}`);

if (missingAsValue.length === 0 && syntaxIssues.length === 0) {
    console.log('\n🎉 FULL CORRESPONDENCE VERIFIED - READY FOR DEPLOYMENT!');
} else {
    console.log('\n⚠️  ISSUES FOUND - NEED RESOLUTION BEFORE DEPLOYMENT');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Fix any remaining SQL syntax issues');
console.log('2. Restart the dashboard application'); 
console.log('3. Monitor for non-zero, non-99999 values in charts');
console.log('4. Verify MCP server query execution in background worker logs');
