const ADODB = require('node-adodb');
const path = 'C:/Users/BobM/Desktop/POR.mdb';
const connection = ADODB.open(
  `Provider=Microsoft.ACE.OLEDB.16.0;Data Source=${path};Persist Security Info=False;`
);

(async () => {
  try {
    const rows = await connection.query('SELECT TOP 1 * FROM Contract');
    console.log('Sample rows:', rows);
  } catch (err) {
    console.error('POR ACE16 test error:', err);
  }
})();
