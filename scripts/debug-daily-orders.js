// Script to debug Daily Orders data flow
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Check the current state of Daily Orders data
  const dailyOrdersData = db.prepare("SELECT * FROM chart_data WHERE chart_name = 'Daily Orders' ORDER BY id").all();
  console.log(`Found ${dailyOrdersData.length} Daily Orders rows`);
  
  if (dailyOrdersData.length > 0) {
    console.log("\nDaily Orders Data in Database:");
    console.log("ID\tVariable Name\t\tValue");
    console.log("--\t------------\t\t-----");
    dailyOrdersData.forEach(row => {
      console.log(`${row.id}\t${row.variable_name || 'NULL'}\t\t${row.value}`);
    });
    
    // Create the expected data structure for the chart
    const chartData = dailyOrdersData.map(row => {
      const idNum = parseInt(row.id);
      const dayNumber = idNum - 56; // Convert to 1-7 range
      
      return {
        id: `order-${dayNumber}`,
        date: dayNumber.toString(),
        orders: parseFloat(row.value) || 0
      };
    });
    
    console.log("\nExpected Chart Data Structure:");
    console.log(JSON.stringify(chartData, null, 2));
    
    // Write to a temporary file that can be loaded by the frontend for testing
    const tempDataPath = path.join(__dirname, 'daily-orders-data.json');
    fs.writeFileSync(tempDataPath, JSON.stringify(chartData, null, 2));
    console.log(`\nWrote expected data to: ${tempDataPath}`);
    
    // Create a temporary HTML file to test the chart
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Daily Orders Chart Test</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .chart-container { width: 800px; height: 400px; }
  </style>
</head>
<body>
  <h1>Daily Orders Chart Test</h1>
  <div class="chart-container">
    <canvas id="dailyOrdersChart"></canvas>
  </div>
  
  <script>
    // Load the data
    const chartData = ${JSON.stringify(chartData)};
    
    // Create the chart
    const ctx = document.getElementById('dailyOrdersChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.map(item => item.date),
        datasets: [{
          label: 'Daily Orders',
          data: chartData.map(item => item.orders),
          borderColor: '#4C51BF',
          backgroundColor: 'rgba(76, 81, 191, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Orders'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Day'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
    
    const htmlPath = path.join(__dirname, 'daily-orders-test.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`\nCreated test HTML file: ${htmlPath}`);
    console.log(`Open this file in a browser to see if the chart displays correctly.`);
    
  } else {
    console.log("No Daily Orders data found in the database.");
  }
  
} catch (error) {
  console.error('Error debugging Daily Orders data:', error);
} finally {
  // Close the database
  db.close();
}
