import MDBReader from 'mdb-reader';
import fs from 'fs';

(async () => {
  try {
    const buffer = fs.readFileSync('\\\\ts03\\POR\\POR.MDB');
    const reader = new MDBReader(buffer);
    const tableNames = reader.getTableNames().filter(name => !/^MSys/i.test(name));
    const nonZeroTables = [];

    for (const tableName of tableNames) {
      const table = reader.getTable(tableName);
      const rows = table.getData();
      let foundNonZero = false;

      for (const row of rows) {
        for (const key of Object.keys(row)) {
          const val = row[key];
          const num = typeof val === 'number' ? val : parseFloat(val);
          if (!isNaN(num) && num !== 0) {
            foundNonZero = true;
            break;
          }
        }
        if (foundNonZero) break;
      }

      if (foundNonZero) {
        nonZeroTables.push(tableName);
      }
    }

    console.log('Tables with non-zero values:');
    console.log(JSON.stringify(nonZeroTables, null, 2));
  } catch (err) {
    console.error('Error scanning tables:', err);
    process.exit(1);
  }
})();
