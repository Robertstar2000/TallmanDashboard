/**
 * Update Customer Rows Script
 * This script:
 * 1. Searches for rows with variable names containing "new customer" or "prospects"
 * 2. Updates their chart group to "Customer Metrics" and chart name to "Customers"
 * 3. Uses a more comprehensive approach to find these rows
 */

const fs = require('fs');
const path = require('path');

// Main function to update customer rows
async function updateCustomerRows() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-update-customers-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Define patterns to search for customer-related rows
    const customerPatterns = [
      /variableName:\s*["']([^"']*new customer[^"']*)["']/i,
      /variableName:\s*["']([^"']*prospect[^"']*)["']/i,
      /variableName:\s*["']([^"']*customer[^"']*new[^"']*)["']/i,
      /name:\s*["']([^"']*new customer[^"']*)["']/i,
      /name:\s*["']([^"']*prospect[^"']*)["']/i,
      /name:\s*["']([^"']*customer[^"']*new[^"']*)["']/i
    ];
    
    // Find all matches
    let matches = [];
    let match;
    
    for (const pattern of customerPatterns) {
      let regex = new RegExp(pattern);
      let startPos = 0;
      
      while ((match = regex.exec(fileContent.slice(startPos))) !== null) {
        const actualPos = startPos + match.index;
        
        // Find the start of the object containing this match
        let objectStartPos = fileContent.lastIndexOf('{', actualPos);
        
        // Find the ID of this object
        const idPattern = /id:\s*["']([^"']*)["']/;
        const idMatch = idPattern.exec(fileContent.slice(objectStartPos, actualPos + match[0].length + 100));
        
        if (idMatch) {
          const id = idMatch[1];
          console.log(`Found customer-related row with ID ${id}, matched text: ${match[0]}`);
          
          // Check if this ID is already in matches
          if (!matches.some(m => m.id === id)) {
            matches.push({
              id,
              pos: objectStartPos,
              text: match[0]
            });
          }
        }
      }
      
      startPos = 0;
    }
    
    console.log(`Found ${matches.length} customer-related rows`);
    
    // Update each match
    let updatedContent = fileContent;
    let updatedCount = 0;
    
    for (const match of matches) {
      // Find the end of the object
      const objectEndPos = updatedContent.indexOf('}', match.pos);
      const objectContent = updatedContent.slice(match.pos, objectEndPos + 1);
      
      // Check if the object has a chartGroup field
      const hasChartGroup = /chartGroup:\s*["'][^"']*["']/.test(objectContent);
      
      // Check if the object has a chartName field
      const hasChartName = /chartName:\s*["'][^"']*["']/.test(objectContent);
      
      let updatedObjectContent = objectContent;
      
      // Update or add chartGroup
      if (hasChartGroup) {
        updatedObjectContent = updatedObjectContent.replace(
          /(chartGroup:\s*["'])[^"']*["']/,
          '$1Customer Metrics"'
        );
      } else {
        updatedObjectContent = updatedObjectContent.replace(
          /}$/,
          ',\n      chartGroup: "Customer Metrics"\n    }'
        );
      }
      
      // Update or add chartName
      if (hasChartName) {
        updatedObjectContent = updatedObjectContent.replace(
          /(chartName:\s*["'])[^"']*["']/,
          '$1Customers"'
        );
      } else {
        updatedObjectContent = updatedObjectContent.replace(
          /}$/,
          ',\n      chartName: "Customers"\n    }'
        );
      }
      
      // Replace the original object with the updated one
      if (updatedObjectContent !== objectContent) {
        updatedContent = updatedContent.replace(objectContent, updatedObjectContent);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} customer-related rows`);
    
    // Write the updated file
    if (updatedCount > 0) {
      fs.writeFileSync(initialDataPath, updatedContent);
      console.log('\n✅ Successfully updated customer rows in the file');
    } else {
      console.log('\nNo changes were made to the file');
    }
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart groups in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartGroupCounts = {
      'Key Metrics': (updatedFileContent.match(/chartGroup:\s*["']Key Metrics["']/g) || []).length,
      'Customer Metrics': (updatedFileContent.match(/chartGroup:\s*["']Customer Metrics["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartGroup:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartGroup:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartGroup:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartGroup:\s*["']Por Overview["']/g) || []).length,
      'Daily Orders': (updatedFileContent.match(/chartGroup:\s*["']Daily Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartGroup:\s*["']Web Orders["']/g) || []).length,
      'Ar Aging': (updatedFileContent.match(/chartGroup:\s*["']Ar Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartGroup:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Group Counts After Update:');
    Object.entries(chartGroupCounts).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
    });
    
    // Count chart names in the updated file
    const chartNameCounts = {
      'Key Metrics': (updatedFileContent.match(/chartName:\s*["']Key Metrics["']/g) || []).length,
      'Customers': (updatedFileContent.match(/chartName:\s*["']Customers["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartName:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartName:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartName:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartName:\s*["']Por Overview["']/g) || []).length,
      'Orders': (updatedFileContent.match(/chartName:\s*["']Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartName:\s*["']Web Orders["']/g) || []).length,
      'AR Aging': (updatedFileContent.match(/chartName:\s*["']AR Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartName:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Name Counts After Update:');
    Object.entries(chartNameCounts).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
updateCustomerRows();
