# P21 MCP Server

A Model Context Protocol (MCP) server that provides secure, read-only access to P21 ERP databases for AI assistants like Claude.

## Features

- **Read-Only Access**: Built-in write protection prevents any data modification
- **Rate Limiting**: 1-second delays between requests to protect database performance
- **ODBC Connectivity**: Uses ODBC for reliable database connections
- **MCP Protocol**: Compatible with Claude and other MCP-enabled AI assistants
- **SQL Server Support**: Optimized for P21 SQL Server databases

## Available Tools

1. **execute_query**: Execute read-only SQL queries against the P21 database
2. **get_version**: Get database version and connection information
3. **list_tables**: List all available tables in the database
4. **describe_table**: Get column information for specific tables

## Prerequisites

- Node.js 18 or higher
- ODBC driver for SQL Server
- P21 database access credentials
- Configured ODBC DSN for your P21 database

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

### 1. Environment Variables

Create or edit the `.env` file in the package root:

```env
# P21 Database Configuration
P21_DSN=YourP21DSNName
```

### 2. ODBC DSN Setup

You need to create an ODBC DSN (Data Source Name) for your P21 database:

**Windows:**
1. Open "ODBC Data Sources" from Control Panel or Windows Administrative Tools
2. Go to "System DSN" tab
3. Click "Add" and select "SQL Server" or "ODBC Driver for SQL Server"
4. Configure with your P21 database details:
   - Name: (use this as P21_DSN value)
   - Server: Your P21 SQL Server instance
   - Database: Your P21 database name
   - Authentication: SQL Server or Windows Authentication

**Example DSN Configuration:**
- Name: `P21_PROD`
- Server: `10.10.20.13\SQLEXPRESS`
- Database: `P21`
- Authentication: SQL Server Authentication

Then set in `.env`:
```env
P21_DSN=P21_PROD
```

## Usage with Claude (Cline)

### 1. Add to MCP Settings

Add this server to your Claude MCP configuration file:

**Location:** `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "p21-server": {
      "command": "node",
      "args": ["C:\\path\\to\\P21-MCP-Server-Package\\build\\index.js"],
      "env": {}
    }
  }
}
```

### 2. Restart Claude

Restart Claude/Cline to load the new MCP server.

### 3. Test Connection

You can test the connection by asking Claude to:
- "List the tables in the P21 database"
- "Get the version of the P21 database"
- "Show me the structure of the customer table"

## Security Features

### Write Protection

The server automatically blocks any SQL statements that could modify data:
- INSERT, UPDATE, DELETE
- DROP, CREATE, ALTER
- TRUNCATE, MERGE, REPLACE
- EXEC, EXECUTE

### Rate Limiting

- 1-second minimum delay between requests
- Prevents database overload
- Protects production systems

### Read-Only Queries

All queries are executed with read-only intent and include NOLOCK hints where appropriate.

## Example Queries

```sql
-- Get customer count
SELECT COUNT(*) as customer_count FROM P21.dbo.customer WITH (NOLOCK)

-- Get recent orders
SELECT TOP 10 order_no, customer_id, order_date, order_amt 
FROM P21.dbo.oe_hdr WITH (NOLOCK) 
ORDER BY order_date DESC

-- Get inventory summary
SELECT location_id, COUNT(*) as item_count, SUM(qty_on_hand) as total_qty
FROM P21.dbo.inv_mast WITH (NOLOCK)
GROUP BY location_id
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Verify ODBC DSN is configured correctly
   - Test DSN connection using ODBC Data Source Administrator
   - Check network connectivity to SQL Server
   - Verify database credentials

2. **"P21_DSN environment variable is required"**
   - Ensure `.env` file exists in package root
   - Verify P21_DSN is set correctly
   - Restart the MCP server after changes

3. **"Rate limiting" messages**
   - This is normal behavior to protect the database
   - Wait for the specified time before next request

4. **"Write operation blocked"**
   - This is a security feature
   - Only SELECT queries are allowed
   - Modify your query to be read-only

### Debugging

Enable debug logging by setting environment variable:
```env
DEBUG=p21-server
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

## Support

For issues related to:
- P21 database connectivity: Contact your P21 administrator
- ODBC configuration: Check Microsoft ODBC documentation
- MCP integration: Refer to Claude/Cline documentation

## License

This MCP server is provided as-is for integration with P21 ERP systems. Ensure you have proper authorization to access your P21 database before use.

## Version History

- v0.1.0: Initial release with read-only P21 database access
- Added write protection and rate limiting
- ODBC connectivity with SQL Server support
