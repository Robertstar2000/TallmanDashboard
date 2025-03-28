// Script to run the initializeTestData function
const path = require('path');
const { initializeTestData } = require(path.join(__dirname, '..', 'lib', 'db', 'initialize-test-data'));

async function main() {
  try {
    console.log('Starting test data initialization...');
    await initializeTestData();
    console.log('Test data initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
}

main();
