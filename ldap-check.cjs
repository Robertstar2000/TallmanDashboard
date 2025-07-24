// Simple LDAP connection test using CommonJS
const net = require('net');

console.log('Starting LDAP connection test...');

const client = new net.Socket();
const HOST = '10.10.20.253';
const PORT = 389;
const TIMEOUT = 10000; // 10 seconds

// Set a connection timeout
const timeoutId = setTimeout(() => {
    console.error('Connection timeout');
    client.destroy();
    process.exit(1);
}, TIMEOUT);

client.connect(PORT, HOST, () => {
    clearTimeout(timeoutId);
    console.log('✅ Connected to LDAP server');
    console.log('Local address:', client.localAddress + ':' + client.localPort);
    console.log('Remote address:', client.remoteAddress + ':' + client.remotePort);
    
    // Send a simple LDAP bind request
    const bindRequest = Buffer.from([
        0x30, 0x0c,  // LDAPMessage sequence
        0x02, 0x01, 0x01,  // Message ID: 1
        0x60, 0x07,  // Bind Request
        0x02, 0x01, 0x03,  // LDAP version: 3
        0x04, 0x02, 0x6e, 0x6f  // Empty name
    ]);
    
    console.log('Sending test LDAP bind request...');
    client.write(bindRequest);
});

client.on('data', (data) => {
    console.log('\nReceived response:');
    console.log('Hex:', data.toString('hex'));
    
    // Try to parse as LDAP response
    if (data.length >= 2) {
        const messageType = data[0];
        const messageLength = data[1];
        console.log('LDAP Message Type:', messageType);
        console.log('Message Length:', messageLength);
        
        // LDAP Bind Response
        if (messageType === 0x61) {
            console.log('LDAP Bind Response received');
            const resultCode = data[8]; // Usually at position 8
            console.log('Result Code:', getLdapResultCode(resultCode));
        }
    }
    
    client.destroy();
});

client.on('error', (err) => {
    clearTimeout(timeoutId);
    console.error('Connection error:', err.message);    
});

client.on('close', () => {
    clearTimeout(timeoutId);
    console.log('Connection closed');
});

function getLdapResultCode(code) {
    const codes = {
        0: 'success',
        1: 'operationsError',
        2: 'protocolError',
        3: 'timeLimitExceeded',
        4: 'sizeLimitExceeded',
        5: 'compareFalse',
        6: 'compareTrue',
        7: 'authMethodNotSupported',
        8: 'strongAuthRequired',
        10: 'referral',
        11: 'adminLimitExceeded',
        12: 'unavailableCriticalExtension',
        13: 'confidentialityRequired',
        14: 'saslBindInProgress',
        16: 'noSuchAttribute',
        17: 'undefinedAttributeType',
        18: 'inappropriateMatching',
        19: 'constraintViolation',
        20: 'attributeOrValueExists',
        21: 'invalidAttributeSyntax',
        32: 'noSuchObject',
        33: 'aliasProblem',
        34: 'invalidDNSyntax',
        36: 'aliasDereferencingProblem',
        48: 'inappropriateAuthentication',
        49: 'invalidCredentials',
        50: 'insufficientAccessRights',
        51: 'busy',
        52: 'unavailable',
        53: 'unwillingToPerform',
        54: 'loopDetect',
        64: 'namingViolation',
        65: 'objectClassViolation',
        66: 'notAllowedOnNonLeaf',
        67: 'notAllowedOnRDN',
        68: 'entryAlreadyExists',
        69: 'objectClassModsProhibited',
        71: 'affectsMultipleDSAs',
        80: 'other'
    };
    return codes[code] || `unknown (${code})`;
}
