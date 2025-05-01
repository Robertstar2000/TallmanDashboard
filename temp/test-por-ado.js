// Quick node-adodb test script
const ADODB = require('node-adodb');
ADODB.Promises = true;

const connString = 'Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\BobM\\Desktop\\POR.mdb;Persist Security Info=False;';
const connection = ADODB.open(connString, true);

(async () => {
  try {
    const data = await connection.query('SELECT 1 AS value');
    console.log('Test result:', data);
  } catch (err) {
    console.error('ADO test error:', err);
    process.exit(1);
  }
})();
