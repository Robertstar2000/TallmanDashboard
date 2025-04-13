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
import { useToast } from "@/components/ui/use-toast";
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSpreadsheet from '@/components/admin/AdminSpreadsheet';
export default function AdminClient() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [isProduction, setIsProduction] = useState(false);
    const [activeRowId, setActiveRowId] = useState(null);
    const { toast } = useToast();
    useEffect(() => {
        const init = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/admin/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch spreadsheet data');
                }
                const { data: adminData } = yield response.json();
                if (!Array.isArray(adminData)) {
                    throw new Error('Invalid data format received from server');
                }
                setData(adminData);
                // Check if queries are already running
                try {
                    const statusResponse = yield fetch('/api/admin/run');
                    if (statusResponse.ok) {
                        const { status, activeRow } = yield statusResponse.json();
                        setIsRunning(status === 'running');
                        setActiveRowId(activeRow);
                    }
                }
                catch (statusError) {
                    console.error('Error checking query status:', statusError);
                }
            }
            catch (error) {
                console.error('Error initializing admin interface:', error);
                toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Failed to initialize admin interface',
                    variant: 'destructive',
                });
            }
            finally {
                setLoading(false);
            }
        });
        init();
    }, [toast]);
    // Add polling mechanism to check status and update data when queries are running
    useEffect(() => {
        if (!isRunning)
            return;
        const updateDataFromExecutionState = () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Check execution state
                const response = yield fetch('/api/admin/run');
                if (!response.ok) {
                    console.error('Failed to fetch execution state');
                    return;
                }
                const executionState = yield response.json();
                console.log('Current execution state:', executionState);
                // Update running status if it has changed
                if (executionState.status !== 'running' && isRunning) {
                    setIsRunning(false);
                    return;
                }
                // Update active row highlight
                setActiveRowId(executionState.activeRow);
                // Update data with new values if available
                if (executionState.updatedData && executionState.updatedData.length > 0) {
                    setData(prevData => {
                        const newData = [...prevData];
                        let updatedCount = 0;
                        executionState.updatedData.forEach((updatedRow) => {
                            const index = newData.findIndex(row => row.id === updatedRow.id);
                            if (index !== -1 && updatedRow.value !== undefined) {
                                newData[index] = Object.assign(Object.assign({}, newData[index]), { value: updatedRow.value, lastUpdated: new Date().toISOString() });
                                updatedCount++;
                            }
                        });
                        if (updatedCount > 0) {
                            console.log(`Updated ${updatedCount} rows from execution state`);
                        }
                        return newData;
                    });
                }
            }
            catch (error) {
                console.error('Error checking for data updates:', error);
            }
        });
        // Poll for updates every second when queries are running
        const updateInterval = setInterval(updateDataFromExecutionState, 1000);
        // Initial check
        updateDataFromExecutionState();
        // Clean up interval on unmount or when running status changes
        return () => clearInterval(updateInterval);
    }, [isRunning]);
    const handleDataUpdate = (updatedData) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/admin/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updatedData }),
            });
            if (!response.ok) {
                throw new Error('Failed to update admin data');
            }
            setData(updatedData);
            toast({
                title: 'Success',
                description: 'Admin data updated successfully',
            });
        }
        catch (error) {
            console.error('Error updating admin data:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update admin data',
                variant: 'destructive',
            });
        }
    });
    const handleRunQueries = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setIsRunning(true);
            const response = yield fetch('/api/admin/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data,
                    isProduction: isProduction
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to run queries');
            }
            const result = yield response.json();
            // Update spreadsheet data with results
            setData(prev => prev.map(row => {
                const resultRow = result.results.find((r) => r.id === row.id);
                if (resultRow) {
                    return Object.assign(Object.assign({}, row), { value: resultRow.error ? `Error: ${resultRow.error}` : resultRow.value, lastUpdated: new Date().toISOString() });
                }
                return row;
            }));
            // Save the updated data
            yield handleDataUpdate(data);
        }
        catch (error) {
            console.error('Error running queries:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to run queries',
                variant: 'destructive',
            });
        }
        finally {
            setIsRunning(false);
        }
    });
    const handleStopQueries = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/admin/run/stop', {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to stop queries');
            }
            toast({
                title: 'Success',
                description: 'Query execution stopped',
            });
            setIsRunning(false);
        }
        catch (error) {
            console.error('Error stopping queries:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to stop queries',
                variant: 'destructive',
            });
        }
    });
    if (loading) {
        return <div className="p-8">Loading admin interface...</div>;
    }
    return (<div className="container mx-auto py-6">
      <AdminHeader isRunning={isRunning} onRun={handleRunQueries} onStop={handleStopQueries} mode={isProduction} onModeChange={setIsProduction}/>
      <AdminSpreadsheet data={data} onDataChange={handleDataUpdate} isRunning={isRunning} isProduction={isProduction} activeRowId={activeRowId}/>
    </div>);
}
