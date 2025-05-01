import MDBReader from 'mdb-reader';
import fs from 'fs';

(async () => {
  try {
    const buffer = fs.readFileSync('C:/Users/BobM/Desktop/POR.mdb');
    const reader = new MDBReader(buffer);
    const table = reader.getTable('AccountsReceivable');
    const rows = table.getData();

    const nonZero = rows.filter(r => parseFloat(r.INVTOTAL) > 0);
    console.log(`Rows with INVTOTAL > 0: ${nonZero.length}`);
    if (nonZero.length > 0) console.table(nonZero.slice(0, 10));
  } catch (err) {
    console.error('Error checking non-zero values:', err);
    process.exit(1);
  }
})();
