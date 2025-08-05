import ldap from 'ldapjs';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const LDAP_URL = process.env.LDAP_URL;
const LDAP_BIND_DN = process.env.LDAP_BIND_DN;
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD;
const LDAP_SEARCH_BASE = process.env.LDAP_SEARCH_BASE;

console.log('LDAP Configuration Test:');
console.log('URL:', LDAP_URL);
console.log('Bind DN:', LDAP_BIND_DN);
console.log('Bind Password:', LDAP_BIND_PASSWORD ? '***' : 'NOT SET');
console.log('Search Base:', LDAP_SEARCH_BASE);

const testLDAPConnection = async (username, password) => {
  return new Promise((resolve, reject) => {
    console.log(`\nTesting LDAP authentication for user: ${username}`);
    
    const client = ldap.createClient({
      url: LDAP_URL,
      timeout: 5000,
      connectTimeout: 5000
    });

    // Bind with service account
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (err) => {
      if (err) {
        console.error('Service account bind failed:', err.message);
        client.unbind();
        return reject(err);
      }

      console.log('✅ Service account bind successful');

      // Search for user
      const searchOptions = {
        scope: 'sub',
        filter: `(sAMAccountName=${username})`
      };

      console.log('Searching for user with filter:', searchOptions.filter);

      client.search(LDAP_SEARCH_BASE, searchOptions, (err, res) => {
        if (err) {
          console.error('Search failed:', err.message);
          client.unbind();
          return reject(err);
        }

        let userDN = null;
        let userInfo = null;

        res.on('searchEntry', (entry) => {
          console.log('✅ User found in directory');
          userDN = entry.dn.toString();
          userInfo = {
            username: entry.object.sAMAccountName,
            displayName: entry.object.displayName,
            email: entry.object.mail,
            groups: entry.object.memberOf || []
          };
          console.log('User DN:', userDN);
          console.log('User Info:', userInfo);
        });

        res.on('error', (err) => {
          console.error('Search result error:', err.message);
          client.unbind();
          reject(err);
        });

        res.on('end', () => {
          if (!userDN) {
            console.error('❌ User not found in directory');
            client.unbind();
            return reject(new Error('User not found'));
          }

          console.log('Testing user password authentication...');
          // Try to bind with user credentials
          client.bind(userDN, password, (err) => {
            client.unbind();
            if (err) {
              console.error('❌ User authentication failed:', err.message);
              return reject(new Error('Invalid credentials'));
            }
            console.log('✅ User authentication successful!');
            resolve(userInfo);
          });
        });
      });
    });
  });
};

// Test the authentication
testLDAPConnection('BobM', 'Rm2214ri#')
  .then((userInfo) => {
    console.log('\n🎉 LDAP authentication test PASSED!');
    console.log('User info:', userInfo);
  })
  .catch((error) => {
    console.log('\n💥 LDAP authentication test FAILED:');
    console.error('Error:', error.message);
  })
  .finally(() => {
    process.exit(0);
  });
