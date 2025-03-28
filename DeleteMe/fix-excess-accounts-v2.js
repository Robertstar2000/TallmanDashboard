/**
 * Fix Excess Account Rows Script (Version 2)
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
    
    // Find all account rows using a more precise regex
    const accountMatches = [...fileContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
    console.log(`Found ${accountMatches.length} account rows using regex`);
    
    // Validate if we have more than 36 rows
    if (accountMatches.length <= 36) {
      console.log('No excess account rows found using regex. Let\'s try a different approach...');
      
      // Try a different approach - extract all objects that contain "Accounts -"
      const lines = fileContent.split('\n');
      const accountObjects = [];
      let currentObject = null;
      let braceCount = 0;
      let startLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line contains an account name
        if (line.includes('name: "Accounts -') || line.includes("name: 'Accounts -")) {
          startLine = i;
          currentObject = [line];
          braceCount = line.split('{').length - line.split('}').length;
          continue;
        }
        
        // If we're currently collecting an object
        if (currentObject !== null) {
          currentObject.push(line);
          braceCount += line.split('{').length - line.split('}').length;
          
          // If we've closed all braces, we've found the end of the object
          if (braceCount === 0) {
            accountObjects.push({
              lines: currentObject,
              startLine,
              endLine: i,
              content: currentObject.join('\n')
            });
            currentObject = null;
          }
        }
      }
      
      console.log(`Found ${accountObjects.length} account objects by parsing the file line by line`);
      
      // If we still have more than 36 objects, we need to remove one
      if (accountObjects.length > 36) {
        console.log(`Found ${accountObjects.length - 36} excess account objects`);
        
        // Extract details from each account object
        const accountDetails = accountObjects.map(obj => {
          const idMatch = obj.content.match(/id:\s*['"](\d+)['"]/);
          const nameMatch = obj.content.match(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/);
          
          return {
            id: idMatch ? idMatch[1] : 'unknown',
            type: nameMatch ? nameMatch[1] : 'unknown',
            month: nameMatch ? parseInt(nameMatch[2], 10) : 0,
            startLine: obj.startLine,
            endLine: obj.endLine,
            content: obj.content
          };
        });
        
        // Print all account details for debugging
        console.log('\nAll account details:');
        accountDetails.forEach(account => {
          console.log(`ID: ${account.id}, Type: ${account.type}, Month: ${account.month}, Lines: ${account.startLine}-${account.endLine}`);
        });
        
        // Check for duplicates
        const monthTypeCounts = {};
        accountDetails.forEach(account => {
          const key = `${account.month}-${account.type}`;
          if (!monthTypeCounts[key]) {
            monthTypeCounts[key] = [];
          }
          monthTypeCounts[key].push(account);
        });
        
        // Find duplicate month-type combinations
        const duplicates = Object.entries(monthTypeCounts)
          .filter(([_, accounts]) => accounts.length > 1)
          .map(([key, accounts]) => ({ key, accounts }));
        
        if (duplicates.length > 0) {
          console.log('\nFound duplicate month-type combinations:');
          duplicates.forEach(dup => {
            console.log(`Month-Type: ${dup.key}, Count: ${dup.accounts.length}`);
            dup.accounts.forEach(account => {
              console.log(`  ID: ${account.id}, Lines: ${account.startLine}-${account.endLine}`);
            });
          });
          
          // Remove the duplicate with the highest ID
          const duplicateToRemove = duplicates[0].accounts.reduce((prev, current) => 
            (parseInt(prev.id, 10) > parseInt(current.id, 10)) ? prev : current
          );
          
          console.log(`\nRemoving duplicate account: ID: ${duplicateToRemove.id}, Type: ${duplicateToRemove.type}, Month: ${duplicateToRemove.month}`);
          
          // Create a backup of the file
          const backupPath = initialDataPath + '.backup';
          fs.writeFileSync(backupPath, fileContent);
          console.log(`Created backup at ${backupPath}`);
          
          // Remove the duplicate from the file
          const newLines = [...lines];
          newLines.splice(duplicateToRemove.startLine, duplicateToRemove.endLine - duplicateToRemove.startLine + 1);
          
          // Fix any trailing commas or missing commas
          if (newLines[duplicateToRemove.startLine - 1].trim().endsWith(',') && 
              newLines[duplicateToRemove.startLine].trim().startsWith('}')) {
            newLines[duplicateToRemove.startLine - 1] = newLines[duplicateToRemove.startLine - 1].replace(/,\s*$/, '');
          }
          
          // Write the updated file
          fs.writeFileSync(initialDataPath, newLines.join('\n'));
          console.log('\n✅ Successfully removed duplicate account row');
          
          // Verify the number of account rows after removal
          const updatedContent = fs.readFileSync(initialDataPath, 'utf8');
          const updatedMatches = [...updatedContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
          console.log(`Remaining account rows: ${updatedMatches.length}`);
        } else {
          // If no duplicates, just remove the row with the highest ID
          console.log('\nNo duplicates found. Removing account with the highest ID:');
          
          // Sort by ID and remove the highest
          accountDetails.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
          const accountToRemove = accountDetails[0];
          
          console.log(`Removing account: ID: ${accountToRemove.id}, Type: ${accountToRemove.type}, Month: ${accountToRemove.month}`);
          
          // Create a backup of the file
          const backupPath = initialDataPath + '.backup';
          fs.writeFileSync(backupPath, fileContent);
          console.log(`Created backup at ${backupPath}`);
          
          // Remove the account from the file
          const newLines = [...lines];
          newLines.splice(accountToRemove.startLine, accountToRemove.endLine - accountToRemove.startLine + 1);
          
          // Fix any trailing commas or missing commas
          if (newLines[accountToRemove.startLine - 1].trim().endsWith(',') && 
              newLines[accountToRemove.startLine].trim().startsWith('}')) {
            newLines[accountToRemove.startLine - 1] = newLines[accountToRemove.startLine - 1].replace(/,\s*$/, '');
          }
          
          // Write the updated file
          fs.writeFileSync(initialDataPath, newLines.join('\n'));
          console.log('\n✅ Successfully removed account row with highest ID');
          
          // Verify the number of account rows after removal
          const updatedContent = fs.readFileSync(initialDataPath, 'utf8');
          const updatedMatches = [...updatedContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
          console.log(`Remaining account rows: ${updatedMatches.length}`);
        }
      } else {
        console.log('No excess account rows found by parsing the file line by line.');
        
        // Let's try one more approach - count all lines containing "Accounts -"
        const accountLines = lines.filter(line => 
          line.includes('name: "Accounts -') || line.includes("name: 'Accounts -")
        );
        
        console.log(`Found ${accountLines.length} lines containing "Accounts -"`);
        
        if (accountLines.length > 36) {
          console.log('\nFound excess account rows by direct line search.');
          console.log('Printing all account lines for inspection:');
          
          accountLines.forEach((line, index) => {
            const lineNumber = lines.indexOf(line);
            console.log(`${index + 1}. Line ${lineNumber}: ${line.trim()}`);
          });
          
          // Look for any anomalies in the account lines
          const accountInfo = accountLines.map(line => {
            const match = line.match(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/);
            return {
              line,
              type: match ? match[1] : 'unknown',
              month: match ? parseInt(match[2], 10) : 0,
              lineNumber: lines.indexOf(line)
            };
          });
          
          // Check for duplicates
          const monthTypeCounts = {};
          accountInfo.forEach(info => {
            const key = `${info.month}-${info.type}`;
            if (!monthTypeCounts[key]) {
              monthTypeCounts[key] = [];
            }
            monthTypeCounts[key].push(info);
          });
          
          // Find duplicate month-type combinations
          const duplicates = Object.entries(monthTypeCounts)
            .filter(([_, infos]) => infos.length > 1)
            .map(([key, infos]) => ({ key, infos }));
          
          if (duplicates.length > 0) {
            console.log('\nFound duplicate month-type combinations:');
            duplicates.forEach(dup => {
              console.log(`Month-Type: ${dup.key}, Count: ${dup.infos.length}`);
              dup.infos.forEach(info => {
                console.log(`  Line ${info.lineNumber}: ${info.line.trim()}`);
              });
            });
            
            // Remove one of the duplicates - find the object containing this line
            const lineToRemove = duplicates[0].infos[1].lineNumber;
            
            // Find the start and end of the object containing this line
            let startLine = lineToRemove;
            let endLine = lineToRemove;
            let braceCount = 0;
            
            // Find the start of the object (going backwards)
            for (let i = lineToRemove; i >= 0; i--) {
              const line = lines[i];
              braceCount += line.split('}').length - line.split('{').length;
              
              if (line.includes('{') && braceCount === 0) {
                startLine = i;
                break;
              }
            }
            
            // Reset brace count for finding the end
            braceCount = 0;
            
            // Find the end of the object (going forwards)
            for (let i = lineToRemove; i < lines.length; i++) {
              const line = lines[i];
              braceCount += line.split('{').length - line.split('}').length;
              
              if (line.includes('}') && braceCount === 0) {
                endLine = i;
                break;
              }
            }
            
            console.log(`\nRemoving object from line ${startLine} to ${endLine}`);
            
            // Create a backup of the file
            const backupPath = initialDataPath + '.backup';
            fs.writeFileSync(backupPath, fileContent);
            console.log(`Created backup at ${backupPath}`);
            
            // Remove the object from the file
            const newLines = [...lines];
            newLines.splice(startLine, endLine - startLine + 1);
            
            // Fix any trailing commas or missing commas
            if (startLine > 0 && endLine < lines.length - 1) {
              if (newLines[startLine - 1].trim().endsWith(',') && 
                  newLines[startLine].trim().startsWith('}')) {
                newLines[startLine - 1] = newLines[startLine - 1].replace(/,\s*$/, '');
              }
            }
            
            // Write the updated file
            fs.writeFileSync(initialDataPath, newLines.join('\n'));
            console.log('\n✅ Successfully removed duplicate account object');
            
            // Verify the number of account rows after removal
            const updatedContent = fs.readFileSync(initialDataPath, 'utf8');
            const updatedMatches = [...updatedContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
            console.log(`Remaining account rows: ${updatedMatches.length}`);
          } else {
            console.log('No duplicate month-type combinations found by direct line search.');
            
            // If no duplicates, check for invalid months or types
            const validMonths = Array.from({ length: 12 }, (_, i) => i + 1);
            const validTypes = ['Payable', 'Overdue', 'Receivable'];
            
            const invalidMonths = accountInfo.filter(info => !validMonths.includes(info.month));
            const invalidTypes = accountInfo.filter(info => !validTypes.includes(info.type));
            
            if (invalidMonths.length > 0) {
              console.log('\nFound account rows with invalid months:');
              invalidMonths.forEach(info => {
                console.log(`Line ${info.lineNumber}: ${info.line.trim()}, Month: ${info.month}`);
              });
              
              // Remove the first invalid month
              const lineToRemove = invalidMonths[0].lineNumber;
              
              // Find the object containing this line and remove it
              // (similar to the duplicate removal code above)
              // ...
            } else if (invalidTypes.length > 0) {
              console.log('\nFound account rows with invalid types:');
              invalidTypes.forEach(info => {
                console.log(`Line ${info.lineNumber}: ${info.line.trim()}, Type: ${info.type}`);
              });
              
              // Remove the first invalid type
              const lineToRemove = invalidTypes[0].lineNumber;
              
              // Find the object containing this line and remove it
              // (similar to the duplicate removal code above)
              // ...
            } else {
              console.log('\nNo invalid months or types found. Removing the last account row:');
              
              // Sort by line number and remove the last one
              accountInfo.sort((a, b) => b.lineNumber - a.lineNumber);
              const lineToRemove = accountInfo[0].lineNumber;
              
              console.log(`Removing account row at line ${lineToRemove}: ${accountInfo[0].line.trim()}`);
              
              // Find the start and end of the object containing this line
              let startLine = lineToRemove;
              let endLine = lineToRemove;
              let braceCount = 0;
              
              // Find the start of the object (going backwards)
              for (let i = lineToRemove; i >= 0; i--) {
                const line = lines[i];
                braceCount += line.split('}').length - line.split('{').length;
                
                if (line.includes('{') && braceCount === 0) {
                  startLine = i;
                  break;
                }
              }
              
              // Reset brace count for finding the end
              braceCount = 0;
              
              // Find the end of the object (going forwards)
              for (let i = lineToRemove; i < lines.length; i++) {
                const line = lines[i];
                braceCount += line.split('{').length - line.split('}').length;
                
                if (line.includes('}') && braceCount === 0) {
                  endLine = i;
                  break;
                }
              }
              
              console.log(`\nRemoving object from line ${startLine} to ${endLine}`);
              
              // Create a backup of the file
              const backupPath = initialDataPath + '.backup';
              fs.writeFileSync(backupPath, fileContent);
              console.log(`Created backup at ${backupPath}`);
              
              // Remove the object from the file
              const newLines = [...lines];
              newLines.splice(startLine, endLine - startLine + 1);
              
              // Fix any trailing commas or missing commas
              if (startLine > 0 && endLine < lines.length - 1) {
                if (newLines[startLine - 1].trim().endsWith(',') && 
                    newLines[startLine].trim().startsWith('}')) {
                  newLines[startLine - 1] = newLines[startLine - 1].replace(/,\s*$/, '');
                }
              }
              
              // Write the updated file
              fs.writeFileSync(initialDataPath, newLines.join('\n'));
              console.log('\n✅ Successfully removed last account object');
              
              // Verify the number of account rows after removal
              const updatedContent = fs.readFileSync(initialDataPath, 'utf8');
              const updatedMatches = [...updatedContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
              console.log(`Remaining account rows: ${updatedMatches.length}`);
            }
          }
        } else {
          console.log('No excess account rows found by direct line search.');
        }
      }
    } else {
      // We have more than 36 rows, so remove the excess
      console.log(`Found ${accountMatches.length - 36} excess account rows`);
      
      // Extract details from each match
      const accountDetails = accountMatches.map(match => {
        const type = match[1];
        const month = parseInt(match[2], 10);
        const fullMatch = match[0];
        const index = match.index;
        
        return { type, month, fullMatch, index };
      });
      
      // Check for duplicates
      const monthTypeCounts = {};
      accountDetails.forEach(detail => {
        const key = `${detail.month}-${detail.type}`;
        if (!monthTypeCounts[key]) {
          monthTypeCounts[key] = [];
        }
        monthTypeCounts[key].push(detail);
      });
      
      // Find duplicate month-type combinations
      const duplicates = Object.entries(monthTypeCounts)
        .filter(([_, details]) => details.length > 1)
        .map(([key, details]) => ({ key, details }));
      
      if (duplicates.length > 0) {
        console.log('\nFound duplicate month-type combinations:');
        duplicates.forEach(dup => {
          console.log(`Month-Type: ${dup.key}, Count: ${dup.details.length}`);
          dup.details.forEach(detail => {
            console.log(`  Match: ${detail.fullMatch}, Index: ${detail.index}`);
          });
        });
        
        // Remove one of the duplicates
        const duplicateKey = duplicates[0].key;
        const duplicateDetails = duplicates[0].details;
        
        // Find the object containing the duplicate
        const duplicateToRemove = duplicateDetails[1]; // Remove the second occurrence
        
        console.log(`\nRemoving duplicate for ${duplicateKey}`);
        
        // Find the start of the object containing this match
        const objectStartRegex = new RegExp(`\\{[\\s\\S]*?${duplicateToRemove.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        const objectStartMatch = [...fileContent.matchAll(objectStartRegex)];
        
        if (objectStartMatch.length > 0) {
          const objectStart = objectStartMatch[0][0];
          const objectStartIndex = objectStartMatch[0].index;
          
          // Find the end of the object
          let braceCount = 1; // We start with one opening brace
          let objectEndIndex = objectStartIndex + objectStart.length;
          
          for (let i = objectEndIndex; i < fileContent.length; i++) {
            if (fileContent[i] === '{') {
              braceCount++;
            } else if (fileContent[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                objectEndIndex = i + 1;
                break;
              }
            }
          }
          
          // Find the next comma or closing bracket after the object
          let commaIndex = objectEndIndex;
          while (commaIndex < fileContent.length && 
                 fileContent[commaIndex] !== ',' && 
                 fileContent[commaIndex] !== ']') {
            commaIndex++;
          }
          
          if (fileContent[commaIndex] === ',') {
            objectEndIndex = commaIndex + 1;
          }
          
          // Extract the object for logging
          const objectToRemove = fileContent.substring(objectStartIndex, objectEndIndex);
          console.log(`\nObject to remove:\n${objectToRemove}`);
          
          // Create a backup of the file
          const backupPath = initialDataPath + '.backup';
          fs.writeFileSync(backupPath, fileContent);
          console.log(`Created backup at ${backupPath}`);
          
          // Remove the object from the file
          const newFileContent = fileContent.substring(0, objectStartIndex) + fileContent.substring(objectEndIndex);
          
          // Write the updated file
          fs.writeFileSync(initialDataPath, newFileContent);
          console.log('\n✅ Successfully removed duplicate account object');
          
          // Verify the number of account rows after removal
          const updatedContent = fs.readFileSync(initialDataPath, 'utf8');
          const updatedMatches = [...updatedContent.matchAll(/name:\s*["']Accounts - ([^"']+) - Month (\d+)["']/g)];
          console.log(`Remaining account rows: ${updatedMatches.length}`);
        } else {
          console.log(`Could not find the start of the object containing ${duplicateToRemove.fullMatch}`);
        }
      } else {
        console.log('No duplicate month-type combinations found.');
        
        // If no duplicates, check for invalid months or types
        const validMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        const validTypes = ['Payable', 'Overdue', 'Receivable'];
        
        const invalidMonths = accountDetails.filter(detail => !validMonths.includes(detail.month));
        const invalidTypes = accountDetails.filter(detail => !validTypes.includes(detail.type));
        
        if (invalidMonths.length > 0) {
          console.log('\nFound account rows with invalid months:');
          invalidMonths.forEach(detail => {
            console.log(`Match: ${detail.fullMatch}, Month: ${detail.month}`);
          });
          
          // Remove the first invalid month
          const detailToRemove = invalidMonths[0];
          
          // Find and remove the object containing this match
          // (similar to the duplicate removal code above)
          // ...
        } else if (invalidTypes.length > 0) {
          console.log('\nFound account rows with invalid types:');
          invalidTypes.forEach(detail => {
            console.log(`Match: ${detail.fullMatch}, Type: ${detail.type}`);
          });
          
          // Remove the first invalid type
          const detailToRemove = invalidTypes[0];
          
          // Find and remove the object containing this match
          // (similar to the duplicate removal code above)
          // ...
        } else {
          console.log('\nNo invalid months or types found. This is unexpected.');
          console.log('Please check the file manually for any issues.');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the fix
fixExcessAccountRows();
