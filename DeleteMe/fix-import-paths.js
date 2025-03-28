const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-imports-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the import paths
// Replace @/lib with relative paths
content = content.replace(
  "import { getMode } from '@/lib/state/dashboardState';",
  "import { getMode } from '../../state/dashboardState';"
);

// Check for other imports that might be causing issues
const importLines = content.match(/import .+ from ['"].+['"];/g) || [];
console.log(`Found ${importLines.length} import statements`);

// Check if the imported files exist
importLines.forEach(importLine => {
  const match = importLine.match(/from ['"](.+)['"]/);
  if (match) {
    const importPath = match[1];
    if (importPath.startsWith('./')) {
      // It's a relative import, check if the file exists
      const relativePath = importPath.substring(2);
      const fullPath = path.join(__dirname, 'lib', 'db', relativePath);
      
      if (!fs.existsSync(`${fullPath}.ts`) && !fs.existsSync(`${fullPath}.js`)) {
        console.log(`Warning: Imported file not found: ${importPath}`);
        
        // Comment out the import if it doesn't exist
        content = content.replace(
          importLine,
          `// ${importLine} // Commented out because file not found`
        );
      }
    }
  }
});

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed import paths in initial-data.ts');

// Now check for the existence of the dashboardState file
const dashboardStatePath = path.join(__dirname, 'lib', 'state', 'dashboardState.ts');
if (!fs.existsSync(dashboardStatePath)) {
  console.log(`Warning: dashboardState.ts file not found at ${dashboardStatePath}`);
  console.log('Creating minimal dashboardState.ts file...');
  
  // Create a minimal dashboardState.ts file
  const dashboardStateContent = `// Minimal dashboardState.ts file
export const getMode = () => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};
`;
  
  // Create the state directory if it doesn't exist
  const stateDir = path.join(__dirname, 'lib', 'state');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  
  // Write the dashboardState.ts file
  fs.writeFileSync(dashboardStatePath, dashboardStateContent, 'utf8');
  console.log('Created minimal dashboardState.ts file');
}
