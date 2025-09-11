import MDBReader from 'mdb-reader';
import * as fs from 'fs';

(async () => {
  try {
    // Load your MDB file
    const buffer = fs.readFileSync('\\\\ts03\\POR\\POR.MDB');
    const reader = new MDBReader(buffer);

    // Get AccountsReceivable table
    const arTable = reader.getTable('AccountsReceivable');
    const rows = arTable.getData();

    // Date range for previous month
    const now = new Date();
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter records by date
    const filteredRows = rows.filter(row => {
      const invoiceDate = new Date(row.INVDATE);
      return invoiceDate >= firstDayPrevMonth && invoiceDate < firstDayCurrentMonth;
    });

    // Sum INVTOTAL
    const totalAmount = filteredRows.reduce((sum, row) => sum + (parseFloat(row.INVTOTAL) || 0), 0);
    console.log(`Total invoice amount for previous month: $${totalAmount.toFixed(2)}`);
  } catch (err) {
    console.error('Test script failed:', err);
    process.exit(1);
  }
})();
