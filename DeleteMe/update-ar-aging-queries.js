const fs = require('fs');
const path = require('path');

/**
 * Script to update AR Aging queries in the dashboard
 * This script will update the AR Aging queries in the initial-data.ts file
 * with the corrected SQL from our diagnostics.
 */

// Path to the initial data file
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the initial data file
const backupPath = `${initialDataPath}.backup-ar-aging-${Date.now()}.ts`;
fs.copyFileSync(initialDataPath, backupPath);
console.log(`Created backup of initial data file at ${backupPath}`);

// Read the initial data file
let initialData = fs.readFileSync(initialDataPath, 'utf8');

// Corrected SQL for AR Aging queries
const correctedQueries = {
  'Current': "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due = 0",
  '1-30 Days': "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 0 AND number_days_past_due <= 30",
  '31-60 Days': "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 30 AND number_days_past_due <= 60",
  '61-90 Days': "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 60 AND number_days_past_due <= 90",
  '90+ Days': "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 90"
};

// Update the AR Aging queries in the initial data file
let updatedCount = 0;

// For each AR Aging bucket
for (const [bucket, query] of Object.entries(correctedQueries)) {
  // Find the corresponding entry in the initial data file
  const bucketRegex = new RegExp(`chartGroup: 'AR Aging',[\\s\\n]*variableName: '${bucket}'`, 'g');
  const match = bucketRegex.exec(initialData);
  
  if (match) {
    // Find the productionSqlExpression for this entry
    const sqlExpressionRegex = new RegExp(`(productionSqlExpression: ")[^"]*(",[\\s\\n]*tableName: ")([^"]*)`, 'g');
    
    // Start searching from the position of the match
    sqlExpressionRegex.lastIndex = match.index;
    
    // Find the next sqlExpression after the match
    const sqlMatch = sqlExpressionRegex.exec(initialData);
    
    if (sqlMatch) {
      // Replace the SQL expression with the corrected query
      const originalSql = sqlMatch[0];
      const updatedSql = `${sqlMatch[1]}${query}${sqlMatch[2]}metrics_period_hierarchy`;
      
      initialData = initialData.replace(originalSql, updatedSql);
      updatedCount++;
      
      console.log(`Updated query for '${bucket}' bucket`);
      console.log(`  Original: ${sqlMatch[0].substring(0, 100)}...`);
      console.log(`  Updated:  ${updatedSql.substring(0, 100)}...`);
    } else {
      console.log(`Could not find SQL expression for '${bucket}' bucket`);
    }
  } else {
    console.log(`Could not find entry for '${bucket}' bucket`);
  }
}

// Write the updated initial data file
fs.writeFileSync(initialDataPath, initialData);
console.log(`\nUpdated ${updatedCount} AR Aging queries in ${initialDataPath}`);

console.log('\nNext steps:');
console.log('1. Run the dashboard to test the updated AR Aging queries');
console.log('2. Check the AR Aging chart to ensure it displays correctly');
