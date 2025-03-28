import { useState, useEffect, useCallback } from 'react';
import AdminSpreadsheet from '@/components/admin/AdminSpreadsheet';
import { AdminControls } from '@/components/admin/AdminControls';
import { SpreadsheetRow } from '@/lib/types/dashboard';
import { useToast } from '@/components/ui/use-toast';
import { useQueryStatusStore } from '@/lib/stores/queryStatusStore';
import { checkAllConnections } from '@/lib/db/connections';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConnectionDialog } from "@/components/admin/ConnectionDialog";
import { ConnectionStatus } from "@/components/admin/ConnectionStatus";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DEFAULT_P21_CONFIG, DEFAULT_POR_CONFIG } from '@/lib/db/server';

export function AdminClient() {
  const { toast } = useToast();
  
  // Get status from the global store  
  const isStatusRunning = useQueryStatusStore(state => state.isRunning);
  const activeRowId = useQueryStatusStore(state => state.activeRowId);
  const statusError = useQueryStatusStore(state => state.error);
  const updatedData = useQueryStatusStore(state => state.updatedData);
  
  // Import the useQueryStatusStore
  const queryStatus = useQueryStatusStore();
  
  // Local component state
  const [data, setData] = useState<SpreadsheetRow[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [p21Connected, setP21Connected] = useState(false);
  const [porConnected, setPorConnected] = useState(false);
  const [sqliteConnected, setSqliteConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state for dialogs
  const [showP21Dialog, setShowP21Dialog] = useState(false);
  const [showPorDialog, setShowPorDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');

  // State for button colors
  const [saveButtonColor, setSaveButtonColor] = useState('bg-white');
  const [loadButtonColor, setLoadButtonColor] = useState('bg-white');

  // Fetch initial data and connection status
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timed out')), 30000)
        );
        
        await Promise.race([
          Promise.all([fetchData(), checkConnections()]),
          timeoutPromise
        ]);
      } catch (error) {
        // Improved error logging with more details
        const errorDetails = {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown error type'
        };
        
        console.error('Error initializing admin client:', errorDetails);
        
        // Set a more descriptive error message
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize admin panel';
        setError(errorMessage);
        setLoading(false);
        
        toast({
          title: "Admin Panel Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toast]);

  // Function to check connection status for all databases
  const checkConnections = async () => {
    try {
      console.log('Checking connections...');
      
      // Set temporary connecting state
      setP21Connected(false); 
      setPorConnected(false);
      setSqliteConnected(false);
      
      // Check P21 connection with retry
      let p21Retries = 2;
      let p21Connected = false;
      let p21Data;
      
      while (p21Retries > 0 && !p21Connected) {
        try {
          const p21Response = await fetch('/api/admin/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              server: 'P21',
              config: {
                ...DEFAULT_P21_CONFIG,
                dsn: 'P21Play',
                database: 'P21Play'
              }
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000)
          });
          p21Data = await p21Response.json();
          p21Connected = p21Data.isConnected;
          if (!p21Connected) p21Retries--;
        } catch (err) {
          console.warn('P21 connection attempt failed, retries left:', p21Retries - 1);
          p21Retries--;
        }
      }
      setP21Connected(p21Connected);
      
      // Check POR connection with retry
      let porRetries = 2;
      let porConnected = false;
      let porData;
      
      while (porRetries > 0 && !porConnected) {
        try {
          const porResponse = await fetch('/api/admin/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              server: 'POR',
              config: DEFAULT_POR_CONFIG
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000)
          });
          porData = await porResponse.json();
          porConnected = porData.isConnected;
          if (!porConnected) porRetries--;
        } catch (err) {
          console.warn('POR connection attempt failed, retries left:', porRetries - 1);
          porRetries--;
        }
      }
      setPorConnected(porConnected);
      
      // Check SQLite connection
      try {
        const sqliteResponse = await fetch('/api/admin/health/sqlite', {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000)
        });
        const sqliteData = await sqliteResponse.json();
        setSqliteConnected(sqliteData.isConnected);
      } catch (err) {
        console.error('SQLite connection check failed:', err);
        setSqliteConnected(false);
      }
      
      console.log('Connection check complete:', {
        p21: p21Connected,
        por: porConnected,
        sqlite: sqliteConnected
      });
      
      return { p21Connected, porConnected, sqliteConnected };
    } catch (error) {
      console.error('Error checking connections:', error);
      toast({
        title: "Connection Error",
        description: "Failed to check database connections",
        variant: "destructive"
      });
      
      // Set all connections to false on complete failure
      setP21Connected(false);
      setPorConnected(false);
      setSqliteConnected(false);
      
      return { p21Connected: false, porConnected: false, sqliteConnected: false };
    }
  };

  // Function to check database connections
  const checkDatabaseConnections = async () => {
    try {
      const { p21Status, porStatus } = await checkAllConnections();
      setP21Connected(p21Status.isConnected);
      setPorConnected(porStatus.isConnected);
      console.log('Database connection status:', { p21: p21Status, por: porStatus });
    } catch (error) {
      console.error('Error checking database connections:', error);
      setP21Connected(false);
      setPorConnected(false);
    }
  };

  const canRunQueries = () => {
    return p21Connected || porConnected;
  };

  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      const response = await fetch('/api/admin/data');
      
      if (!response.ok) {
        console.error('Server returned error status:', response.status, response.statusText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Raw response data:', JSON.stringify(responseData).substring(0, 500) + '...');
      
      // Check if responseData has the expected structure
      if (!responseData || typeof responseData !== 'object') {
        console.error('Unexpected response format:', responseData);
        throw new Error('Invalid data format received from server');
      }
      
      // Check if data property exists and is an array
      if (!responseData.data && !Array.isArray(responseData)) {
        console.error('Response missing data array:', responseData);
        throw new Error('Invalid data format received from server');
      }
      
      // Determine where the actual rows are
      const rows = responseData.data || responseData;
      
      if (!Array.isArray(rows)) {
        console.error('Rows is not an array:', rows);
        throw new Error('Invalid data format received from server');
      }
      
      console.log(`Fetched ${rows.length} rows of spreadsheet data`);
      setData(rows);
      
      // Force a re-render by updating lastRefresh
      setLastRefresh(new Date().toISOString());
      
      return rows;
    } catch (error) {
      // Improved error logging with more details
      console.error('Error fetching data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      throw error;
    }
  };

  const handleRunQueries = async () => {
    if (!canRunQueries()) {
      toast({
        title: "Error",
        description: "Please connect to at least one database (P21 or POR) first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Set local running state first to update UI immediately
      setIsRunning(true);
      
      console.log('Starting query execution with data:', data.length, 'rows');
      
      const response = await fetch('/api/admin/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start query execution');
      }

      const result = await response.json();
      console.log('Query execution started:', result);

      if (result.status === 'already_running') {
        console.log('Query execution was already running');
        toast({
          title: "Already Running",
          description: "Query execution is already in progress",
          duration: 3000,
        });
      } else {
        toast({
          title: "Success",
          description: "Continuous query execution started - will run until stopped",
          duration: 5000,
        });
      }

      // Start global polling for query status
      queryStatus.startPolling();
      
      // Ensure the polling is active
      setTimeout(() => {
        if (!queryStatus.isPolling) {
          console.log('Polling did not start, forcing start');
          queryStatus.startPolling();
        }
      }, 500);
      
    } catch (error) {
      setIsRunning(false);
      console.error('Error running queries:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to run queries',
        variant: "destructive"
      });
    }
  };

  const handleStopQueries = async () => {
    try {
      // Set local state first for immediate UI feedback
      setIsRunning(false);
      
      // Make multiple attempts to stop the query execution
      let stopSuccess = false;
      let attempts = 0;
      
      while (!stopSuccess && attempts < 3) {
        attempts++;
        try {
          const response = await fetch('/api/admin/run/stop', { 
            method: 'POST',
            // Add a timeout to prevent hanging requests
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            stopSuccess = true;
            console.log(`Successfully stopped queries on attempt ${attempts}`);
          } else {
            console.warn(`Failed to stop queries on attempt ${attempts}, status: ${response.status}`);
          }
        } catch (err) {
          console.error(`Error on stop attempt ${attempts}:`, err);
        }
        
        // Wait a bit before retrying
        if (!stopSuccess && attempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Stop the global polling regardless of stop success
      queryStatus.stopPolling();
      
      // Force reset the execution state through a separate call
      try {
        await fetch('/api/admin/run/reset', { 
          method: 'POST',
          signal: AbortSignal.timeout(3000)
        });
      } catch (resetErr) {
        console.warn('Error resetting execution state:', resetErr);
      }
      
      toast({
        title: "Success",
        description: "Query execution stopped",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error stopping queries:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to stop queries',
        variant: "destructive"
      });
    }
  };

  // Function to save database content to single source data file
  const handleSaveToInitFile = async () => {
    try {
      // Change button color to red during loading
      setSaveButtonColor('bg-red-500');
      
      // Show loading toast
      toast({
        title: "Saving...",
        description: "Saving database content to single source data file",
        duration: 3000,
      });
      
      // Call the API endpoint to save database content to single source data file
      const response = await fetch('/api/admin/saveToInitFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save database content to single source data file');
      }
      
      const data = await response.json();
      
      // Show success toast
      toast({
        title: "Success",
        description: data.message || "Database content saved to single source data file successfully",
        duration: 5000,
      });
      
      // Change button color to green to indicate success
      setSaveButtonColor('bg-green-500');
      
      // Set a timeout to change the button color back to white after 3 seconds
      setTimeout(() => {
        setSaveButtonColor('bg-white');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving database content to single source data file:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save database content to single source data file',
        variant: "destructive",
        duration: 5000,
      });
      
      // Change button color back to white
      setSaveButtonColor('bg-white');
    }
  };

  // Function to load database content from single source data file
  const handleLoadFromInitFile = async () => {
    try {
      // Change button color to red during loading
      setLoadButtonColor('bg-red-500');
      
      // Show loading toast
      toast({
        title: "Loading...",
        description: "Loading database content from single source data file",
        duration: 3000,
      });
      
      // Call the API endpoint to load database content from single source data file
      const response = await fetch('/api/admin/loadFromInitFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load database content from single source data file');
      }
      
      const data = await response.json();
      
      // Show success toast
      toast({
        title: "Success",
        description: data.message || "Database content loaded from single source data file successfully",
        duration: 5000,
      });
      
      // Add a small delay to ensure the database has fully updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the data to show the newly loaded data
      console.log('Fetching updated data after database load...');
      await fetchData();
      
      // Force a re-render by setting a state variable
      setLastRefresh(new Date().toISOString());
      
      // Change button color to green to indicate success
      setLoadButtonColor('bg-green-500');
      
      // Set a timeout to change the button color back to white after 3 seconds
      setTimeout(() => {
        setLoadButtonColor('bg-white');
      }, 3000);
      
    } catch (error) {
      console.error('Error loading database content from single source data file:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load database content from single source data file',
        variant: "destructive",
        duration: 5000,
      });
      
      // Change button color back to white
      setLoadButtonColor('bg-white');
    }
  };

  // Effect to check for running processes and sync with global state
  useEffect(() => {
    const checkRunningStatus = async () => {
      try {
        const response = await fetch('/api/admin/run/status');
        if (response.ok) {
          const { status, activeRow } = await response.json();
          
          if (status === 'running' || status === 'processing') {
            setIsRunning(true);
            
            // If a process is already running, start polling
            queryStatus.startPolling();
            
            // If there's an active row, update both local and global state
            if (activeRow) {
              queryStatus.setActiveRowId(activeRow);
            }
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };
    
    checkRunningStatus();
    
    // Sync local isRunning state with global state whenever it changes
    if (queryStatus.isRunning !== isRunning) {
      setIsRunning(queryStatus.isRunning);
    }
    
    return () => {
      // Don't stop polling when switching pages - it will continue in the background
    };
  }, [isRunning, queryStatus.isRunning]);

  useEffect(() => {
    const updateDataFromExecutionState = async () => {
      try {
        // Check for any updates from the background process
        const response = await fetch('/api/admin/run/status');
        if (response.ok) {
          const { updatedData } = await response.json();
          
          if (updatedData && updatedData.length > 0) {
            console.log('Received updated data from execution state:', updatedData.length, 'rows');
            
            // Log a sample of the updated data for debugging
            if (updatedData.length > 0) {
              console.log('Sample updated row:', updatedData[0]);
            }
            
            setData(prevData => {
              const newData = [...prevData];
              let updatedCount = 0;
              
              for (const updatedRow of updatedData) {
                const index = newData.findIndex(row => row.id === updatedRow.id);
                if (index !== -1) {
                  // Only update if the values are actually different
                  if (newData[index].value !== updatedRow.value) {
                    console.log(`Updating row ${updatedRow.id} from ${newData[index].value} to ${updatedRow.value}`);
                    newData[index] = { ...updatedRow };
                    updatedCount++;
                  }
                }
              }
              
              console.log(`Updated ${updatedCount} rows in the spreadsheet data`);
              return newData;
            });
          }
        }
      } catch (error) {
        console.error('Error checking for data updates:', error);
      }
    };
    
    // Only poll for updates when queries are running
    if (isRunning) {
      updateDataFromExecutionState(); // Run immediately on status change
      const updateInterval = setInterval(updateDataFromExecutionState, 1000); // Poll more frequently
      return () => clearInterval(updateInterval);
    }
  }, [isRunning]);

  useEffect(() => {
    if (updatedData && updatedData.length > 0) {
      console.log('Received updated data from query status store:', updatedData.length, 'rows');
      
      setData(prevData => {
        const newData = [...prevData];
        let updatedCount = 0;
        
        for (const updatedRow of updatedData) {
          const index = newData.findIndex(row => row.id === updatedRow.id);
          if (index !== -1) {
            // Only update if the values are actually different
            if (newData[index].value !== updatedRow.value) {
              console.log(`Updating row ${updatedRow.id} from ${newData[index].value} to ${updatedRow.value}`);
              newData[index] = { ...updatedRow };
              updatedCount++;
            }
          }
        }
        
        console.log(`Updated ${updatedCount} rows in the spreadsheet data from store`);
        return updatedCount > 0 ? [...newData] : prevData; // Only trigger re-render if data changed
      });
    }
  }, [updatedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={isRunning ? handleStopQueries : handleRunQueries}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? "Stop Queries" : "Run Queries"}
          </Button>
          <Button 
            onClick={handleSaveToInitFile}
            variant="outline"
            className={`transition-colors duration-300 ${saveButtonColor} hover:bg-blue-100`}
            title="Save current database content to single source data file"
          >
            {saveButtonColor === 'bg-red-500' ? 'Saving...' : 'Save DB'}
          </Button>
          <Button 
            onClick={handleLoadFromInitFile}
            variant="outline"
            className={`transition-colors duration-300 ${loadButtonColor} hover:bg-blue-100`}
            title="Load database content from single source data file"
          >
            {loadButtonColor === 'bg-red-500' ? 'Loading...' : 'Load DB'}
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection dialogs are still needed for functionality, but buttons are removed */}
          <ConnectionDialog
            serverType="P21"
            open={showP21Dialog}
            onOpenChange={setShowP21Dialog}
            onSuccess={() => setP21Connected(true)}
          />
          <ConnectionDialog
            serverType="POR"
            open={showPorDialog}
            onOpenChange={setShowPorDialog}
            onSuccess={() => setPorConnected(true)}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!data || data.length === 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data found. 
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status Panel */}
      <Card className="p-4 mb-4">
        <h3 className="text-lg font-medium mb-4">Database Connections</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* P21 Connection */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">P21 Database</h4>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-server">Server</Label>
                <Input 
                  id="p21-server" 
                  value={DEFAULT_P21_CONFIG.server}
                  className="w-48"
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-port">Port</Label>
                <Input 
                  id="p21-port" 
                  value={DEFAULT_P21_CONFIG.port}
                  className="w-48"
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-database">Database</Label>
                <Input 
                  id="p21-database" 
                  value={DEFAULT_P21_CONFIG.database}
                  className="w-48"
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-user">User</Label>
                <Input 
                  id="p21-user" 
                  value={DEFAULT_P21_CONFIG.user}
                  className="w-48"
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${p21Connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{p21Connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button 
                onClick={() => setShowP21Dialog(true)}
                variant={p21Connected ? "outline" : "default"}
                size="sm"
              >
                {p21Connected ? 'Reconnect' : 'Connect'}
              </Button>
            </div>
          </div>

          {/* POR Connection */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">POR Database (MS Access)</h4>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="por-type">Type</Label>
                <span className="text-sm font-medium">MS Access</span>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="por-path">File Path</Label>
                <Input 
                  id="por-path" 
                  value={localStorage.getItem('porAccessFilePath') || 'C:\\Users\\BobM\\Desktop\\POR.MDB'}
                  className="w-48"
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${porConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{porConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button 
                onClick={() => setShowPorDialog(true)}
                variant={porConnected ? "outline" : "default"}
                size="sm"
              >
                {porConnected ? 'Reconnect' : 'Connect'}
              </Button>
            </div>
          </div>

          {/* SQLite Connection */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Local Database</h4>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Label>Type</Label>
                <span className="text-sm font-medium">SQLite</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Location</Label>
                <span className="text-sm">./data/dashboard.db</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <span className="text-sm">{sqliteConnected ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${sqliteConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{sqliteConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <AdminSpreadsheet
          data={data}
          onDataChange={setData}
          isRunning={isRunning}
          isProduction={process.env.NODE_ENV === 'production'}
          activeRowId={activeRowId}
        />
      </Card>
    </div>
  );
}
