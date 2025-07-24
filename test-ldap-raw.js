// Simple LDAP test using raw TCP socket
const net = require('net');

const HOST = '10.10.20.253';
const PORT = 389;
const TIMEOUT = 5000;

console.log(`Attempting to connect to ${HOST}:${PORT}...`);

const client = new net.Socket();

client.setTimeout(TIMEOUT);

client.on('connect', () => {
  console.log('✅ Connected to LDAP server');
  
  // Send a simple LDAP bind request
  const bindRequest = Buffer.from([
    0x30, 0x0c,  // LDAPMessage sequence
    0x02, 0x01, 0x01,  // Message ID: 1
    0x60, 0x07,  // Bind Request
    0x02, 0x01, 0x03,  // LDAP version: 3
    0x04, 0x02, 0x6e, 0x6f  // Empty name
  ]);
  
  console.log('Sending LDAP bind request...');
  client.write(bindRequest);
});

client.on('data', (data) => {
  console.log('Received data from server:');
  console.log(data.toString('hex').match(/.{1,32}/g).join('\n'));
  
  // Close the connection
  console.log('Closing connection...');
  client.end();
});

client.on('timeout', () => {
  console.error('❌ Connection timed out');
  client.destroy();
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err.message);});

// Connect to the server
client.connect(PORT, HOST);

// Close after 10 seconds
setTimeout(() => {
  if (!client.destroyed) {
    console.log('Closing connection after timeout');
    client.destroy();
  }
}, 10000);
