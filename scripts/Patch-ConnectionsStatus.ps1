$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path $root 'backend\server.js'

if (!(Test-Path $serverPath)) {
  throw "server.js not found at $serverPath"
}

# Backup original
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = "$serverPath.$timestamp.bak"
Copy-Item $serverPath $backupPath -Force

$content = Get-Content -Raw -Path $serverPath

# 1) Replace checkMCPStatus implementation with timeout and value validation
$pattern1 = 'const checkMCPStatus = async \(serverName\) => \{[\s\S]*?\r?\n\s*\};'
$replacement1 = @"
const checkMCPStatus = async (serverName) => {
  try {
    console.log(`🔍 Checking MCP status for ${serverName.toUpperCase()}...`);
    const serverConfigs = {
      'p21': {
        name: 'P21',
        server: 'P21-MCP-Server',
        database: 'P21',
        type: 'SQL Server via MCP'
      },
      'por': {
        name: 'POR',
        server: 'POR-MCP-Server', 
        database: 'POR',
        type: 'MS Access via MCP'
      }
    };

    const config = serverConfigs[serverName];
    if (!config) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    const withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      promise.then(v => { clearTimeout(t); resolve(v); }).catch(err => { clearTimeout(t); reject(err); });
    });

    const start = Date.now();
    const isPor = serverName.toLowerCase() === 'por';
    const testQuery = isPor ? 'SELECT 42 as value' : 'SELECT 1 as value';
    const value = await withTimeout(
      mcpController.executeQuery(serverName.toUpperCase(), testQuery),
      15000,
      `${serverName.toUpperCase()} MCP status`
    );

    if (typeof value !== 'number' || !isFinite(value) || value === 99999) {
      throw new Error(`MCP test query returned invalid value: ${value}`);
    }

    const elapsed = Date.now() - start;
    console.log(`✅ MCP ${serverName.toUpperCase()} connection successful in ${elapsed} ms`);
    return {
      status: 'Connected',
      config,
      version: config.type,
      responseTime: elapsed
    };
  } catch (error) {
    console.error(`❌ MCP status check failed for ${serverName}:`, error.message);
    return {
      status: 'Disconnected',
      error: error.message,
      config: {
        type: 'MCP Server',
        server: `${serverName.toUpperCase()} Database`
      }
    };
  }
};
"@
$replacement1 = $replacement1 -replace '\$', '$$'

$contentNew = [regex]::Replace($content, $pattern1, $replacement1, [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($contentNew -eq $content) { throw "Failed to patch checkMCPStatus; pattern not found." }
$content = $contentNew

# 2) Replace /api/connections/status route to parallelize and include error field
$pattern2 = "app.get\('/api/connections/status',[\s\S]*?\r?\n\s*\}\);"
$replacement2 = @"
app.get('/api/connections/status', async (req, res) => {
  try {
    const [p21Result, porResult] = await Promise.allSettled([
      checkMCPStatus('p21'),
      checkMCPStatus('por')
    ]);

    const unwrap = (prettyName, result) => {
      const statusObj = result.status === 'fulfilled'
        ? result.value
        : { status: 'Disconnected', error: (result.reason && result.reason.message) || 'Unknown error', config: { type: 'MCP Server', server: `${prettyName} Database` } };
      const isConnected = statusObj.status === 'Connected';
      return {
        name: prettyName,
        status: statusObj.status,
        details: isConnected ? `${statusObj.config.type} (${statusObj.config.server})` : undefined,
        error: !isConnected ? statusObj.error : undefined,
        version: statusObj.version || (statusObj.config && statusObj.config.type) || 'Unknown',
        identifier: (statusObj.config && statusObj.config.server) || 'Unknown',
        responseTime: isConnected ? (statusObj.responseTime ?? null) : null
      };
    };

    const connections = [
      unwrap('P21', p21Result),
      unwrap('POR', porResult)
    ];

    res.json(connections);
  } catch (error) {
    console.error('Connection status error:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});
"@
$replacement2 = $replacement2 -replace '\$', '$$'

$contentNew = [regex]::Replace($content, $pattern2, $replacement2, [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($contentNew -eq $content) { throw "Failed to patch /api/connections/status route; pattern not found." }

Set-Content -Path $serverPath -Value $contentNew -Encoding UTF8
Write-Host "Patched backend/server.js successfully. Backup: $backupPath"
