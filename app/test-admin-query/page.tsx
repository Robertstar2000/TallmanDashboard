'use client';

import React, { useState, useEffect } from 'react';
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box, Paper, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';

export default function TestAdminQueryPage() {
  const [serverType, setServerType] = useState<string>('P21');
  const [tableName, setTableName] = useState<string>('sy_param');
  const [query, setQuery] = useState<string>("SELECT DB_NAME() as db_name");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [formattedQuery, setFormattedQuery] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<string | null>(null);
  
  // Direct connection details
  const [useDirectConnection, setUseDirectConnection] = useState<boolean>(true);
  const [server, setServer] = useState<string>('SQL01');
  const [database, setDatabase] = useState<string>('P21Play');
  const [useSqlAuth, setUseSqlAuth] = useState<boolean>(false); // Default to Windows auth
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [dsn, setDsn] = useState<string>('P21Play');
  const [porFilePath, setPorFilePath] = useState<string>('C:\\Users\\BobM\\Desktop\\POR.MDB');

  // POR MDB specific states
  const [porMdbQuery, setPorMdbQuery] = useState<string>("SELECT * FROM PO_HDR LIMIT 10");
  const [porMdbResult, setPorMdbResult] = useState<any>(null);
  const [porMdbLoading, setPorMdbLoading] = useState<boolean>(false);
  const [porMdbError, setPorMdbError] = useState<string | null>(null);
  const [porMdbRawResponse, setPorMdbRawResponse] = useState<any>(null);
  const [customTableName, setCustomTableName] = useState<string>('');

  useEffect(() => {
    // Load saved connection details from localStorage
    if (typeof window !== 'undefined') {
      // P21 connection details
      const savedServer = localStorage.getItem('p21_server');
      const savedDatabase = localStorage.getItem('p21_database');
      const savedDsn = localStorage.getItem('p21_dsn');
      const savedUsername = localStorage.getItem('p21_username');
      const savedPassword = localStorage.getItem('p21_password');
      const savedUseDirect = localStorage.getItem('p21_use_direct');
      const savedUseSqlAuth = localStorage.getItem('p21_use_sql_auth');
      
      if (savedServer) setServer(savedServer);
      if (savedDatabase) setDatabase(savedDatabase);
      if (savedDsn) setDsn(savedDsn);
      if (savedUsername) setUsername(savedUsername);
      if (savedPassword) setPassword(savedPassword);
      if (savedUseDirect) setUseDirectConnection(savedUseDirect === 'true');
      if (savedUseSqlAuth) setUseSqlAuth(savedUseSqlAuth === 'true');
      
      // POR connection details
      const savedPorFilePath = localStorage.getItem('por_file_path');
      if (savedPorFilePath) setPorFilePath(savedPorFilePath);
    }
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);
    
    try {
      console.log(`Testing connection to ${serverType} server`);
      
      // Prepare the request config
      let config: any = {};
      
      if (serverType === 'P21') {
        if (useDirectConnection) {
          config = {
            server,
            database: database || 'P21Play',
            // Use trusted connection for Windows authentication
            trustedConnection: true
          };
        } else {
          config = {
            dsn: dsn || 'P21Play',
            database: database || 'P21Play',
            // Use trusted connection for Windows authentication
            trustedConnection: true
          };
        }
        
        // Save the connection details to localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('p21_server', server || '');
          localStorage.setItem('p21_database', database || 'P21Play');
          localStorage.setItem('p21_dsn', dsn || 'P21Play');
          localStorage.setItem('p21_use_direct', useDirectConnection ? 'true' : 'false');
        }
      } else if (serverType === 'POR') {
        config = {
          filePath: porFilePath || process.env.POR_FILE_PATH || 'C:\\POR\\PORENT.mdb'
        };
        
        // Save the connection details to localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('por_file_path', porFilePath || '');
        }
      }
      
      // Test the connection
      const response = await fetch('/api/testConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          server: serverType,
          config
        })
      });
      
      const data = await response.json();
      console.log('Connection test response:', data);
      
      if (data.success) {
        setConnectionStatus(`Connected to ${serverType} server successfully`);
      } else {
        throw new Error(data.message || 'Connection test failed');
      }
    } catch (err: any) {
      console.error('Error testing connection:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);
    setFormattedQuery(null);

    // Clear POR MDB results when executing P21 queries
    setPorMdbResult(null);
    setPorMdbRawResponse(null);
    setPorMdbError(null);

    try {
      // Use the query as entered by the user without modification
      let formattedQueryText = query;
      setFormattedQuery(formattedQueryText);

      console.log(`Executing query on ${serverType} server:`, formattedQueryText);

      // Prepare the request config
      let config: any = {};
      
      if (serverType === 'P21') {
        if (useDirectConnection) {
          config = {
            server,
            database: database || 'P21Play',
            // Add authentication details
            username: useSqlAuth ? username : '',
            password: useSqlAuth ? password : '',
            trustedConnection: !useSqlAuth
          };
        } else {
          config = {
            dsn: dsn || 'P21Play',
            database: database || 'P21Play',
            // Add authentication details
            username: useSqlAuth ? username : '',
            password: useSqlAuth ? password : '',
            trustedConnection: !useSqlAuth
          };
        }
        
        // Log the configuration being used
        console.log('Using P21 config:', {
          ...config,
          password: config.password ? '***' : undefined,
          authentication: useSqlAuth ? 'SQL Server Authentication' : 'Windows Authentication (trusted connection)'
        });
      } else if (serverType === 'POR') {
        config = {
          filePath: porFilePath || process.env.POR_FILE_PATH || 'C:\\POR\\PORENT.mdb'
        };
        
        console.log('Using POR config:', config);
      }

      // Execute the query
      const response = await fetch('/api/admin/run-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sqlQuery: formattedQueryText,
          targetDatabase: serverType,
          porFilePath,
        })
      });

      // Parse the response
      const data = await response.json();
      setRawResponse(data);

      console.log('Query response:', data);

      if (data.success) {
        // If we have data array, use it
        if (data.data && Array.isArray(data.data)) {
          console.log('Setting result with array data:', data.data);
          setResult(data.data);
        } else if (data.value !== undefined) {
          // Otherwise, create a simple result with the value
          console.log('Setting result with single value:', data.value);
          setResult([{ value: data.value }]);
        } else {
          console.log('No data in response:', data);
          setResult([]);
        }
      } else {
        throw new Error(data.error || 'Query execution failed');
      }
    } catch (err: any) {
      console.error('Error executing query:', err);
      setError(`Query error: ${err.message}`);
      // Make sure error information is available in the raw response
      setRawResponse((prev: any) => ({
        ...prev,
        success: false,
        error: err.message,
        errorType: err.name === 'TypeError' ? 'connection' : 'execution'
      }));
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeQuery = () => {
    // Try without P21.dbo prefix
    if (query.includes('P21.dbo.')) {
      setQuery(query.replace('P21.dbo.', ''));
    } else if (query.includes('dbo.')) {
      // Try without any schema
      setQuery(query.replace('dbo.', ''));
    } else {
      // Try with just dbo schema
      setQuery(query.replace(/FROM\s+([^\s]+)/i, 'FROM dbo.$1'));
    }
  };

  // New function to execute POR MDB queries
  const executePorMdbQuery = async () => {
    setPorMdbLoading(true);
    setPorMdbError(null);
    setPorMdbResult(null);
    setPorMdbRawResponse(null);
    
    // Clear P21 results when executing POR MDB queries
    setResult(null);
    setRawResponse(null);
    setError(null);
    setFormattedQuery(null);

    try {
      console.log(`Executing POR MDB query:`, porMdbQuery);
      
      if (!porFilePath) {
        throw new Error("Please provide a POR MDB file path");
      }

      // Execute the query using our new API endpoint
      const response = await fetch('/api/admin/run-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sqlQuery: porMdbQuery,
          targetDatabase: 'POR',
          porFilePath,
        })
      });

      // Parse the response
      const data = await response.json();
      setPorMdbRawResponse(data);

      console.log('POR MDB Query response:', data);

      if (data.success) {
        // If we have data array, use it
        if (data.data && Array.isArray(data.data)) {
          console.log('Setting POR MDB result with array data:', data.data);
          setPorMdbResult(data.data);
        } else {
          setPorMdbResult([data]);
        }
      } else {
        throw new Error(data.message || data.error || 'Query failed');
      }
    } catch (err: any) {
      console.error('Error executing POR MDB query:', err);
      setPorMdbError(`Error: ${err.message}`);
      // Make sure error information is available in the raw response
      setPorMdbRawResponse((prev: any) => ({
        ...prev,
        success: false,
        error: err.message,
        errorType: err.name === 'TypeError' ? 'connection' : 'execution'
      }));
    } finally {
      setPorMdbLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Admin Query Test Tool</Typography>
        <Box display="flex" gap={2}>
          <Link href="/TestScripts/test-all-por-sql">
            <Button variant="contained" color="secondary">
              POR SQL Test Tool
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="contained" color="primary">
              Return to Admin
            </Button>
          </Link>
        </Box>
      </Box>

      <Paper elevation={3} className="p-4 mb-4">
        <Box mb={3}>
          <FormControl fullWidth variant="outlined" className="mb-4">
            <InputLabel>Server Type</InputLabel>
            <Select
              value={serverType}
              onChange={(e) => setServerType(e.target.value)}
              label="Server Type"
            >
              <MenuItem value="P21">P21</MenuItem>
              <MenuItem value="POR">POR</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" className="mb-4">
            <TextField
              label="Table Name"
              variant="outlined"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name (optional)"
              fullWidth
              margin="normal"
            />
          </FormControl>

          {serverType === 'P21' && (
            <>
              <FormControl fullWidth variant="outlined" className="mb-4">
                <InputLabel id="direct-connection-label">Use Direct Connection</InputLabel>
                <Select
                  labelId="direct-connection-label"
                  value={useDirectConnection ? "true" : "false"}
                  onChange={(e) => setUseDirectConnection(e.target.value === 'true')}
                  label="Use Direct Connection"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>

              {!useDirectConnection && (
                <Box className="p-4 border border-gray-300 rounded mb-4">
                  <Typography variant="h6" gutterBottom>ODBC Connection Details</Typography>
                  
                  <TextField
                    label="DSN Name"
                    variant="outlined"
                    value={dsn}
                    onChange={(e) => setDsn(e.target.value)}
                    placeholder="Enter DSN name"
                    fullWidth
                    margin="normal"
                  />
                  
                  <TextField
                    label="Database Name"
                    variant="outlined"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="Enter database name (e.g., P21)"
                    fullWidth
                    margin="normal"
                  />
                  
                  <FormControl fullWidth variant="outlined" className="mb-4 mt-4">
                    <InputLabel id="sql-auth-label">Use SQL Server Authentication</InputLabel>
                    <Select
                      labelId="sql-auth-label"
                      value={useSqlAuth ? "true" : "false"}
                      onChange={(e) => setUseSqlAuth(e.target.value === 'true')}
                      label="Use SQL Server Authentication"
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No (Use Windows Authentication)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {useSqlAuth && (
                    <>
                      <TextField
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter SQL Server username"
                        fullWidth
                        margin="normal"
                      />
                      
                      <TextField
                        label="Password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter SQL Server password"
                        fullWidth
                        margin="normal"
                        type="password"
                      />
                    </>
                  )}
                </Box>
              )}

              {useDirectConnection && (
                <Box className="p-4 border border-gray-300 rounded mb-4">
                  <Typography variant="h6" gutterBottom>Direct Connection Details</Typography>
                  
                  <TextField
                    label="Server"
                    variant="outlined"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="Enter server"
                    fullWidth
                    margin="normal"
                  />
                  
                  <TextField
                    label="Database"
                    variant="outlined"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="Enter database"
                    fullWidth
                    margin="normal"
                  />
                  
                  <FormControl fullWidth variant="outlined" className="mb-4 mt-4">
                    <InputLabel id="sql-auth-label">Use SQL Server Authentication</InputLabel>
                    <Select
                      labelId="sql-auth-label"
                      value={useSqlAuth ? "true" : "false"}
                      onChange={(e) => setUseSqlAuth(e.target.value === 'true')}
                      label="Use SQL Server Authentication"
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No (Use Windows Authentication)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {useSqlAuth && (
                    <>
                      <TextField
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter SQL Server username"
                        fullWidth
                        margin="normal"
                      />
                      
                      <TextField
                        label="Password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter SQL Server password"
                        fullWidth
                        margin="normal"
                        type="password"
                      />
                    </>
                  )}
                </Box>
              )}
            </>
          )}
          {serverType !== 'P21' && (
            <FormControl fullWidth variant="outlined" className="mb-4">
              <TextField
                label="File Path"
                variant="outlined"
                value={porFilePath}
                onChange={(e) => setPorFilePath(e.target.value)}
                placeholder="Enter file path"
                fullWidth
                margin="normal"
              />
            </FormControl>
          )}
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={testConnection}
            disabled={loading}
            className="mb-4"
          >
            {loading ? <CircularProgress size={24} /> : 'Test Connection'}
          </Button>

          {connectionStatus && connectionStatus !== 'unknown' && (
            <Alert severity={connectionStatus.includes('successful') ? "success" : "error"} className="mb-4">
              {connectionStatus}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" className="mb-4">{error}</Alert>
          )}
        </Box>

        <TextField
          label="SQL Query"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query"
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={executeQuery}
            disabled={loading || !query}
            className="mr-2"
          >
            {loading ? <CircularProgress size={24} /> : 'Execute Query'}
          </Button>
          
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={tryAlternativeQuery}
            disabled={loading || !query}
          >
            Try Alternative Query
          </Button>
        </Box>

        {serverType === 'P21' && (
          <Box className="mt-4">
            <Typography variant="h6" gutterBottom>Diagnostic Queries</Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery('SELECT @@VERSION as version');
                  executeQuery();
                }}
              >
                Check SQL Version
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery('SELECT DB_NAME() as database_name');
                  executeQuery();
                }}
              >
                Check Database Name
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT TOP 20 name, type_desc FROM sys.objects WHERE type_desc IN ('USER_TABLE', 'VIEW') ORDER BY name");
                  executeQuery();
                }}
              >
                List Tables
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT name, schema_id, type_desc FROM sys.objects WHERE name LIKE '%param%' OR name LIKE '%hdr%'");
                  executeQuery();
                }}
              >
                Find Similar Tables
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT name FROM sys.schemas");
                  executeQuery();
                }}
              >
                List Schemas
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT OBJECT_ID('sy_param') as sy_param_exists, OBJECT_ID('oe_hdr') as oe_hdr_exists");
                  executeQuery();
                }}
              >
                Check Key Tables
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES");
                  executeQuery();
                }}
              >
                Check Schema Info
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT name, database_id, create_date FROM sys.databases");
                  executeQuery();
                }}
              >
                List Databases
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT DB_NAME() as current_db, (SELECT COUNT(*) FROM sys.objects WHERE type_desc = 'USER_TABLE') as table_count");
                  executeQuery();
                }}
              >
                DB Info
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT name, database_id, create_date FROM sys.databases");
                  executeQuery();
                }}
              >
                List Databases
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery("SELECT TOP 20 s.name as schema_name, t.name as table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id ORDER BY s.name, t.name");
                  executeQuery();
                }}
              >
                Tables with Schemas
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`SELECT 1 AS test`);
                  executeQuery();
                }}
              >
                Simple Test Query
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`SELECT @@VERSION AS version`);
                  executeQuery();
                }}
              >
                Get SQL Version
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`SELECT DB_NAME() AS current_database`);
                  executeQuery();
                }}
              >
                Current Database
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Query system_parameters table
SELECT TOP 20 * FROM system_parameters
                  `);
                  executeQuery();
                }}
              >
                Query System Parameters
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Query sys_params_p21 table
SELECT TOP 20 * FROM sys_params_p21
                  `);
                  executeQuery();
                }}
              >
                Query P21 Sys Params
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  // Try to find P21 tables across all accessible databases
                  setQuery(`
DECLARE @sql NVARCHAR(MAX) = '';
DECLARE @dbname NVARCHAR(128);

-- Create a temp table to hold results
CREATE TABLE #Results (
    DatabaseName NVARCHAR(128),
    TableName NVARCHAR(128),
    SchemaName NVARCHAR(128)
);

-- Get all databases
DECLARE db_cursor CURSOR FOR 
SELECT name FROM sys.databases 
WHERE state_desc = 'ONLINE' 
AND name NOT IN ('master', 'tempdb', 'model', 'msdb')
ORDER BY name;

OPEN db_cursor;
FETCH NEXT FROM db_cursor INTO @dbname;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Build dynamic SQL to search each database
    SET @sql = '
    USE [' + @dbname + '];
    INSERT INTO #Results
    SELECT 
        ''' + @dbname + ''' AS DatabaseName,
        t.name AS TableName,
        SCHEMA_NAME(t.schema_id) AS SchemaName
    FROM sys.tables t
    WHERE t.name LIKE ''%param%'' OR t.name LIKE ''%hdr%''
    ';
    
    -- Execute the dynamic SQL
    BEGIN TRY
        EXEC sp_executesql @sql;
    END TRY
    BEGIN CATCH
        -- Ignore errors and continue
    END CATCH
    
    FETCH NEXT FROM db_cursor INTO @dbname;
END

CLOSE db_cursor;
DEALLOCATE db_cursor;

-- Return the results
SELECT * FROM #Results ORDER BY DatabaseName, SchemaName, TableName;

-- Clean up
DROP TABLE #Results;
                  `);
                  executeQuery();
                }}
              >
                Search P21 Tables Across DBs
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Try a simpler query that works with more limited permissions
SELECT 
  DB_NAME() as current_database,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') as table_count,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%PARAM%') as param_tables,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%HDR%') as hdr_tables
                  `);
                  executeQuery();
                }}
              >
                Basic DB Info
              </Button>
              
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- List tables using INFORMATION_SCHEMA which has broader permissions
SELECT 
  TABLE_SCHEMA as schema_name,
  TABLE_NAME as table_name,
  TABLE_TYPE as table_type
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME
                  `);
                  executeQuery();
                }}
              >
                List Tables (Alt Method)
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- List all databases on the server
SELECT name FROM master.sys.databases
WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
ORDER BY name
                  `);
                  executeQuery();
                }}
              >
                List User Databases
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Try a direct query to master database
SELECT name, database_id, create_date, state_desc
FROM master.sys.databases
ORDER BY name
                  `);
                  executeQuery();
                }}
              >
                List All Databases
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Try to switch to master database first
USE master;
SELECT name, database_id, create_date, state_desc
FROM sys.databases
ORDER BY name
                  `);
                  executeQuery();
                }}
              >
                Use Master DB
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setQuery(`
-- Comprehensive P21 Database Diagnostics
-- Step 1: Get SQL Server Version
SELECT @@VERSION as SQLServerVersion;

