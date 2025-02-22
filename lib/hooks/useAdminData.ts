'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDashboardVariables, updateDashboardVariable, resetDatabase } from '@/lib/db/admin';
import { showSuccess, showError } from '@/lib/utils/toast';
import type { AdminVariable, DatabaseConnections } from '@/lib/types/dashboard';
import { testDashboardData } from '@/lib/db/test-data';
import { useDatabase } from '@/lib/db/database-connection';
import { checkP21Connection, executeP21Query, P21ConnectionError } from '@/lib/services/p21';
import { updateCustomerMetrics, getCustomerMetrics } from '@/lib/db';

const REAL_TIME_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const TEST_TIME_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const PRODUCTION_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

// Global interval ID to persist across page changes
let globalPollingInterval: NodeJS.Timeout | null = null;

export function useAdminData() {
  const [data, setData] = useState<AdminVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRealTime, setIsRealTime] = useState(process.env.NODE_ENV === 'production');
  const [p21Connected, setP21Connected] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [editedData, setEditedData] = useState<AdminVariable[]>([]);
  const [processingRowIndex, setProcessingRowIndex] = useState<number | null>(null);
  const [sqlUpdatedVariables, setSqlUpdatedVariables] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debug logging function
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AdminData Debug] ${message}`, data || '');
    }
  };

  // Load initial data when component mounts - only show structure, no values
  useEffect(() => {
    const initializeData = async () => {
      debugLog('Initializing data structure');
      try {
        const variables = await getDashboardVariables();
        // In production, start with empty values to prevent local data flash
        if (process.env.NODE_ENV === 'production') {
          const emptyVariables = variables.map(v => ({
            ...v,
            value: '' // Use empty string instead of null for TypeScript compatibility
          })).sort((a, b) => Number(a.id) - Number(b.id));
          
          setData(emptyVariables);
          setEditedData(emptyVariables);
          debugLog('Initialized with empty values in production');
        } else {
          const sortedVariables = variables.sort((a, b) => Number(a.id) - Number(b.id));
          setData(sortedVariables);
          setEditedData(sortedVariables);
          debugLog('Initialized with test values in development');
        }
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load initial data');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    initializeData();
  }, []);

  const { connectionState, connect, disconnect, executeQueries } = useDatabase();

  // Update connection status when connectionState changes
  useEffect(() => {
    setP21Connected(connectionState.isConnected);
  }, [connectionState]);

  const loadData = useCallback(async () => {
    debugLog('Starting loadData execution');
    try {
      if (process.env.NODE_ENV === 'production' || isRealTime) {
        const variables = await getDashboardVariables();
        
        // Always start with row 0 in production
        if (window.location.pathname.includes('/admin')) {
          debugLog('Setting initial processing row to 0');
          setProcessingRowIndex(0);
        }

        // Check connection before processing
        if (variables.some(v => v.sqlExpression && v.p21DataDictionary) && !p21Connected) {
          throw new P21ConnectionError('No P21 database connection available');
        }

        // Process each variable sequentially
        for (let i = 0; i < variables.length; i++) {
          const variable = variables[i];
          
          debugLog(`Processing variable ${variable.id} at index ${i}`);
          
          if (variable.sqlExpression && variable.p21DataDictionary) {
            try {
              // Execute SQL query
              const sqlValue = await executeP21Query(
                variable.sqlExpression,
                variable.p21DataDictionary
              );
              debugLog(`Received SQL value for ${variable.id}:`, sqlValue);

              // Update customer metrics if this is a customer-related variable
              if (variable.chartName === 'Customer Metrics') {
                const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
                if (variable.variableName === 'prospects') {
                  updateCustomerMetrics(currentMonth, Number(sqlValue), 0);
                } else if (variable.variableName === 'newCustomers') {
                  const customerMetrics = getCustomerMetrics();
                  const currentMetrics = customerMetrics.find((m: { month: string }) => m.month === currentMonth);
                  updateCustomerMetrics(currentMonth, currentMetrics?.prospects || 0, Number(sqlValue));
                }
              }

              // Update the current variable with SQL value
              setSqlUpdatedVariables(prev => {
                const updated = new Set(prev).add(variable.id);
                debugLog(`Updated SQL variables:`, Array.from(updated));
                return updated;
              });

              // Get current state to ensure we don't lose updates
              setData(currentData => {
                const updatedData = [...currentData];
                const index = updatedData.findIndex(v => v.id === variable.id);
                if (index !== -1) {
                  updatedData[index] = {
                    ...updatedData[index],
                    value: sqlValue,
                    updateTime: new Date().toISOString()
                  };
                }
                debugLog(`Updated data for ${variable.id}`);
                return updatedData.sort((a, b) => Number(a.id) - Number(b.id));
              });

              setEditedData(currentData => {
                const updatedData = [...currentData];
                const index = updatedData.findIndex(v => v.id === variable.id);
                if (index !== -1) {
                  updatedData[index] = {
                    ...updatedData[index],
                    value: sqlValue,
                    updateTime: new Date().toISOString()
                  };
                }
                debugLog(`Updated editedData for ${variable.id}`);
                return updatedData.sort((a, b) => Number(a.id) - Number(b.id));
              });

              // Update storage after state is updated
              await updateDashboardVariable(variable.id, 'value', sqlValue);
              debugLog(`Updated storage for ${variable.id}`);

              // Update processing row only after successful SQL update
              if (window.location.pathname.includes('/admin')) {
                debugLog(`Updating processing row to ${i + 1}`);
                setProcessingRowIndex(i + 1);
              }
            } catch (err) {
              console.error(`Failed to execute P21 query for ${variable.name}:`, err);
              debugLog(`SQL error for ${variable.id}:`, err);
            }
          }
        }

        // Clear processing row only after all updates are complete
        if (window.location.pathname.includes('/admin')) {
          debugLog('Clearing processing row');
          setProcessingRowIndex(null);
        }
      } else {
        // Development mode
        const variables = await getDashboardVariables();
        const sortedVariables = variables.sort((a, b) => Number(a.id) - Number(b.id));
        setData(sortedVariables);
        setEditedData(sortedVariables);
        debugLog('Updated with development data');
      }
    } catch (err) {
      debugLog('Error in loadData:', err);
      if (window.location.pathname.includes('/admin')) {
        setProcessingRowIndex(null);
      }
      if (err instanceof P21ConnectionError) {
        setError('Database connection error. Please reconnect.');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [isRealTime, p21Connected]);

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
        if (item.id === id.toString()) {
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
    debugLog('Starting polling');
    if (globalPollingInterval) return;
    
    setIsRunning(true);
    loadData();

    const interval = process.env.NODE_ENV === 'production' 
      ? PRODUCTION_INTERVAL 
      : (isRealTime ? REAL_TIME_INTERVAL : TEST_TIME_INTERVAL);

    globalPollingInterval = setInterval(() => {
      debugLog('Polling interval triggered');
      loadData();
    }, interval);
  }, [isRealTime, loadData]);

  const stopPolling = useCallback(() => {
    debugLog('Stopping polling');
    if (globalPollingInterval) {
      clearInterval(globalPollingInterval);
      globalPollingInterval = null;
    }
    setIsRunning(false);
    setProcessingRowIndex(null);
    setSqlUpdatedVariables(new Set());
  }, []);

  // Cleanup on unmount, but only if explicitly stopped
  useEffect(() => {
    return () => {
      // Only clean up if we're not running
      if (!isRunning && globalPollingInterval) {
        clearInterval(globalPollingInterval);
        globalPollingInterval = null;
      }
    };
  }, [isRunning]);

  // Keep isRunning in sync with globalPollingInterval
  useEffect(() => {
    setIsRunning(!!globalPollingInterval);
  }, []);

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
    handleTimeSourceChange: useCallback(async (useRealTime: boolean) => {
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
    }, [restoreTestData, isRunning, stopPolling, startPolling, loadData, checkP21Connection]),
    p21Connected,
    pendingChanges,
    handleSave,
    handleDatabaseConnect
  };
}