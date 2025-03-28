/**
 * Fix Customer Chart Names Script
 * This script:
 * 1. Updates chart names for Customer Metrics rows to match exactly "Customer Metrics"
 * 2. Ensures consistency between chart groups and chart names for customer-related rows
 */

const fs = require('fs');
const path = require('path');

// Main function to fix customer chart names
async function fixCustomerChartNames() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-customer-names-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find all objects with chartGroup "Customer Metrics"
    const customerMetricsRegex = /{[^}]*chartGroup:\s*["']Customer Metrics["'][^}]*}/g;
    const matches = [...fileContent.matchAll(customerMetricsRegex)];
    
    console.log(`Found ${matches.length} objects with chartGroup "Customer Metrics"`);
    
    // Update each match to have chartName "Customer Metrics"
    let updatedContent = fileContent;
    let updatedCount = 0;
    
    for (const match of matches) {
      const originalObj = match[0];
      
      // Check if the object has chartName "Customers"
      const chartNameMatch = originalObj.match(/chartName:\s*["']([^"']+)["']/);
      
      if (chartNameMatch && chartNameMatch[1] !== "Customer Metrics") {
        // Update the chartName to "Customer Metrics"
        const updatedObj = originalObj.replace(
          /(chartName:\s*["'])[^"']*["']/,
          '$1Customer Metrics"'
        );
        
        // Replace the original object with the updated one
        updatedContent = updatedContent.replace(originalObj, updatedObj);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} objects to have chartName "Customer Metrics"`);
    
    // Write the updated file
    if (updatedCount > 0) {
      fs.writeFileSync(initialDataPath, updatedContent);
      console.log('\n✅ Successfully updated customer chart names in the file');
    } else {
      console.log('\nNo changes were made to the file');
    }
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart groups and names in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartGroups = {};
    const chartNames = {};
    
    // Extract all chart groups and names
    const chartGroupRegex = /chartGroup:\s*["']([^"']+)["']/g;
    const chartNameRegex = /chartName:\s*["']([^"']+)["']/g;
    
    let match;
    while ((match = chartGroupRegex.exec(updatedFileContent)) !== null) {
      const chartGroup = match[1];
      chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
    }
    
    while ((match = chartNameRegex.exec(updatedFileContent)) !== null) {
      const chartName = match[1];
      chartNames[chartName] = (chartNames[chartName] || 0) + 1;
    }
    
    console.log('\nChart Group Counts:');
    Object.entries(chartGroups).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
    });
    
    console.log('\nChart Name Counts:');
    Object.entries(chartNames).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
    // Check for mismatches
    console.log('\nChecking for mismatches between chart groups and chart names:');
    
    const mismatches = [];
    const chartGroupRegexWithId = /id:\s*["']([^"']+)["'].*?chartGroup:\s*["']([^"']+)["']/gs;
    const chartNameRegexWithId = /id:\s*["']([^"']+)["'].*?chartName:\s*["']([^"']+)["']/gs;
    
    const idToChartGroup = {};
    const idToChartName = {};
    
    while ((match = chartGroupRegexWithId.exec(updatedFileContent)) !== null) {
      const id = match[1];
      const chartGroup = match[2];
      idToChartGroup[id] = chartGroup;
    }
    
    while ((match = chartNameRegexWithId.exec(updatedFileContent)) !== null) {
      const id = match[1];
      const chartName = match[2];
      idToChartName[id] = chartName;
    }
    
    for (const id in idToChartGroup) {
      if (idToChartName[id] && idToChartGroup[id] !== idToChartName[id]) {
        mismatches.push({
          id,
          chartGroup: idToChartGroup[id],
          chartName: idToChartName[id]
        });
      }
    }
    
    if (mismatches.length > 0) {
      console.log(`Found ${mismatches.length} mismatches:`);
      mismatches.forEach(mismatch => {
        console.log(`ID: ${mismatch.id}, Chart Group: ${mismatch.chartGroup}, Chart Name: ${mismatch.chartName}`);
      });
    } else {
      console.log('No mismatches found. All chart names match their corresponding chart groups.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixCustomerChartNames();
