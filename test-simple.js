const ldap = require('ldapjs');

// LDAP Configuration
const LDAP_URL = 'ldap://10.10.20.253:389';
const USERNAME = 'BobM';
const PASSWORD = 'Rm2214ri#';
const DOMAIN = 'tallman.com';

console.log('Testing LDAP authentication...');
console.log(`Server: ${LDAP_URL}`);
console.log(`User: ${USERNAME}@${DOMAIN}`);

// Create client
const client = ldap.createClient({
  url: LDAP_URL,
  log: console,
  timeout: 10000,
  connectTimeout: 5000,
  strictDN: false
});

// Handle client errors
client.on('error', (err) => {
  console.error('LDAP client error:', err);
  process.exit(1);
});

// Test bind
console.log('\nAttempting to bind...');
const userDN = `${USERNAME}@${DOMAIN}`;

client.bind(userDN, PASSWORD, (err) => {
  if (err) {
    console.error('LDAP bind failed:', err);
    console.error('Details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      dn: err.dn || 'N/A'
    });
    process.exit(1);
  }
  
  console.log('\nLDAP bind successful!');
  console.log('Authentication successful for user:', userDN);
  
  // Unbind and exit
  client.unbind((unbindErr) => {
    if (unbindErr) {
      console.error('Error during unbind:', unbindErr);
    }
    process.exit(0);
  });
});
