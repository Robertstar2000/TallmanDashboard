import ldap from 'ldapjs';

const LDAP_URL = 'ldap://10.10.20.253:389';
const BIND_DN = 'CN=LDAP,DC=tallman,DC=com';
const BIND_PASSWORD = 'ebGGAm77kk';
const SEARCH_BASE = 'DC=tallman,DC=com';
const LDAP_DOMAIN = 'tallman.com';

const serviceAccountUser = BIND_DN.match(/^CN=([^,]+)/i)?.[1] || BIND_DN;
const candidateBindIds = [
  BIND_DN,
  `CN=${serviceAccountUser},CN=Users,${SEARCH_BASE}`,
  `${serviceAccountUser}@${SEARCH_BASE.replace(/DC=/gi, '').replace(/,/g, '.')}`,
  `TALLMAN\\${serviceAccountUser}`
];

console.log('Testing LDAP bind with the following DNs:');
candidateBindIds.forEach((dn, i) => console.log(`${i + 1}. ${dn}`));

async function testBind(dn) {
  return new Promise((resolve) => {
    console.log(`\nTesting bind with DN: ${dn}`);
    const client = ldap.createClient({ url: LDAP_URL });
    
    client.on('error', (err) => {
      console.error('  Error:', err.message);
      client.unbind();
      resolve(false);
    });
    
    client.bind(dn, BIND_PASSWORD, (err) => {
      if (err) {
        console.error('  Bind failed:', err.message);
        client.unbind();
        resolve(false);
      } else {
        console.log('  Bind successful!');
        client.unbind();
        resolve(true);
      }
    });
  });
}

async function runTests() {
  for (const dn of candidateBindIds) {
    const success = await testBind(dn);
    if (success) {
      console.log(`\n✅ Successfully bound with DN: ${dn}`);
      return;
    }
  }
  console.log('\n❌ All bind attempts failed.');
}

runTests().catch(console.error);
