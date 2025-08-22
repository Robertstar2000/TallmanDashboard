console.log('Attempting to load mdb-reader module...');
try {
  const MDBReader = require('mdb-reader');
  console.log('mdb-reader module loaded successfully.');
  console.log(MDBReader);
} catch (e) {
  console.error('Failed to load mdb-reader module:', e);
}
