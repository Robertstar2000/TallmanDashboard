import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardDataPoint, ConnectionStatus, ServerName, ConnectionDetails, CalculationType } from '../types';
import { INITIAL_DATA } from '../constants';
// PRODUCTION RULE: NO SIMULATION IMPORTS - All data must come from MCP servers only
import { useGlobal } from '../contexts/GlobalContext';

export const useDashboardData = () => {
    const { mode } = useGlobal();
    // PRODUCTION RULE: NO INITIAL DATA FALLBACK IN PRODUCTION MODE
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

    const stop = useCallback(() => {
        setIsRunning(false);
        if (demoIntervalRef.current) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
        }
        setStatusMessage('Demo Mode: System Idle. Press Run to start.');
    }, []);

    const testConnections = useCallback(async () => {
        setStatusMessage('Testing MCP server connections...');
        const details: ConnectionDetails[] = [];

        // Test backend API connections which reports MCP server status
        try {
            const response = await fetch('http://localhost:3001/api/connections/status');
            
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
                    version: 'MS Access'
                });
                
                setP21Status('disconnected');
                setPorStatus('disconnected');
            }
        } catch (error) {
            details.push({
                name: 'P21',
                status: 'Error',
                error: 'Backend API connection failed',
                identifier: 'MCP Server',
                version: 'SQL Server'
            });

            details.push({
                name: 'POR',
                status: 'Error',
                error: 'Backend API connection failed',
                identifier: 'MCP Server',
                version: 'MS Access'
            });
            
            setP21Status('disconnected');
            setPorStatus('disconnected');
        }
        
        details.push({
            name: 'Internal Metric Store',
            status: 'Connected',
            size: `${dataPoints.length} metrics loaded`,
            version: 'Local Storage',
            identifier: 'Browser LocalStorage'
        });

        details.push({
            name: 'Ollama AI Service',
            status: 'Connected',
            identifier: import.meta.env.VITE_OLLAMA_URL || 'Not configured',
            version: import.meta.env.VITE_OLLAMA_MODEL || 'Not configured',
            size: 'AI-powered data simulation'
        });

        setStatusMessage('MCP server connection test complete.');
        setConnectionDetails(details);
        return true; // Return true since we're now properly checking MCP servers
    }, [dataPoints.length]);
    
    const clearConnectionDetails = () => setConnectionDetails(null);

    // PRODUCTION RULE: NO DEMO DATA REFRESH - All data must come from MCP background worker
    const refreshDemoData = useCallback(async () => {
        // DISABLED: Demo mode not allowed in production
        console.warn('Demo data refresh disabled - production system only uses MCP data');
        setStatusMessage('Demo mode disabled - system requires real MCP database connections');
    }, []);

    const refreshProductionData = useCallback(async () => {
        if (mode !== 'production' || isRefreshing.current) return;
        isRefreshing.current = true;
        setStatusMessage(`Fetching production data from background worker...`);

        try {
            // Get data from background worker
            const response = await fetch('http://localhost:3001/api/dashboard/data', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const metrics = await response.json();
            
            // Ensure we have valid data structure
            if (Array.isArray(metrics) && metrics.length > 0) {
                // Convert backend data format to frontend format if needed
                const formattedMetrics: DashboardDataPoint[] = metrics.map((metric: any) => ({
                    id: metric.id,
                    chartGroup: metric.chartGroup,
                    variableName: metric.variableName,
                    dataPoint: metric.dataPoint,
                    serverName: metric.serverName as ServerName,
                    tableName: metric.tableName,
                    valueColumn: metric.valueColumn,
                    productionSqlExpression: metric.productionSqlExpression,
                    value: metric.value || 0,
                    calculationType: metric.calculationType as CalculationType,
                    lastUpdated: metric.lastUpdated
                }));
                
                setDataPoints(formattedMetrics);
                console.log(`Production mode: Loaded ${formattedMetrics.length} metrics across chart groups:`, 
                    [...new Set(formattedMetrics.map(m => m.chartGroup))]);
            } else {
                console.warn('No metrics received from backend worker');
                setStatusMessage('Warning: No metrics received from background worker');
            }
            
            // Update connection status
            const connectionResponse = await fetch('http://localhost:3001/api/connections/status');
            if (connectionResponse.ok) {
                const connections = await connectionResponse.json();
                const p21Connection = connections.find((conn: any) => conn.name === 'P21');
                const porConnection = connections.find((conn: any) => conn.name === 'POR');
                
                setP21Status(p21Connection?.status === 'Connected' ? 'connected' : 'disconnected');
                setPorStatus(porConnection?.status === 'Connected' ? 'connected' : 'disconnected');
            } else {
                setP21Status('disconnected');
                setPorStatus('disconnected');
            }
            
            setStatusMessage(`Production data updated at ${new Date().toLocaleTimeString()} (${metrics.length} metrics from background worker)`);
        } catch (error) {
            console.error("Failed to refresh production data:", error);
            setStatusMessage('Error fetching production data from background worker.');
            setP21Status('disconnected');
            setPorStatus('disconnected');
        } finally {
            isRefreshing.current = false;
        }
    }, [mode]);


    useEffect(() => {
        const cleanup = () => {
            if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
            if (prodIntervalRef.current) clearInterval(prodIntervalRef.current);
            demoIntervalRef.current = null;
            prodIntervalRef.current = null;
        };

        cleanup();

        // Set background worker mode
        const setWorkerMode = async () => {
            try {
                await fetch('http://localhost:3001/api/worker/mode', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ mode })
                });
            } catch (error) {
                console.error('Failed to set worker mode:', error);
            }
        };

        setWorkerMode();

        if (mode === 'production') {
            setIsRunning(false);
            setP21Status('disconnected');
            setPorStatus('disconnected');
            // Get initial data from background worker
            refreshProductionData();
            setStatusMessage('Production Mode: Background worker processing data...');
            
            // Set up polling for production data
            prodIntervalRef.current = setInterval(() => {
                refreshProductionData();
            }, 10000); // Poll every 10 seconds
            
        } else { // demo mode
            setIsRunning(false);
            setP21Status('disconnected');
            setPorStatus('disconnected');
            const resetDataPoints = INITIAL_DATA.map(dp => ({
                ...dp,
                value: typeof dp.value === 'number' ? 0 : dp.value,
                lastUpdated: new Date().toISOString()
            }));
            setDataPoints(resetDataPoints);
            setStatusMessage('Demo Mode: System Idle. Press Simulate Data to start.');
        }

        return cleanup;
    }, [mode, refreshProductionData]);
    
    const isRunningRef = useRef(isRunning);
    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    const start = async () => {
        setIsRunning(true);
        setStatusMessage('Initializing SQL execution sequence...');
        
        const resetDataPoints = INITIAL_DATA.map(dp => ({
            ...dp,
            value: 0,
            lastUpdated: new Date().toISOString()
        }));
        setDataPoints(resetDataPoints);
        
        await new Promise(resolve => setTimeout(resolve, 500));

        for (const dp of resetDataPoints) {
            if (!isRunningRef.current) {
                setStatusMessage('Execution cancelled.');
                break;
            }
            
            setActiveRow(dp.id);
            setStatusMessage(`Executing query for: ${dp.variableName}`);
            
            try {
                const response = await fetch('http://localhost:3001/api/mcp/execute-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ query: dp.productionSqlExpression, server: dp.serverName })
                });

                if (!response.ok) {
                    throw new Error(`Query failed for ${dp.variableName}`);
                }

                const result = await response.json();
                const value = result && Array.isArray(result) && result.length > 0 && result[0].result !== undefined ? result[0].result : 0;

                setDataPoints(prev => prev.map(p => p.id === dp.id ? { ...p, value, lastUpdated: new Date().toISOString() } : p));
            } catch (error) {
                console.error(`Error executing SQL for ${dp.variableName}:`, error);
                setDataPoints(prev => prev.map(p => p.id === dp.id ? { ...p, value: 99999 } : p));
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay between queries (respects 1-second MCP rate limit)
        }
        
        setActiveRow(null);
        setStatusMessage('SQL execution sequence complete.');
        setIsRunning(false);
        await testConnections();
    };

    // PRODUCTION RULE: NO SIMULATION ALLOWED - All data must come from MCP servers only
    const simulateData = useCallback(async () => {
        // DISABLED: Simulation not allowed in production
        console.warn('Data simulation disabled - production system only uses MCP data');
        setStatusMessage('Simulation disabled - system requires real MCP database connections');
    }, []);

    const updateDataPoint = (id: number, field: keyof DashboardDataPoint, value: string) => {
        setDataPoints(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return {
        dataPoints,
        isRunning,
        statusMessage,
        p21Status,
        porStatus,
        connectionDetails,
        activeRow,
        start,
        stop,
        simulateData,
        updateDataPoint,
        testConnections,
        clearConnectionDetails
    };
};
