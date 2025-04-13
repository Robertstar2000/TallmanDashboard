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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
export default function TestP21QueryPage() {
    const [query, setQuery] = useState("SELECT COUNT(*) AS value FROM P21.dbo.oe_hdr WITH (NOLOCK)");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);
    const executeQuery = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        setResult(null);
        setRawResponse(null);
        try {
            const response = yield fetch('/api/executeQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'P21',
                    query: query
                }),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`API request failed: ${errorText}`);
            }
            const data = yield response.json();
            setRawResponse(data);
            if (!data.success) {
                throw new Error(data.message || 'Query execution failed');
            }
            if (data.data && data.data.length > 0) {
                const firstRow = data.data[0];
                setResult(firstRow);
            }
            else {
                setResult({ value: 'No data returned' });
            }
        }
        catch (err) {
            console.error('Error executing P21 query:', err);
            setError(err.message || 'An unknown error occurred');
        }
        finally {
            setLoading(false);
        }
    });
    return (<div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">P21 Query Test Tool</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>P21 SQL Query</CardTitle>
            <CardDescription>Enter a SQL query to execute against the P21 database</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter SQL query..." className="min-h-[100px] font-mono text-sm"/>
          </CardContent>
          <CardFooter>
            <Button onClick={executeQuery} disabled={loading || !query.trim()} className="w-full">
              {loading ? 'Executing...' : 'Execute Query'}
            </Button>
          </CardFooter>
        </Card>
        
        {error && (<Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>)}
        
        {result && (<Card>
            <CardHeader>
              <CardTitle>Query Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md">
                <h3 className="font-semibold mb-2">First Row:</h3>
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>)}
        
        {rawResponse && (<Card>
            <CardHeader>
              <CardTitle>Raw API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>);
}
