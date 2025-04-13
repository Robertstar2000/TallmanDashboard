'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Tabs, Tab, List, ListItem, ListItemText, Chip, TextField, Alert } from '@mui/material';
import Link from 'next/link';
import { dashboardData as initialSpreadsheetData } from '@/lib/db/single-source-data';
function TabPanel(props) {
    const { children, value, index } = props, other = __rest(props, ["children", "value", "index"]);
    return (<div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && (<Box p={3}>
          {children}
        </Box>)}
    </div>);
}
// Function to fix POR SQL expressions to use proper Jet SQL syntax
function fixPORSqlExpression(sql, availableTables = []) {
    if (!sql)
        return sql;
    // Extract table name from SQL
    const tableMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
    const tableName = tableMatch ? tableMatch[1].replace(/dbo\./i, '') : null;
    // Map of known table names in POR database to their actual names
    const TABLE_NAME_MAP = {
        'SOMAST': 'AccountingTransaction',
        'Rentals': 'AccountingTransaction',
        'Contracts': 'AccountingTransaction',
        'PurchaseOrder': 'AccountingTransaction',
        'Orders': 'AccountingTransaction',
        'Transactions': 'AccountingTransaction',
        'RentalContracts': 'AccountingTransaction',
        'Invoices': 'AccountingTransaction',
        'Customer': 'Customer',
        'Customers': 'Customer',
        'Inventory': 'Inventory',
        'Items': 'Inventory',
        'Products': 'Inventory',
        'Vendors': 'Vendor',
        'Suppliers': 'Vendor'
    };
    // Check if table exists in the database
    const tableExists = tableName && availableTables.length > 0 &&
        availableTables.some(t => t.toLowerCase() === tableName.toLowerCase());
    // If table doesn't exist, try to find a suitable replacement
    if (tableName && !tableExists) {
        // Try to find the table in our mapping
        const mappedTable = TABLE_NAME_MAP[tableName];
        if (mappedTable && availableTables.some(t => t.toLowerCase() === mappedTable.toLowerCase())) {
            sql = sql.replace(new RegExp(`FROM\\s+${tableName.replace(/\./g, '\\.')}\\b`, 'i'), `FROM ${mappedTable}`);
        }
        else {
            // Try to find a similar table name
            const possibleTables = availableTables.filter(t => t.toLowerCase().includes('transaction') ||
                t.toLowerCase().includes('accounting') ||
                t.toLowerCase().includes('customer') ||
                t.toLowerCase().includes('inventory'));
            if (possibleTables.length > 0) {
                // Use the first matching table as a best guess
                sql = sql.replace(new RegExp(`FROM\\s+${tableName.replace(/\./g, '\\.')}\\b`, 'i'), `FROM ${possibleTables[0]}`);
            }
        }
    }
    // Fix date functions
    sql = sql.replace(/GETDATE\(\)/gi, 'Date()');
    // Fix DATEADD/DATEDIFF syntax
    sql = sql.replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, interval, number, date) => `DateAdd('${interval}', ${number}, ${date})`);
    sql = sql.replace(/DATEDIFF\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, (match, interval, date1, date2) => `DateDiff('${interval}', ${date1}, ${date2})`);
    // Fix NULL handling
    sql = sql.replace(/ISNULL\(([^,]+),\s*([^)]+)\)/gi, (match, expr, replacement) => `Nz(${expr}, ${replacement})`);
    // Remove schema prefixes
    sql = sql.replace(/dbo\./gi, '');
    // Remove table hints
    sql = sql.replace(/WITH\s*\([^)]+\)/gi, '');
    return sql;
}
// Get all POR SQL expressions
function getAllPORSqlExpressions() {
    return initialSpreadsheetData
        .filter(item => item.serverName === 'POR' && item.productionSqlExpression)
        .map(item => ({
        id: item.id,
        dataPoint: item.DataPoint || `POR Expression ${item.id}`,
        sql: item.productionSqlExpression,
        fixedSql: ''
    }));
}
export default function TestAllPORSQLPage() {
    const [tabValue, setTabValue] = useState(0);
    const [porExpressions, setPorExpressions] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [testErrors, setTestErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testingIndex, setTestingIndex] = useState(-1);
    const [porFilePath, setPorFilePath] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedExpression, setSelectedExpression] = useState(null);
    const [editedSql, setEditedSql] = useState('');
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateError, setUpdateError] = useState('');
    useEffect(() => {
        // Load all POR expressions
        const expressions = getAllPORSqlExpressions();
        setPorExpressions(expressions);
        // Get available tables on load
        fetchAvailableTables();
    }, []);
    const fetchAvailableTables = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/test-por-sql');
            const data = yield response.json();
            if (data.availableTables) {
                setAvailableTables(data.availableTables);
            }
            if (data.porFilePath) {
                setPorFilePath(data.porFilePath);
            }
        }
        catch (error) {
            console.error('Error fetching tables:', error);
        }
    });
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    const selectExpression = (expr) => {
        setSelectedExpression(expr);
        setEditedSql(expr.fixedSql || expr.sql);
    };
    const updateSqlExpression = () => __awaiter(this, void 0, void 0, function* () {
        if (!selectedExpression)
            return;
        try {
            setUpdateStatus('Updating...');
            setUpdateError('');
            const response = yield fetch('/api/update-sql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedExpression.id,
                    productionSqlExpression: editedSql
                }),
            });
            const data = yield response.json();
            if (data.success) {
                setUpdateStatus('Updated successfully!');
                // Update the local state
                setPorExpressions(prev => prev.map(expr => expr.id === selectedExpression.id
                    ? Object.assign(Object.assign({}, expr), { sql: editedSql, fixedSql: editedSql }) : expr));
                // Update test results if this expression was tested
                setTestResults(prev => prev.map(result => result.id === selectedExpression.id
                    ? Object.assign(Object.assign({}, result), { sql: editedSql, originalSql: editedSql }) : result));
                // Update test errors if this expression had errors
                setTestErrors(prev => prev.map(error => error.id === selectedExpression.id
                    ? Object.assign(Object.assign({}, error), { sql: editedSql, originalSql: editedSql }) : error));
            }
            else {
                setUpdateError(data.error || 'Failed to update SQL expression');
            }
        }
        catch (error) {
            setUpdateError(error.message || 'An error occurred while updating');
        }
        finally {
            setTimeout(() => {
                setUpdateStatus('');
            }, 3000);
        }
    });
    const testAllExpressions = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        setTestResults([]);
        setTestErrors([]);
        // First ensure we have available tables
        if (availableTables.length === 0) {
            yield fetchAvailableTables();
        }
        // Fix all SQL expressions with available tables
        const fixedExpressions = porExpressions.map(expr => (Object.assign(Object.assign({}, expr), { fixedSql: fixPORSqlExpression(expr.sql, availableTables) })));
        setPorExpressions(fixedExpressions);
        // Test each expression one by one
        for (let i = 0; i < fixedExpressions.length; i++) {
            setTestingIndex(i);
            const expr = fixedExpressions[i];
            try {
                const response = yield fetch('/api/test-sql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sqlExpression: expr.fixedSql,
                        serverType: 'POR'
                    }),
                });
                const data = yield response.json();
                if (data.error) {
                    setTestErrors(prev => [...prev, {
                            id: expr.id,
                            dataPoint: expr.dataPoint,
                            sql: expr.fixedSql,
                            originalSql: expr.sql,
                            error: data.error
                        }]);
                }
                else {
                    setTestResults(prev => [...prev, {
                            id: expr.id,
                            dataPoint: expr.dataPoint,
                            sql: expr.fixedSql,
                            originalSql: expr.sql,
                            result: data.result
                        }]);
                }
            }
            catch (error) {
                setTestErrors(prev => [...prev, {
                        id: expr.id,
                        dataPoint: expr.dataPoint,
                        sql: expr.fixedSql,
                        originalSql: expr.sql,
                        error: error.message
                    }]);
            }
            // Small delay to avoid overwhelming the server
            yield new Promise(resolve => setTimeout(resolve, 100));
        }
        setTestingIndex(-1);
        setLoading(false);
    });
    const updateAllSqlExpressions = () => __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Are you sure you want to update all SQL expressions? This will overwrite the existing expressions in the database.')) {
            return;
        }
        setLoading(true);
        setUpdateStatus('Updating all SQL expressions...');
        setUpdateError('');
        try {
            // Get successful test results
            const successfulExpressions = testResults.map(result => ({
                id: result.id,
                productionSqlExpression: result.sql
            }));
            if (successfulExpressions.length === 0) {
                setUpdateError('No successful expressions to update');
                setLoading(false);
                return;
            }
            const response = yield fetch('/api/update-sql-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expressions: successfulExpressions
                }),
            });
            const data = yield response.json();
            if (data.success) {
                setUpdateStatus(`Updated ${data.updatedCount} SQL expressions successfully!`);
            }
            else {
                setUpdateError(data.error || 'Failed to update SQL expressions');
            }
        }
        catch (error) {
            setUpdateError(error.message || 'An error occurred while updating');
        }
        finally {
            setLoading(false);
            setTimeout(() => {
                setUpdateStatus('');
            }, 3000);
        }
    });
    return (<div className="container mx-auto p-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Test All POR SQL Expressions</Typography>
        <Link href="/">
          <Button variant="contained" color="primary">
            Return to Dashboard
          </Button>
        </Link>
      </Box>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6">POR Database Information</Typography>
        <Typography>File Path: {porFilePath || 'Not loaded yet'}</Typography>
        <Typography>Available Tables: {availableTables.length}</Typography>
        <Typography>Total POR Expressions: {porExpressions.length}</Typography>
        
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={testAllExpressions} disabled={loading} sx={{ mr: 2 }}>
            {loading ? 'Testing...' : 'Test All Expressions'}
          </Button>
          
          <Button variant="contained" color="secondary" onClick={updateAllSqlExpressions} disabled={loading || testResults.length === 0}>
            Update All Successful Expressions
          </Button>
          
          {loading && (<Box mt={2} display="flex" alignItems="center">
              <CircularProgress size={24} className="mr-2"/>
              <Typography>
                {testingIndex >= 0
                ? `Testing expression ${testingIndex + 1} of ${porExpressions.length}...`
                : 'Processing...'}
              </Typography>
            </Box>)}
          
          {updateStatus && (<Alert severity="success" sx={{ mt: 2 }}>{updateStatus}</Alert>)}
          
          {updateError && (<Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>)}
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="POR SQL test tabs">
          <Tab label={`Available Tables (${availableTables.length})`}/>
          <Tab label={`Successful Tests (${testResults.length})`}/>
          <Tab label={`Failed Tests (${testErrors.length})`}/>
          <Tab label="Edit Expression"/>
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>Available Tables in POR Database</Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableTables.map((table, index) => (<Chip key={index} label={table} color="primary" variant="outlined"/>))}
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Successful Tests ({testResults.length})</Typography>
        <List>
          {testResults.map((result, index) => (<Paper key={index} elevation={2} sx={{ mb: 2, p: 2 }}>
              <ListItem sx={{ cursor: 'pointer' }} onClick={() => selectExpression(result)}>
                <ListItemText primary={`${result.dataPoint} (ID: ${result.id})`} secondary={<>
                      <Typography component="span" variant="body2" color="textPrimary">
                        Original SQL:
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {result.originalSql}
                      </Typography>
                      
                      <Typography component="span" variant="body2" color="textPrimary">
                        Fixed SQL:
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {result.sql}
                      </Typography>
                      
                      <Typography component="span" variant="body2" color="textPrimary">
                        Result:
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(result.result, null, 2)}
                      </Typography>
                    </>}/>
              </ListItem>
            </Paper>))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>Failed Tests ({testErrors.length})</Typography>
        <List>
          {testErrors.map((error, index) => (<Paper key={index} elevation={2} sx={{ mb: 2, p: 2 }}>
              <ListItem sx={{ cursor: 'pointer' }} onClick={() => selectExpression(error)}>
                <ListItemText primary={`${error.dataPoint} (ID: ${error.id})`} secondary={<>
                      <Typography component="span" variant="body2" color="textPrimary">
                        Original SQL:
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {error.originalSql}
                      </Typography>
                      
                      <Typography component="span" variant="body2" color="textPrimary">
                        Fixed SQL (with error):
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {error.sql}
                      </Typography>
                      
                      <Typography component="span" variant="body2" color="error">
                        Error:
                      </Typography>
                      <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', color: 'red' }}>
                        {error.error}
                      </Typography>
                    </>}/>
              </ListItem>
            </Paper>))}
        </List>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>Edit SQL Expression</Typography>
        {selectedExpression ? (<>
            <Typography variant="subtitle1">
              {selectedExpression.dataPoint} (ID: {selectedExpression.id})
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Original SQL:</Typography>
            <Typography component="pre" variant="body2" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px' }}>
              {selectedExpression.originalSql || selectedExpression.sql}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Edit SQL:</Typography>
            <TextField fullWidth multiline rows={6} variant="outlined" value={editedSql} onChange={(e) => setEditedSql(e.target.value)} sx={{ mb: 2 }}/>
            
            <Button variant="contained" color="primary" onClick={updateSqlExpression} disabled={loading}>
              Update SQL Expression
            </Button>
            
            {updateStatus && (<Alert severity="success" sx={{ mt: 2 }}>{updateStatus}</Alert>)}
            
            {updateError && (<Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>)}
          </>) : (<Typography>
            Select an expression from the Successful or Failed tabs to edit it.
          </Typography>)}
      </TabPanel>
    </div>);
}
