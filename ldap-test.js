const ldap = require('ldapjs');
const dns = require('dns');
const net = require('net');
const util = require('util');

// Configuration
const config = {
  host: '10.10.20.253',
  port: 389,
  bindDn: 'LDAP@tallman.com',
  bindPassword: 'ebGGAm77kk',
  baseDn: 'DC=tallman,DC=com',
  username: 'LDAP',
  timeout: 5000
};

// Enable debug logging
ldap.Client.prototype.log.level('trace');

async function testConnection() {
  console.log('Starting LDAP connection test...');
  
  // 1. Test DNS resolution
  try {
    console.log('\n1. Testing DNS resolution...');
    const address = await util.promisify(dns.lookup)(config.host);
    console.log(`✅ Resolved ${config.host} to ${address.address}`);
  } catch (err) {
    console.error(`❌ DNS resolution failed: ${err.message}`);
    return;
  }
  
  // 2. Test TCP connection
  try {
    console.log('\n2. Testing TCP connection...');
    await new Promise((resolve, reject) => {
      const socket = net.createConnection(config.port, config.host);
      socket.setTimeout(config.timeout);
      
      socket.on('connect', () => {
        console.log(`✅ Successfully connected to ${config.host}:${config.port}`);
        socket.end();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  } catch (err) {
    console.error(`❌ TCP connection failed: ${err.message}`);
    return;
  }
  
  // 3. Test LDAP bind
  try {
    console.log('\n3. Testing LDAP bind...');
    const client = ldap.createClient({
      url: `ldap://${config.host}:${config.port}`,
      timeout: config.timeout,
      connectTimeout: config.timeout,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    // Set up error handling
    client.on('error', (err) => {
      console.error('LDAP client error:', err.message);
    });
    
    // Test bind
    await new Promise((resolve, reject) => {
      client.bind(config.bindDn, config.bindPassword, (err) => {
        if (err) return reject(err);
        console.log('✅ LDAP bind successful');
        resolve();
      });
    });
    
    // 4. Test search
    console.log('\n4. Testing LDAP search...');
    await new Promise((resolve, reject) => {
      const opts = {
        filter: '(objectClass=*)',
        scope: 'base',
        attributes: ['namingContexts', 'supportedLDAPVersion']
      };
      
      const req = client.search('', opts, (err, res) => {
        if (err) return reject(err);
        
        res.on('searchEntry', (entry) => {
          console.log('✅ Found root DSE entry:');
          console.log(JSON.stringify(entry.object, null, 2));
        });
        
        res.on('error', reject);
        res.on('end', resolve);
      });
      
      req.on('error', reject);
    });
    
    // 5. Try to find users
    console.log('\n5. Searching for users...');
    await new Promise((resolve, reject) => {
      const opts = {
        filter: '(objectClass=user)',
        scope: 'sub',
        sizeLimit: 5,
        attributes: ['cn', 'sAMAccountName', 'userPrincipalName']
      };
      
      const req = client.search(config.baseDn, opts, (err, res) => {
        if (err) return reject(err);
        
        let count = 0;
        res.on('searchEntry', (entry) => {
          count++;
          console.log(`\nUser ${count}:`);
          console.log(JSON.stringify(entry.object, null, 2));
        });
        
        res.on('error', reject);
        res.on('end', () => {
          console.log(`\nFound ${count} users`);
          resolve();
        });
      });
      
      req.on('error', reject);
    });
    
    // Clean up
    client.unbind();
    
  } catch (err) {
    console.error(`❌ LDAP operation failed: ${err.message}`);
    console.error('Stack:', err.stack);
  }
}

// Run the tests
testConnection().catch(console.error);
