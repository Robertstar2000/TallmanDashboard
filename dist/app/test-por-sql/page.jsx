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
import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import Link from 'next/link';
export default function TestPORSQLPage() {
    const [results, setResults] = useState([]);
    const [errors, setErrors] = useState([]);
    const [porFilePath, setPorFilePath] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    useEffect(() => {
        const fetchResults = () => __awaiter(this, void 0, void 0, function* () {
            try {
                setLoading(true);
                const response = yield fetch('/api/test-por-sql');
                const data = yield response.json();
                if (data.error) {
                    setApiError(data.error);
                }
                else {
                    setResults(data.results || []);
                    setErrors(data.errors || []);
                    setPorFilePath(data.porFilePath || '');
                    setAvailableTables(data.availableTables || []);
                }
            }
            catch (err) {
                setApiError(`Error fetching results: ${err.message}`);
            }
            finally {
                setLoading(false);
            }
        });
        fetchResults();
    }, []);
    return (<div className="container mx-auto p-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">POR SQL Test Results (Jet SQL)</Typography>
        <Link href="/">
          <Button variant="contained" color="primary">
            Return to Dashboard
          </Button>
        </Link>
      </Box>

      {loading ? (<Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>) : (<>
          {apiError && (<Paper elevation={3} className="p-4 mb-4 bg-red-100">
              <Typography variant="h6" color="error">API Error:</Typography>
              <Typography>{apiError}</Typography>
            </Paper>)}

          <Paper elevation={3} className="p-4 mb-4">
            <Typography variant="h6">POR File Path:</Typography>
            <Typography className="font-mono">{porFilePath}</Typography>
          </Paper>

          <Paper elevation={3} className="p-4 mb-4">
            <Typography variant="h6">Available Tables:</Typography>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {availableTables.map((table, index) => (<div key={index} className="font-mono text-sm bg-gray-100 p-1 rounded">
                  {table}
                </div>))}
            </div>
          </Paper>

          <Paper elevation={3} className="p-4 mb-4">
            <Typography variant="h5" gutterBottom>Successful Queries</Typography>
            {results.length > 0 ? (results.map((result, index) => (<Box key={index} className="border p-3 rounded mb-3">
                  <Typography variant="h6">{result.description} (ID: {result.id})</Typography>
                  <Box className="bg-gray-100 p-2 rounded my-2">
                    <Typography variant="subtitle2">SQL:</Typography>
                    <pre className="whitespace-pre-wrap font-mono text-sm">{result.sql}</pre>
                  </Box>
                  {result.originalSql && (<Box className="bg-gray-50 p-2 rounded my-2">
                      <Typography variant="subtitle2">Original SQL:</Typography>
                      <pre className="whitespace-pre-wrap font-mono text-sm">{result.originalSql}</pre>
                    </Box>)}
                  <Typography variant="subtitle2">Result:</Typography>
                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto font-mono text-sm">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </Box>))) : (<Typography>No successful queries.</Typography>)}
          </Paper>

          {errors.length > 0 && (<Paper elevation={3} className="p-4 mb-4">
              <Typography variant="h5" gutterBottom color="error">Failed Queries</Typography>
              {errors.map((error, index) => (<Box key={index} className="border border-red-300 p-3 rounded mb-3">
                  <Typography variant="h6">{error.description} (ID: {error.id})</Typography>
                  <Box className="bg-gray-100 p-2 rounded my-2">
                    <Typography variant="subtitle2">SQL:</Typography>
                    <pre className="whitespace-pre-wrap font-mono text-sm">{error.sql}</pre>
                  </Box>
                  <Typography variant="subtitle2" color="error">Error:</Typography>
                  <pre className="bg-red-50 p-2 rounded overflow-x-auto font-mono text-sm">
                    {error.error}
                  </pre>
                </Box>))}
            </Paper>)}
        </>)}
    </div>);
}
