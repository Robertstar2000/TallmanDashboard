'use client';

import { useState, useEffect } from 'react';
import { useToast, toast } from '@/components/ui/use-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSpreadsheet from '@/components/admin/AdminSpreadsheet';
import { SpreadsheetRow } from '@/lib/db/types';

// Basic column definitions for the spreadsheet - TODO: Refine these as needed
// We assume SpreadsheetRow has properties similar to ChartDataRow for now
const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'chartGroup', header: 'Group' },
  { accessorKey: 'variableName', header: 'Variable' },
  { accessorKey: 'dataPoint', header: 'Data Point Label' },
  { accessorKey: 'serverName', header: 'Server' },
  { accessorKey: 'tableName', header: 'Table' },
  { accessorKey: 'productionSqlExpression', header: 'SQL Expression' },
  { accessorKey: 'value', header: 'Current Value' },
  { accessorKey: 'lastUpdated', header: 'Last Updated' },
  { accessorKey: 'calculationType', header: 'Calc Type' },
];

export default function AdminClient() {
  const [data, setData] = useState<SpreadsheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/admin/data');
        if (!response.ok) {
          throw new Error('Failed to fetch spreadsheet data');
        }
        const { data: adminData } = await response.json();
        if (!Array.isArray(adminData)) {
          throw new Error('Invalid data format received from server');
        }
        setData(adminData);
        
        // Check if queries are already running
        try {
          const statusResponse = await fetch('/api/admin/run');
          if (statusResponse.ok) {
            const { status, activeRow } = await statusResponse.json();
            setIsRunning(status === 'running');
            setActiveRowId(activeRow);
          }
        } catch (statusError) {
          console.error('Error checking query status:', statusError);
        }
      } catch (error) {
        console.error('Error initializing admin interface:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to initialize admin interface',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [toast]);

  // Add polling mechanism to check status and update data when queries are running
  useEffect(() => {
    if (!isRunning) return;
    
    const updateDataFromExecutionState = async () => {
      try {
        // Check execution state
        const response = await fetch('/api/admin/run');
        if (!response.ok) {
          console.error('Failed to fetch execution state');
          return;
        }
        
        const executionState = await response.json();
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
            
            executionState.updatedData.forEach((updatedRow: SpreadsheetRow) => {
              const index = newData.findIndex(row => row.id === updatedRow.id);
              if (index !== -1 && updatedRow.value !== undefined) {
                newData[index] = {
                  ...newData[index],
                  value: updatedRow.value,
                  lastUpdated: new Date().toISOString()
                };
                updatedCount++;
              }
            });
            
            if (updatedCount > 0) {
              console.log(`Updated ${updatedCount} rows from execution state`);
            }
            
            return newData;
          });
        }
      } catch (error) {
        console.error('Error checking for data updates:', error);
      }
    };
    
    // Poll for updates every second when queries are running
    const updateInterval = setInterval(updateDataFromExecutionState, 1000);
    
    // Initial check
    updateDataFromExecutionState();
    
    // Clean up interval on unmount or when running status changes
    return () => clearInterval(updateInterval);
  }, [isRunning]);

  const handleDataUpdate = async (updatedData: SpreadsheetRow[]) => {
    try {
      const response = await fetch('/api/admin/data', {
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
    } catch (error) {
      console.error('Error updating admin data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update admin data',
        variant: 'destructive',
      });
    }
  };

  const handleRunQueries = async () => {
    try {
      setIsRunning(true);
      const response = await fetch('/api/admin/run', {
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

      const result = await response.json();
      
      // Update spreadsheet data with results
      setData(prev => prev.map(row => {
        const resultRow = result.results.find((r: any) => r.id === row.id);
        if (resultRow) {
          return {
            ...row,
            value: resultRow.error ? `Error: ${resultRow.error}` : resultRow.value,
            lastUpdated: new Date().toISOString()
          };
        }
        return row;
      }));

      // Save the updated data
      await handleDataUpdate(data);
      
    } catch (error) {
      console.error('Error running queries:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run queries',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopQueries = async () => {
    try {
      const response = await fetch('/api/admin/run/stop', {
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
    } catch (error) {
      console.error('Error stopping queries:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop queries',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading admin interface...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <AdminHeader 
        isRunning={isRunning}
        onRun={handleRunQueries}
        onStop={handleStopQueries}
        mode={isProduction}
        onModeChange={setIsProduction}
      />
      <AdminSpreadsheet 
        data={data} 
        columns={columns}
        onDataChange={handleDataUpdate}
        isRunning={isRunning}
        isProduction={isProduction}
        activeRowId={activeRowId}
      />
    </div>
  );
}
