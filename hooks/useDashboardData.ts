import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardDataPoint, ConnectionStatus, ServerName, ConnectionDetails, CalculationType } from '../types';
import { INITIAL_DATA } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';

export const useDashboardData = () => {
    const { mode } = useGlobal();
    
    // PRODUCTION RULE: NO MOCK DATA - All data comes from MCP servers
    // Initialize with empty array - data will be fetched from MCP servers
    const [dataPoints, setDataPoints] = useState<DashboardDataPoint[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [statusMessage, setStatusMessage] = useState('System Idle.');
    const [p21Status, setP21Status] = useState<ConnectionStatus>('disconnected');
    const [porStatus, setPorStatus] = useState<ConnectionStatus>('disconnected');
    const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails[] | null>(null);
    const [activeRow, setActiveRow] = useState<number | null>(null);
    
    const demoIntervalRef = useRef<number | null>(null);
    const prodIntervalRef = useRef<number | null>(null);
    const isRefreshing = useRef(false);

    const stop = useCallback(async () => {
        // Stop periodic refresh timers on the client
        setIsRunning(false);
        if (demoIntervalRef.current) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
        }
        if (prodIntervalRef.current) {
            clearInterval(prodIntervalRef.current);
            prodIntervalRef.current = null;
        }

        // Ask backend to stop its background worker
        try {
            const token = sessionStorage.getItem('jwt_token');
            await fetch('http://localhost:3001/api/worker/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            setStatusMessage('Background worker stopped. System Idle. Press Run to start.');
        } catch (err) {
            console.error('Failed to stop background worker:', err);
            setStatusMessage('Attempted to stop background worker.');
        }
    }, []);

    const testConnections = useCallback(async () => {
        setStatusMessage('Testing MCP server connections...');
        const details: ConnectionDetails[] = [];

        // Test backend API connections which reports MCP server status
        try {
            const token = sessionStorage.getItem('jwt_token');
            const response = await fetch('http://localhost:3001/api/connections/status', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                const connections = await response.json();
                details.push(...connections);
                
                // Update connection status based on backend response
                const p21Connection = connections.find((conn: any) => conn.name === 'P21');
                const porConnection = connections.find((conn: any) => conn.name === 'POR');
                
                setP21Status(p21Connection?.status === 'Connected' ? 'connected' : 'disconnected');
                setPorStatus(porConnection?.status === 'Connected' ? 'connected' : 'disconnected');
            } else {
                details.push({
                    name: 'P21',
                    status: 'Error',
                    error: 'Backend API not available',
                    identifier: 'MCP Server',
                    version: 'SQL Server'
                });
                details.push({
                    name: 'POR',
                    status: 'Error',
                    error: 'Backend API not available',
                    identifier: 'MCP Server',
                    version: 'SQL Server'
                });
                setP21Status('disconnected');
                setPorStatus('disconnected');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            details.push({
                name: 'Backend API',
                status: 'Error',
                error: error instanceof Error ? error.message : 'Unknown error',
                identifier: 'API',
                version: 'N/A'
            });
            setP21Status('disconnected');
            setPorStatus('disconnected');
        }

        setConnectionDetails(details);
        return details;
    }, []);

    // Update a single field of a data point by id
    const updateDataPoint = useCallback((id: number, field: keyof DashboardDataPoint, value: string) => {
        setDataPoints(prev => prev.map(dp => dp.id === id ? { ...dp, [field]: value } as DashboardDataPoint : dp));
    }, []);

    // Clear connection details (used when closing modal)
    const clearConnectionDetails = useCallback(() => {
        setConnectionDetails(null);
    }, []);

    const fetchDataFromMCP = useCallback(async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;

        try {
            setStatusMessage('Fetching data from MCP servers...');
            
            // Fetch data from backend API which queries MCP servers
            const token = sessionStorage.getItem('jwt_token');
            const response = await fetch('http://localhost:3001/api/dashboard/data', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            
            if (response.ok) {
                const mcpData = await response.json();
                
                // Transform MCP data to dashboard data points
                const transformedData: DashboardDataPoint[] = mcpData.map((item: any, index: number) => ({
                    id: item.id || index + 1,
                    chartGroup: item.chartGroup || 'KEY_METRICS',
                    variableName: item.variableName || `Variable_${index + 1}`,
                    dataPoint: item.dataPoint || item.name || 'Unknown Metric',
                    serverName: item.serverName || 'P21',
                    tableName: item.tableName || 'unknown',
                    productionSqlExpression: item.productionSqlExpression || 'SELECT 1',
                    value: item.value || 0,
                    calculationType: item.calculationType || 'COUNT',
                    lastUpdated: item.lastUpdated || new Date().toISOString(),
                    valueColumn: item.valueColumn || 'value',
                    month: item.month
                }));

                setDataPoints(transformedData);
                setStatusMessage(`Successfully loaded ${transformedData.length} data points from MCP servers.`);
            } else {
                if (response.status === 401 || response.status === 403) {
                    setStatusMessage('Unauthorized to fetch dashboard data. Please log in again.');
                } else {
                    console.error('Failed to fetch MCP data:', response.status, response.statusText);
                    setStatusMessage('Failed to fetch data from MCP servers. Charts will display zero values.');
                }
                // Set empty data points so charts display zero
                setDataPoints([]);
            }
        } catch (error) {
            console.error('Error fetching MCP data:', error);
            setStatusMessage('Error connecting to MCP servers. Charts will display zero values.');
            // Set empty data points so charts display zero
            setDataPoints([]);
        } finally {
            isRefreshing.current = false;
        }
    }, []);

    const run = useCallback(async () => {
        if (isRunning) return;
        
        setIsRunning(true);
        setStatusMessage('Starting data refresh...');
        
        // Test connections first
        await testConnections();
        
        // Ensure backend background worker is running
        try {
            const token = sessionStorage.getItem('jwt_token');
            const resp = await fetch('http://localhost:3001/api/worker/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            if (resp.ok) {
                setStatusMessage('Background worker started. Fetching initial data...');
            } else if (resp.status === 401 || resp.status === 403) {
                setStatusMessage('Unauthorized to start background worker. Please log in again.');
            } else {
                setStatusMessage('Failed to start background worker. Attempting to fetch data anyway...');
            }
        } catch (err) {
            console.error('Failed to start background worker:', err);
            setStatusMessage('Error starting background worker. Attempting to fetch data anyway...');
        }

        // Fetch initial data from MCP servers
        await fetchDataFromMCP();
        
        // Set up periodic refresh for production data
        if (prodIntervalRef.current) {
            clearInterval(prodIntervalRef.current);
        }
        
        prodIntervalRef.current = window.setInterval(async () => {
            await fetchDataFromMCP();
        }, 30000); // Refresh every 30 seconds
        
    }, [isRunning, testConnections, fetchDataFromMCP]);

    const refresh = useCallback(async () => {
        setStatusMessage('Refreshing data...');
        await fetchDataFromMCP();
    }, [fetchDataFromMCP]);

    // Optional: simulate data generation (no-op in production)
    const simulateData = useCallback(() => {
        setStatusMessage('Simulate Data is not available in production mode.');
    }, []);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            if (demoIntervalRef.current) {
                clearInterval(demoIntervalRef.current);
            }
            if (prodIntervalRef.current) {
                clearInterval(prodIntervalRef.current);
            }
        };
    }, []);

    // One-time initial load so Admin/Dashboard show rows even before pressing Run
    useEffect(() => {
        (async () => {
            try {
                setStatusMessage('Initializing... checking connections and loading data');
                await testConnections();
                await fetchDataFromMCP();
                setStatusMessage('Initial data loaded. Press Run to start auto-refresh.');
            } catch (e) {
                // errors are already handled inside helpers
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        dataPoints,
        isRunning,
        statusMessage,
        p21Status,
        porStatus,
        connectionDetails,
        activeRow,
        run,
        start: run,
        stop,
        refresh,
        testConnections,
        updateDataPoint,
        clearConnectionDetails,
        simulateData
    };
};

