import MDBReader from 'mdb-reader';
import fs from 'fs';

const dbPath = 'C:/Users/BobM/Desktop/POR.mdb';

const buffer = fs.readFileSync(dbPath);
const reader = new MDBReader(buffer);

const contractTable = reader.getTable('Contract');
if (!contractTable) {
  console.error('Table Contract not found');
  process.exit(1);
}
const rows = contractTable.getRows({ limit: 5 });
console.log('First 5 rows from Contract');
console.log(rows);
if (rows.length) {
  console.log('Columns:', Object.keys(rows[0]));
}
