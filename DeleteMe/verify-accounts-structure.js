/**
 * Verify Accounts Structure Script
 * This script verifies that the Accounts chart group has exactly 36 rows
 * (12 months × 3 variables: Payable, Overdue, Receivable)
 */

const fs = require('fs');
const path = require('path');

// Main function to verify accounts structure
async function verifyAccountsStructure() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    const fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Extract all rows with "chartGroup: "Accounts""
    const accountsRowsRegex = /{\s+id:\s+'[^']+',\s+name:\s+"Accounts[^}]+}/g;
    const accountsRows = fileContent.match(accountsRowsRegex) || [];
    
    console.log(`Found ${accountsRows.length} Accounts rows in initial-data.ts`);
    
    // Extract month and variable information
    const accountsInfo = accountsRows.map(row => {
      const nameMatch = row.match(/name:\s+"Accounts - ([^"]+) - Month (\d+)"/);
      const variableMatch = row.match(/variableName:\s+"([^"]+)"/);
      
      if (nameMatch && variableMatch) {
        return {
          variable: nameMatch[1],
          month: parseInt(nameMatch[2]),
          variableName: variableMatch[1]
        };
      }
      return null;
    }).filter(Boolean);
    
    // Group by month
    const monthGroups = {};
    accountsInfo.forEach(info => {
      if (!monthGroups[info.month]) {
        monthGroups[info.month] = [];
      }
      monthGroups[info.month].push(info.variable);
    });
    
    // Check if we have 12 months
    const months = Object.keys(monthGroups).map(Number).sort((a, b) => a - b);
    console.log(`Found data for ${months.length} months: ${months.join(', ')}`);
    
    if (months.length !== 12) {
      console.log('WARNING: Expected 12 months, but found', months.length);
    }
    
    // Check if each month has 3 variables (Payable, Overdue, Receivable)
    let missingVariables = false;
    months.forEach(month => {
      const variables = monthGroups[month].sort();
      console.log(`Month ${month}: ${variables.join(', ')}`);
      
      if (variables.length !== 3) {
        console.log(`WARNING: Month ${month} has ${variables.length} variables instead of 3`);
        missingVariables = true;
      }
      
      if (!variables.includes('Payable')) {
        console.log(`WARNING: Month ${month} is missing Payable variable`);
        missingVariables = true;
      }
      
      if (!variables.includes('Overdue')) {
        console.log(`WARNING: Month ${month} is missing Overdue variable`);
        missingVariables = true;
      }
      
      if (!variables.includes('Receivable')) {
        console.log(`WARNING: Month ${month} is missing Receivable variable`);
        missingVariables = true;
      }
    });
    
    if (!missingVariables) {
      console.log('All months have the required variables (Payable, Overdue, Receivable)');
    }
    
    // Check if there are exactly 36 rows (12 months × 3 variables)
    if (accountsRows.length === 36) {
      console.log('✅ CORRECT: There are exactly 36 Accounts rows (12 months × 3 variables)');
    } else {
      console.log(`WARNING: Expected 36 Accounts rows, but found ${accountsRows.length}`);
      
      if (accountsRows.length > 36) {
        console.log(`There are ${accountsRows.length - 36} extra rows that need to be removed`);
      } else {
        console.log(`There are ${36 - accountsRows.length} missing rows that need to be added`);
      }
    }
    
    // Save results to JSON file
    const results = {
      totalRows: accountsRows.length,
      months,
      monthGroups,
      isCorrect: accountsRows.length === 36 && months.length === 12 && !missingVariables
    };
    
    const jsonFile = path.join(process.cwd(), 'accounts-structure-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'accounts-structure-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the verification
verifyAccountsStructure().catch(error => {
  console.error('Unhandled error:', error);
});
