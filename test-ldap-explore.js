import ldap from 'ldapjs';

// Configuration
const config = {
  url: 'ldap://10.10.20.253:389',
  bindDn: 'LDAP@tallman.com',
  bindPassword: 'ebGGAm77kk',
  searchBase: 'DC=tallman,DC=com'
};

console.log('Starting LDAP directory exploration...');
console.log('Connecting to:', config.url);

// Create LDAP client
const client = ldap.createClient({
  url: config.url,
  reconnect: false,
  timeout: 10000,
  connectTimeout: 10000,
  tlsOptions: { rejectUnauthorized: false }
});

// Test different search bases
const testSearches = [
  { name: 'Root DSE', base: '', filter: '(objectClass=*)', scope: 'base' },
  { name: 'Root context', base: config.searchBase, filter: '(objectClass=*)', scope: 'one' },
  { name: 'Users container', base: `CN=Users,${config.searchBase}`, filter: '(objectClass=user)', scope: 'one' },
  { name: 'Computers container', base: `CN=Computers,${config.searchBase}`, filter: '(objectClass=computer)', scope: 'one' }
];

async function runTests() {
  try {
    // Bind to the server
    await new Promise((resolve, reject) => {
      client.bind(config.bindDn, config.bindPassword, (err) => {
        if (err) return reject(err);
        console.log('✅ Successfully bound to LDAP server');
        resolve(true);
      });
    });

    // Run each test search
    for (const test of testSearches) {
      console.log(`\n🔍 Running test: ${test.name}`);
      console.log(`   Base: ${test.base || '(root DSE)'}`);
      console.log(`   Filter: ${test.filter}`);
      
      await new Promise((resolve) => {
        const searchOpts = {
          filter: test.filter,
          scope: test.scope,
          attributes: ['*', '+'],
          paged: true,
          sizeLimit: 5  // Limit results for testing
        };

        client.search(test.base || '', searchOpts, (err, res) => {
          if (err) {
            console.error(`   ❌ Search failed: ${err.message}`);
            return resolve();
          }

          let count = 0;
          res.on('searchEntry', (entry) => {
            count++;
            console.log(`\n   Entry ${count}:`);
            
            // Display common attributes
            const obj = entry.object;
            console.log('   DN:', obj.dn || 'N/A');
            
            // Display object classes if available
            if (obj.objectClass) {
              console.log('   Object Classes:', Array.isArray(obj.objectClass) 
                ? obj.objectClass.join(', ')
                : obj.objectClass);
            }
            
            // Display other interesting attributes
            const attrs = ['cn', 'name', 'sAMAccountName', 'userPrincipalName', 'distinguishedName'];
            attrs.forEach(attr => {
              if (obj[attr]) {
                console.log(`   ${attr}:`, Array.isArray(obj[attr]) 
                  ? obj[attr].join(', ')
                  : obj[attr]);
              }
            });
            
            // For the root DSE, show naming contexts
            if (obj.namingContexts) {
              console.log('   Naming Contexts:', Array.isArray(obj.namingContexts)
                ? obj.namingContexts.join('\n                ')
                : obj.namingContexts);
            }
          });

          res.on('error', (err) => {
            console.error(`   ❌ Search error: ${err.message}`);
          });

          res.on('end', () => {
            if (count === 0) {
              console.log('   ℹ️ No entries found');
            } else {
              console.log(`\n   Found ${count} entries`);
            }
            resolve();
          });
        });
      });
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    // Always unbind
    client.unbind(() => {
      console.log('\nDisconnected from LDAP server');
    });
  }
}

// Run the tests
runTests().catch(console.error);
