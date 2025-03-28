const fs = require('fs');
const path = require('path');

/**
 * Script to update the AR Aging queries in the initial-data.ts file
 * This script will:
 * 1. Create a backup of the initial-data.ts file
 * 2. Update the AR Aging queries to use the ar_open_items table instead of metrics_period_hierarchy
 */
async function updateArAgingQueries() {
  console.log('=== AR Aging Queries Update ===');
  console.log('Starting at', new Date().toISOString());
  
  // Define the file path
  const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
  
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  // Create a backup of the file
  const backupPath = `${filePath}.backup.${Date.now()}.ts`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Created backup at: ${backupPath}`);
  
  // Read the file content
  let fileContent = fs.readFileSync(filePath, 'utf8');
  console.log('✅ Read file content');
  
  // Define the new AR Aging queries
  const newArAgingQueries = {
    'Current': "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) <= 0",
    '1-30 Days': "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30",
    '31-60 Days': "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60",
    '61-90 Days': "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90",
    '90+ Days': "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) > 90"
  };
  
  // Find and update the AR Aging queries in the file
  let updatedContent = fileContent;
  let updateCount = 0;
  
  for (const [bucket, query] of Object.entries(newArAgingQueries)) {
    // Create a regex pattern to find the AR Aging query for this bucket
    const pattern = new RegExp(`(chartGroup:\\s*['"]AR Aging['"],\\s*variableName:\\s*['"]${bucket}['"].*?productionSqlExpression:\\s*["'])([^"']*)(["'])`, 'gs');
    
    // Check if the pattern matches
    if (pattern.test(updatedContent)) {
      // Replace the SQL expression
      updatedContent = updatedContent.replace(pattern, `$1${query}$3`);
      updateCount++;
      console.log(`✅ Updated query for ${bucket}`);
    } else {
      console.log(`❌ Could not find query for ${bucket}`);
    }
  }
  
  // Write the updated content back to the file
  if (updateCount > 0) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Updated ${updateCount} queries in ${filePath}`);
  } else {
    console.log('❌ No queries were updated');
  }
  
  console.log('\n=== AR Aging Queries Update Completed ===');
}

// Run the update
updateArAgingQueries()
  .then(() => {
    console.log('Update completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
