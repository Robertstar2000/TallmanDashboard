// Script to verify SQL expressions in complete-chart-data.ts file
const fs = require('fs');
const path = require('path');

// File path
const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');

console.log('Starting SQL expression verification...');

// Read the file content
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.log(`Read file content, size: ${fileContent.length} bytes`);

  // Extract the data array from the file
  const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
  const endMarker = '];';
  const startIndex = fileContent.indexOf(startMarker);
  const endIndex = fileContent.lastIndexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find the data array markers in the file');
    process.exit(1);
  }

  // Extract the array content
  const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex);
  
  // Parse the array content to find all objects
  const regex = /"id":\s*"(\d+)"[^}]*"serverName":\s*"([^"]*)"[^}]*"productionSqlExpression":\s*"([^"]*)"/g;
  
  let match;
  let p21Count = 0;
  let porCount = 0;
  let p21Errors = [];
  let porErrors = [];
  
  while ((match = regex.exec(arrayContent)) !== null) {
    const id = match[1];
    const serverName = match[2];
    const sqlExpression = match[3];
    
    // Determine expected server name based on ID
    const expectedServerName = parseInt(id) >= 127 && parseInt(id) <= 174 ? 'POR' : 'P21';
    
    // Check if server name matches expected value
    if (serverName !== expectedServerName) {
      if (expectedServerName === 'P21') {
        p21Errors.push(`ID ${id}: Incorrect serverName "${serverName}", should be "P21"`);
      } else {
        porErrors.push(`ID ${id}: Incorrect serverName "${serverName}", should be "POR"`);
      }
    }
    
    // Verify SQL expression syntax based on server type
    if (serverName === 'P21') {
      p21Count++;
      
      // Check for SQL Server syntax
      if (!sqlExpression.includes('dbo.') && sqlExpression.includes('FROM')) {
        p21Errors.push(`ID ${id}: Missing schema prefix (dbo.)`);
      }
      
      if (!sqlExpression.includes('WITH (NOLOCK)') && sqlExpression.includes('FROM')) {
        p21Errors.push(`ID ${id}: Missing WITH (NOLOCK) hint`);
      }
      
      if (sqlExpression.includes('Date()')) {
        p21Errors.push(`ID ${id}: Using Date() instead of GETDATE()`);
      }
      
      if (sqlExpression.includes("DateAdd('") || sqlExpression.includes("DateDiff('")) {
        p21Errors.push(`ID ${id}: Using quoted interval in DateAdd/DateDiff`);
      }
      
      if (!sqlExpression.includes(' as value') && !sqlExpression.includes(' AS value')) {
        p21Errors.push(`ID ${id}: Missing 'value' alias`);
      }
    } else if (serverName === 'POR') {
      porCount++;
      
      // Check for MS Access syntax
      if (sqlExpression.includes('dbo.')) {
        porErrors.push(`ID ${id}: Contains schema prefix (dbo.)`);
      }
      
      if (sqlExpression.includes('WITH (NOLOCK)')) {
        porErrors.push(`ID ${id}: Contains WITH (NOLOCK) hint`);
      }
      
      if (sqlExpression.includes('GETDATE()')) {
        porErrors.push(`ID ${id}: Using GETDATE() instead of Date()`);
      }
      
      if (sqlExpression.includes('DATEADD(') || sqlExpression.includes('DATEDIFF(')) {
        porErrors.push(`ID ${id}: Using unquoted interval in DATEADD/DATEDIFF`);
      }
      
      if (!sqlExpression.includes(' as value') && !sqlExpression.includes(' AS value')) {
        porErrors.push(`ID ${id}: Missing 'value' alias`);
      }
    }
  }
  
  // Print results
  console.log('\n=== SQL Expression Verification Results ===');
  console.log(`Total entries: ${p21Count + porCount}`);
  console.log(`P21 entries: ${p21Count}`);
  console.log(`POR entries: ${porCount}`);
  
  console.log('\n=== P21 SQL Errors ===');
  if (p21Errors.length === 0) {
    console.log('No errors found in P21 SQL expressions');
  } else {
    p21Errors.forEach(error => console.log(error));
  }
  
  console.log('\n=== POR SQL Errors ===');
  if (porErrors.length === 0) {
    console.log('No errors found in POR SQL expressions');
  } else {
    porErrors.forEach(error => console.log(error));
  }
  
  console.log('\n=== Verification Complete ===');
  
} catch (error) {
  console.error('Error verifying SQL expressions:', error);
  process.exit(1);
}
