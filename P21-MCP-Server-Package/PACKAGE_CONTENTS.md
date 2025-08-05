# P21 MCP Server Package Contents

## Package Information
- **Version**: 1.0
- **Package Size**: ~29 KB (compressed)
- **Target Platform**: Windows with Node.js
- **Database**: P21 ERP SQL Server

## Included Files

### Core Server Files
- `src/index.ts` - Main MCP server source code
- `build/index.js` - Compiled JavaScript server (ready to run)
- `build/index.d.ts` - TypeScript definitions
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Configuration Files
- `.env` - Environment configuration (with sample P21_DSN)
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
✅ **Read-Only Queries** - All queries executed with NOLOCK hints
✅ **SQL Injection Protection** - Parameterized queries where applicable

### MCP Tools
✅ **execute_query** - Run SELECT queries against P21 database
✅ **get_version** - Get database version and connection info
✅ **list_tables** - List all available tables
✅ **describe_table** - Get column information for tables

### Database Support
✅ **ODBC Connectivity** - Uses Windows ODBC for reliable connections
✅ **SQL Server Optimized** - Designed for P21 SQL Server databases
✅ **Connection Pooling** - Efficient database connection management
✅ **Error Handling** - Comprehensive error reporting and logging

## Installation Requirements

### System Requirements
- Windows 10/11 or Windows Server 2016+
- Node.js 18.0 or higher
- ODBC Driver for SQL Server
- Network access to P21 database server

### P21 Database Requirements
- P21 ERP system with SQL Server backend
- Database user with SELECT permissions
- Configured ODBC DSN pointing to P21 database

### Claude/Cline Requirements
- Claude Desktop or Cline VS Code extension
- MCP support enabled
- Write access to MCP configuration file

## What's NOT Included

❌ **Node.js Runtime** - Must be installed separately
❌ **ODBC Drivers** - Must be installed separately  
❌ **P21 Database** - Must be accessible on your network
❌ **Database Credentials** - Must be configured in ODBC DSN

## Post-Installation Steps

1. **Install Dependencies**: Run `npm install` or use `install.bat`
2. **Configure Environment**: Copy `.env.example` to `.env` and set P21_DSN
3. **Setup ODBC DSN**: Create system DSN in Windows ODBC Administrator
4. **Add to Claude**: Update MCP configuration with server path
5. **Test Connection**: Ask Claude to list P21 tables

## Support and Troubleshooting

- Check `README.md` for detailed troubleshooting steps
- Verify ODBC connection using Windows ODBC Administrator
- Ensure P21 database is accessible from your machine
- Check Claude console for detailed error messages

## Version History

- **v1.0** (Initial Release)
  - Read-only P21 database access
  - ODBC connectivity with SQL Server
  - Write protection and rate limiting
  - Complete documentation and installation scripts

---

**Ready to install?** Start with `QUICK_START.md` for the fastest setup experience!
