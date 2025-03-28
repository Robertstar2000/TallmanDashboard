/**
 * Find All Account Rows Script
 * This script thoroughly examines the initial-data.ts file to find all account rows
 */

const fs = require('fs');
const path = require('path');

// Main function to find all account rows
function findAllAccountRows() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    const fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Find all account rows using different methods
    console.log('\nMethod 1: Using regex to find "Accounts -" in name field');
    const accountMatches = [...fileContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
    console.log(`Found ${accountMatches.length} account rows`);
    
    // Count all occurrences of "Accounts -" anywhere in the file
    console.log('\nMethod 2: Counting all occurrences of "Accounts -" anywhere in the file');
    const allAccountMatches = [...fileContent.matchAll(/Accounts -/g)];
    console.log(`Found ${allAccountMatches.length} occurrences of "Accounts -"`);
    
    // Count all occurrences of "chartName: "Accounts"" in the file
    console.log('\nMethod 3: Counting all occurrences of chartName: "Accounts"');
    const chartNameMatches = [...fileContent.matchAll(/chartName:\s*["']Accounts["']/g)];
    console.log(`Found ${chartNameMatches.length} occurrences of chartName: "Accounts"`);
    
    // Count all occurrences of "chartGroup: "Accounts"" in the file
    console.log('\nMethod 4: Counting all occurrences of chartGroup: "Accounts"');
    const chartGroupMatches = [...fileContent.matchAll(/chartGroup:\s*["']Accounts["']/g)];
    console.log(`Found ${chartGroupMatches.length} occurrences of chartGroup: "Accounts"`);
    
    // Find all objects with "Accounts" in them
    console.log('\nMethod 5: Finding all objects with "Accounts" in them');
    
    // Split the file into objects
    const objects = [];
    let currentObject = '';
    let braceCount = 0;
    let inObject = false;
    
    for (let i = 0; i < fileContent.length; i++) {
      const char = fileContent[i];
      
      if (char === '{') {
        braceCount++;
        if (!inObject) {
          inObject = true;
          currentObject = '{';
        } else {
          currentObject += char;
        }
      } else if (char === '}') {
        braceCount--;
        currentObject += char;
        
        if (braceCount === 0 && inObject) {
          inObject = false;
          objects.push(currentObject);
          currentObject = '';
        }
      } else if (inObject) {
        currentObject += char;
      }
    }
    
    console.log(`Found ${objects.length} total objects in the file`);
    
    // Filter objects that contain "Accounts"
    const accountObjects = objects.filter(obj => obj.includes('Accounts'));
    console.log(`Found ${accountObjects.length} objects containing "Accounts"`);
    
    // Extract account details from these objects
    const accountDetails = accountObjects.map(obj => {
      const nameMatch = obj.match(/name:\s*["']([^"']+)["']/);
      const idMatch = obj.match(/id:\s*["'](\d+)["']/);
      
      return {
        id: idMatch ? idMatch[1] : 'unknown',
        name: nameMatch ? nameMatch[1] : 'unknown',
        object: obj
      };
    });
    
    // Group by name
    const nameGroups = {};
    accountDetails.forEach(detail => {
      if (!nameGroups[detail.name]) {
        nameGroups[detail.name] = [];
      }
      nameGroups[detail.name].push(detail);
    });
    
    // Find duplicates
    const duplicates = Object.entries(nameGroups)
      .filter(([_, details]) => details.length > 1)
      .map(([name, details]) => ({ name, details }));
    
    if (duplicates.length > 0) {
      console.log('\nFound duplicate names:');
      duplicates.forEach(dup => {
        console.log(`Name: ${dup.name}, Count: ${dup.details.length}`);
        dup.details.forEach(detail => {
          console.log(`  ID: ${detail.id}`);
        });
      });
    } else {
      console.log('\nNo duplicate names found');
    }
    
    // Check for accounts that don't follow the pattern "Accounts - [Type] - Month [Number]"
    const validPattern = /^Accounts - (Payable|Overdue|Receivable) - Month (\d+)$/;
    const invalidAccounts = accountDetails.filter(detail => !validPattern.test(detail.name));
    
    if (invalidAccounts.length > 0) {
      console.log('\nFound accounts with invalid names:');
      invalidAccounts.forEach(account => {
        console.log(`ID: ${account.id}, Name: ${account.name}`);
      });
    } else {
      console.log('\nNo accounts with invalid names found');
    }
    
    // Check for accounts with month numbers outside 1-12
    const validMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const invalidMonthAccounts = accountDetails.filter(detail => {
      const match = detail.name.match(/^Accounts - [^-]+ - Month (\d+)$/);
      return match && !validMonths.includes(parseInt(match[1], 10));
    });
    
    if (invalidMonthAccounts.length > 0) {
      console.log('\nFound accounts with invalid month numbers:');
      invalidMonthAccounts.forEach(account => {
        console.log(`ID: ${account.id}, Name: ${account.name}`);
      });
    } else {
      console.log('\nNo accounts with invalid month numbers found');
    }
    
    // Check for accounts with types other than Payable, Overdue, Receivable
    const validTypes = ['Payable', 'Overdue', 'Receivable'];
    const invalidTypeAccounts = accountDetails.filter(detail => {
      const match = detail.name.match(/^Accounts - ([^-]+) - Month \d+$/);
      return match && !validTypes.includes(match[1]);
    });
    
    if (invalidTypeAccounts.length > 0) {
      console.log('\nFound accounts with invalid types:');
      invalidTypeAccounts.forEach(account => {
        console.log(`ID: ${account.id}, Name: ${account.name}`);
      });
    } else {
      console.log('\nNo accounts with invalid types found');
    }
    
    // Count the number of accounts for each month and type
    const monthTypeCounts = {};
    accountDetails.forEach(detail => {
      const match = detail.name.match(/^Accounts - ([^-]+) - Month (\d+)$/);
      if (match) {
        const type = match[1];
        const month = parseInt(match[2], 10);
        const key = `${month}-${type}`;
        
        if (!monthTypeCounts[key]) {
          monthTypeCounts[key] = [];
        }
        monthTypeCounts[key].push(detail);
      }
    });
    
    // Find month-type combinations with more than one account
    const duplicateMonthTypes = Object.entries(monthTypeCounts)
      .filter(([_, details]) => details.length > 1)
      .map(([key, details]) => ({ key, details }));
    
    if (duplicateMonthTypes.length > 0) {
      console.log('\nFound duplicate month-type combinations:');
      duplicateMonthTypes.forEach(dup => {
        console.log(`Month-Type: ${dup.key}, Count: ${dup.details.length}`);
        dup.details.forEach(detail => {
          console.log(`  ID: ${detail.id}, Name: ${detail.name}`);
        });
      });
    } else {
      console.log('\nNo duplicate month-type combinations found');
    }
    
    // Check if we have exactly 36 valid accounts (12 months × 3 types)
    const validAccounts = accountDetails.filter(detail => {
      const match = detail.name.match(/^Accounts - (Payable|Overdue|Receivable) - Month (\d+)$/);
      return match && validMonths.includes(parseInt(match[2], 10));
    });
    
    console.log(`\nFound ${validAccounts.length} valid accounts (should be 36)`);
    
    if (validAccounts.length > 36) {
      console.log(`\nExcess accounts: ${validAccounts.length - 36}`);
      
      // If we have duplicates, identify them
      if (duplicateMonthTypes.length > 0) {
        console.log('\nExcess accounts are due to duplicates');
      } else {
        console.log('\nExcess accounts are not due to duplicates - this is unexpected');
        
        // Print all valid accounts for manual inspection
        console.log('\nAll valid accounts:');
        validAccounts.forEach(account => {
          console.log(`ID: ${account.id}, Name: ${account.name}`);
        });
      }
    } else if (validAccounts.length < 36) {
      console.log(`\nMissing accounts: ${36 - validAccounts.length}`);
      
      // Check which month-type combinations are missing
      const expectedCombinations = [];
      for (let month = 1; month <= 12; month++) {
        for (const type of validTypes) {
          expectedCombinations.push(`${month}-${type}`);
        }
      }
      
      const existingCombinations = Object.keys(monthTypeCounts);
      const missingCombinations = expectedCombinations.filter(combo => !existingCombinations.includes(combo));
      
      if (missingCombinations.length > 0) {
        console.log('\nMissing month-type combinations:');
        missingCombinations.forEach(combo => {
          console.log(`  ${combo}`);
        });
      }
    }
    
    // Let's also check for any "Accounts" entries that might be outside the initialSpreadsheetData array
    console.log('\nMethod 6: Checking for "Accounts" entries outside initialSpreadsheetData');
    
    const initialDataStart = fileContent.indexOf('initialSpreadsheetData');
    const initialDataEnd = fileContent.indexOf('export default initialSpreadsheetData');
    
    if (initialDataStart !== -1 && initialDataEnd !== -1) {
      const beforeInitialData = fileContent.substring(0, initialDataStart);
      const afterInitialData = fileContent.substring(initialDataEnd);
      
      const beforeMatches = [...beforeInitialData.matchAll(/Accounts -/g)];
      const afterMatches = [...afterInitialData.matchAll(/Accounts -/g)];
      
      console.log(`Found ${beforeMatches.length} "Accounts -" occurrences before initialSpreadsheetData`);
      console.log(`Found ${afterMatches.length} "Accounts -" occurrences after initialSpreadsheetData`);
      
      if (beforeMatches.length > 0 || afterMatches.length > 0) {
        console.log('This could explain the discrepancy in account counts');
      }
    }
    
    // Check for any "Accounts" entries in comments
    console.log('\nMethod 7: Checking for "Accounts" entries in comments');
    
    const commentMatches = [...fileContent.matchAll(/\/\/.*Accounts -|\/\*[\s\S]*?Accounts -[\s\S]*?\*\//g)];
    console.log(`Found ${commentMatches.length} "Accounts -" occurrences in comments`);
    
    if (commentMatches.length > 0) {
      console.log('This could explain the discrepancy in account counts');
    }
    
    // Let's also try to find the exact line numbers for each account row
    console.log('\nMethod 8: Finding line numbers for each account row');
    
    const lines = fileContent.split('\n');
    const accountLines = lines.map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes('name:') && line.includes('Accounts -'));
    
    console.log(`Found ${accountLines.length} lines containing account names`);
    
    // Extract account details from these lines
    const lineDetails = accountLines.map(({ line, index }) => {
      const match = line.match(/name:\s*["']([^"']+)["']/);
      return {
        lineNumber: index,
        name: match ? match[1] : 'unknown',
        line
      };
    });
    
    // Group by name
    const lineNameGroups = {};
    lineDetails.forEach(detail => {
      if (!lineNameGroups[detail.name]) {
        lineNameGroups[detail.name] = [];
      }
      lineNameGroups[detail.name].push(detail);
    });
    
    // Find duplicates
    const lineDuplicates = Object.entries(lineNameGroups)
      .filter(([_, details]) => details.length > 1)
      .map(([name, details]) => ({ name, details }));
    
    if (lineDuplicates.length > 0) {
      console.log('\nFound duplicate names by line:');
      lineDuplicates.forEach(dup => {
        console.log(`Name: ${dup.name}, Count: ${dup.details.length}`);
        dup.details.forEach(detail => {
          console.log(`  Line ${detail.lineNumber}: ${detail.line.trim()}`);
        });
      });
    } else {
      console.log('\nNo duplicate names found by line');
    }
    
    // Print all account lines for inspection
    console.log('\nAll account lines:');
    lineDetails.forEach(detail => {
      console.log(`Line ${detail.lineNumber}: ${detail.line.trim()}`);
    });
    
    // Count the total number of account lines
    console.log(`\nTotal account lines: ${lineDetails.length}`);
    
    // Check if we have exactly 36 account lines
    if (lineDetails.length > 36) {
      console.log(`\nExcess account lines: ${lineDetails.length - 36}`);
      
      // If we have duplicates, identify them
      if (lineDuplicates.length > 0) {
        console.log('\nExcess account lines are due to duplicates');
      } else {
        console.log('\nExcess account lines are not due to duplicates - this is unexpected');
      }
    } else if (lineDetails.length < 36) {
      console.log(`\nMissing account lines: ${36 - lineDetails.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
findAllAccountRows();
