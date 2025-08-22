// ESM diagnostic: list tables via MCP controller
import MCPController from './backend/mcpControllerFixed.js';

async function run() {
  const mcp = new MCPController();
  try {
    console.log('=== MCP list_tables diagnostic ===');

    // Always attempt both servers; server packages load their own .env
    try {
      console.log('\n[POR] Attempting list_tables...');
      const porTables = await mcp.executeListTables('POR');
      console.log(`[POR] Tables (${porTables.length} total):`);
      console.log(JSON.stringify(porTables.slice(0, 30), null, 2));
    } catch (e) {
      console.error('[POR] list_tables failed:', e?.message || e);
    }

    try {
      console.log('\n[P21] Attempting list_tables...');
      const p21Tables = await mcp.executeListTables('P21');
      console.log(`[P21] Tables (${p21Tables.length} total):`);
      console.log(JSON.stringify(p21Tables.slice(0, 30), null, 2));
    } catch (e) {
      console.error('[P21] list_tables failed:', e?.message || e);
    }
  } finally {
    await mcp.cleanup();
  }
}

run().catch(err => {
  console.error('Diagnostic failed:', err?.message || err);
  process.exit(1);
});
