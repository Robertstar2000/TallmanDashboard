'use client';

import { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Paper } from '@mui/material';
import Link from 'next/link';
import { dashboardData as initialSpreadsheetData } from '@/lib/db/single-source-data';

export default function TestSQLPage() {
  const [serverType, setServerType] = useState('POR');
  const [sqlExpression, setSqlExpression] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [porTables, setPorTables] = useState<string[]>([]);
  const [selectedExpression, setSelectedExpression] = useState('');

  // Get POR tables on page load
  useEffect(() => {
    const fetchPorTables = async () => {
      try {
        const response = await fetch('/api/test-sql');
        const data = await response.json();
        
        if (data.tables) {
          // Extract table names from the response
          const tableNames = data.tables.map((table: any) => table.TableName || table.value);
          setPorTables(tableNames);
        } else if (data.error) {
          setError(`Error fetching POR tables: ${data.error}`);
        }
      } catch (err: any) {
        setError(`Error fetching POR tables: ${err.message}`);
      }
    };

    fetchPorTables();
  }, []);

  // Filter expressions by server type
  const filteredExpressions = initialSpreadsheetData.filter(
    item => item.serverName === serverType
  );

  // Execute SQL expression
  const executeSQL = async () => {
    if (!sqlExpression) {
      setError('Please enter an SQL expression');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sqlExpression,
          serverType
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result);
      }
    } catch (err: any) {
      setError(`Error executing SQL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle expression selection
  const handleExpressionChange = (event: any) => {
    const expressionId = event.target.value;
    setSelectedExpression(expressionId);
    
    if (expressionId) {
      const selectedExpr = initialSpreadsheetData.find(item => item.id === expressionId);
      if (selectedExpr && selectedExpr.productionSqlExpression) {
        setSqlExpression(selectedExpr.productionSqlExpression);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">SQL Expression Test Tool</Typography>
        <Link href="/">
          <Button variant="contained" color="primary">
            Return to Dashboard
          </Button>
        </Link>
      </Box>

      <Paper elevation={3} className="p-4 mb-4">
        <Box mb={3}>
          <FormControl fullWidth variant="outlined" className="mb-4">
            <InputLabel>Server Type</InputLabel>
            <Select
              value={serverType}
              onChange={(e) => {
                setServerType(e.target.value);
                setSelectedExpression('');
                setSqlExpression('');
              }}
              label="Server Type"
            >
              <MenuItem value="P21">P21</MenuItem>
              <MenuItem value="POR">POR</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" className="mb-4">
            <InputLabel>Select SQL Expression</InputLabel>
            <Select
              value={selectedExpression}
              onChange={handleExpressionChange}
              label="Select SQL Expression"
            >
              <MenuItem value="">-- Select an expression --</MenuItem>
              {filteredExpressions.map((expr) => (
                <MenuItem key={expr.id} value={expr.id}>
                  {expr.DataPoint} (ID: {expr.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {serverType === 'POR' && (
            <Box mb={3}>
              <Typography variant="h6">Available POR Tables:</Typography>
              <Box className="border p-2 mt-2 max-h-40 overflow-y-auto">
                {porTables.length > 0 ? (
                  <ul>
                    {porTables.map((table, index) => (
                      <li key={index}>{table}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography>No tables found or still loading...</Typography>
                )}
              </Box>
            </Box>
          )}

          <TextField
            label="SQL Expression"
            variant="outlined"
            value={sqlExpression}
            onChange={(e) => setSqlExpression(e.target.value)}
            placeholder="Enter SQL expression"
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={executeSQL}
            disabled={loading || !sqlExpression}
            className="mt-4"
          >
            {loading ? 'Executing...' : 'Execute SQL'}
          </Button>
        </Box>

        {error && (
          <Box className="p-4 bg-red-100 text-red-700 rounded mb-4">
            <Typography variant="h6">Error:</Typography>
            <pre>{error}</pre>
          </Box>
        )}

        {result && (
          <Box className="mt-4">
            <Typography variant="h6">Result:</Typography>
            <Box className="border p-4 rounded bg-gray-50 overflow-x-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
}
