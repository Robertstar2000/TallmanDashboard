const ldap = require('ldapjs');

async function testLDAPConnection() {
  console.log('🔍 Testing LDAP Connection...');
  
  // Test configurations
  const configs = [
    {
      name: 'Current Config (tallmanequipment.com)',
      url: 'ldap://tallmanequipment.com:389',
      baseDN: 'dc=tallmanequipment,dc=com',
      bindDN: 'CN=LDAP,DC=tallman,DC=com',
      bindPassword: 'ebGGAm77kk'
    },
    {
      name: 'IP Address Config',
      url: 'ldap://10.10.20.253:389',
      baseDN: 'dc=tallman,dc=com',
      bindDN: 'CN=LDAP,DC=tallman,DC=com',
      bindPassword: 'ebGGAm77kk'
    },
    {
      name: 'Corrected Domain Config',
      url: 'ldap://tallmanequipment.com:389',
      baseDN: 'dc=tallman,dc=com',
      bindDN: 'CN=LDAP,DC=tallman,DC=com',
      bindPassword: 'ebGGAm77kk'
    }
  ];

  for (const config of configs) {
    console.log(`\n📡 Testing: ${config.name}`);
    console.log(`URL: ${config.url}`);
    console.log(`Base DN: ${config.baseDN}`);
    console.log(`Bind DN: ${config.bindDN}`);
    
    try {
      await testConfig(config);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

function testConfig(config) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: config.url,
      timeout: 5000,
      connectTimeout: 5000,
    });

    client.on('error', (err) => {
      console.log(`❌ Connection Error: ${err.message}`);
      reject(err);
    });

    client.on('connect', () => {
      console.log('✅ Connected to LDAP server');
    });

    // Try to bind with service account
    client.bind(config.bindDN, config.bindPassword, (err) => {
      if (err) {
        console.log(`❌ Bind Error: ${err.message}`);
        client.unbind();
        reject(err);
        return;
      }
      
      console.log('✅ Successfully bound to LDAP server');
      
      // Try a simple search to verify connection
      const searchOptions = {
        scope: 'base',
        filter: '(objectClass=*)'
      };
      
      client.search(config.baseDN, searchOptions, (err, res) => {
        if (err) {
          console.log(`❌ Search Error: ${err.message}`);
          client.unbind();
          reject(err);
          return;
        }
        
        console.log('✅ LDAP search successful');
        client.unbind();
        resolve();
      });
    });
  });
}

// Test user authentication
async function testUserAuth() {
  console.log('\n👤 Testing User Authentication...');
  
  const testUser = 'BobM';
  const testPassword = 'Rm2214ri#'; // Using the same password for testing
  
  const config = {
    url: 'ldap://10.10.20.253:389',
    baseDN: 'dc=tallman,dc=com'
  };
  
  const client = ldap.createClient({
    url: config.url,
    timeout: 5000,
    connectTimeout: 5000,
  });
  
  // Try different user DN formats
  const userDNFormats = [
    `${testUser}@tallman.com`,
    `${testUser}@tallmanequipment.com`,
    `CN=${testUser},DC=tallman,DC=com`,
    `sAMAccountName=${testUser},DC=tallman,DC=com`
  ];
  
  for (const userDN of userDNFormats) {
    console.log(`\n🔐 Testing user DN: ${userDN}`);
    
    try {
      await new Promise((resolve, reject) => {
        client.bind(userDN, testPassword, (err) => {
          if (err) {
            console.log(`❌ Auth failed: ${err.message}`);
            reject(err);
          } else {
            console.log('✅ User authentication successful!');
            resolve();
          }
        });
      });
    } catch (error) {
      // Continue to next format
    }
  }
  
  client.unbind();
}

// Run tests
testLDAPConnection()
  .then(() => testUserAuth())
  .then(() => {
    console.log('\n🎉 LDAP testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n💥 LDAP testing failed:', error.message);
    process.exit(1);
  });
