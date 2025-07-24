// Test LDAP authentication
import { authenticateLdap } from './lib/auth/ldapAuth.js';

async function testAuth() {
  try {
    // Test with a valid username and password
    const username = 'testuser'; // Replace with a valid username
    const password = 'testpassword'; // Replace with the actual password
    
    console.log(`Testing LDAP authentication for user: ${username}`);
    const user = await authenticateLdap(username, password);
    console.log('Authentication successful!');
    console.log('User details:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Authentication failed:', error.message);
  }
}

testAuth();
