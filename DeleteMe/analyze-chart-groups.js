/**
 * Analyze Chart Groups Script
 * This script analyzes chart groups in the initial-data.ts file
 * and reports statistics without making any changes
 */

const fs = require('fs');
const path = require('path');

// Chart group requirements
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

// Main function to analyze chart groups
async function analyzeChartGroups() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    const fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Find all chart groups using regex
    const chartGroupRegex = /chartGroup:\s*["']([^"']+)["']/g;
    const chartGroups = {};
    let match;
    
    while ((match = chartGroupRegex.exec(fileContent)) !== null) {
      const group = match[1];
      if (!chartGroups[group]) {
        chartGroups[group] = 0;
      }
      chartGroups[group]++;
    }
    
    // Print chart group statistics
    console.log('\nChart Group Statistics:');
    Object.entries(chartGroups).forEach(([group, count]) => {
      console.log(`${group}: ${count} rows`);
    });
    
    // Check for chart groups that don't match requirements
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
      console.log('\nChart groups with incorrect number of rows:');
      incorrectGroups.forEach(info => {
        console.log(`${info.group}: ${info.current} rows (should be ${info.required})`);
      });
    }
    
    // Find objects with missing chart group
    const objectRegex = /{[^}]*id:[^}]*name:[^}]*}/g;
    const objects = [];
    let objMatch;
    
    while ((objMatch = objectRegex.exec(fileContent)) !== null) {
      objects.push(objMatch[0]);
    }
    
    console.log(`\nFound approximately ${objects.length} total objects in the file`);
    
    // Count objects with missing chart group
    const missingChartGroupCount = objects.filter(obj => !obj.includes('chartGroup:')).length;
    console.log(`Found ${missingChartGroupCount} objects with missing chart group`);
    
    // Find all chart names
    const chartNameRegex = /chartName:\s*["']([^"']+)["']/g;
    const chartNames = {};
    let chartNameMatch;
    
    while ((chartNameMatch = chartNameRegex.exec(fileContent)) !== null) {
      const chartName = chartNameMatch[1];
      if (!chartNames[chartName]) {
        chartNames[chartName] = 0;
      }
      chartNames[chartName]++;
    }
    
    console.log('\nChart Name Statistics:');
    Object.entries(chartNames).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
    // Generate a report of the analysis
    const report = {
      totalObjects: objects.length,
      missingChartGroup: missingChartGroupCount,
      chartGroupStatistics: Object.entries(chartGroups).map(([group, count]) => ({
        group,
        count,
        required: chartGroupRequirements[group] || 'Not specified'
      })),
      chartNameStatistics: Object.entries(chartNames).map(([chartName, count]) => ({
        chartName,
        count
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'chart-groups-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nGenerated analysis report at ${reportPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
analyzeChartGroups();
