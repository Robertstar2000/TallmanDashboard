// Simple LDAP test with CommonJS
const ldap = require('ldapjs');

// Configuration
const config = {
  url: 'ldap://10.10.20.253:389',
  username: 'BobM',
  password: 'Rm2214ri#',
  domain: 'tallman.com'
};

console.log('Starting LDAP test...');
console.log('Connecting to:', config.url);

// Create client with minimal options
const client = ldap.createClient({
  url: config.url,
  timeout: 10000,
  connectTimeout: 5000,
  log: {
    trace: console.log,
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error,
    fatal: console.error
  }
});

// Simple error handler
client.on('error', (err) => {
  console.error('LDAP client error:', err);
  process.exit(1);
});

console.log('\n=== Testing LDAP Bind ===');
const userDN = `${config.username}@${config.domain}`;
console.log(`Attempting to bind as: ${userDN}`);

client.bind(userDN, config.password, (err) => {
  if (err) {
    console.error('\n=== BIND FAILED ===');
    console.error('Error:', err.message);
    console.error('Details:', {
      name: err.name,
      code: err.code,
      dn: err.dn || 'N/A'
    });
    process.exit(1);
  }
  
  console.log('\n=== BIND SUCCESSFUL ===');
  console.log('Successfully authenticated as:', userDN);
  
  // Clean up
  client.unbind(() => {
    console.log('\nDisconnected from LDAP server');
    process.exit(0);
  });
});
