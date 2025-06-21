import fs from 'fs';
import path from 'path';
import MDBReader from 'mdb-reader';

/**
 * Reads daily sales values from POR MDB file. Expects a table 'TotalsDaily' with column 'ALL'.
 * Returns an array of numbers, one per row (day).
 */
export async function getPORDailySales(porPath: string): Promise<number[]> {
  let filePath = porPath;
  if (!filePath) {
    throw new Error('POR path is required');
  }
  // If directory, pick latest .mdb
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const mdbs = fs.readdirSync(filePath)
      .filter(f => f.toLowerCase().endsWith('.mdb'))
      .map(f => path.join(filePath, f));
    if (!mdbs.length) throw new Error(`No .mdb in ${filePath}`);
    mdbs.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    filePath = mdbs[0];
  }
  const buf = fs.readFileSync(filePath);
  const reader = new MDBReader(buf);
  const table = reader.getTable('TotalsDaily');
  const rows = table.getData();
  const cols = table.getColumnNames();
  const idx = cols.indexOf('ALL');
  if (idx < 0) throw new Error("Column 'ALL' not found");
  const values: number[] = rows.map(r => Array.isArray(r) ? Number(r[idx]) : Number((r as any)['ALL']));
  return values;
}
