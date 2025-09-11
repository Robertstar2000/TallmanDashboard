// Temporary test script to verify we can read data from POR.mdb using mdb-reader
// Run with: node temp/por-odbc-test.js
// Does not touch any application code.

import fs from 'node:fs';
import MDBReader from 'mdb-reader';

// Path to the MDB file. Can be overridden via the POR_DB_PATH env var.
const path = process.env.POR_DB_PATH || '\\\\ts03\\POR\\POR.MDB';

// Optional table name to inspect. Defaults to the first user table found.
const TEST_TABLE = process.env.POR_TEST_TABLE;

(async () => {
  console.log('\n=== POR MDB Reader Connectivity Smoke-Test ===');
  console.log('MDB Path :', path);

  // Validate file existence early so the user gets fast feedback.
  if (!fs.existsSync(path)) {
    console.error(`❌ MDB file not found at ${path}`);
    process.exit(1);
  }

  try {
    // Read file into a buffer and create a reader instance.
    const buffer = fs.readFileSync(path);
    const reader = new MDBReader(buffer, { useIsoDateFormat: true });

    // Retrieve all table names, filtering out Access system tables (MSys*).
    const tableNames = reader
      .getTableNames()
      .filter((name) => !/^MSys/i.test(name));

    console.log(`✓ Opened database. Found ${tableNames.length} user tables.`);
    console.table(tableNames);

    // Decide which table to sample.
    const tableName = TEST_TABLE || tableNames[0];
    if (!tableName) {
      console.warn('No user tables found to sample.');
      return;
    }

    console.log(`\nReading first 5 rows from table: ${tableName}`);
    const table = reader.getTable(tableName);
    const rows = table.getData({ rowLimit: 5 });
    console.table(rows);
    console.log(`Returned ${rows.length} rows from ${tableName}.`);
    console.log('✓ Test completed successfully.');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message || err);
    if (err && err.stack) console.error(err.stack);
    process.exitCode = 1;
  }
})();
