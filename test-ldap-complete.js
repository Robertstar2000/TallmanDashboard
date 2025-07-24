import ldap from 'ldapjs';

// Configuration
const config = {
  url: 'ldap://10.10.20.253:389',
  bindDn: 'LDAP@tallman.com',
  bindPassword: 'ebGGAm77kk',
  searchBase: 'DC=tallman,DC=com',
  username: 'LDAP'  // Test username to search for
};

async function testLdapConnection() {
  console.log('Starting LDAP connection test...');
  console.log('Configuration:', {
    ...config,
    bindPassword: '***'  // Don't log the actual password
  });

  // Create LDAP client
  const client = ldap.createClient({
    url: config.url,
    reconnect: true,
    timeout: 10000,
    connectTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('\n1. Testing connection...');
    await new Promise((resolve, reject) => {
      client.on('connect', () => {
        console.log('✅ Connected to LDAP server');
        resolve(true);
      });

      client.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
        reject(err);
      });

      client.on('connectTimeout', () => {
        console.error('❌ Connection timeout');
        reject(new Error('Connection timeout'));
      });
    });

    // Test bind
    console.log('\n2. Testing bind...');
    await new Promise((resolve, reject) => {
      client.bind(config.bindDn, config.bindPassword, (err) => {
        if (err) {
          console.error('❌ Bind failed:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Successfully bound to LDAP server');
        resolve(true);
      });
    });

    // Test search with different filters
    console.log('\n3. Testing user search...');
    
    // Try different search filters
    const searchTests = [
      { 
        name: 'Search by sAMAccountName',
        filter: `(sAMAccountName=${config.username})`
      },
      {
        name: 'Search by userPrincipalName',
        filter: `(userPrincipalName=${config.bindDn})`
      },
      {
        name: 'Search all users',
        filter: '(objectClass=user)'
      }
    ];

    for (const test of searchTests) {
      console.log(`\n${test.name} (${test.filter}):`);
      
      const searchOptions = {
        filter: test.filter,
        scope: 'sub',
        attributes: ['*', '+'],
        paged: true,
        sizeLimit: 10  // Limit to 10 results for testing
      };

      await new Promise((resolve, reject) => {
        client.search(config.searchBase, searchOptions, (err, res) => {
          if (err) {
            console.error('  ❌ Search error:', err.message);
            resolve();
            return;
          }

          let count = 0;
          res.on('searchEntry', (entry) => {
            count++;
            console.log(`\n  ✅ Entry ${count}:`);
            
            // Log a subset of useful attributes
            const obj = entry.object;
            console.log('     DN:', obj.dn || 'N/A');
            console.log('     CN:', obj.cn || 'N/A');
            console.log('     sAMAccountName:', obj.sAMAccountName || 'N/A');
            console.log('     userPrincipalName:', obj.userPrincipalName || 'N/A');
            console.log('     mail:', obj.mail || 'N/A');
            console.log('     displayName:', obj.displayName || 'N/A');
            
            // Log all available attributes (commented out to reduce noise)
            // console.log('  All attributes:', Object.keys(obj).join(', '));
          });

          res.on('error', (err) => {
            console.error('  ❌ Search error:', err.message);
            reject(err);
          });

          res.on('end', () => {
            if (count === 0) {
              console.log('  ℹ️ No entries found');
            } else {
              console.log(`\n  Found ${count} entries`);
            }
            resolve(true);
          });
        });
      });
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    // Always unbind
    client.unbind((err) => {
      if (err) {
        console.error('Error during unbind:', err.message);
      } else {
        console.log('\nDisconnected from LDAP server');
      }
    });
  }
}

// Run the test
testLdapConnection().catch(console.error);
