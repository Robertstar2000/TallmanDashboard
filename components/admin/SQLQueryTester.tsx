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

export default function SQLQueryTester({ initialPorPath = '' }: SQLQueryTesterProps) {
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [targetDatabase, setTargetDatabase] = useState<'P21' | 'POR'>('P21');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

      <Button onClick={handleExecuteQuery} disabled={isLoading || (targetDatabase === 'POR' && !porFilePath.trim())}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Execute Query
      </Button>

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
