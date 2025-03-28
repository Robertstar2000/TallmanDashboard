// Script to check database changes
const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Checking Historical Data variables:');
  const histData = db.prepare("SELECT variable_name, COUNT(*) as count FROM chart_data WHERE chart_group = 'Historical Data' GROUP BY variable_name").all();
  console.table(histData);

  console.log('\nChecking Customer Metrics variables:');
  const custData = db.prepare("SELECT variable_name, COUNT(*) as count FROM chart_data WHERE chart_group = 'Customer Metrics' GROUP BY variable_name").all();
  console.table(custData);

  console.log('\nChecking Daily Orders variables:');
  const dailyData = db.prepare("SELECT variable_name, COUNT(*) as count FROM chart_data WHERE chart_group = 'Daily Orders' GROUP BY variable_name").all();
  console.table(dailyData);
  
  console.log('\nChecking Site Distribution in chart_name:');
  const siteData = db.prepare("SELECT chart_name FROM chart_data WHERE chart_group = 'Site Distribution'").all();
  console.table(siteData);
  
  console.log('\nTotal row count by chart_group:');
  const groupCounts = db.prepare("SELECT chart_group, COUNT(*) as count FROM chart_data GROUP BY chart_group ORDER BY chart_group").all();
  console.table(groupCounts);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
}
