const ADODB = require('node-adodb');
const dbPath = '\\\\ts03\\POR\\POR.MDB';
const connection = ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`);

(async () => {
  try {
    const rows = await connection.query('SELECT TOP 5 * FROM Contract');
    console.log('Sample rows from Contract:');
    console.table(rows);
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
    }
    const [{ cnt }] = await connection.query('SELECT COUNT(*) AS cnt FROM Contract');
    console.log('Total rows in Contract:', cnt);
  } catch (err) {
    console.error('Error querying Contract table:', err);
  }
})();
