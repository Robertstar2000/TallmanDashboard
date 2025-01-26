'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDashboardVariables, updateDashboardVariable, resetDatabase } from '@/lib/db/admin';
import { showSuccess, showError } from '@/lib/utils/toast';
import type { AdminVariable, DatabaseConnections } from '@/lib/types/dashboard';
import { testDashboardData } from '@/lib/db/test-data';
import { useDatabase } from '@/lib/db/database-connection';
import { checkP21Connection, executeP21Query, P21ConnectionError } from '@/lib/services/p21';

const REAL_TIME_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const TEST_TIME_INTERVAL = 5 * 1000; // 5 seconds in milliseconds

export function useAdminData() {
  const [data, setData] = useState<AdminVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRealTime, setIsRealTime] = useState(false); // Default to test time
  const [p21Connected, setP21Connected] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [editedData, setEditedData] = useState<AdminVariable[]>([]);

  const { connectionState, connect, disconnect, executeQueries } = useDatabase();

  // Initialize with test data on mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const variables = await getDashboardVariables();
        setData(variables);
        setEditedData(variables);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize data';
        setError(message);
        showError('Error', message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Update connection status when connectionState changes
  useEffect(() => {
    setP21Connected(connectionState.isConnected);
  }, [connectionState]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Always get base data from IndexedDB
      const variables = await getDashboardVariables();

      // In test mode, just use the data from IndexedDB
      if (!isRealTime) {
        setData(variables);
        setEditedData(variables);
        setError(null);
        return;
      }

      // In real time mode, only require connection if we have SQL expressions to execute
      const hasP21Queries = variables.some(v => v.sqlExpression && v.p21DataDictionary);
      
      if (hasP21Queries && !p21Connected) {
        setData(variables); // Still show the base data
        setEditedData(variables);
        throw new P21ConnectionError('No P21 database connection available');
      }

      if (hasP21Queries) {
        // Only update values from P21, keep other fields from IndexedDB
        const updatedVariables = await Promise.all(
          variables.map(async (variable) => {
            if (variable.sqlExpression && variable.p21DataDictionary) {
              try {
                const value = await executeP21Query(
                  variable.sqlExpression,
                  variable.p21DataDictionary
                );
                return { ...variable, value };
              } catch (err) {
                console.error(`Failed to execute P21 query for ${variable.name}:`, err);
                return variable;
              }
            }
            return variable;
          })
        );
        setData(updatedVariables);
        setEditedData(updatedVariables);
      } else {
        // No P21 queries, just use IndexedDB data
        setData(variables);
        setEditedData(variables);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      if (!(err instanceof P21ConnectionError)) {
        showError('Error', message);
      }
    } finally {
      setLoading(false);
    }
  }, [isRealTime, p21Connected, executeP21Query]);

  const handleDatabaseConnect = useCallback(async (connections: DatabaseConnections) => {
    setLoading(true);
    try {
      await connect(connections);
      const connected = await checkP21Connection();
      setP21Connected(connected);
      showSuccess('Successfully connected to databases');
      
      // Reload data after successful connection
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error connecting to database';
      showError('Failed to connect to databases: ' + errorMessage);
      setP21Connected(false);
    } finally {
      setLoading(false);
    }
  }, [connect, checkP21Connection, loadData]);

  const updateVariable = useCallback(async (id: number, field: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [`${id}-${field}`]: value
    }));

    // Update the edited data immediately for display
    setEditedData(prevData => 
      prevData.map(item => {
        if (item.id === id) {
          // Handle special fields based on chart group
          if (field === 'value') {
            if (item.chartGroup === 'Historical Data') return { ...item, p21: value };
            if (item.chartGroup === 'Inventory Value & Turnover') return { ...item, inventory: value };
            if (item.chartGroup === 'Accounts Payable Overview') return { ...item, total: value };
            if (item.chartGroup === 'New Customers vs. New Prospects') return { ...item, new: value };
            return { ...item, value };
          }
          if (field === 'secondaryValue') {
            if (item.chartGroup === 'Historical Data') return { ...item, por: value };
            if (item.chartGroup === 'Inventory Value & Turnover') return { ...item, turnover: value };
            if (item.chartGroup === 'Accounts Payable Overview') return { ...item, overdue: value };
            if (item.chartGroup === 'New Customers vs. New Prospects') return { ...item, prospects: value };
            return { ...item, secondaryValue: value };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // First, save all pending changes to IndexedDB
      for (const item of editedData) {
        const itemId = item.id;
        
        // Save all fields that might have changed
        await Promise.all([
          // Basic fields
          updateDashboardVariable(itemId, 'name', item.name || ''),
          updateDashboardVariable(itemId, 'chartGroup', item.chartGroup || ''),
          updateDashboardVariable(itemId, 'calculation', item.calculation || ''),
          updateDashboardVariable(itemId, 'sqlExpression', item.sqlExpression || ''),
          updateDashboardVariable(itemId, 'p21DataDictionary', item.p21DataDictionary || ''),
          updateDashboardVariable(itemId, 'value', String(item.value || '')),
          updateDashboardVariable(itemId, 'subGroup', item.subGroup || ''),
          
          // Special fields based on chart group
          item.chartGroup === 'Historical Data' && [
            updateDashboardVariable(itemId, 'historicalDate', item.historicalDate || ''),
            updateDashboardVariable(itemId, 'p21', String(item.p21 || '')),
            updateDashboardVariable(itemId, 'por', String(item.por || ''))
          ],
          
          item.chartGroup === 'Inventory Value & Turnover' && [
            updateDashboardVariable(itemId, 'inventoryValueDate', item.inventoryValueDate || ''),
            updateDashboardVariable(itemId, 'inventory', String(item.inventory || '')),
            updateDashboardVariable(itemId, 'turnover', String(item.turnover || ''))
          ],
          
          item.chartGroup === 'Accounts Payable Overview' && [
            updateDashboardVariable(itemId, 'accountsPayableDate', item.accountsPayableDate || ''),
            updateDashboardVariable(itemId, 'total', String(item.total || '')),
            updateDashboardVariable(itemId, 'overdue', String(item.overdue || ''))
          ],
          
          item.chartGroup === 'New Customers vs. New Prospects' && [
            updateDashboardVariable(itemId, 'customersDate', item.customersDate || ''),
            updateDashboardVariable(itemId, 'new', String(item.new || '')),
            updateDashboardVariable(itemId, 'prospects', String(item.prospects || ''))
          ],

          item.chartGroup === 'AR Aging' && [
            updateDashboardVariable(itemId, 'arAgingDate', item.arAgingDate || ''),
            updateDashboardVariable(itemId, 'current', String(item.current || '')),
            updateDashboardVariable(itemId, 'aging_1_30', String(item.aging_1_30 || '')),
            updateDashboardVariable(itemId, 'aging_31_60', String(item.aging_31_60 || '')),
            updateDashboardVariable(itemId, 'aging_61_90', String(item.aging_61_90 || '')),
            updateDashboardVariable(itemId, 'aging_90_plus', String(item.aging_90_plus || ''))
          ]
        ].filter(Boolean).flat());
      }

      // Clear pending changes
      setPendingChanges({});
      
      // Update the base data with edited values
      setData(editedData);
      
      showSuccess('Success', 'All changes saved successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
      showError('Error', message);
    }
  }, [editedData]);

  const restoreTestData = useCallback(async () => {
    setLoading(true);
    try {
      // First disconnect from any database
      if (isRealTime) {
        await disconnect();
        setP21Connected(false);
      }
      
      // Reset to initial data
      await resetDatabase();
      
      // Load the test data
      const variables = await getDashboardVariables();
      setData(variables);
      setEditedData(variables);
      setError(null);
      setPendingChanges({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore test data';
      setError(message);
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  }, [isRealTime, disconnect]);

  const resetData = useCallback(async () => {
    setLoading(true);
    try {
      await resetDatabase();
      await loadData();
      showSuccess('Success', 'Data reset successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset data';
      setError(message);
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const startPolling = useCallback(() => {
    if (!isRunning) {
      const interval = setInterval(loadData, isRealTime ? REAL_TIME_INTERVAL : TEST_TIME_INTERVAL);
      setPollingInterval(interval);
      setIsRunning(true);
      // Initial load when starting
      loadData();
    }
  }, [isRealTime, loadData]);

  const stopPolling = useCallback(() => {
    if (isRunning) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsRunning(false);
    }
  }, [pollingInterval, isRunning]);

  const handleTimeSourceChange = useCallback(async (useRealTime: boolean) => {
    setLoading(true);
    // Stop polling before changing mode
    if (isRunning) {
      stopPolling();
    }

    try {
      // Update mode first so loadData knows which mode we're in
      setIsRealTime(useRealTime);

      // If switching to test time
      if (!useRealTime) {
        // First restore test data (this will also disconnect DB)
        await restoreTestData();
      } else {
        // If switching to real time, check connection
        try {
          const connected = await checkP21Connection();
          setP21Connected(connected);
          if (!connected) {
            // Only show warning if there are variables that need P21
            const variables = await getDashboardVariables();
            const needsP21 = variables.some(v => v.sqlExpression && v.p21DataDictionary);
            if (needsP21) {
              showError('Warning', 'No database connection available. Please connect to P21 to see live data.');
            }
          }
        } catch (error) {
          setP21Connected(false);
          const variables = await getDashboardVariables();
          const needsP21 = variables.some(v => v.sqlExpression && v.p21DataDictionary);
          if (needsP21) {
            showError('Warning', 'Failed to check P21 connection. Please connect to P21 to see live data.');
          }
        }

        // Load initial data for real-time mode
        await loadData();
      }

      // Restart polling if it was running
      if (isRunning) {
        startPolling();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch time source';
      setError(message);
      showError('Error', message);
      
      // If we fail, revert back to the previous mode
      setIsRealTime(!useRealTime);
    } finally {
      setLoading(false);
    }
  }, [restoreTestData, isRunning, stopPolling, startPolling, loadData, checkP21Connection]);

  return {
    data: editedData, // Use editedData for display
    loading,
    error,
    updateVariable,
    refreshData: loadData,
    restoreTestData,
    resetData,
    isRunning,
    startPolling,
    stopPolling,
    isRealTime,
    handleTimeSourceChange,
    p21Connected,
    pendingChanges,
    handleSave,
    handleDatabaseConnect
  };
}