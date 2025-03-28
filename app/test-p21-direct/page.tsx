'use client';

import { useState, useEffect } from 'react';

export default function TestP21DirectPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-p21-direct');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Test failed');
      }
      
      setResults(data.results);
    } catch (err: any) {
      console.error('Error testing P21 connection:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">P21 Direct Connection Test</h1>
      
      <button 
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Running Tests...' : 'Run Direct P21 Tests'}
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">ConnectionManager Result:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(results.connectionManager, null, 2)}
              </pre>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">P21 Service Result:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {results.p21Service}
              </pre>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Admin executeProductionQuery Result:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {results.adminExecuteProduction}
              </pre>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Raw Results:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(results.rawResults, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
