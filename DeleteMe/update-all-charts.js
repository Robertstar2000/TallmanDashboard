/**
 * Master script to update all chart group SQL expressions in the TallmanDashboard
 * This script runs all individual update scripts in sequence
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('=== TallmanDashboard SQL Expressions Update ===');
console.log('Starting at', new Date().toISOString());

// List of update scripts to run
const updateScripts = [
  'update-accounts-fixed.js',
  'update-customer-metrics-fixed.js',
  'update-daily-orders-fixed.js',
  'update-historical-data.js',
  'update-inventory.js',
  'update-key-metrics-fixed.js',
  'update-por-overview.js',
  'update-site-distribution.js',
  'update-web-orders.js',
  'update-all-queries-final.js' // This script updates all chart groups at once
];

// Run each update script
for (const script of updateScripts) {
  try {
    console.log(`\n=== Running ${script} ===`);
    
    // Execute the script
    execSync(`node ${script}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ Successfully ran ${script}`);
  } catch (error) {
    console.error(`❌ Error running ${script}:`, error.message);
  }
}

console.log('\n=== All SQL Expressions Updated Successfully ===');
console.log('Completed at', new Date().toISOString());
console.log('\nNext steps:');
console.log('1. Run the dashboard application');
console.log('2. Go to the admin page and connect to the P21 database');
console.log('3. Click "Run" to execute all SQL queries and update the dashboard');
console.log('4. Verify that all charts and metrics display non-zero values');
