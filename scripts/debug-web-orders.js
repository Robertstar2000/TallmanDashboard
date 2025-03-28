// Script to debug Web Orders data
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for Web Orders rows
  console.log('\n--- Dashboard Data ---');
  const dashboardData = db.prepare(`
    SELECT * FROM dashboard_data WHERE key = 'webOrders'
  `).all();
  
  if (dashboardData.length > 0) {
    console.log(`Found dashboard_data for webOrders`);
    try {
      const parsedData = JSON.parse(dashboardData[0].value);
      console.log('Parsed data:', parsedData);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  } else {
    console.log('No dashboard_data found for webOrders');
  }

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
