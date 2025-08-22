console.log('Attempting to load ODBC module...');
try {
  const odbc = require('odbc');
  console.log('ODBC module loaded successfully.');
  console.log(odbc);
} catch (e) {
  console.error('Failed to load ODBC module:', e);
}
