// Test LDAP authentication with different username formats
const { authenticateLdap } = require('./lib/auth/ldapAuth');

// Test cases with different username formats
const testCases = [
  { username: 'BobM', description: 'Username without domain' },
  { username: 'bobm', description: 'Lowercase username without domain' },
  { username: 'BOBM', description: 'Uppercase username without domain' },
  { username: 'BobM@tallman.com', description: 'Username with domain' },
  { username: 'bobm@tallman.com', description: 'Lowercase username with domain' },
  { username: 'BOBM@TALLMAN.COM', description: 'Uppercase username with domain' }
];

// Password for testing
const PASSWORD = 'Rm2214ri#';

async function runTests() {
  console.log('=== Testing LDAP Authentication with Different Username Formats ===\n');
  
  for (const test of testCases) {
    console.log(`Test: ${test.description}`);
    console.log(`Username: ${test.username}`);
    
    try {
      console.log('Attempting authentication...');
      const user = await authenticateLdap(test.username, PASSWORD);
      
      console.log('✅ Authentication SUCCESSFUL');
      console.log('User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      });
    } catch (error) {
      console.error('❌ Authentication FAILED');
      console.error('Error:', error.message);
      
      // Log additional error details if available
      if (error.details) {
        console.error('Details:', error.details);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  console.log('All tests completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
