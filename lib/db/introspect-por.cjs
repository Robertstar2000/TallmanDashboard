// Introspection script for POR.mdb (Access)
// Usage: node lib/db/introspect-por.cjs <path-to-por.mdb>

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { default: MDBReader } = require('mdb-reader');

const readFile = promisify(fs.readFile);

async function run(mdbPath) {
  const buffer = await readFile(mdbPath);
  const db = new MDBReader(buffer);

  const tables = db.getTableNames();
  for (const tableName of tables) {
    console.log(`\n=== ${tableName} ===`);
    const table = db.getTable(tableName);
    const columns = table.getColumns().map(c => c.name);
    console.log('Columns:');
    console.table(columns);
    if (process.argv.includes('--count')) {
      let rowCount = 0;
      try {
        rowCount = table.getData().length;
      } catch (e) {
        rowCount = -1; // could not load
      }
      console.log(`Row Count: ${rowCount}`);
    }
  }
}

(async () => {
  try {
    if (process.argv.length < 3) {
      throw new Error('Please provide the path to POR.mdb as a CLI argument');
    }
    const mdbPath = path.resolve(process.argv[2]);
    await run(mdbPath);
  } catch (err) {
    console.error('Introspection error:', err);
  }
})();