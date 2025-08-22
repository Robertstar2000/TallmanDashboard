#!/usr/bin/env node
/*
  Normalize allData.json initial values:
  - Backup existing file with timestamp
  - Set metric.value to 0 when it's exactly 99999 (number or string)
  - Leave other fields intact
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'allData.json');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

(function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`allData.json not found at ${FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(FILE, 'utf8').replace(/^\uFEFF/, '').trim();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse allData.json:', e.message);
    process.exit(1);
  }

  const backupName = path.join(ROOT, `allData.json.${timestamp()}.pre-normalize.bak`);
  fs.writeFileSync(backupName, raw, 'utf8');
  console.log(`Backup created: ${backupName}`);

  let changed = 0;
  const normalizeValue = (v) => {
    if (typeof v === 'number' && v === 99999) return 0;
    if (typeof v === 'string' && v.trim() === '99999') return '0';
    return v;
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && Object.prototype.hasOwnProperty.call(item, 'value')) {
        const nv = normalizeValue(item.value);
        if (nv !== item.value) {
          item.value = nv;
          changed++;
        }
      }
    }
  } else if (data && typeof data === 'object') {
    // Fallback: walk shallow arrays under known keys
    for (const k of Object.keys(data)) {
      const arr = data[k];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && Object.prototype.hasOwnProperty.call(item, 'value')) {
            const nv = normalizeValue(item.value);
            if (nv !== item.value) {
              item.value = nv;
              changed++;
            }
          }
        }
      }
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Normalization complete. Updated ${changed} value field(s) to 0.`);
})();