-- Step 2: Check Current Database
SELECT DB_NAME() as CurrentDatabase;

-- Step 3: Try to switch to P21Play database
USE P21Play;
SELECT DB_NAME() as SwitchedToDatabase;

-- Step 4: Check if system_parameters table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'system_parameters')
    THEN 'system_parameters table exists'
    ELSE 'system_parameters table DOES NOT exist'
  END as SystemParametersCheck;

-- Step 5: Check if sys_params_p21 table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'sys_params_p21')
    THEN 'sys_params_p21 table exists'
    ELSE 'sys_params_p21 table DOES NOT exist'
  END as SysParamsP21Check;

-- Step 6: Sample data from system_parameters
SELECT TOP 5 * FROM system_parameters;
                  `);
                  executeQuery();
                }}
              >
                Run Full Diagnostics
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* New POR MDB Query Testing Section */}
      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h5" gutterBottom>POR MDB Query Testing (mdb-reader)</Typography>
        <Box mb={3}>
          <Typography variant="body2" gutterBottom>
            This section tests POR queries using the mdb-reader module, connecting directly to the MS Access database.
          </Typography>
        </Box>

        <Box mb={3} display="flex" alignItems="flex-start">
          <TextField
            label="POR MDB File Path"
            value={porFilePath}
            onChange={(e) => {
              setPorFilePath(e.target.value);
              localStorage.setItem('por_file_path', e.target.value);
            }}
            fullWidth
            margin="normal"
            variant="outlined"
            helperText="Path to the POR MDB file (e.g., C:\Users\BobM\Desktop\POR.MDB)"
            style={{ marginRight: '16px' }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Set default path
              setPorFilePath('C:\\Users\\BobM\\Desktop\\POR.MDB');
              localStorage.setItem('por_file_path', 'C:\\Users\\BobM\\Desktop\\POR.MDB');
              
              // Test connection
              setPorMdbQuery('SHOW TABLES');
              executePorMdbQuery();
            }}
            style={{ marginTop: '16px', height: '56px' }}
          >
            Connect to POR
          </Button>
        </Box>

        <Box mb={3}>
          <TextField
            label="POR MDB Query"
            value={porMdbQuery}
            onChange={(e) => setPorMdbQuery(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            helperText="Enter a query to execute against the POR MDB file (e.g., SELECT * FROM PO_HDR LIMIT 10, SHOW TABLES, DESCRIBE PO_HDR)"
          />
        </Box>

        <Box mb={3} display="flex" justifyContent="flex-start">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={executePorMdbQuery}
            disabled={porMdbLoading}
            style={{ marginRight: '8px' }}
          >
            {porMdbLoading ? <CircularProgress size={24} /> : 'Execute POR MDB Query'}
          </Button>
        </Box>

        {/* POR MDB Diagnostic Queries */}
        <Box className="mt-4 mb-4">
          <Typography variant="h6" gutterBottom>POR MDB Diagnostic Queries</Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {/* Connection status check button */}
            <Button 
              variant="outlined" 
              size="small"
              color="primary"
              onClick={() => {
                setPorMdbQuery(`
                  -- Check POR database connection status
                  SHOW TABLES
                `);
                executePorMdbQuery();
              }}
            >
              Check Connection
            </Button>
            
            {/* List all tables */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery('SHOW TABLES');
                executePorMdbQuery();
              }}
            >
              List Tables
            </Button>
            
            {/* Query PurchaseOrder table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM PurchaseOrder`);
                executePorMdbQuery();
              }}
            >
              PurchaseOrder
            </Button>
            
            {/* Query PurchaseOrderDetail table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM PurchaseOrderDetail`);
                executePorMdbQuery();
              }}
            >
              PurchaseOrderDetail
            </Button>
            
            {/* Query CustomerFile table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM CustomerFile_Tr_Bak`);
                executePorMdbQuery();
              }}
            >
              CustomerFile
            </Button>
            
            {/* Query Transactions table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM Transactions`);
                executePorMdbQuery();
              }}
            >
              Transactions
            </Button>
            
            {/* Query TransactionItems table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM TransactionItems`);
                executePorMdbQuery();
              }}
            >
              TransactionItems
            </Button>
            
            {/* Query ItemFile table */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM ItemFile`);
                executePorMdbQuery();
              }}
            >
              ItemFile
            </Button>
            
            {/* Find tables with a specific name pattern */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM MSysObjects WHERE Name LIKE '%Customer%' AND Type=1 AND Flags=0`);
                executePorMdbQuery();
              }}
            >
              Find Customer Tables
            </Button>
            
            {/* Find tables with a specific name pattern */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setPorMdbQuery(`SELECT * FROM MSysObjects WHERE Name LIKE '%Transaction%' AND Type=1 AND Flags=0`);
                executePorMdbQuery();
              }}
            >
              Find Transaction Tables
            </Button>
            
            {/* Describe table structure */}
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                const tableName = prompt('Enter table name to describe:', 'PurchaseOrder');
                if (tableName) {
                  setPorMdbQuery(`DESCRIBE ${tableName}`);
                  executePorMdbQuery();
                }
              }}
            >
              Describe Table
            </Button>
            
            {/* Dynamic query input */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, width: '100%' }}>
              <TextField
                label="Table Name"
                variant="outlined"
                size="small"
                value={customTableName}
                onChange={(e) => setCustomTableName(e.target.value)}
                sx={{ flexGrow: 1, maxWidth: 200 }}
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={() => {
                  if (customTableName) {
                    setPorMdbQuery(`SELECT * FROM ${customTableName}`);
                    executePorMdbQuery();
                  }
                }}
                disabled={!customTableName}
              >
                Query Table
              </Button>
            </Box>
          </Box>
        </Box>

        {porMdbError && (
          <Alert severity="error" className="mb-4">{porMdbError}</Alert>
        )}

        {porMdbRawResponse && (
          <Paper elevation={3} className="p-4">
            <Typography variant="h6" gutterBottom>POR MDB Raw API Response</Typography>
            <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(porMdbRawResponse, null, 2)}</pre>
          </Paper>
        )}

        {porMdbRawResponse && porMdbRawResponse.error && (
          <Paper elevation={3} className="p-4 mt-4">
            <Typography variant="h6" gutterBottom>POR MDB Error Details</Typography>
            <Alert severity="error" className="mb-2">
              <Typography variant="subtitle1"><strong>Error Message:</strong> {porMdbRawResponse.error}</Typography>
              {porMdbRawResponse.errorType && (
                <Typography variant="subtitle2"><strong>Error Type:</strong> {porMdbRawResponse.errorType}</Typography>
              )}
            </Alert>
          </Paper>
        )}

        {porMdbResult && (
          <Paper elevation={3} className="p-4">
            <Typography variant="h6" gutterBottom>POR MDB Query Result</Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    {porMdbResult.length > 0 && Object.keys(porMdbResult[0]).map((key) => (
                      <th key={key} className="py-2 px-4 border">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {porMdbResult.map((row: Record<string, any>, rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                      {Object.values(row).map((value: any, colIndex: number) => (
                        <td key={colIndex} className="py-2 px-4 border">
                          {value === null ? 'NULL' : 
                           typeof value === 'object' ? JSON.stringify(value) : 
                           String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Paper>
        )}
      </Paper>

      {formattedQuery && (
        <Paper elevation={3} className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>Formatted Query</Typography>
          <pre className="bg-gray-100 p-2 rounded">{formattedQuery}</pre>
        </Paper>
      )}

      {result && (
        <Paper elevation={3} className="p-4 mb-4">
          <Typography variant="h6" gutterBottom>Query Result</Typography>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
        </Paper>
      )}

      {rawResponse && (
        <Paper elevation={3} className="p-4">
          <Typography variant="h6" gutterBottom>Raw API Response</Typography>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(rawResponse, null, 2)}</pre>
        </Paper>
      )}
      
      {rawResponse && rawResponse.error && (
        <Paper elevation={3} className="p-4 mt-4">
          <Typography variant="h6" gutterBottom>Error Details</Typography>
          <Alert severity="error" className="mb-2">
            <Typography variant="subtitle1"><strong>Error Message:</strong> {rawResponse.error}</Typography>
            {rawResponse.errorType && (
              <Typography variant="subtitle2"><strong>Error Type:</strong> {rawResponse.errorType}</Typography>
            )}
          </Alert>
        </Paper>
      )}
      
      {connectionDetails && (
        <Paper elevation={3} className="p-4">
          <Typography variant="h6" gutterBottom>Connection Details</Typography>
          <pre className="bg-gray-100 p-2 rounded">{connectionDetails}</pre>
        </Paper>
      )}
    </div>
  );
}
