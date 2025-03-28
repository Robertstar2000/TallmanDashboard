const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

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

// Expected chart groups and their counts based on the architecture
const expectedChartGroups = {
  'Key Metrics': 7,
  'Site Distribution': 3,
  'Accounts': 36,
  'Customer Metrics': 36,
  'Historical Data': 24,
  'Inventory': 24,
  'POR Overview': 36,
  'Open Orders': 12,
  'Web Orders': 24,
  'Daily Orders': 7,
  'AR Aging': 5
};

// Function to verify chart groups in the database
function verifyDatabaseChartGroups() {
  return new Promise((resolve, reject) => {
    // Query to count rows by chart group
    const query = `
      SELECT chart_group, COUNT(*) as count
      FROM chart_data
      GROUP BY chart_group
      ORDER BY chart_group
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        return reject(err);
      }

      console.log('\nChart Groups in Database:');
      console.log('-------------------------');
      
      const dbChartGroups = {};
      rows.forEach(row => {
        dbChartGroups[row.chart_group] = row.count;
        console.log(`${row.chart_group}: ${row.count} rows`);
      });

      // Check for missing chart groups
      console.log('\nMissing Chart Groups in Database:');
      Object.keys(expectedChartGroups).forEach(group => {
        if (!dbChartGroups[group]) {
          console.log(`  ${group}`);
        }
      });

      // Check for count mismatches
      console.log('\nChart Group Count Mismatches:');
      Object.keys(expectedChartGroups).forEach(group => {
        if (dbChartGroups[group] && dbChartGroups[group] !== expectedChartGroups[group]) {
          console.log(`  ${group}: Expected ${expectedChartGroups[group]}, Found ${dbChartGroups[group]}`);
        }
      });

      resolve();
    });
  });
}

// Function to verify variables in each chart group
function verifyChartGroupVariables() {
  return new Promise((resolve, reject) => {
    // Query to get all rows from the database
    const query = `
      SELECT id, chart_group, variable_name
      FROM chart_data
      ORDER BY chart_group, variable_name
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        return reject(err);
      }

      // Group rows by chart group
      const chartGroupVariables = {};
      rows.forEach(row => {
        if (!chartGroupVariables[row.chart_group]) {
          chartGroupVariables[row.chart_group] = new Set();
        }
        chartGroupVariables[row.chart_group].add(row.variable_name);
      });

      console.log('\nVariables by Chart Group:');
      console.log('------------------------');
      Object.keys(chartGroupVariables).sort().forEach(group => {
        console.log(`${group}:`);
        Array.from(chartGroupVariables[group]).sort().forEach(variable => {
          console.log(`  - ${variable}`);
        });
      });

      // Check for monthly variables based on naming pattern
      const monthlyChartGroups = [
        'Accounts', 'Customer Metrics', 'Historical Data', 
        'Inventory', 'POR Overview', 'Open Orders', 'Web Orders'
      ];

      console.log('\nChecking Monthly Data:');
      console.log('--------------------');
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyChartGroups.forEach(group => {
        console.log(`${group}:`);
        
        // Get variables for this chart group without month suffix
        const variableBaseNames = new Set();
        rows
          .filter(row => row.chart_group === group)
          .forEach(row => {
            // Check if variable name ends with a month
            const monthSuffix = months.find(month => row.variable_name.endsWith(month));
            if (monthSuffix) {
              // Extract the base name without the month
              const baseName = row.variable_name.substring(0, row.variable_name.length - monthSuffix.length).trim();
              variableBaseNames.add(baseName);
            } else {
              // If no month suffix, just add the variable name
              variableBaseNames.add(row.variable_name);
            }
          });
        
        // For each base variable name, check if we have all 12 months
        Array.from(variableBaseNames).sort().forEach(baseName => {
          const monthsPresent = months.filter(month => {
            return rows.some(row => 
              row.chart_group === group && 
              (row.variable_name === `${baseName}${month}` || row.variable_name === `${baseName} ${month}`)
            );
          });
          
          const missingMonths = months.filter(month => !monthsPresent.includes(month));
          
          if (missingMonths.length > 0) {
            console.log(`  - ${baseName}: Missing months: ${missingMonths.join(', ')}`);
          } else if (monthsPresent.length === 12) {
            console.log(`  - ${baseName}: All 12 months present`);
          } else if (monthsPresent.length === 0) {
            console.log(`  - ${baseName}: No monthly data (may be a single value metric)`);
          } else {
            console.log(`  - ${baseName}: Partial months present: ${monthsPresent.join(', ')}`);
          }
        });
      });

      resolve();
    });
  });
}

// Function to verify initial data
function verifyInitialData() {
  return new Promise((resolve, reject) => {
    // Path to the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

    // Extract the initialSpreadsheetData array
    const dataStartRegex = /export const initialSpreadsheetData: SpreadsheetRow\[] = \[/;
    const dataEndRegex = /\];(\r?\n\r?\n\/\/ Chart group settings)/;

    const dataStartMatch = initialDataContent.match(dataStartRegex);
    const dataEndMatch = initialDataContent.match(dataEndRegex);

    if (!dataStartMatch || !dataEndMatch) {
      return reject(new Error('Could not find initialSpreadsheetData array in the file'));
    }

    const dataStartIndex = dataStartMatch.index + dataStartMatch[0].length;
    const dataEndIndex = dataEndMatch.index;

    // Extract the data array as a string
    const dataArrayString = initialDataContent.substring(dataStartIndex, dataEndIndex);

    // Create a temporary file with the data array
    const tempFilePath = path.join(process.cwd(), 'temp-data-array.js');
    fs.writeFileSync(tempFilePath, 'module.exports = [' + dataArrayString + '];');

    // Require the temporary file
    const initialSpreadsheetData = require('./temp-data-array.js');

    // Delete the temporary file
    fs.unlinkSync(tempFilePath);

    console.log(`\nLoaded ${initialSpreadsheetData.length} rows from initial-data.ts`);

    // Count rows by chart group
    const chartGroupCounts = {};
    initialSpreadsheetData.forEach(row => {
      if (!chartGroupCounts[row.chartGroup]) {
        chartGroupCounts[row.chartGroup] = 0;
      }
      chartGroupCounts[row.chartGroup]++;
    });

    console.log('\nChart Groups in Initial Data:');
    console.log('---------------------------');
    Object.keys(chartGroupCounts).sort().forEach(group => {
      console.log(`${group}: ${chartGroupCounts[group]} rows`);
    });

    // Check for missing chart groups
    console.log('\nMissing Chart Groups in Initial Data:');
    Object.keys(expectedChartGroups).forEach(group => {
      if (!chartGroupCounts[group]) {
        console.log(`  ${group}`);
      }
    });

    // Check for count mismatches
    console.log('\nChart Group Count Mismatches in Initial Data:');
    Object.keys(expectedChartGroups).forEach(group => {
      if (chartGroupCounts[group] && chartGroupCounts[group] !== expectedChartGroups[group]) {
        console.log(`  ${group}: Expected ${expectedChartGroups[group]}, Found ${chartGroupCounts[group]}`);
      }
    });

    resolve();
  });
}

// Run all verification functions
async function runVerification() {
  try {
    console.log('Verifying database chart groups...');
    await verifyDatabaseChartGroups();

    console.log('\nVerifying chart group variables...');
    await verifyChartGroupVariables();

    console.log('\nVerifying initial data...');
    await verifyInitialData();

    console.log('\nVerification complete!');
  } catch (err) {
    console.error(`Error during verification: ${err.message}`);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      }
      console.log('Database connection closed');
    });
  }
}

// Run the verification
runVerification();
