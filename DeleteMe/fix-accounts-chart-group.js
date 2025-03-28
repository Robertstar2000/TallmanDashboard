/**
 * Fix Accounts Chart Group Script
 * This script:
 * 1. Finds all account rows in the initial-data.ts file
 * 2. Changes their chart group from "Historical Data" back to "Accounts"
 * 3. Ensures all 36 account rows are preserved
 */

const fs = require('fs');
const path = require('path');

// Main function to fix accounts chart group
async function fixAccountsChartGroup() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-accounts-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find all account rows
    const accountRegex = /name:\s*["']Accounts - (Payable|Overdue|Receivable) - Month (\d+)["']/g;
    let match;
    const accountRows = [];
    
    while ((match = accountRegex.exec(fileContent)) !== null) {
      const type = match[1];
      const month = match[2];
      const startPos = match.index;
      
      // Find the end of this object
      const objectStartPos = fileContent.lastIndexOf('{', startPos);
      let braceCount = 1;
      let objectEndPos = objectStartPos + 1;
      
      while (braceCount > 0 && objectEndPos < fileContent.length) {
        if (fileContent[objectEndPos] === '{') {
          braceCount++;
        } else if (fileContent[objectEndPos] === '}') {
          braceCount--;
        }
        objectEndPos++;
      }
      
      // Extract the full object
      const objectText = fileContent.substring(objectStartPos, objectEndPos);
      
      accountRows.push({
        type,
        month,
        startPos: objectStartPos,
        endPos: objectEndPos,
        text: objectText
      });
    }
    
    console.log(`Found ${accountRows.length} account rows`);
    
    // Check if we have all 36 account rows (12 months x 3 types)
    if (accountRows.length !== 36) {
      console.error(`Expected 36 account rows, but found ${accountRows.length}`);
      return;
    }
    
    // Update the chart group for each account row
    let updatedContent = fileContent;
    accountRows.forEach(row => {
      // Check if the row has Historical Data as chart group
      if (row.text.includes('chartGroup: "Historical Data"')) {
        // Replace Historical Data with Accounts
        const updatedText = row.text.replace('chartGroup: "Historical Data"', 'chartGroup: "Accounts"');
        updatedContent = updatedContent.replace(row.text, updatedText);
      }
    });
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedContent);
    console.log('\n✅ Successfully updated chart group for account rows');
    
    // Verify the changes
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    const accountsChartGroupCount = (updatedFileContent.match(/chartGroup:\s*["']Accounts["']/g) || []).length;
    
    console.log(`\nVerified ${accountsChartGroupCount} rows with chart group "Accounts"`);
    
    if (accountsChartGroupCount === 36) {
      console.log('All 36 account rows now have chart group "Accounts"');
    } else {
      console.error(`Expected 36 rows with chart group "Accounts", but found ${accountsChartGroupCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixAccountsChartGroup();
