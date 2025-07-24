import ldap from 'ldapjs';

const LDAP_URL = 'ldap://10.10.20.253:389';
const BIND_DN = 'CN=LDAP,DC=tallman,DC=com';
const BIND_PASSWORD = 'ebGGAm77kk';
const SEARCH_BASE = 'DC=tallman,DC=com';

console.log('Attempting to connect to LDAP server...');
const client = ldap.createClient({ url: LDAP_URL });

client.on('connectError', (err) => {
  console.error('LDAP connection error:', err);
  process.exit(1);
});

client.bind(BIND_DN, BIND_PASSWORD, (err) => {
  if (err) {
    console.error('LDAP bind failed:', err);
    process.exit(1);
  }
  console.log('Successfully bound to LDAP server');
  
  // Perform a simple search to verify access
  const opts = {
    filter: '(objectClass=user)',
    scope: 'sub',
    attributes: ['dn', 'cn', 'mail']
  };
  
  client.search(SEARCH_BASE, opts, (err, res) => {
    if (err) {
      console.error('LDAP search error:', err);
      process.exit(1);
    }
    
    res.on('searchEntry', (entry) => {
      console.log('Found entry:', JSON.stringify(entry.object, null, 2));
    });
    
    res.on('error', (err) => {
      console.error('Search error:', err);
      process.exit(1);
    });
    
    res.on('end', () => {
      console.log('LDAP search completed');
      client.unbind();
      process.exit(0);
    });
  });
});
