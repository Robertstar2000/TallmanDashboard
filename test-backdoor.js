// Test backdoor authentication directly
const path = require('path');

// Import the auth service (we'll need to simulate the ES module)
async function testBackdoor() {
  try {
    console.log('Testing backdoor authentication...');
    
    // Test the extraction and comparison logic
    const extractUsername = (input) => {
      if (input.includes('@')) {
        return input.split('@')[0];
      }
      return input;
    };
    
    const checkBackdoorAuth = (username, password) => {
      const normalizedUsername = extractUsername(username);
      const isMatch = normalizedUsername.toLowerCase() === 'robertstar' && password === 'Rm2214ri#';
      console.log('Backdoor check details:');
      console.log('- Original username:', username);
      console.log('- Normalized username:', normalizedUsername);
      console.log('- Lowercase normalized:', normalizedUsername.toLowerCase());
      console.log('- Expected username: robertstar');
      console.log('- Password matches:', password === 'Rm2214ri#');
      console.log('- Overall match:', isMatch);
      return isMatch;
    };
    
    // Test various username formats
    const testCases = [
      { username: 'Robertstar', password: 'Rm2214ri#' },
      { username: 'robertstar', password: 'Rm2214ri#' },
      { username: 'ROBERTSTAR', password: 'Rm2214ri#' },
      { username: 'Robertstar@tallman.com', password: 'Rm2214ri#' },
      { username: 'robertstar@tallmanequipment.com', password: 'Rm2214ri#' },
      { username: 'Robertstar', password: 'wrong-password' },
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`\n=== Test Case ${index + 1} ===`);
      const result = checkBackdoorAuth(testCase.username, testCase.password);
      console.log('Expected result:', testCase.password === 'Rm2214ri#' && testCase.username.toLowerCase().includes('robertstar'));
      console.log('Actual result:', result);
      console.log('PASS:', result === (testCase.password === 'Rm2214ri#' && testCase.username.toLowerCase().includes('robertstar')));
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBackdoor();
