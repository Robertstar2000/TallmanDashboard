/**
 * UPDATE REFERENCES TO SINGLE SOURCE
 * 
 * This script updates all references to complete-chart-data.ts
 * to use the single-source-data.ts file instead.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path to the project root
const projectRoot = process.cwd();

// Function to recursively find all TypeScript and JavaScript files
async function findAllFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = await findAllFiles(filePath, fileList);
    } else if (
      stats.isFile() && 
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
      !file.includes('complete-chart-data.ts')
    ) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Function to update references in a file
async function updateReferencesInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file contains references to complete-chart-data
    if (content.includes('complete-chart-data')) {
      console.log(`Found reference in: ${filePath}`);
      
      // Replace import statements
      let updatedContent = content.replace(
        /import\s*{\s*initialSpreadsheetData\s*}\s*from\s*['"](.+?)\/complete-chart-data['"];?/g,
        `import { dashboardData as initialSpreadsheetData } from '$1/single-source-data';`
      );
      
      // Replace other references
      updatedContent = updatedContent.replace(
        /import\s*\*\s*as\s*(\w+)\s*from\s*['"](.+?)\/complete-chart-data['"];?/g,
        `import * as $1 from '$2/single-source-data';`
      );
      
      // Write the updated content back to the file
      await writeFile(filePath, updatedContent);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating references in ${filePath}:`, error);
    return false;
  }
}

// Main function
async function updateReferencesToSingleSource() {
  console.log('UPDATE REFERENCES TO SINGLE SOURCE');
  console.log('=================================');
  
  try {
    // Step 1: Find all TypeScript and JavaScript files
    console.log('\nStep 1: Finding all TypeScript and JavaScript files...');
    const allFiles = await findAllFiles(projectRoot);
    console.log(`Found ${allFiles.length} files to check`);
    
    // Step 2: Update references in each file
    console.log('\nStep 2: Updating references in each file...');
    let updatedCount = 0;
    
    for (const file of allFiles) {
      const updated = await updateReferencesInFile(file);
      if (updated) {
        updatedCount++;
      }
    }
    
    console.log(`\nUpdated references in ${updatedCount} files`);
    
    // Step 3: Check if complete-chart-data.ts exists and delete it
    console.log('\nStep 3: Checking if complete-chart-data.ts exists...');
    const completeChartDataPath = path.join(projectRoot, 'lib', 'db', 'complete-chart-data.ts');
    
    if (fs.existsSync(completeChartDataPath)) {
      console.log(`Found complete-chart-data.ts at: ${completeChartDataPath}`);
      
      // Create a backup
      const backupPath = `${completeChartDataPath}.bak`;
      fs.copyFileSync(completeChartDataPath, backupPath);
      console.log(`Created backup at: ${backupPath}`);
      
      // Delete the file
      fs.unlinkSync(completeChartDataPath);
      console.log(`Deleted: ${completeChartDataPath}`);
    } else {
      console.log(`complete-chart-data.ts not found at: ${completeChartDataPath}`);
    }
    
    console.log('\nUpdate references to single source completed successfully!');
    
  } catch (error) {
    console.error('Error during update references to single source:', error);
  }
}

// Run the main function
updateReferencesToSingleSource();
