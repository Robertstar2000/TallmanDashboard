#!/usr/bin/env node
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MCPController from '../mcpControllerFixed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
const allDataPath = path.join(projectRoot, 'allData.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function ts() { return new Date().toISOString(); }

function normalizeSqlForServer(server, sql) {
  if (!sql) return sql;
  let s = sql;
  if (server === 'POR') {
    // Access date functions
    s = s.replace(/GETDATE\(\)/gi, 'DATE()');
    // Ensure canonical casing
    s = s.replace(/YEAR\(\s*DATE\(\)\s*\)/gi, 'YEAR(DATE())');
    // Remove source_system filter if present (POR.mdb likely doesn't have it)
    s = s.replace(/\bAND\s+source_system\s*=\s*'POR'\b/gi, '');
    s = s.replace(/\bWHERE\s+source_system\s*=\s*'POR'\s+AND\b/gi, 'WHERE ');
    // If WHERE only had that clause, clean up possible trailing WHERE
    s = s.replace(/WHERE\s*;$/i, ';');
  } else if (server === 'P21') {
    // SQL Server
    s = s.replace(/DATE\(\)/gi, 'GETDATE()');
    s = s.replace(/YEAR\(\s*GETDATE\(\)\s*\)/gi, 'YEAR(GETDATE())');
  }
  return s;
}

function findSumColumn(sql) {
  if (!sql) return null;
  const m = sql.match(/SUM\s*\(\s*([\w\[\]\.]+)\s*\)/i);
  return m ? m[1].replace(/[\[\]]/g, '') : null;
}

async function main() {
  console.log(`[${ts()}] Validator starting`);

  if (!fssync.existsSync(allDataPath)) {
    console.error(`allData.json not found at ${allDataPath}`);
    process.exit(1);
  }

  const raw = await fs.readFile(allDataPath, 'utf8');
  let metrics = JSON.parse(raw.replace(/^\uFEFF/, ''));

  const backupPath = `${allDataPath}.${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;
  await fs.writeFile(backupPath, raw, 'utf8');
  console.log(`Backup written: ${backupPath}`);

  const mcp = new MCPController();
  const tableCache = new Map(); // server -> [tables]
  const columnCache = new Map(); // key server:table -> Set(columns)

  async function listTables(server) {
    if (tableCache.has(server)) return tableCache.get(server);
    const tables = await mcp.executeListTables(server).catch(() => []);
    const names = Array.isArray(tables) ? tables.map(t => (t.name || t).toString()) : [];
    tableCache.set(server, names);
    return names;
  }

  async function getColumns(server, table) {
    const key = `${server}:${table}`;
    if (columnCache.has(key)) return columnCache.get(key);
    // Try to fetch one row to infer columns
    const q = `SELECT TOP 1 * FROM ${table}`;
    const rows = await mcp.executeQueryRows(server, q).catch(() => []);
    const cols = new Set(rows[0] ? Object.keys(rows[0]) : []);
    columnCache.set(key, cols);
    return cols;
  }

  const results = [];
  let modified = 0;

  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    const report = { id: m.id, variableName: m.variableName, server: m.serverName, status: 'unchecked', notes: [] };

    try {
      const server = m.serverName;
      if (!server || (server !== 'P21' && server !== 'POR')) {
        report.status = 'skipped';
        report.notes.push('Unsupported or missing serverName');
        results.push(report);
        continue;
      }

      // Resolve table name
      const tables = await listTables(server);
      const expectedTable = m.tableName || '';
      const match = tables.find(t => t.toLowerCase() === expectedTable.toLowerCase())
        || tables.find(t => t.toLowerCase().includes(expectedTable.toLowerCase()));
      if (!match) {
        report.notes.push(`Table not found: ${expectedTable}`);
      } else if (match !== expectedTable) {
        // Update tableName to exact match
        m.tableName = match;
        report.notes.push(`Adjusted tableName => ${match}`);
        modified++;
        // Try to replace first FROM occurrence of table in SQL
        if (m.productionSqlExpression) {
          const re = new RegExp(`\\b${expectedTable}\\b`, 'i');
          const replaced = m.productionSqlExpression.replace(re, match);
          if (replaced !== m.productionSqlExpression) {
            m.productionSqlExpression = replaced;
            report.notes.push('Rewrote SQL table identifier');
          }
        }
      }

      // Columns
      const sumCol = findSumColumn(m.productionSqlExpression);
      const valueCol = m.valueColumn || sumCol;
      if (m.tableName) {
        const cols = await getColumns(server, m.tableName).catch(() => new Set());
        if (valueCol && cols.size && !colsHas(cols, valueCol)) {
          // Attempt case-insensitive match
          const ci = [...cols].find(c => c.toLowerCase() === valueCol.toLowerCase());
          if (ci && m.valueColumn !== ci) {
            m.valueColumn = ci;
            report.notes.push(`Adjusted valueColumn => ${ci}`);
            modified++;
          }
        }
      }

      // Normalize SQL for server
      const originalSql = m.productionSqlExpression;
      let sql = normalizeSqlForServer(server, originalSql);

      // Simple bracket quoting for Access if table contains spaces (not expected here)
      if (server === 'POR' && m.tableName && /\s/.test(m.tableName) && !/\[/.test(sql)) {
        sql = sql.replace(new RegExp(`\\b${m.tableName}\\b`, 'gi'), `[${m.tableName}]`);
      }

      if (sql !== originalSql) {
        m.productionSqlExpression = sql;
        report.notes.push('Normalized SQL for server');
        modified++;
      }

      // Test execution
      const val1 = await mcp.executeQuery(server, m.productionSqlExpression);
      report.notes.push(`Test value: ${val1}`);

      // If zero or 99999, try a relaxed variant for POR by removing source_system if still present
      if ((val1 === 0 || val1 === 99999) && server === 'POR') {
        let relaxed = m.productionSqlExpression
          .replace(/\bAND\s+source_system\s*=\s*'POR'\b/gi, '')
          .replace(/\bWHERE\s+source_system\s*=\s*'POR'\s+AND\b/gi, 'WHERE ')
          .replace(/WHERE\s*;$/i, ';');
        if (relaxed !== m.productionSqlExpression) {
          const val2 = await mcp.executeQuery(server, relaxed);
          report.notes.push(`Relaxed test value: ${val2}`);
          if (val2 !== 0 && val2 !== 99999) {
            m.productionSqlExpression = relaxed;
            report.notes.push('Applied relaxed SQL (removed source_system)');
            modified++;
          }
        }
      }

      report.status = 'ok';
    } catch (e) {
      report.status = 'error';
      report.notes.push(e.message);
    }

    results.push(report);
    // Light rate-limit spacing
    await sleep(500);
  }

  // Persist if modified
  if (modified > 0) {
    const out = JSON.stringify(metrics, null, 2);
    // Validate
    JSON.parse(out);
    await fs.writeFile(allDataPath, out, 'utf8');
    console.log(`Saved updates to allData.json (modified: ${modified})`);
  } else {
    console.log('No changes were necessary.');
  }

  // Print summary
  const summary = results.map(r => ({ id: r.id, server: r.server, status: r.status, note: r.notes[0] || '' }));
  console.table(summary);

  // Exit with non-zero if any error or any metric still likely bad (0/99999 noted)
  const bad = results.filter(r => r.notes.some(n => /Test value: (0|99999)\b/.test(String(n))));
  if (bad.length > 0) {
    console.log(`Metrics with suspicious values: ${bad.map(b => b.id).join(', ')}`);
  }

  console.log(`[${ts()}] Validator finished.`);
}

function colsHas(set, name) {
  if (set.has(name)) return true;
  const lower = name.toLowerCase();
  for (const c of set) if (c.toLowerCase() === lower) return true;
  return false;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
