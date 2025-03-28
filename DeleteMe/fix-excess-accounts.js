/**
 * Fix Excess Account Rows Script
 * This script identifies and removes excess account rows beyond the required 36
 * (12 months × 3 variables: Payable, Overdue, Receivable)
 */

const fs = require('fs');
const path = require('path');

// Main function to fix excess account rows
function fixExcessAccountRows() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Extract all account rows
    const accountRowRegex = /{\s*id:\s*['"](\d+)['"],\s*name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g;
    const accountRows = [];
    let match;
    
    while ((match = accountRowRegex.exec(fileContent)) !== null) {
      accountRows.push({
        id: match[1],
        type: match[2], // Payable, Overdue, or Receivable
        month: parseInt(match[3], 10),
        fullMatch: match[0],
        index: match.index
      });
    }
    
    console.log(`Found ${accountRows.length} account rows`);
    
    // Validate if we have more than 36 rows
    if (accountRows.length <= 36) {
      console.log('No excess account rows found. There are exactly 36 or fewer account rows.');
      return;
    }
    
    console.log(`Found ${accountRows.length - 36} excess account rows`);
    
    // Analyze the account rows to find duplicates or anomalies
    const monthTypeCounts = {};
    const duplicates = [];
    
    accountRows.forEach(row => {
      const key = `${row.month}-${row.type}`;
      if (!monthTypeCounts[key]) {
        monthTypeCounts[key] = [];
      }
      monthTypeCounts[key].push(row);
      
      if (monthTypeCounts[key].length > 1) {
        duplicates.push(row);
      }
    });
    
    // Print month-type combinations with more than one entry
    console.log('\nDuplicate month-type combinations:');
    let hasDuplicates = false;
    
    Object.keys(monthTypeCounts).forEach(key => {
      if (monthTypeCounts[key].length > 1) {
        hasDuplicates = true;
        console.log(`Month-Type: ${key}, Count: ${monthTypeCounts[key].length}`);
        monthTypeCounts[key].forEach((row, index) => {
          console.log(`  ${index + 1}. ID: ${row.id}, Index: ${row.index}`);
        });
      }
    });
    
    if (!hasDuplicates) {
      console.log('No duplicate month-type combinations found.');
      
      // If no duplicates, look for rows outside the expected range (months 1-12)
      const invalidMonths = accountRows.filter(row => row.month < 1 || row.month > 12);
      
      if (invalidMonths.length > 0) {
        console.log('\nRows with invalid month numbers:');
        invalidMonths.forEach(row => {
          console.log(`ID: ${row.id}, Type: ${row.type}, Month: ${row.month}`);
        });
      } else {
        console.log('\nNo rows with invalid month numbers found.');
        
        // If no invalid months, check for invalid types
        const validTypes = ['Payable', 'Overdue', 'Receivable'];
        const invalidTypes = accountRows.filter(row => !validTypes.includes(row.type));
        
        if (invalidTypes.length > 0) {
          console.log('\nRows with invalid types:');
          invalidTypes.forEach(row => {
            console.log(`ID: ${row.id}, Type: ${row.type}, Month: ${row.month}`);
          });
        } else {
          console.log('\nNo rows with invalid types found.');
          
          // If we still haven't found the issue, look for the highest ID to remove
          console.log('\nRemoving row with the highest ID:');
          const highestIdRow = accountRows.reduce((prev, current) => 
            (parseInt(prev.id, 10) > parseInt(current.id, 10)) ? prev : current
          );
          console.log(`Highest ID: ${highestIdRow.id}, Type: ${highestIdRow.type}, Month: ${highestIdRow.month}`);
          
          // Find the row to remove
          const rowToRemove = highestIdRow;
          console.log(`\nRemoving row: ID: ${rowToRemove.id}, Type: ${rowToRemove.type}, Month: ${rowToRemove.month}`);
          
          // Find the full object in the file content
          const rowStartIndex = fileContent.indexOf(`id: '${rowToRemove.id}'`, rowToRemove.index);
          if (rowStartIndex === -1) {
            console.log(`Could not find the start of row with ID ${rowToRemove.id}`);
            return;
          }
          
          // Find the end of the object (the closing brace and comma)
          let braceCount = 0;
          let rowEndIndex = rowStartIndex;
          let foundOpeningBrace = false;
          
          for (let i = rowStartIndex; i < fileContent.length; i++) {
            if (fileContent[i] === '{') {
              braceCount++;
              foundOpeningBrace = true;
            } else if (fileContent[i] === '}') {
              braceCount--;
              if (foundOpeningBrace && braceCount === 0) {
                // Find the next comma or the end of the array
                for (let j = i + 1; j < fileContent.length; j++) {
                  if (fileContent[j] === ',') {
                    rowEndIndex = j + 1;
                    break;
                  } else if (fileContent[j] === ']') {
                    rowEndIndex = i + 1;
                    break;
                  } else if (fileContent[j] !== ' ' && fileContent[j] !== '\n' && fileContent[j] !== '\r' && fileContent[j] !== '\t') {
                    break;
                  }
                }
                break;
              }
            }
          }
          
          if (rowEndIndex <= rowStartIndex) {
            console.log(`Could not find the end of row with ID ${rowToRemove.id}`);
            return;
          }
          
          // Extract the row content for logging
          const rowContent = fileContent.substring(rowStartIndex, rowEndIndex);
          console.log(`\nRow content to remove:\n${rowContent}`);
          
          // Remove the row from the file content
          const newFileContent = fileContent.substring(0, rowStartIndex) + fileContent.substring(rowEndIndex);
          
          // Write the updated file content
          fs.writeFileSync(initialDataPath, newFileContent);
          console.log('\n✅ Successfully removed excess account row');
          
          // Count the remaining account rows
          const remainingAccountRows = newFileContent.match(/name:\s*["']Accounts - /g);
          console.log(`Remaining account rows: ${remainingAccountRows ? remainingAccountRows.length : 0}`);
        }
      }
    } else {
      // Remove one of the duplicates
      const duplicateKey = Object.keys(monthTypeCounts).find(key => monthTypeCounts[key].length > 1);
      const duplicateRows = monthTypeCounts[duplicateKey];
      
      // Sort by ID and keep the lower ID (assuming it's the original)
      duplicateRows.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
      
      // Remove the row with the higher ID
      const rowToRemove = duplicateRows[duplicateRows.length - 1];
      console.log(`\nRemoving duplicate row: ID: ${rowToRemove.id}, Type: ${rowToRemove.type}, Month: ${rowToRemove.month}`);
      
      // Find the full object in the file content
      const rowStartIndex = fileContent.indexOf(`id: '${rowToRemove.id}'`, rowToRemove.index);
      if (rowStartIndex === -1) {
        console.log(`Could not find the start of row with ID ${rowToRemove.id}`);
        return;
      }
      
      // Find the end of the object (the closing brace and comma)
      let braceCount = 0;
      let rowEndIndex = rowStartIndex;
      let foundOpeningBrace = false;
      
      for (let i = rowStartIndex; i < fileContent.length; i++) {
        if (fileContent[i] === '{') {
          braceCount++;
          foundOpeningBrace = true;
        } else if (fileContent[i] === '}') {
          braceCount--;
          if (foundOpeningBrace && braceCount === 0) {
            // Find the next comma or the end of the array
            for (let j = i + 1; j < fileContent.length; j++) {
              if (fileContent[j] === ',') {
                rowEndIndex = j + 1;
                break;
              } else if (fileContent[j] === ']') {
                rowEndIndex = i + 1;
                break;
              } else if (fileContent[j] !== ' ' && fileContent[j] !== '\n' && fileContent[j] !== '\r' && fileContent[j] !== '\t') {
                break;
              }
            }
            break;
          }
        }
      }
      
      if (rowEndIndex <= rowStartIndex) {
        console.log(`Could not find the end of row with ID ${rowToRemove.id}`);
        return;
      }
      
      // Extract the row content for logging
      const rowContent = fileContent.substring(rowStartIndex, rowEndIndex);
      console.log(`\nRow content to remove:\n${rowContent}`);
      
      // Remove the row from the file content
      const newFileContent = fileContent.substring(0, rowStartIndex) + fileContent.substring(rowEndIndex);
      
      // Write the updated file content
      fs.writeFileSync(initialDataPath, newFileContent);
      console.log('\n✅ Successfully removed duplicate account row');
      
      // Count the remaining account rows
      const remainingAccountRows = newFileContent.match(/name:\s*["']Accounts - /g);
      console.log(`Remaining account rows: ${remainingAccountRows ? remainingAccountRows.length : 0}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the fix
fixExcessAccountRows();
