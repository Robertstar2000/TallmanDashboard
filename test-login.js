import { authenticateLdap } from './lib/auth/ldapAuth.js';

async function testLogin() {
  const username = 'BobM';
  const password = 'Rm2214ri#';
  
  console.log(`Testing login for user: ${username}`);
  console.log('='.repeat(60));
  
  try {
    console.log('Attempting LDAP authentication...');
    const user = await authenticateLdap(username, password);
    console.log('\n=== AUTHENTICATION SUCCESSFUL ===');
    console.log('User details:', JSON.stringify(user, null, 2));
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n=== AUTHENTICATION FAILED ===');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.log('='.repeat(60));
  }
}

testLogin().catch(console.error);
