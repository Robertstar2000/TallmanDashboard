import MDBReader from 'mdb-reader';
import fs from 'fs';

(async () => {
  try {
    const buffer = fs.readFileSync('C:/Users/BobM/Desktop/POR.mdb');
    const reader = new MDBReader(buffer);
    const tables = reader.getTableNames().filter(name => !/^MSys/i.test(name));
    console.log('User tables:', tables);
  } catch (err) {
    console.error('Failed to list tables:', err);
    process.exit(1);
  }
})();
