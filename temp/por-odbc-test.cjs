// CommonJS test script (works when package.json has "type":"module")
const odbc = require('odbc');
const fs = require('fs');

// Adjust path via env var if needed
const path = process.env.POR_DB_PATH || '\\\\ts03\\POR\\POR.MDB';
const testTable = process.env.POR_TEST_TABLE || 'SOMAST';

(async () => {
  console.log('\n=== POR ODBC Connectivity Smoke-Test ===');
  console.log('MDB Path  :', path);
  console.log('Test Table:', testTable);

  // Verify file exists first
  if (!fs.existsSync(path)) {
    console.error('❌ MDB file not found at path');
    process.exit(1);
  }

  const connStr = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=${path};ReadOnly=True;`;
  try {
    const conn = await odbc.connect(connStr);
    console.log('✓ Connected via ODBC');

    const sql = `SELECT TOP 5 * FROM ${testTable}`;
    console.log('Running:', sql);
    const rows = await conn.query(sql);
    console.table(rows);
    console.log(`Fetched ${rows.length} rows.`);

    await conn.close();
    console.log('✓ Connection closed');
  } catch (err) {
    console.error('❌ ODBC test failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  }
})();
