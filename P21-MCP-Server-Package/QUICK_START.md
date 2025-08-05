# Quick Start Guide - P21 MCP Server

## 1. Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ ODBC Driver for SQL Server installed
- ✅ P21 database access credentials
- ✅ Claude/Cline installed

## 2. Installation (5 minutes)

### Option A: Automated Installation
1. Double-click `install.bat`
2. Follow the prompts

### Option B: Manual Installation
```bash
npm install
npm run build
```

## 3. Configuration (2 minutes)

### Step 1: Create Environment File
1. Copy `.env.example` to `.env`
2. Edit `.env` and set your DSN name:
   ```
   P21_DSN=YourDSNName
   ```

### Step 2: Create ODBC DSN
1. Open "ODBC Data Sources (64-bit)" from Windows Start Menu
2. Go to "System DSN" tab
3. Click "Add" → Select "ODBC Driver 17 for SQL Server"
4. Configure:
   - **Name**: `YourDSNName` (same as in .env)
   - **Server**: Your P21 SQL Server (e.g., `10.10.20.13\SQLEXPRESS`)
   - **Database**: Your P21 database name
5. Test connection and save

## 4. Add to Claude (1 minute)

1. Open: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

2. Add this server:
```json
{
  "mcpServers": {
    "p21-server": {
      "command": "node",
      "args": ["C:\\FULL\\PATH\\TO\\P21-MCP-Server-Package\\build\\index.js"],
      "env": {}
    }
  }
}
```

3. **Important**: Replace `C:\\FULL\\PATH\\TO\\` with the actual path to this package

4. Restart Claude/Cline

## 5. Test (30 seconds)

Ask Claude:
- "List the tables in the P21 database"
- "Get the P21 database version"

## Troubleshooting

### "Cannot find DSN"
- Verify DSN name matches exactly in both ODBC and .env
- Use "System DSN" not "User DSN"

### "Path not found"
- Use full absolute path in MCP settings
- Use double backslashes `\\` in JSON

### "Permission denied"
- Run ODBC Data Sources as Administrator
- Verify database user has SELECT permissions

## Example Queries to Try

```sql
-- Customer count
SELECT COUNT(*) FROM customer

-- Recent orders
SELECT TOP 5 order_no, customer_id, order_date 
FROM oe_hdr 
ORDER BY order_date DESC

-- Inventory locations
SELECT DISTINCT location_id FROM inv_mast
```

## Need Help?

1. Check the full README.md for detailed instructions
2. Verify ODBC connection using "Test Data Source" button
3. Check Claude console for error messages
4. Ensure P21 database is accessible from your machine

---

**Total Setup Time: ~8 minutes**
