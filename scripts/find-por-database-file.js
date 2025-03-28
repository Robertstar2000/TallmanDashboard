/**
 * Find POR Database File
 * 
 * This script helps locate MS Access database files (.mdb or .accdb)
 * in a specified directory and its subdirectories.
 */

const fs = require('fs');
const path = require('path');

// Function to search for Access database files
function findAccessDatabaseFiles(startPath, maxDepth = 2) {
  if (!fs.existsSync(startPath)) {
    console.error(`Directory not found: ${startPath}`);
    return [];
  }

  let results = [];
  
  // Function to recursively search directories
  function searchDirectory(currentPath, currentDepth) {
    if (currentDepth > maxDepth) return;
    
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.mdb' || ext === '.accdb') {
          results.push({
            path: filePath,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            modified: stats.mtime.toLocaleString()
          });
        }
      } else if (stats.isDirectory()) {
        searchDirectory(filePath, currentDepth + 1);
      }
    }
  }
  
  // Start the search
  searchDirectory(startPath, 0);
  return results;
}

// Main function
async function main() {
  console.log('Searching for POR database files...');
  
  // Default search paths
  const searchPaths = [
    'C:\\Users\\BobM\\Desktop',
    'C:\\Users\\BobM\\Documents',
    'C:\\ProgramData\\Point-of-Rental',
    'C:\\Program Files\\Point-of-Rental',
    'C:\\Program Files (x86)\\Point-of-Rental'
  ];
  
  // Custom search path from command line argument
  const customPath = process.argv[2];
  if (customPath) {
    searchPaths.unshift(customPath);
  }
  
  // Search each path
  let allResults = [];
  
  for (const searchPath of searchPaths) {
    console.log(`\nSearching in: ${searchPath}`);
    try {
      const results = findAccessDatabaseFiles(searchPath);
      
      if (results.length > 0) {
        console.log(`Found ${results.length} Access database files:`);
        results.forEach((file, index) => {
          console.log(`${index + 1}. ${file.path}`);
          console.log(`   Size: ${file.size}, Last Modified: ${file.modified}`);
        });
        
        allResults = [...allResults, ...results];
      } else {
        console.log('No Access database files found in this location.');
      }
    } catch (error) {
      console.error(`Error searching in ${searchPath}: ${error.message}`);
    }
  }
  
  // Summary
  if (allResults.length > 0) {
    console.log('\n=== SUMMARY ===');
    console.log(`Found a total of ${allResults.length} Access database files.`);
    console.log('\nTo connect to a POR database, use one of these file paths in the connection dialog.');
    console.log('Example: C:\\Path\\To\\Database.mdb');
  } else {
    console.log('\nNo Access database files found in any of the searched locations.');
    console.log('You may need to search in other directories or provide a specific path.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
});
