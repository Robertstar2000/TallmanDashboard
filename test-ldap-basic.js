const net = require('net');
const dns = require('dns/promises');

async function testLdapConnection() {
  const host = '10.10.20.253';
  const port = 389;
  
  try {
    // 1. Test DNS resolution
    console.log('1. Testing DNS resolution...');
    try {
      const addresses = await dns.lookup(host);
      console.log(`✅ Resolved ${host} to ${addresses.address}`);
    } catch (err) {
      console.error(`❌ DNS resolution failed: ${err.message}`);
      return;
    }
    
    // 2. Test TCP connection
    console.log('\n2. Testing TCP connection...');
    const socket = net.createConnection({ host, port, timeout: 5000 });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`✅ Successfully connected to ${host}:${port}`);
        socket.end();
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
    
    console.log('\n✅ Basic connectivity tests passed!');
    
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
  }
}

testLdapConnection();
