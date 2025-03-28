const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Expected chart group structure based on updated requirements
const expectedStructure = {
  'AR Aging': {
    totalRows: 5,
    variables: ['Amount Due'],
    categories: ['1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Current']
  },
  'Accounts': {
    totalRows: 36,
    variables: ['Payable', 'Receivable', 'Overdue'],
    months: true
  },
  'Customer Metrics': {
    totalRows: 24,
    variables: ['New', 'Active'],
    months: true
  },
  'Daily Orders': {
    totalRows: 7,
    variables: ['Orders'],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  'Historical Data': {
    totalRows: 36,
    variables: ['Orders', 'Revenue', 'Growth'],
    months: true
  },
  'Inventory': {
    totalRows: 8,
    variables: ['In Stock', 'On Order'],
    departments: ['Department 1', 'Department 2', 'Department 3', 'Department 4']
  },
  'Key Metrics': {
    totalRows: 7,
    variables: ['Total Orders', 'Open Orders', 'Total Sales Monthly', 'Daily Revenue', 'Turnover Rate', 'Open Invoices', 'Payable']
  },
  'Site Distribution': {
    totalRows: 3,
    variables: ['Value'],
    locations: ['Columbus', 'Jackson', 'Elk City']
  },
  'POR Overview': {
    totalRows: 36,
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    months: true
  },
  'Web Orders': {
    totalRows: 12,
    variables: ['Orders'],
    months: true
  }
};

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to the database at ${dbPath}`);
});

// Function to get chart data from database
async function getChartData() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM chart_data', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to analyze chart groups in database
async function analyzeChartGroups() {
  try {
    const chartData = await getChartData();
    
    // Group data by chart_group
    const chartGroups = {};
    chartData.forEach(row => {
      const chartGroup = row.chart_group;
      if (!chartGroups[chartGroup]) {
        chartGroups[chartGroup] = [];
      }
      chartGroups[chartGroup].push(row);
    });
    
    console.log('\nChart Groups in Database:');
    console.log('-------------------------');
    Object.keys(chartGroups).sort().forEach(group => {
      console.log(`${group}: ${chartGroups[group].length} rows`);
    });
    
    // Check for missing chart groups
    console.log('\nMissing Chart Groups:');
    const missingGroups = [];
    Object.keys(expectedStructure).forEach(group => {
      if (!chartGroups[group]) {
        missingGroups.push(group);
        console.log(`  ${group}`);
      }
    });
    if (missingGroups.length === 0) {
      console.log('  None');
    }
    
    // Check for unexpected chart groups
    console.log('\nUnexpected Chart Groups:');
    const unexpectedGroups = [];
    Object.keys(chartGroups).forEach(group => {
      if (!expectedStructure[group]) {
        unexpectedGroups.push(group);
        console.log(`  ${group}`);
      }
    });
    if (unexpectedGroups.length === 0) {
      console.log('  None');
    }
    
    // Check row counts
    console.log('\nChart Group Count Compliance:');
    Object.keys(expectedStructure).forEach(group => {
      if (chartGroups[group]) {
        const expected = expectedStructure[group].totalRows;
        const actual = chartGroups[group].length;
        const status = actual === expected ? '✅ Compliant' : 
                      actual > expected ? '⚠️ Exceeds' : '❌ Insufficient';
        console.log(`  ${group}: Expected ${expected}, Found ${actual} - ${status}`);
      } else {
        console.log(`  ${group}: Expected ${expectedStructure[group].totalRows}, Found 0 - ❌ Missing`);
      }
    });
    
    // Analyze variables in each chart group
    console.log('\nVariables by Chart Group:');
    console.log('------------------------');
    Object.keys(chartGroups).sort().forEach(group => {
      console.log(`${group}:`);
      
      // Get unique variable names
      const variables = new Set();
      chartGroups[group].forEach(row => {
        variables.add(row.variable_name);
      });
      
      // Print variables
      Array.from(variables).sort().forEach(variable => {
        console.log(`  - ${variable}`);
      });
      
      // Check for expected variables
      if (expectedStructure[group]) {
        const missingVariables = expectedStructure[group].variables.filter(
          v => !Array.from(variables).some(dbVar => dbVar.includes(v))
        );
        
        if (missingVariables.length > 0) {
          console.log(`  Missing expected variables:`);
          missingVariables.forEach(v => console.log(`    - ${v}`));
        }
      }
    });
    
    // Check monthly data for chart groups that should have it
    console.log('\nMonthly Data Check:');
    console.log('--------------------');
    Object.keys(expectedStructure).forEach(group => {
      if (expectedStructure[group].months && chartGroups[group]) {
        console.log(`${group}:`);
        
        // Get unique variable names
        const variables = new Set();
        chartGroups[group].forEach(row => {
          variables.add(row.variable_name);
        });
        
        // Check each variable for monthly data
        Array.from(variables).sort().forEach(variable => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const missingMonths = [];
          
          months.forEach(month => {
            const hasMonth = chartGroups[group].some(row => 
              row.variable_name === variable && (
                row.timeframe === month || 
                row.name.includes(`${month}`) ||
                row.name.includes(`- ${month}`)
              )
            );
            
            if (!hasMonth) {
              missingMonths.push(month);
            }
          });
          
          if (missingMonths.length > 0) {
            console.log(`  - ${variable}: Missing months: ${missingMonths.join(', ')}`);
          } else {
            console.log(`  - ${variable}: All months present ✅`);
          }
        });
      }
    });
    
    // Generate compliance summary
    console.log('\nCompliance Summary:');
    console.log('------------------');
    let compliantGroups = 0;
    let nonCompliantGroups = 0;
    let exceedingGroups = 0;
    
    Object.keys(expectedStructure).forEach(group => {
      if (chartGroups[group]) {
        const expected = expectedStructure[group].totalRows;
        const actual = chartGroups[group].length;
        
        if (actual === expected) {
          compliantGroups++;
          console.log(`  ${group}: ✅ Compliant (${actual}/${expected} rows)`);
        } else if (actual > expected) {
          exceedingGroups++;
          console.log(`  ${group}: ⚠️ Exceeds (${actual}/${expected} rows)`);
        } else {
          nonCompliantGroups++;
          console.log(`  ${group}: ❌ Insufficient (${actual}/${expected} rows)`);
        }
      } else {
        nonCompliantGroups++;
        console.log(`  ${group}: ❌ Missing (0/${expectedStructure[group].totalRows} rows)`);
      }
    });
    
    console.log('\nOverall Compliance:');
    console.log(`  Compliant Groups: ${compliantGroups}/${Object.keys(expectedStructure).length}`);
    console.log(`  Non-compliant Groups: ${nonCompliantGroups}/${Object.keys(expectedStructure).length}`);
    console.log(`  Exceeding Groups: ${exceedingGroups}/${Object.keys(expectedStructure).length}`);
    
    // Generate action items
    console.log('\nAction Items:');
    console.log('-------------');
    
    // Missing chart groups
    if (missingGroups.length > 0) {
      console.log('1. Add missing chart groups:');
      missingGroups.forEach(group => {
        console.log(`   - ${group} (${expectedStructure[group].totalRows} rows required)`);
      });
    }
    
    // Insufficient row counts
    const insufficientGroups = Object.keys(expectedStructure).filter(group => 
      chartGroups[group] && chartGroups[group].length < expectedStructure[group].totalRows
    );
    
    if (insufficientGroups.length > 0) {
      console.log('2. Add missing rows to these chart groups:');
      insufficientGroups.forEach(group => {
        const missing = expectedStructure[group].totalRows - chartGroups[group].length;
        console.log(`   - ${group} (${missing} more rows needed)`);
      });
    }
    
    // Missing variables
    let hasMissingVariables = false;
    Object.keys(expectedStructure).forEach(group => {
      if (chartGroups[group]) {
        const dbVariables = new Set();
        chartGroups[group].forEach(row => {
          dbVariables.add(row.variable_name);
        });
        
        const missingVariables = expectedStructure[group].variables.filter(
          v => !Array.from(dbVariables).some(dbVar => dbVar.includes(v))
        );
        
        if (missingVariables.length > 0) {
          if (!hasMissingVariables) {
            console.log('3. Add missing variables:');
            hasMissingVariables = true;
          }
          
          console.log(`   - ${group}: ${missingVariables.join(', ')}`);
        }
      }
    });
    
    // Extra variables to consider removing
    console.log('4. Consider removing extra variables:');
    Object.keys(chartGroups).forEach(group => {
      if (expectedStructure[group]) {
        const dbVariables = new Set();
        chartGroups[group].forEach(row => {
          dbVariables.add(row.variable_name);
        });
        
        const extraVariables = Array.from(dbVariables).filter(dbVar => 
          !expectedStructure[group].variables.some(v => dbVar.includes(v))
        );
        
        if (extraVariables.length > 0) {
          console.log(`   - ${group}: ${extraVariables.join(', ')}`);
        }
      }
    });
    
  } catch (error) {
    console.error(`Error during analysis: ${error.message}`);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      }
      console.log('\nDatabase connection closed');
    });
  }
}

// Run the analysis
analyzeChartGroups();
