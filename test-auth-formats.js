// Test LDAP authentication with different username formats
const ldap = require('ldapjs');

// Test cases with different username formats
const testCases = [
  { username: 'BobM', description: 'Username without domain' },
  { username: 'bobm', description: 'Lowercase username without domain' },
  { username: 'BOBM', description: 'Uppercase username without domain' },
  { username: 'BobM@tallman.com', description: 'Username with domain' },
  { username: 'bobm@tallman.com', description: 'Lowercase username with domain' },
  { username: 'BOBM@TALLMAN.COM', description: 'Uppercase username with domain' }
];

// Configuration
const PASSWORD = 'Rm2214ri#';
const DOMAIN = 'tallman.com';

// Function to test LDAP authentication
async function testLdapAuth(username, password) {
  return new Promise((resolve, reject) => {
    // Create client
    const client = ldap.createClient({
      url: 'ldap://10.10.20.253:389',
      timeout: 10000,
      connectTimeout: 5000
    });

    // Handle errors
    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });

    // Normalize username (add domain if not present)
    const userDN = username.includes('@') ? username : `${username}@${DOMAIN}`;
    
    // Attempt to bind
    client.bind(userDN, password, (err) => {
      if (err) {
        client.unbind(() => {});
        reject(err);
        return;
      }
      
      // Success
      client.unbind(() => {
        resolve({
          success: true,
          username: userDN
        });
      });
    });
  });
}

// Run all test cases
async function runTests() {
  console.log('=== Testing LDAP Authentication with Different Username Formats ===\n');
  
  for (const test of testCases) {
    console.log(`Test: ${test.description}`);
    console.log(`Username: ${test.username}`);
    
    try {
      console.log('Attempting authentication...');
      const result = await testLdapAuth(test.username, PASSWORD);
      console.log('✅ Authentication SUCCESSFUL');
      console.log('Authenticated as:', result.username);
    } catch (error) {
      console.error('❌ Authentication FAILED');
      console.error('Error:', error.message);
      
      // Log additional error details if available
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.dn) {
        console.error('DN:', error.dn);
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
