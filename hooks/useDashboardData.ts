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

    const stop = useCallback(() => {
        setIsRunning(false);
        if (demoIntervalRef.current) {
            clearInterval(demoIntervalRef.current);
            demoIntervalRef.current = null;
        }
        setStatusMessage('System Idle. Press Run to start.');
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

    const fetchDataFromMCP = useCallback(async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;

        try {
            setStatusMessage('Fetching data from MCP servers...');
            
            // Fetch data from backend API which queries MCP servers
            const response = await fetch('http://localhost:3001/api/dashboard/data');
            
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
                console.error('Failed to fetch MCP data:', response.statusText);
                setStatusMessage('Failed to fetch data from MCP servers. Charts will display zero values.');
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

    return {
        dataPoints,
        isRunning,
        statusMessage,
        p21Status,
        porStatus,
        connectionDetails,
        activeRow,
        run,
        stop,
        refresh,
        testConnections
    };
};
