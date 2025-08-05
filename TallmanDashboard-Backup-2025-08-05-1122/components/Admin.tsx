import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardDataPoint, ConnectionStatus, ChartGroup, ConnectionDetails } from '../types';
import { useGlobal } from '../contexts/GlobalContext';
import ConnectionStatusModal from './ConnectionStatusModal';

interface AdminProps {
    dataPoints: DashboardDataPoint[];
    isRunning: boolean;
    activeRow: number | null;
    start: () => void;
    stop: () => void;
    simulateData: () => void;
    updateDataPoint: (id: number, field: keyof DashboardDataPoint, value: string) => void;
    testConnections: () => Promise<boolean>;
    connectionDetails: ConnectionDetails[] | null;
    clearConnectionDetails: () => void;
}

const ModeSwitcher: React.FC = () => {
    const { mode, setMode } = useGlobal();
    const isDemo = mode === 'demo';

    return (
        <div className="flex items-center space-x-2 bg-secondary p-1 rounded-full">
            <button
                onClick={() => setMode('demo')}
                className={`px-3 py-1 text-sm rounded-full ${isDemo ? 'bg-accent text-white' : 'text-text-secondary'}`}
            >
                Demo
            </button>
            <button
                onClick={() => setMode('production')}
                className={`px-3 py-1 text-sm rounded-full ${!isDemo ? 'bg-accent text-white' : 'text-text-secondary'}`}
            >
                Production
            </button>
        </div>
    );
};

const Admin: React.FC<AdminProps> = ({
    dataPoints,
    isRunning,
    activeRow,
    start,
    stop,
    simulateData,
    updateDataPoint,
    testConnections,
    connectionDetails,
    clearConnectionDetails,
}) => {
    const { mode } = useGlobal();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleInputChange = <T extends keyof DashboardDataPoint, >(
        id: number,
        field: T,
        value: DashboardDataPoint[T]
    ) => {
        if (!isRunning) {
            updateDataPoint(id, field, String(value));
        }
    };

    const handleTestConnections = async () => {
        await testConnections();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        clearConnectionDetails();
    };

    const headers = [
      'ID', 'Chart Group', 'Variable Name', 'Data Point', 'Server', 
      'Table Name', 'Production SQL Expression', 'Value', 'Calc Type', 'Last Updated'
    ];
    
    const isProduction = mode === 'production';

    return (
        <div className="bg-primary shadow-xl rounded-lg p-6">
            {isModalOpen && connectionDetails && (
                <ConnectionStatusModal details={connectionDetails} onClose={handleCloseModal} />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-text-primary">Admin Management</h2>
                <div className="flex items-center space-x-2 flex-wrap justify-center">
                     <Link to="/sql-query" className="px-3 py-2 text-sm font-medium text-white bg-highlight rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background">
                        SQL Tool
                    </Link>
                     <Link to="/user-management" className="px-3 py-2 text-sm font-medium text-white bg-highlight rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background">
                        User Management
                    </Link>
                    <ModeSwitcher />
                    <button
                        onClick={handleTestConnections}
                        disabled={!isProduction}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-background disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={isProduction ? "Test live database connections" : "Only available in Production Mode"}
                    >
                        Test Connections
                    </button>
                    <button
                        onClick={start}
                        disabled={isRunning}
                        className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-background disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title="Execute SQL expressions from admin rows using MCP servers"
                    >
                        Run
                    </button>
                    <button
                        onClick={simulateData}
                        disabled={isRunning}
                        className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-background disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title="Generate simulated data using AI"
                    >
                        Simulate Data
                    </button>
                    <button
                        onClick={stop}
                        disabled={!isRunning}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-background disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Stop
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary">
                    <thead className="bg-secondary">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-primary divide-y divide-secondary">
                        {dataPoints.map((row) => (
                            <tr key={row.id} className={`${activeRow === row.id ? 'bg-yellow-500/20' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{row.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={row.chartGroup}
                                        onChange={(e) => handleInputChange(row.id, 'chartGroup', e.target.value as ChartGroup)}
                                        disabled={isRunning}
                                        className="w-40 bg-secondary p-1 rounded border border-transparent focus:border-accent focus:ring-0 text-sm"
                                    >
                                        {Object.values(ChartGroup).map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <input type="text" value={row.variableName} onChange={(e) => handleInputChange(row.id, 'variableName', e.target.value)} disabled={isRunning} className="w-40 bg-secondary p-1 rounded border border-transparent focus:border-accent focus:ring-0 text-sm"/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input type="text" value={row.dataPoint} onChange={(e) => handleInputChange(row.id, 'dataPoint', e.target.value)} disabled={isRunning} className="w-40 bg-secondary p-1 rounded border border-transparent focus:border-accent focus:ring-0 text-sm"/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{row.serverName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <input type="text" value={row.tableName} onChange={(e) => handleInputChange(row.id, 'tableName', e.target.value)} disabled={isRunning} className="w-32 bg-secondary p-1 rounded border border-transparent focus:border-accent focus:ring-0 text-sm"/>
                                </td>
                                <td className="px-6 py-4">
                                    <textarea value={row.productionSqlExpression} onChange={(e) => handleInputChange(row.id, 'productionSqlExpression', e.target.value)} disabled={isRunning} rows={2} className="w-96 bg-secondary p-1 rounded border border-transparent focus:border-accent focus:ring-0 text-sm font-mono"/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-bold">{typeof row.value === 'number' ? row.value.toLocaleString() : row.value}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{row.calculationType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(row.lastUpdated).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;
