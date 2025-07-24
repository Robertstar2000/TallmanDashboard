const ldap = require('ldapjs');
const dns = require('dns');
const util = require('util');

// Configuration
const config = {
  host: '10.10.20.253',
  port: 389,
  bindDn: 'LDAP@tallman.com',
  bindPassword: 'ebGGAm77kk',
  baseDn: 'DC=tallman,DC=com',
  username: 'LDAP'
};

// Promisify LDAP operations
const bindAsync = util.promisify(client.bind).bind(client);
const searchAsync = util.promisify(client.search).bind(client);

async function testLdapConnection() {
  console.log('Starting LDAP connection test...');
  
  // 1. First, verify DNS resolution
  console.log('\n1. Verifying DNS resolution...');
  try {
    const addresses = await dns.promises.lookup(config.host);
    console.log(`✅ Resolved ${config.host} to ${addresses.address}`);
  } catch (err) {
    console.error(`❌ DNS resolution failed: ${err.message}`);
    return;
  }

  // 2. Test TCP connection
  console.log('\n2. Testing TCP connection...');
  const net = require('net');
  const socket = net.createConnection(config.port, config.host);
  
  await new Promise((resolve, reject) => {
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log(`✅ Successfully connected to ${config.host}:${config.port}`);
      socket.destroy();
      resolve();
    });
    
    socket.on('timeout', () => {
      console.error('❌ Connection timed out');
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
    
    socket.on('error', (err) => {
      console.error(`❌ Connection error: ${err.message}`);
      reject(err);
    });
  });

  // 3. Test LDAP connection
  console.log('\n3. Testing LDAP connection...');
  const client = ldap.createClient({
    url: `ldap://${config.host}:${config.port}`,
    timeout: 10000,
    connectTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
    log: {
      trace: (...args) => console.log('LDAP TRACE:', ...args),
      debug: (...args) => console.log('LDAP DEBUG:', ...args),
      error: (...args) => console.error('LDAP ERROR:', ...args)
    }
  });

  try {
    // 4. Test bind
    console.log('\n4. Testing LDAP bind...');
    await bindAsync(config.bindDn, config.bindPassword);
    console.log('✅ LDAP bind successful');
    
    // 5. Test search
    console.log('\n5. Testing LDAP search...');
    const opts = {
      filter: '(objectClass=*)',
      scope: 'base',
      attributes: ['namingContexts', 'supportedLDAPVersion']
    };
    
    const res = await searchAsync('', opts);
    res.on('searchEntry', (entry) => {
      console.log('✅ Found root DSE entry:');
      console.log(JSON.stringify(entry.object, null, 2));
    });
    
    await new Promise((resolve, reject) => {
      res.on('error', reject);
      res.on('end', resolve);
    });
    
  } catch (err) {
    console.error(`❌ LDAP operation failed: ${err.message}`);
  } finally {
    // 6. Clean up
    client.unbind((err) => {
      if (err) console.error('Error during unbind:', err.message);
      console.log('\nLDAP connection closed');
    });
  }
}

// Run the test
testLdapConnection().catch(console.error);
