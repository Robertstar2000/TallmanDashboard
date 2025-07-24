import ldap from 'ldapjs';

// Configuration
const config = {
  url: 'ldap://10.10.20.253:389',
  bindDn: 'LDAP@tallman.com',
  bindPassword: 'ebGGAm77kk',
  searchBase: 'DC=tallman,DC=com'
};

console.log('Starting simple LDAP test...');
console.log('Connecting to:', config.url);

// Create LDAP client
const client = ldap.createClient({
  url: config.url,
  reconnect: false,
  timeout: 5000,
  connectTimeout: 5000,
  tlsOptions: { 
    rejectUnauthorized: false
  }
});

// Handle connection events
client.on('connect', () => {
  console.log('✅ Connected to LDAP server');
  
  // Try to bind
  console.log('Attempting to bind...');
  client.bind(config.bindDn, config.bindPassword, (err) => {
    if (err) {
      console.error('❌ Bind failed:', err.message);
      process.exit(1);
    }
    
    console.log('✅ Successfully bound to LDAP server');
    
    // Try a simple search
    console.log('\nAttempting to search...');
    const searchOptions = {
      filter: '(objectClass=*)',
      scope: 'base',
      attributes: ['namingContexts']
    };
    
    client.search('', searchOptions, (err, res) => {
      if (err) {
        console.error('❌ Search failed:', err.message);
        client.unbind();
        process.exit(1);
      }
      
      res.on('searchEntry', (entry) => {
        console.log('✅ Search result:');
        console.log(JSON.stringify(entry.object, null, 2));
      });
      
      res.on('error', (err) => {
        console.error('❌ Search error:', err.message);
      });
      
      res.on('end', () => {
        console.log('\n✅ Search completed');
        client.unbind(() => {
          console.log('Disconnected from LDAP server');
        });
      });
    });
  });
});

// Handle errors
client.on('error', (err) => {
  console.error('❌ LDAP client error:', err.message);
  process.exit(1);
});

client.on('connectTimeout', () => {
  console.error('❌ Connection timeout');
  process.exit(1);
});

// Set a timeout for the entire operation
setTimeout(() => {
  console.error('❌ Operation timed out');
  process.exit(1);
}, 10000);
