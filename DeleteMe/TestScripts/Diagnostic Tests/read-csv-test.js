const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Path to the CSV file
const csvFilePath = path.resolve(__dirname, '..', '..', 'scripts', 'MasterSQLTable.csv');

console.log(`Attempting to read CSV file: ${csvFilePath}`);
console.log(`File exists: ${fs.existsSync(csvFilePath)}`);

// Function to read CSV file
function readCsvFile() {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .on('error', (error) => {
        console.error(`Error reading file: ${error.message}`);
        reject(error);
      })
      .pipe(csv({
        // Try different delimiter options
        separator: ',',
        headers: ['ID', 'Name', 'ChartGroup', 'VariableName', 'ServerType', 'Value', 'TableName', 'SqlExpression', 'ProductionSqlExpression'],
        skipLines: 0
      }))
      .on('data', (data) => {
        console.log('Row data:', data);
        results.push(data);
      })
      .on('end', () => {
        console.log(`Total rows read: ${results.length}`);
        resolve(results);
      });
  });
}

// Execute the function
readCsvFile()
  .then(data => {
    console.log('CSV reading completed successfully');
  })
  .catch(error => {
    console.error(`Failed to read CSV: ${error.message}`);
  });
