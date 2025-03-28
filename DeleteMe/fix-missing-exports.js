const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Add the missing exports at the end of the file
const appendContent = `

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
    server_name: 'P21',
    host: 'localhost',
    port: 1433,
    database: 'P21',
    username: 'sa',
    password: 'password',
    server: 'P21'
  },
  {
    id: '2',
    server_name: 'POR',
    host: 'localhost',
    port: 1433,
    database: 'POR',
    username: 'sa',
    password: 'password',
    server: 'POR'
  }
];`;

// Write the updated content back to the file
fs.writeFileSync(filePath, content + appendContent, 'utf8');

console.log('Added missing exports to initial-data.ts file');
