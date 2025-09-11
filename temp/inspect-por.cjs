const ADODB = require('node-adodb');
const path = '\\\\ts03\\POR\\POR.MDB';
const connection = ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${path};Persist Security Info=False;`);

(async () => {
  try {
    const tables = await connection.schema(20);
    console.log('Tables count:', tables.length);
    const sample = await connection.query('SELECT TOP 5 * FROM Contract');
    console.log('Sample Contract rows');
    console.table(sample);
    if (sample.length) {
      console.log('Columns', Object.keys(sample[0]));
    }
  } catch (e) {
    console.error(e);
  }
})();
