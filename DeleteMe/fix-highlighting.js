// Script to fix any potential issues with row highlighting in the AdminSpreadsheet component
const fs = require('fs');
const path = require('path');

// Path to AdminSpreadsheet.tsx
const adminSpreadsheetPath = path.join(process.cwd(), 'components', 'admin', 'AdminSpreadsheet.tsx');
console.log(`AdminSpreadsheet path: ${adminSpreadsheetPath}`);

// Read the AdminSpreadsheet component
fs.readFile(adminSpreadsheetPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading AdminSpreadsheet.tsx:', err.message);
    return;
  }
  
  console.log('Successfully read AdminSpreadsheet.tsx');
  
  // Check if the component is using the ID for row highlighting
  const rowHighlightingMatch = data.match(/className={activeRowId === row\.id \? .* : ''}/);
  if (rowHighlightingMatch) {
    console.log('Row highlighting is already configured correctly.');
  } else {
    console.log('Row highlighting needs to be fixed.');
    
    // Find the TableRow component and fix the highlighting
    const tableRowRegex = /<TableRow\s+key={.*?}\s+.*?>/g;
    const updatedData = data.replace(tableRowRegex, (match) => {
      // If the match already contains className with activeRowId, don't modify it
      if (match.includes('activeRowId')) {
        return match;
      }
      
      // Otherwise, add the highlighting logic
      return match.replace(/<TableRow\s+key={row\.id}/, 
        '<TableRow key={row.id} className={activeRowId === row.id ? \'bg-blue-300 animate-pulse border-2 border-blue-500\' : \'\'}');
    });
    
    // Write the updated component back to the file
    fs.writeFile(adminSpreadsheetPath, updatedData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing updated AdminSpreadsheet.tsx:', writeErr.message);
        return;
      }
      
      console.log('Successfully updated AdminSpreadsheet.tsx with fixed row highlighting');
    });
  }
  
  // Check if the component is displaying the ID correctly
  const idDisplayMatch = data.match(/<TableCell>\s*<div[^>]*>\s*{row\.id}\s*<\/div>\s*<\/TableCell>/);
  if (idDisplayMatch) {
    console.log('ID display is already configured correctly.');
  } else {
    console.log('ID display needs to be fixed.');
    
    // Find the first TableCell and add the ID display before it
    const firstTableCellRegex = /<TableCell>/;
    const updatedData = data.replace(firstTableCellRegex, 
      `<TableCell>
  <div className="px-2 py-1 border rounded bg-gray-100 text-gray-800 text-xs">
    {row.id}
  </div>
</TableCell>
<TableCell>`);
    
    // Write the updated component back to the file
    fs.writeFile(adminSpreadsheetPath, updatedData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing updated AdminSpreadsheet.tsx:', writeErr.message);
        return;
      }
      
      console.log('Successfully updated AdminSpreadsheet.tsx with fixed ID display');
    });
  }
});
