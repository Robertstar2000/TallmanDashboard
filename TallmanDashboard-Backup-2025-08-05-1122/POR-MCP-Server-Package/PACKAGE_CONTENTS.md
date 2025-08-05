# POR MCP Server Package Contents

## Package Information
- **Version**: 1.0
- **Target Platform**: Windows with Node.js
- **Database**: POR MS Access (.mdb/.accdb)

## Included Files

### Core Server Files
- `src/index.ts` - Main MCP server source code
- `build/index.js` - Compiled JavaScript server (ready to run)
- `build/index.d.ts` - TypeScript definitions
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Configuration Files
- `.env.example` - Template for environment setup
- `package-lock.json` - Locked dependency versions

### Documentation
- `README.md` - Complete installation and usage guide
- `QUICK_START.md` - 8-minute setup guide
- `PACKAGE_CONTENTS.md` - This file

### Installation Scripts
- `install.bat` - Automated Windows installation script

## Features Included

### Security Features
✅ **Write Protection** - Blocks INSERT, UPDATE, DELETE, DROP, etc.
✅ **Rate Limiting** - 30-second delays between requests
✅ **Read-Only Queries** - All queries executed with read-only intent
✅ **File Access Control** - Secure MS Access database connectivity

### MCP Tools
✅ **execute_query** - Run SELECT queries against POR database
✅ **get_version** - Get database version and connection info
✅ **list_tables** - List all available tables
✅ **describe_table** - Get column information for tables

### Database Support
✅ **MS Access Connectivity** - Uses mdb-reader for reliable connections
✅ **Multiple Formats** - Supports .mdb and .accdb files
✅ **Network Support** - Can access databases on network shares
✅ **Error Handling** - Comprehensive error reporting and logging

## Installation Requirements

### System Requirements
- Windows 10/11 or Windows Server 2016+
- Node.js 18.0 or higher
- Access to POR MS Access database file

### POR Database Requirements
- POR system with MS Access backend (.mdb or .accdb)
- Read access to the database file
- Database file not exclusively locked by MS Access

### Claude/Cline Requirements
- Claude Desktop or Cline VS Code extension
- MCP support enabled
- Write access to MCP configuration file

## What's NOT Included

❌ **Node.js Runtime** - Must be installed separately
❌ **POR Database** - Must be accessible on your system
❌ **MS Access Runtime** - Not required (uses mdb-reader)
❌ **Database Credentials** - File path configuration only

## Post-Installation Steps

1. **Install Dependencies**: Run `npm install` or use `install.bat`
2. **Configure Environment**: Copy `.env.example` to `.env` and set POR_DB_PATH
3. **Verify Database Access**: Ensure POR database file is accessible
4. **Add to Claude**: Update MCP configuration with server path
5. **Test Connection**: Ask Claude to list POR tables

## Support and Troubleshooting

- Check `README.md` for detailed troubleshooting steps
- Verify database file opens in MS Access
- Ensure file is not locked by other applications
- Check Claude console for detailed error messages

## MS Access Database Notes

### Supported Formats
- **Access 97-2003**: .mdb files
- **Access 2007+**: .accdb files

### Performance Considerations
- Local files perform better than network files
- Large databases may have slower query response
- File locking can prevent access

### Common Issues
- **File locked**: Close MS Access before using server
- **Network delays**: Consider copying database locally for better performance
- **Permissions**: Ensure read access to database file

## Version History

- **v1.0** (Initial Release)
  - Read-only POR database access
  - MS Access connectivity with mdb-reader
  - Write protection and rate limiting
  - Complete documentation and installation scripts

## Comparison with P21 Server

| Feature | POR Server | P21 Server |
|---------|------------|------------|
| Database Type | MS Access | SQL Server |
| Connection Method | File-based | ODBC DSN |
| Setup Complexity | Simple (file path) | Moderate (ODBC config) |
| Performance | Good for small DBs | Excellent |
| Network Support | Yes (file shares) | Yes (SQL Server) |
| Security | File-level | Database-level |

---

**Ready to install?** Start with `QUICK_START.md` for the fastest setup experience!
