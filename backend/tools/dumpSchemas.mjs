#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import MCPController from '../mcpControllerFixed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');

function ts() { return new Date().toISOString(); }

async function listTablesSafe(mcp, server) {
  try {
    const tables = await mcp.executeListTables(server);
    if (!Array.isArray(tables)) return [];
    return tables.map(t => (t?.name ?? t)?.toString()).filter(Boolean);
  } catch (e) {
    console.error(`[${ts()}] Failed to list tables for ${server}: ${e.message}`);
    return [];
  }
}

async function getColumnsSafe(mcp, server, table) {
  try {
    const q = `SELECT TOP 1 * FROM ${table}`;
    const rows = await mcp.executeQueryRows(server, q);
    if (Array.isArray(rows) && rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
      return Object.keys(rows[0]);
    }
    return [];
  } catch (e) {
    console.warn(`[${ts()}] Could not infer columns for ${server}.${table}: ${e.message}`);
    return [];
  }
}

async function dumpServerSchema(server) {
  const mcp = new MCPController();
  console.log(`[${ts()}] ${server}: listing tables...`);
  const tables = await listTablesSafe(mcp, server);
  console.log(`[${ts()}] ${server}: found ${tables.length} tables`);

  const schema = { server, generatedAt: ts(), tables: {} };

  for (const t of tables) {
    console.log(`[${ts()}] ${server}: probing columns for ${t}...`);
    const cols = await getColumnsSafe(mcp, server, t);
    schema.tables[t] = cols;
  }

  const outPath = path.join(projectRoot, `schemas-${server}.json`);
  await fs.writeFile(outPath, JSON.stringify(schema, null, 2), 'utf8');
  console.log(`[${ts()}] ${server}: schema written to ${outPath}`);
}

async function main() {
  console.log(`[${ts()}] Schema dump starting`);
  for (const server of ['P21', 'POR']) {
    await dumpServerSchema(server);
  }
  console.log(`[${ts()}] Schema dump finished`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
