"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; 

interface SQLQueryTesterProps {
  initialPorPath?: string;
}

interface QueryResult {
  success: boolean;
  data?: any[]; 
  columns?: string[]; 
  error?: string;
  message?: string;
  executionTime?: number; 
}

interface SchemaTestResult {
  name: string; // Table or Column name
  status: 'success' | 'failure' | 'pending';
  error?: string;
}

export default function SQLQueryTester({ initialPorPath = '' }: SQLQueryTesterProps) {
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [targetDatabase, setTargetDatabase] = useState<'P21' | 'POR'>('P21');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isSchemaTesting, setIsSchemaTesting] = useState<boolean>(false);
  const [schemaTestResults, setSchemaTestResults] = useState<SchemaTestResult[] | null>(null);

  const [porFilePath, setPorFilePath] = useState<string>(initialPorPath);
  const [porPassword, setPorPassword] = useState<string>('');

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      setQueryResult({ success: false, error: "SQL query cannot be empty." });
      return;
    }
    if (targetDatabase === 'POR' && !porFilePath.trim()) {
        setQueryResult({ success: false, error: "POR File Path cannot be empty when target is POR." });
        return;
    }

    setIsLoading(true);
    setQueryResult(null); 

    console.log(`Executing query on ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`);

    const requestBody: any = {
      sqlQuery: sqlQuery,
      targetDatabase: targetDatabase,
    };
    if (targetDatabase === 'POR') {
      requestBody.porFilePath = porFilePath;
      if (porPassword) { 
          requestBody.porPassword = porPassword;
      }
    }

    try {
        const response = await fetch('/api/admin/run-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody), 
        });

        const resultData: QueryResult = await response.json();
        console.log("API Response:", resultData);

        if (!response.ok) {
            setQueryResult({
                success: false,
                error: resultData.error || `API Error: ${response.status} ${response.statusText}`,
             });
        } else {
             setQueryResult(resultData); 
        }

    } catch (error) {
      console.error("Error executing query via API:", error);
      setQueryResult({
          success: false,
          error: error instanceof Error ? `Network/Fetch Error: ${error.message}` : "An unknown error occurred while contacting the API.",
      });
    } finally {
       setIsLoading(false);
    }
  };

  const handleSchemaTest = async () => {
    if (!sqlQuery.trim()) {
      console.log("Cannot test schema: SQL query is empty.");
      return;
    }
    setIsSchemaTesting(true);
    setSchemaTestResults(null); // Clear previous results
    console.log(`Starting schema test for ${targetDatabase}: ${sqlQuery.substring(0, 100)}...`);

    const queryToParse = sqlQuery.replace(/(--.*)|(\/\*[\s\S]*?\*\/)/g, ''); // Remove comments
    let primaryTable = '';
    const tables = new Set<string>();
    const columns = new Set<string>();

    const tableRegex = /(?:FROM|JOIN)\s+([a-zA-Z0-9_\.]+)/gi;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(queryToParse)) !== null) {
      const tableName = tableMatch[1];
      tables.add(tableName);
      if (!primaryTable && tableRegex.lastIndex > queryToParse.toUpperCase().indexOf('FROM')) { 
         primaryTable = tableName;
      }
    }
    
    // Extract columns (SELECT ... FROM)
    // Remove 's' flag to avoid ES2018+ requirement - less robust for multiline selects
    const selectClauseMatch = queryToParse.match(/SELECT\s+(.*?)\s+FROM/i); 
    if (selectClauseMatch && selectClauseMatch[1]) {
        const columnList = selectClauseMatch[1].split(',');
        columnList.forEach(col => {
            const cleanCol = col.trim().split(/\s+as\s+/i)[0]; 
            if (cleanCol && cleanCol !== '*') { 
                 columns.add(cleanCol.split('.').pop() || cleanCol); 
            }
        });
    }

    const extractedElements = [
        ...Array.from(tables).map(t => ({ name: t, type: 'table' as const })),
        ...Array.from(columns).map(c => ({ name: c, type: 'column' as const }))
    ];

    if (extractedElements.length === 0) {
        console.log("No tables or columns found to test.");
        setSchemaTestResults([{ name: 'N/A', status: 'failure', error: 'Could not parse tables/columns from query.' }]);
        setIsSchemaTesting(false);
        return;
    }

    const initialResults: SchemaTestResult[] = extractedElements.map(el => ({ name: el.name, status: 'pending' }));
    setSchemaTestResults(initialResults);

    for (let i = 0; i < extractedElements.length; i++) {
      const element = extractedElements[i];
      const updateResult = (status: 'success' | 'failure', error?: string) => {
        setSchemaTestResults(prevResults => 
          prevResults!.map((r, index) => index === i ? { ...r, status, error } : r)
        );
      }

      let testQuery = '';
      const elementName = element.name;
      const isP21 = targetDatabase === 'P21';

      if (element.type === 'table') {
          testQuery = isP21 
              ? `SELECT TOP 1 1 FROM ${elementName} WITH (NOLOCK)`
              : `SELECT TOP 1 1 FROM [${elementName}]`;
      } else if (element.type === 'column' && primaryTable) { 
          testQuery = isP21
              ? `SELECT TOP 1 ${elementName} FROM ${primaryTable} WITH (NOLOCK)`
              : `SELECT TOP 1 [${elementName}] FROM [${primaryTable}]`;
      } else {
          console.log(`Skipping test for column ${elementName} - primary table unclear.`);
          updateResult('failure', 'Primary table unclear');
          continue; 
      }

      console.log(`Testing ${element.type}: ${elementName} with query: ${testQuery}`);

      const requestBody: any = {
          sqlQuery: testQuery,
          targetDatabase: targetDatabase,
      };
      if (targetDatabase === 'POR') {
          if (!porFilePath.trim()) {
              updateResult('failure', 'POR File Path missing');
              continue;
          }
          requestBody.porFilePath = porFilePath;
          if (porPassword) { 
              requestBody.porPassword = porPassword;
          }
      }

      try {
          const response = await fetch('/api/admin/run-query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody), 
          });
          const resultData: QueryResult = await response.json();

          if (resultData.success) {
              updateResult('success');
          } else {
              updateResult('failure', resultData.error || 'API Error');
          }
      } catch (error) {
          console.error(`Error testing ${elementName}:`, error);
          updateResult('failure', error instanceof Error ? error.message : 'Fetch Error');
      }
    }

    console.log("Schema test finished.");
    setIsSchemaTesting(false);
  };

  const renderCellData = (data: any) => {
    if (data === null || data === undefined) return <span className="text-gray-400 italic">NULL</span>;
    if (typeof data === 'object') return JSON.stringify(data); 
    if (typeof data === 'boolean') return data ? 'True' : 'False';
    return String(data);
  };

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className='space-y-1'>
          <Label htmlFor="target-db">Target Database</Label>
          <Select value={targetDatabase} onValueChange={(value: 'P21' | 'POR') => setTargetDatabase(value)}>
            <SelectTrigger id="target-db">
              <SelectValue placeholder="Select Database" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P21">P21 (SQL Server via DSN)</SelectItem>
              <SelectItem value="POR">POR (MS Access)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetDatabase === 'POR' && (
          <>
             <div className='space-y-1'>
               <Label htmlFor="por-filePath">POR File Path</Label>
               <Input
                 id="por-filePath"
                 name="porFilePath"
                 value={porFilePath}
                 onChange={(e) => setPorFilePath(e.target.value)}
                 placeholder="e.g., C:\\Data\\database.mdb"
               />
                <Badge variant="outline" className="text-xs font-normal">Temporary Input</Badge>
             </div>
             <div className='space-y-1'>
               <Label htmlFor="por-password">POR Password (Optional)</Label>
               <Input
                 id="por-password"
                 name="porPassword"
                 type="password"
                 value={porPassword}
                 onChange={(e) => setPorPassword(e.target.value)}
                 placeholder="Leave blank if none"
               />
             </div>
          </>
        )}
        {targetDatabase === 'P21' && <div className="md:col-span-2"></div>}
      </div>

      <div>
        <Label htmlFor="sql-query">SQL Query (Read-Only)</Label>
        <Textarea
          id="sql-query"
          placeholder={
            targetDatabase === 'P21'
            ? "Enter P21 SQL query (e.g., SELECT TOP 10 * FROM dbo.oe_hdr WITH (NOLOCK))"
            : "Enter POR SQL query (e.g., SELECT TOP 10 * FROM [Some Table])"
           }
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          rows={8}
          className="font-mono text-sm mt-1"
        />
         <p className="text-xs text-muted-foreground mt-1">Only SELECT statements are permitted.</p>
      </div>

      <div className="flex space-x-2">
          <Button onClick={handleExecuteQuery} disabled={isLoading || isSchemaTesting || (targetDatabase === 'POR' && !porFilePath.trim())}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Execute Query
          </Button>
          <Button 
            onClick={handleSchemaTest}
            disabled={isLoading || isSchemaTesting || !sqlQuery.trim()} 
            variant="outline"
          >
            {isSchemaTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Schema Elements
          </Button>
      </div>

      {schemaTestResults && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Schema Test Results</h3>
          <ul className="space-y-1 text-sm">
            {schemaTestResults.map((result, index) => (
              <li key={index} className="flex items-center space-x-2">
                {result.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {result.status === 'success' && <span className="text-green-600">✔️</span>}
                {result.status === 'failure' && <span className="text-red-600">❌</span>}
                <span>{result.name}</span>
                {result.status === 'failure' && result.error && (
                  <span className="text-red-500 text-xs">({result.error})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {queryResult && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Query Results</h3>
          {queryResult.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{queryResult.error}</AlertDescription>
            </Alert>
          )}
          {queryResult.message && (
             <Alert variant={queryResult.success ? "default" : "destructive"} className="mb-4">
              <AlertTitle>{queryResult.success ? "Info" : "Status"}</AlertTitle>
              <AlertDescription>
                  {queryResult.message}
                  {queryResult.executionTime !== undefined && ` (Execution Time: ${queryResult.executionTime}ms)`}
                </AlertDescription>
            </Alert>
          )}

          {queryResult.success && queryResult.data && queryResult.columns && queryResult.data.length > 0 && (
            <div className="overflow-x-auto border rounded-md max-h-96"> 
              <Table>
                <TableHeader className="sticky top-0 bg-muted"> 
                  <TableRow>
                    {queryResult.columns.map((colName) => (
                      <TableHead key={colName}>{colName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {queryResult.columns!.map((colName) => (
                        <TableCell key={`${rowIndex}-${colName}`} className="text-xs whitespace-nowrap"> 
                           {renderCellData(row[colName])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {queryResult.success && queryResult.data && queryResult.data.length === 0 && (
               <p className="text-muted-foreground">Query executed successfully, but returned no rows.</p>
           )}
        </div>
      )}
    </div>
  );
}
