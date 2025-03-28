const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Extract all chart groups
const chartGroupPattern = /chartGroup:\s*['"]([^'"]+)['"]/g;
const chartGroups = {};
let match;

while ((match = chartGroupPattern.exec(content)) !== null) {
  const chartGroup = match[1];
  chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
}

// Expected counts based on requirements
const expectedCounts = {
  'AR Aging': 5,
  'Accounts': 36,
  'Customer Metrics': 24,
  'Daily Orders': 7,
  'Historical Data': 36,
  'Inventory': 8,
  'Key Metrics': 7,
  'Site Distribution': 3,
  'POR Overview': 36,
  'Web Orders': 12
};

// Compare actual vs expected counts
console.log('Chart Group Counts:');
console.log('------------------');
let totalActual = 0;
let totalExpected = 0;

for (const chartGroup in expectedCounts) {
  const actual = chartGroups[chartGroup] || 0;
  const expected = expectedCounts[chartGroup];
  totalActual += actual;
  totalExpected += expected;
  
  const status = actual === expected ? '✓' : '✗';
  console.log(`${chartGroup}: ${actual} / ${expected} ${status}`);
}

console.log('------------------');
console.log(`Total: ${totalActual} / ${totalExpected} ${totalActual === totalExpected ? '✓' : '✗'}`);

// Check for SQL expressions that might not yield non-zero results
const sqlPattern = /productionSqlExpression:\s*[`'"](SELECT\s+0|SELECT\s+NULL|SELECT\s+CAST\(0)[`'"]/g;
const zeroResults = [];

while ((match = sqlPattern.exec(content)) !== null) {
  const startPos = content.lastIndexOf('chartGroup:', match.index);
  const variablePos = content.lastIndexOf('variableName:', match.index);
  
  if (startPos !== -1 && variablePos !== -1) {
    const chartGroupLine = content.substring(startPos, content.indexOf('\n', startPos));
    const variableLine = content.substring(variablePos, content.indexOf('\n', variablePos));
    
    const chartGroup = chartGroupLine.match(/chartGroup:\s*['"]([^'"]+)['"]/)[1];
    const variableName = variableLine.match(/variableName:\s*['"]([^'"]+)['"]/)[1];
    
    zeroResults.push({ chartGroup, variableName });
  }
}

if (zeroResults.length > 0) {
  console.log('\nSQL expressions that might yield zero results:');
  for (const item of zeroResults) {
    console.log(`- ${item.chartGroup}: ${item.variableName}`);
  }
} else {
  console.log('\nAll SQL expressions should yield non-zero results when executed against the production P21 database.');
}
