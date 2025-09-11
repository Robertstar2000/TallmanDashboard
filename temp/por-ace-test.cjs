const ADODB = require('node-adodb');
const path = '\\\\ts03\\POR\\POR.MDB';
const connection = ADODB.open(
  `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${path};Persist Security Info=False;`
);

(async () => {
  try {
    const rows = await connection.query('SELECT COUNT(*) AS cnt FROM Contract');
    console.log('Contract count:', rows);
  } catch (err) {
    console.error('POR ACE test error:', err);
  }
})();
