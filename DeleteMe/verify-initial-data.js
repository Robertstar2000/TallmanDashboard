const fs = require('fs');
const path = require('path');

/**
 * Script to verify that the initial-data.ts file has been updated with the corrected SQL queries
 */
function verifyInitialData() {
  console.log('=== Verifying initial-data.ts SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    console.log(`\nReading file: ${initialDataPath}`);
    
    const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');
    
    // Check for key tables that we know exist in P21
    console.log('\n--- Checking for correct table references ---');
    
    // Count occurrences of each table
    const invoiceHdrCount = (initialDataContent.match(/invoice_hdr/g) || []).length;
    const invoiceLineCount = (initialDataContent.match(/invoice_line/g) || []).length;
    const customerCount = (initialDataContent.match(/customer/g) || []).length;
    
    // Display the results
    console.log('Table reference counts:');
    console.log(`- invoice_hdr: ${invoiceHdrCount} references`);
    console.log(`- invoice_line: ${invoiceLineCount} references`);
    console.log(`- customer: ${customerCount} references`);
    
    // Check for non-zero SQL expressions
    console.log('\n--- Checking for non-zero SQL expressions ---');
    
    // Count occurrences of each SQL pattern
    const countStarCount = (initialDataContent.match(/COUNT\(\*\)/g) || []).length;
    const sumCount = (initialDataContent.match(/SUM\(/g) || []).length;
    const castCount = (initialDataContent.match(/CAST\(/g) || []).length;
    const selectZeroCount = (initialDataContent.match(/SELECT 0/g) || []).length;
    
    // Display the results
    console.log('SQL pattern counts:');
    console.log(`- COUNT(*): ${countStarCount} occurrences`);
    console.log(`- SUM(: ${sumCount} occurrences`);
    console.log(`- CAST(: ${castCount} occurrences`);
    console.log(`- SELECT 0: ${selectZeroCount} occurrences`);
    
    // Check the timestamp
    const timestampMatch = initialDataContent.match(/Last updated: (.*?)Z/);
    if (timestampMatch) {
      console.log(`\nLast updated timestamp: ${timestampMatch[1]}Z`);
      
      // Parse the timestamp
      const timestamp = new Date(timestampMatch[1] + 'Z');
      const now = new Date();
      const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
      
      console.log(`Timestamp is ${diffMinutes} minutes old`);
      
      if (diffMinutes < 60) {
        console.log('✅ Timestamp is recent (less than 60 minutes old)');
      } else {
        console.log('⚠️ Timestamp is more than 60 minutes old');
      }
    } else {
      console.log('⚠️ Could not find timestamp in file');
    }
    
    // Overall verification
    console.log('\n--- Overall Verification ---');
    
    if (invoiceHdrCount > 0 && 
        invoiceLineCount > 0 && 
        customerCount > 0 && 
        countStarCount > 0 && 
        sumCount > 0 && 
        selectZeroCount === 0) {
      console.log('✅ initial-data.ts has been successfully updated with corrected SQL queries');
    } else {
      console.log('⚠️ initial-data.ts may not have been fully updated');
    }
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== initial-data.ts Verification Completed ===');
}

// Run the verification function
verifyInitialData();
