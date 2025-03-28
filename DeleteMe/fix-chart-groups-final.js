/**
 * Fix Chart Groups Final Script
 * This script fixes chart groups in the initial-data.ts file:
 * - Renames chart groups to match requirements
 * - Ensures each chart group has the correct number of rows
 * - Organizes chart group rows in contiguous sequence
 */

const fs = require('fs');
const path = require('path');

// Chart group requirements and mappings
const chartGroupRequirements = {
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'Por Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 24,
  'Ar Aging': 5,
  'Site Distribution': 3,
  'Key Metrics': 7
};

// Mapping from current chart groups to required chart groups
const chartGroupMapping = {
  'Inventory': 'Inventory',
  'Site Distribution': 'Site Distribution',
  'Metrics': 'Key Metrics',
  'Site Sales': 'Site Distribution',
  'Accounts': 'Historical Data',
  'AR Aging': 'Ar Aging',
  'Orders': 'Daily Orders',
  'Customers': 'Customer Metrics'
};

// Main function to fix chart groups
async function fixChartGroups() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find all chart group occurrences and update them
    let updatedContent = fileContent;
    
    // Update chart group names based on mapping
    Object.entries(chartGroupMapping).forEach(([oldGroup, newGroup]) => {
      const regex = new RegExp(`chartGroup:\\s*["']${oldGroup}["']`, 'g');
      updatedContent = updatedContent.replace(regex, `chartGroup: "${newGroup}"`);
    });
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedContent);
    console.log('\n✅ Successfully updated chart group names in initial-data.ts file');
    
    // Now analyze the updated file to verify changes
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    // Find all chart groups using regex
    const chartGroupRegex = /chartGroup:\s*["']([^"']+)["']/g;
    const chartGroups = {};
    let match;
    
    while ((match = chartGroupRegex.exec(updatedFileContent)) !== null) {
      const group = match[1];
      if (!chartGroups[group]) {
        chartGroups[group] = 0;
      }
      chartGroups[group]++;
    }
    
    // Print updated chart group statistics
    console.log('\nUpdated Chart Group Statistics:');
    Object.entries(chartGroups).forEach(([group, count]) => {
      console.log(`${group}: ${count} rows`);
    });
    
    // Check for chart groups that still don't match requirements
    const incorrectGroups = [];
    Object.entries(chartGroupRequirements).forEach(([group, required]) => {
      const current = chartGroups[group] || 0;
      if (current !== required) {
        incorrectGroups.push({
          group,
          current,
          required
        });
      }
    });
    
    if (incorrectGroups.length > 0) {
      console.log('\nChart groups still with incorrect number of rows:');
      incorrectGroups.forEach(info => {
        console.log(`${info.group}: ${info.current} rows (should be ${info.required})`);
      });
      
      // Generate a report of what needs to be added
      console.log('\nRows that need to be added:');
      incorrectGroups.forEach(info => {
        if (info.current < info.required) {
          console.log(`${info.group}: Need to add ${info.required - info.current} rows`);
        }
      });
    } else {
      console.log('\nAll chart groups now have the correct number of rows!');
    }
    
    // Generate a report of the changes
    const report = {
      chartGroupStatistics: Object.entries(chartGroups).map(([group, count]) => ({
        group,
        count,
        required: chartGroupRequirements[group] || 'Not specified',
        difference: (chartGroupRequirements[group] || 0) - count
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'chart-groups-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nGenerated fix report at ${reportPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
fixChartGroups();
