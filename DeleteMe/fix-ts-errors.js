const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix property naming: server_name -> serverName
content = content.replace(/server_name:/g, 'serverName:');

// 2. Find and remove duplicate exports
// First, find the last occurrence of initialSpreadsheetData
const lastInitialDataIndex = content.lastIndexOf('initialSpreadsheetData');
const endOfInitialDataIndex = content.indexOf('];', lastInitialDataIndex) + 2;

// Keep only the content up to the end of initialSpreadsheetData
let cleanedContent = content.substring(0, endOfInitialDataIndex);

// Add a single instance of chartGroupSettings and serverConfigs
cleanedContent += `

// Chart group settings
export const chartGroupSettings = {
  'AR Aging': { chartType: 'bar' },
  'Accounts': { chartType: 'line' },
  'Customer Metrics': { chartType: 'line' },
  'Daily Orders': { chartType: 'bar' },
  'Historical Data': { chartType: 'line' },
  'Inventory': { chartType: 'bar' },
  'Key Metrics': { chartType: 'value' },
  'Site Distribution': { chartType: 'pie' },
  'POR Overview': { chartType: 'line' },
  'Web Orders': { chartType: 'line' }
};

// Server configurations
export const serverConfigs = [
  {
    id: '1',
    serverName: 'P21',
    host: 'localhost',
    port: 1433,
    database: 'P21',
    username: 'sa',
    password: 'password',
    server: 'P21'
  },
  {
    id: '2',
    serverName: 'POR',
    host: 'localhost',
    port: 1433,
    database: 'POR',
    username: 'sa',
    password: 'password',
    server: 'POR'
  }
];`;

// Write the updated content back to the file
fs.writeFileSync(filePath, cleanedContent, 'utf8');

console.log('Fixed TypeScript errors in initial-data.ts file:');
console.log('1. Changed server_name to serverName');
console.log('2. Removed duplicate declarations of chartGroupSettings and serverConfigs');
