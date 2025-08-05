# POR MCP Server

A Model Context Protocol (MCP) server that provides secure, read-only access to POR (MS Access) databases for AI assistants like Claude.

## Features

- **Read-Only Access**: Built-in write protection prevents any data modification
- **Rate Limiting**: 30-second delays between requests to protect database performance
- **MS Access Connectivity**: Uses mdb-reader for reliable Access database connections
- **MCP Protocol**: Compatible with Claude and other MCP-enabled AI assistants
- **MS Access Support**: Optimized for POR MS Access databases

## Available Tools

1. **execute_query**: Execute read-only SQL queries against the POR database
2. **get_version**: Get database version and connection information
3. **list_tables**: List all available tables in the database
4. **describe_table**: Get column information for specific tables

## Prerequisites

- Node.js 18 or higher
- POR database access (MS Access .mdb or .accdb file)
- Network or local access to the POR database file

## Installation

1. Extract this package to your desired location
2. Open a terminal in the package directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure your environment (see Configuration section)
5. Build the server:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create or edit the `.env` file in the package root:

```env
# POR Database Configuration
POR_DB_PATH=C:\path\to\your\por\database.mdb
```

### Database Path Setup

The POR_DB_PATH should point to your POR MS Access database file:

**Examples:**
```env
# Local file
POR_DB_PATH=C:\POR\Database\POR.mdb

# Network share
POR_DB_PATH=\\server\share\POR\POR.accdb

# Relative path (from server directory)
POR_DB_PATH=./data/POR.mdb
```

## Usage with Claude (Cline)

### 1. Add to MCP Settings

Add this server to your Claude MCP configuration file:

**Location:** `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "por-server": {
      "command": "node",
      "args": ["C:\\path\\to\\POR-MCP-Server-Package\\build\\index.js"],
      "env": {}
    }
  }
}
```

### 2. Restart Claude

Restart Claude/Cline to load the new MCP server.

### 3. Test Connection

You can test the connection by asking Claude to:
- "List the tables in the POR database"
- "Get the version of the POR database"
- "Show me the structure of a specific table"

## Security Features

### Write Protection

The server automatically blocks any SQL statements that could modify data:
- INSERT, UPDATE, DELETE
- DROP, CREATE, ALTER
- TRUNCATE, MERGE, REPLACE

### Rate Limiting

- 30-second minimum delay between requests
- Prevents database overload
- Protects production systems

### Read-Only Queries

All queries are executed with read-only intent to prevent accidental data modification.

## Example Queries

```sql
-- Get record count from a table
SELECT COUNT(*) as record_count FROM TableName

-- Get recent records (if date field exists)
SELECT TOP 10 * FROM TableName ORDER BY DateField DESC

-- Get unique values from a field
SELECT DISTINCT FieldName FROM TableName
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Verify POR_DB_PATH points to correct file
   - Check file permissions and accessibility
   - Ensure database file is not locked by another application
   - Verify network connectivity if using network path

2. **"POR_DB_PATH environment variable is required"**
   - Ensure `.env` file exists in package root
   - Verify POR_DB_PATH is set correctly
   - Restart the MCP server after changes

3. **"Rate limiting" messages**
   - This is normal behavior to protect the database
   - Wait for the specified time before next request

4. **"Write operation blocked"**
   - This is a security feature
   - Only SELECT queries are allowed
   - Modify your query to be read-only

5. **"File not found" or "Access denied"**
   - Check if database file exists at specified path
   - Verify read permissions on the database file
   - Ensure no other applications have exclusive lock

### Debugging

Enable debug logging by setting environment variable:
```env
DEBUG=por-server
```

Check the console output for detailed error messages and connection status.

## Development

### Building from Source

```bash
npm run build
```

### Running in Development

```bash
npm run dev
```

### Testing

```bash
# Test basic connectivity
node build/index.js
```

## MS Access Database Notes

### Supported Formats
- .mdb files (Access 97-2003)
- .accdb files (Access 2007+)

### Performance Considerations
- MS Access databases have connection limits
- Large queries may take longer than SQL Server
- Consider database size and complexity when querying

### File Locking
- Ensure database is not exclusively locked
- Close Access application before using server
- Network databases may have additional restrictions

## Support

For issues related to:
- POR database connectivity: Contact your POR administrator
- MS Access file access: Check Windows file permissions
- MCP integration: Refer to Claude/Cline documentation

## License

This MCP server is provided as-is for integration with POR systems. Ensure you have proper authorization to access your POR database before use.

## Version History

- v0.1.0: Initial release with read-only POR database access
- Added write protection and rate limiting
- MS Access connectivity with mdb-reader support
