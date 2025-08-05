
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ServerName, DashboardDataPoint } from '../types';
import { simulateSqlQuery } from '../services/ollamaService';
import { useGlobal } from '../contexts/GlobalContext';

interface SqlQueryToolProps {
    updateDataPoint: (id: number, field: keyof DashboardDataPoint, value: string) => void;
    dataPoints: DashboardDataPoint[];
}

const ResultDisplay: React.FC<{ data: any, error: string | null }> = ({ data, error }) => {
    if (error) {
        return <div className="mt-4 p-4 bg-red-900/50 text-red-300 rounded-md font-mono text-sm">{error}</div>;
    }
    if (data === null || data === undefined) {
        return <div className="mt-4 p-4 text-text-secondary">No results to display. Run a query or fetch schema information.</div>;
    }

    let content;
    try {
        content = JSON.stringify(data, null, 2);
    } catch {
        content = "Could not serialize result."
    }

    return (
        <pre className="mt-4 p-4 bg-secondary rounded-md text-text-primary whitespace-pre-wrap break-all overflow-auto text-sm max-h-96">
            <code>{content}</code>
        </pre>
    );
};


const SqlQueryTool: React.FC<SqlQueryToolProps> = ({ updateDataPoint, dataPoints }) => {
    const navigate = useNavigate();

    const [selectedServer, setSelectedServer] = useState<ServerName>(ServerName.P21);
    const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM oe_hdr LIMIT 10;');
    const [queryResult, setQueryResult] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [columns, setColumns] = useState<any[]>([]);
    const [targetRowId, setTargetRowId] = useState<string>('');

    const { mode } = useGlobal();

    const runQuery = useCallback(async (query: string, action: 'fetch-tables' | 'fetch-columns' | 'execute-query' | 'test-column') => {
        setIsLoading(true);
        setError(null);
        if (action !== 'fetch-columns') setColumns([]);
        if (action !== 'fetch-tables') setTables([]);
        setQueryResult(null);
        
        try {
            let result;
            
            if (mode === 'demo') {
                // Use simulation for demo mode
                result = await simulateSqlQuery(query, selectedServer);
                if (result.error) {
                    setError(result.error);
                    setQueryResult(null);
                } else {
                    setQueryResult(result);
                    if (action === 'fetch-tables' && Array.isArray(result)) {
                        setTables(result);
                    } else if (action === 'fetch-columns' && Array.isArray(result)) {
                        setColumns(result);
                    }
                }
            } else {
                // Use real MCP servers for production mode
                const response = await fetch('http://localhost:3001/api/mcp/execute-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ 
                        query: query, 
                        server: selectedServer 
                    })
                });

                if (!response.ok) {
                    throw new Error(`Query failed: ${response.status}`);
                }

                result = await response.json();
                setQueryResult(result);

                // Process specific actions for production mode
                if (action === 'fetch-tables' && Array.isArray(result)) {
                    // Extract table names from MCP result
                    const tableNames = result.map(row => Object.values(row)[0]).filter(name => typeof name === 'string');
                    setTables(tableNames);
                } else if (action === 'fetch-columns' && Array.isArray(result)) {
                    // Extract column info from MCP result
                    setColumns(result);
                }
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedServer, mode]);

    const handleFetchTables = () => runQuery('list tables', 'fetch-tables');
    
    const handleTableSelect = (tableName: string) => {
        setSelectedTable(tableName);
        setColumns([]);
        if (tableName) {
            runQuery(`describe ${tableName}`, 'fetch-columns');
        }
    };

    const handleTestColumn = (columnName: string) => {
        if (!selectedTable) return;
        const query = `SELECT COUNT(${columnName}) as data_count FROM ${selectedTable} WHERE ${columnName} IS NOT NULL;`;
        setSqlQuery(query);
        runQuery(query, 'test-column');
    };

    const handleSaveQuery = () => {
        const id = parseInt(targetRowId, 10);
        if (isNaN(id) || !dataPoints.some(dp => dp.id === id)) {
            setError(`Invalid Row ID: ${targetRowId}. Please select a valid row from the dropdown.`);
            return;
        }
        if (!sqlQuery.trim()) {
            setError("Cannot save an empty SQL expression.");
            return;
        }
        updateDataPoint(id, 'productionSqlExpression', sqlQuery);
        alert(`SQL expression for Row ID ${id} has been updated!`);
        navigate('/admin');
    };

    const handleRowSelect = (id: string) => {
        setTargetRowId(id);
        const point = dataPoints.find(dp => dp.id.toString() === id);
        if (point) {
            setSqlQuery(point.productionSqlExpression);
            setSelectedServer(point.serverName);
            setError(null);
        }
    };

    const insertIntoQuery = (text: string) => {
        setSqlQuery(prev => `${prev ? prev + ' ' : ''}${text}`);
    };

    return (
        <div className="bg-primary shadow-xl rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">SQL Query Tool</h2>
                <Link to="/admin" className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-highlight">
                    &larr; Back to Admin
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Schema Explorer */}
                <div className="lg:col-span-1 bg-secondary p-4 rounded-lg space-y-4">
                    <h3 className="font-bold text-text-primary">Schema Explorer</h3>
                    <div>
                        <label htmlFor="server-select" className="block text-sm font-medium text-text-secondary mb-1">Server</label>
                        <select
                            id="server-select"
                            value={selectedServer}
                            onChange={e => setSelectedServer(e.target.value as ServerName)}
                            disabled={isLoading}
                            className="w-full bg-primary p-2 rounded border border-transparent focus:border-accent focus:ring-0 text-sm"
                        >
                            <option value={ServerName.P21}>P21</option>
                            <option value={ServerName.POR}>POR</option>
                        </select>
                    </div>
                    <button onClick={handleFetchTables} disabled={isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                        {isLoading ? 'Loading...' : 'Fetch Tables'}
                    </button>
                    {tables.length > 0 && (
                        <div>
                            <label htmlFor="table-select" className="block text-sm font-medium text-text-secondary mb-1">Tables</label>
                            <select id="table-select" onChange={e => handleTableSelect(e.target.value)} disabled={isLoading} className="w-full bg-primary p-2 rounded border border-transparent focus:border-accent focus:ring-0 text-sm">
                                <option value="">-- Select a table --</option>
                                {tables.map(table => <option key={table} value={table}>{table}</option>)}
                            </select>
                        </div>
                    )}
                    {columns.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-text-secondary mb-1">Columns for <span className="font-bold text-text-primary">{selectedTable}</span></h4>
                            <ul className="bg-primary p-2 rounded-md space-y-1 max-h-60 overflow-y-auto">
                                {columns.map(col => (
                                    <li key={col.column_name} className="flex justify-between items-center text-sm p-1 rounded hover:bg-secondary">
                                        <button onClick={() => insertIntoQuery(col.column_name)} className="text-left flex-grow font-mono text-accent" title="Add to query">
                                            {col.column_name} <span className="text-text-secondary font-sans">({col.data_type})</span>
                                        </button>
                                        <button onClick={() => handleTestColumn(col.column_name)} disabled={isLoading} className="ml-2 px-2 py-0.5 text-xs text-white bg-blue-600/70 rounded hover:bg-blue-600">Test</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Panel: Query and Results */}
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <h3 className="font-bold text-text-primary mb-2">Query Editor</h3>
                        <div className="mb-2">
                             <label htmlFor="row-select" className="block text-sm font-medium text-text-secondary mb-1">Load SQL From Row</label>
                             <select id="row-select" value={targetRowId} onChange={e => handleRowSelect(e.target.value)} className="w-full bg-secondary p-2 rounded border border-transparent focus:border-accent focus:ring-0 text-sm">
                                <option value="">-- Select a row to edit --</option>
                                {dataPoints.map(dp => <option key={dp.id} value={dp.id}>ID: {dp.id} - {dp.dataPoint}</option>)}
                            </select>
                        </div>
                        <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            disabled={isLoading}
                            rows={8}
                            className="w-full bg-secondary p-2 rounded border border-transparent focus:border-accent focus:ring-0 text-sm font-mono"
                            placeholder="Enter your SQL query here..."
                        />
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => runQuery(sqlQuery, 'execute-query')} disabled={isLoading} className="flex-grow px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">
                            {isLoading ? 'Executing...' : 'Execute Query'}
                        </button>
                        <button onClick={handleSaveQuery} disabled={isLoading || !targetRowId} className="flex-grow px-4 py-2 text-sm font-medium text-white bg-highlight rounded-md hover:bg-accent disabled:bg-gray-500 disabled:cursor-not-allowed" title={!targetRowId ? "Select a row to enable saving" : "Save and return to Admin"}>
                            Save to Admin List
                        </button>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">Results</h3>
                         <ResultDisplay data={queryResult} error={error} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SqlQueryTool;
