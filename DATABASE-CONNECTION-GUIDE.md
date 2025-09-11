# Database Connection Guide: P21 & POR Query Execution

This guide explains how to connect to P21 (SQL Server) and POR (Microsoft Access) databases, send SQL queries, and receive results.

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [P21 Database Connection](#p21-database-connection)
3. [POR Database Connection](#por-database-connection)
4. [Code Examples](#code-examples)
5. [Troubleshooting](#troubleshooting)

## Environment Configuration

**IMPORTANT**: All database credentials and connection parameters are now managed through environment variables in `.env.local`. This centralizes configuration and improves security.

### Required Environment Variables

Create or update your `.env.local` file with these variables:

```bash
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# P21 SQL Server Database
P21_SERVER=10.10.20.13
P21_DATABASE=P21_LIVE
P21_TRUSTED_CONNECTION=true
P21_DSN=P21Live
P21_USERNAME=your-sql-username
P21_PASSWORD=your-sql-password

# POR MS Access Database
NEXT_PUBLIC_POR_DB_PATH=\\ts03\POR\POR.MDB
POR_FILE_PATH=\\ts03\POR\POR.MDB
POR_DB_PATH=\\ts03\POR\POR.MDB
POR_DB_PASSWORD=
```

### Security Notes
- Never commit `.env.local` to version control
- Use strong passwords for database connections
- Consider using Windows Authentication (P21_TRUSTED_CONNECTION=true) when possible
- POR database password can be left empty if the .MDB file is not password-protected

## P21 Database Connection

### Connection Method
P21 uses **ODBC DSN (Data Source Name)** connections to SQL Server.

### Prerequisites
1. Microsoft SQL Server ODBC Driver installed
2. System DSN configured in Windows ODBC Data Source Administrator
3. Network access to SQL Server
4. Valid authentication credentials

### Setup Steps

#### 1. Configure Environment Variables
Add these variables to your `.env.local` file:
```bash
# P21 SQL Server Database
P21_SERVER=10.10.20.13
P21_DATABASE=P21_LIVE
P21_TRUSTED_CONNECTION=true
P21_DSN=P21Live
P21_USERNAME=your-sql-username
P21_PASSWORD=your-sql-password
```

#### 2. Create Windows System DSN
1. Open **ODBC Data Sources (64-bit)**
2. Go to **System DSN** tab
3. Click **Add** → Select **SQL Server** driver
4. Configure:
   - **Name**: `P21Live` (matches P21_DSN)
   - **Server**: `10.10.20.13` (matches P21_SERVER)
   - **Database**: `P21_LIVE` (matches P21_DATABASE)
   - **Authentication**: Use environment credentials or Windows

#### 3. Connection String Format
```
DSN=P21Live;
```

**Note**: All connection parameters are now configured via environment variables in `.env.local`

### P21 Query Execution

```typescript
import odbc from 'odbc';

async function executeP21Query(sql: string): Promise<any[]> {
  const dsnName = process.env.P21_DSN;
  const connectionString = `DSN=${dsnName};`;
  let connection: odbc.Connection | null = null;

  try {
    connection = await odbc.connect(connectionString);
    const result = await connection.query<any[]>(sql);
    return result;
  } catch (error) {
    console.error('P21 Query failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Usage
const result = await executeP21Query("SELECT COUNT(*) as count FROM dbo.invoice_hdr");
console.log(result); // [{ count: 1234 }]
```

### P21 SQL Syntax
Standard SQL Server syntax:
```sql
SELECT COUNT(*) as count FROM dbo.invoice_hdr WITH (NOLOCK)
SELECT SUM(amount) as total FROM dbo.invoice_line WHERE date >= '2025-01-01'
SELECT TOP 10 * FROM dbo.customer WHERE active = 1
```

## POR Database Connection

### Connection Methods
POR supports multiple connection methods with automatic fallback:
1. **ADODB** (Primary - best for complex queries)
2. **ODBC Driver** (Secondary)
3. **MDBReader** (Fallback - simple COUNT queries only)

### Prerequisites
1. Microsoft Access .MDB file
2. File read permissions
3. Microsoft Access Database Engine (for ADODB/ODBC methods)

### Setup Steps

#### 1. Configure Environment Variables
Add these variables to your `.env.local` file:
```bash
# POR MS Access Database
NEXT_PUBLIC_POR_DB_PATH=\\ts03\POR\POR.MDB
POR_FILE_PATH=\\ts03\POR\POR.MDB
POR_DB_PATH=\\ts03\POR\POR.MDB
POR_DB_PASSWORD=
```

**Note**: All POR connection parameters are now configured via environment variables in `.env.local`

### POR Query Execution

```typescript
import fs from 'fs';
import MDBReader from 'mdb-reader';

async function executePORQuery(sqlQuery: string): Promise<any[]> {
  // Get configuration from environment variables
  const filePath = process.env.POR_FILE_PATH || process.env.POR_DB_PATH;
  const password = process.env.POR_DB_PASSWORD;
  
  if (!filePath) {
    throw new Error('POR_FILE_PATH or POR_DB_PATH environment variable is required');
  }
  // Method 1: Try ADODB first
  try {
    const ADODB = require('node-adodb');
    const provider = filePath.toLowerCase().endsWith('.accdb')
      ? 'Provider=Microsoft.ACE.OLEDB.12.0;'
      : 'Provider=Microsoft.Jet.OLEDB.4.0;';
    const auth = password ? `Jet OLEDB:Database Password=${password};` : '';
    const connStr = `${provider}Data Source=${filePath};Persist Security Info=False;${auth}`;

    const connection = ADODB.open(connStr, true);
    const result = await connection.query(sqlQuery);
    return Array.isArray(result) ? result : [result];
  } catch (adodbErr) {
    console.error('ADODB failed, trying fallback:', adodbErr);
    
    // Method 2: Fallback to MDBReader for simple COUNT queries
    const simpleCountRegex = /^SELECT\s+Count\(\*\)\s+AS\s+\w+\s+FROM\s+\[?(\w+)\]?$/i;
    const match = simpleCountRegex.exec(sqlQuery.trim());
    
    if (match) {
      try {
        const buffer = fs.readFileSync(filePath);
        const reader = new MDBReader(buffer, password ? { password } as any : undefined);
        const tableName = match[1];
        const table = reader.getTable(tableName);
        const count = table.getData().length;
        return [{ value: count }];
      } catch (readerErr) {
        console.error('MDBReader fallback failed:', readerErr);
        throw readerErr;
      }
    }
    
    throw adodbErr;
  }
}

// Usage
const result = await executePORQuery(
  "SELECT Count(*) AS value FROM PurchaseOrder"
);
console.log(result); // [{ value: 567 }]
```

### POR SQL Syntax
Microsoft Access SQL syntax:
```sql
-- Date literals use # delimiters
SELECT Count(*) AS value FROM PurchaseOrder WHERE [Date] >= #1/1/2025#

-- Column names in square brackets
SELECT * FROM [Purchase Order] WHERE [Status] <> 'Closed'

-- String literals use single quotes
SELECT Count(*) FROM PurchaseOrder WHERE [Status] = 'Open'
```

## Code Examples

### Basic P21 Connection Test
```typescript
async function testP21Connection(): Promise<boolean> {
  try {
    const connection = await odbc.connect(`DSN=${process.env.P21_DSN};`);
    await connection.query('SELECT 1');
    await connection.close();
    return true;
  } catch (error) {
    console.error('P21 connection failed:', error);
    return false;
  }
}
```

### Basic POR Connection Test
```typescript
async function testPORConnection(filePath: string): Promise<boolean> {
  try {
    const ADODB = require('node-adodb');
    const connStr = `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${filePath};`;
    const connection = ADODB.open(connStr, true);
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('POR connection failed:', error);
    return false;
  }
}
```

### Query with Error Handling
```typescript
async function executeQuerySafely(serverType: 'P21' | 'POR', sql: string): Promise<any[] | null> {
  try {
    if (serverType === 'P21') {
      return await executeP21Query(sql);
    } else {
      return await executePORQuery(process.env.POR_FILE_PATH!, process.env.POR_DB_PASSWORD, sql);
    }
  } catch (error) {
    console.error(`${serverType} query failed:`, error);
    return null;
  }
}
```

## Troubleshooting

### P21 Issues

**DSN Not Found**
```
Error: Data source name not found
```
- Verify DSN exists in System DSN (not User DSN)
- Check DSN name matches environment variable
- Ensure 64-bit DSN for 64-bit Node.js

**Authentication Failed**
```
Error: Login failed for user
```
- Verify SQL Server authentication mode
- Check username/password
- Try Windows Authentication
- Confirm user has database access

**Network Error**
```
Error: A network-related or instance-specific error occurred
```
- Check server address and port (1433)
- Verify firewall settings
- Test with: `telnet SQL01 1433`

### POR Issues

**File Not Found**
```
Error: Could not find file
```
- Verify file path is correct
- Check file permissions
- Ensure file is not locked

**ADODB Error**
```
Error: Provider cannot be found
```
- Install Microsoft Access Database Engine
- Check 32-bit vs 64-bit compatibility
- Try MDBReader fallback for simple queries

**Empty Results**
```
Query returns no data
```
- Verify table names exist
- Check MS Access SQL syntax
- Test query in MS Access first

### General Debugging

Enable detailed logging:
```typescript
// Add before connection
console.log('Connection string:', connectionString);
console.log('SQL Query:', sql);

// Add after query
console.log('Query result:', result);
console.log('Result type:', typeof result);
console.log('Result length:', Array.isArray(result) ? result.length : 'Not array');
```

Connection cleanup:
```typescript
// Always close connections
try {
  // ... query execution
} finally {
  if (connection) {
    await connection.close();
  }
}
