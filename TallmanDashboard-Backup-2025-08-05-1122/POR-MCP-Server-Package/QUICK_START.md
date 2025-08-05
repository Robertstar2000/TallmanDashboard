# Quick Start Guide - POR MCP Server

## 1. Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ POR database file (.mdb or .accdb) accessible
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
2. Edit `.env` and set your database path:
   ```
   POR_DB_PATH=C:\path\to\your\por\database.mdb
   ```

### Step 2: Verify Database Access
Make sure you can access the POR database file:
- **Local file**: Ensure file exists and you have read permissions
- **Network file**: Test network connectivity and file access
- **File not locked**: Close MS Access if it's open on the database

## 4. Add to Claude (1 minute)

1. Open: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

2. Add this server:
```json
{
  "mcpServers": {
    "por-server": {
      "command": "node",
      "args": ["C:\\FULL\\PATH\\TO\\POR-MCP-Server-Package\\build\\index.js"],
      "env": {}
    }
  }
}
```

3. **Important**: Replace `C:\\FULL\\PATH\\TO\\` with the actual path to this package

4. Restart Claude/Cline

## 5. Test (30 seconds)

Ask Claude:
- "List the tables in the POR database"
- "Get the POR database version"

## Troubleshooting

### "Cannot connect to database"
- Verify POR_DB_PATH points to correct file
- Check file permissions (read access required)
- Ensure database file is not locked by MS Access
- Test network connectivity if using network path

### "POR_DB_PATH environment variable is required"
- Verify `.env` file exists in package root
- Check POR_DB_PATH is set correctly
- Restart Claude after changes

### "Path not found"
- Use full absolute path in MCP settings
- Use double backslashes `\\` in JSON
- Verify package location is correct

### "File not found" or "Access denied"
- Check if database file exists at specified path
- Verify read permissions on the database file
- Close MS Access if it has the file open
- Try copying database to local drive for testing

## Example Database Paths

```env
# Local file
POR_DB_PATH=C:\POR\Database\POR.mdb

# Network share
POR_DB_PATH=\\server\share\POR\POR.accdb

# Relative path (from server directory)
POR_DB_PATH=./data/POR.mdb
```

## Example Queries to Try

```sql
-- Table count
SELECT COUNT(*) as table_count FROM MSysObjects WHERE Type=1

-- Get all table names (if MSysObjects is accessible)
SELECT Name FROM MSysObjects WHERE Type=1 AND Name NOT LIKE 'MSys*'

-- Sample data from a table (replace TableName)
SELECT TOP 5 * FROM TableName
```

## MS Access Notes

### Supported Formats
- .mdb files (Access 97-2003)
- .accdb files (Access 2007+)

### Common Issues
- **File locking**: Close MS Access before using server
- **Network delays**: Local files perform better than network files
- **Permissions**: Ensure read access to database file
- **File corruption**: Verify database opens in MS Access

## Need Help?

1. Check the full README.md for detailed instructions
2. Verify database file opens in MS Access
3. Test file path in Windows Explorer
4. Check Claude console for error messages
5. Ensure database file is not exclusively locked

---

**Total Setup Time: ~8 minutes**
