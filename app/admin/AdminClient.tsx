import { useState, useEffect, useCallback } from 'react';
import AdminSpreadsheet from '@/components/admin/AdminSpreadsheet';
import { AdminControls } from '@/components/admin/AdminControls';
import { ChartDataRow, DatabaseStatus } from '@/lib/db/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Save } from "lucide-react"; 
import DatabaseConnectionDialog from '@/components/DatabaseConnectionDialog';
import DatabaseStatusDisplay from '@/components/admin/DatabaseStatusDisplay';

interface QueryExecutionState {
  [key: string]: {
    value: any;
    status: 'pending' | 'success' | 'error';
    error?: string;
    timestamp?: string; 
  };
}

interface ConnectionStatusResponse {
  statuses: DatabaseStatus[];
  error?: string;
}

interface SpreadsheetDataResponse {
  data: ChartDataRow[];
  sqliteAvailable?: boolean;
  error?: string;
}

interface SpreadsheetRowUpdate {
  rowId: string;
  variableName?: string;
  productionSqlExpression?: string | null; 
  value?: number | string | null; 
}

export default function AdminClient() {
  const { toast } = useToast();
  
  // Local component state
  const [data, setData] = useState<ChartDataRow[]>([]);
  const [lastRefresh, setLastRefresh] = useState('');
  const [isSaving, setIsSaving] = useState(false); 

  // UI state for dialogs
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false); // State for dialog visibility
  const [connectionStatuses, setConnectionStatuses] = useState<DatabaseStatus[]>([]);

  // Function to execute a single SQL expression
  // Ensure row is explicitly typed
  const executeSqlExpression = async (row: ChartDataRow) => { 
    const rowId = row.rowId; // Use rowId from ChartDataRow
    if (!rowId) {
      console.error("AdminClient: Cannot execute SQL, rowId is missing for row:", row);
      // Potentially add toast notification here
      return; // Exit if no rowId
    }
    console.log(`AdminClient: Attempting to execute SQL for rowId: ${rowId}`);
    // ... (rest of the execution logic, currently commented out)
    // try {
    //   // ... API call ...
    // } catch (error) {
    //   console.error(`AdminClient: Error executing SQL for rowId ${rowId}:`, error);
    //   // Handle error (e.g., update UI, show toast)
    // }
  };

  // Fetch initial data and connection status
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timed out')), 30000)
        );
        
        // Remove checkConnections from initial load
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

  // Function to check connection status using the dedicated API route
  // NOTE: This function is no longer called on initial load.
  // It might be useful later for a manual refresh button, but the primary
  // status update mechanism is now via the DatabaseConnectionDialog's callback.
  const checkConnections = async () => {
    try {
      console.log('Fetching connection statuses from /api/admin/connection-status...');
      
      const response = await fetch('/api/admin/connection-status');
      
      if (!response.ok) {
        // Try to get error details from response body if possible
        let errorBody = null;
        try {
            errorBody = await response.json();
        } catch (parseError) {
            // Ignore if response body isn't valid JSON
        }
        console.error('Failed to fetch connection statuses:', response.status, response.statusText, errorBody);
        throw new Error(`HTTP error ${response.status}: ${response.statusText}${errorBody?.error ? ` - ${errorBody.error}` : ''}`);
      }
      
      const result: ConnectionStatusResponse = await response.json();
      
      if (result.error) {
        console.error('API returned error for connection statuses:', result.error);
        throw new Error(result.error);
      }
      
      if (!result.statuses) {
          console.error('API response missing statuses array');
          throw new Error('Invalid response structure from connection status API');
      }
      
      console.log('Received connection statuses:', result.statuses);
      setConnectionStatuses(result.statuses);
      
      // Update individual connection states based on the fetched statuses
      // const p21Status = result.statuses.find(s => s.serverName === 'P21');
      // const porStatus = result.statuses.find(s => s.serverName === 'POR');
      // const sqliteStatus = result.statuses.find(s => s.serverName === 'SQLite');
      
      // // Setting state here is now less relevant on init, but kept for potential future use
      // setP21Connected(p21Status?.status === 'connected');
      // setPorConnected(porStatus?.status === 'connected');
      // setSqliteConnected(sqliteStatus?.status === 'connected');
      
    } catch (error) {
      // Log detailed error and re-throw to be caught by the main useEffect catch block
      console.error('Detailed error in checkConnections:', error instanceof Error ? error.stack : error);
      throw error; // Re-throw the error to be handled by the caller (init function)
    }
  };

  const fetchData = useCallback(async () => { 
    try {
      setLoading(true);
      
      console.log('Fetching spreadsheet data from /api/admin/spreadsheet-data...'); 
      const response = await fetch('/api/admin/spreadsheet-data');

      if (!response.ok) {
        let errorBody = null;
        try {
            errorBody = await response.json();
        } catch (parseError) { /* Ignore */ }
        console.error('Failed to fetch spreadsheet data:', response.status, response.statusText, errorBody);
        const apiErrorMsg = errorBody?.error || `HTTP error ${response.status}`;
        toast({
          title: "Admin Panel Error",
          description: apiErrorMsg,
          variant: "destructive",
        });
        return; // Stop execution here if fetch failed
      }

      // Expecting { data: ChartDataRow[], sqliteAvailable?: boolean, error?: string } on success
      const result: SpreadsheetDataResponse = await response.json();

      if (result.error) { // Handle potential error message even with 200 OK
          console.error('API returned error in success response:', result.error);
          toast({
            title: "Admin Panel Error",
            description: result.error,
            variant: "destructive",
          });
          return;
      }

      // Access the data array
      const resultData = result.data;
       
      // Ensure resultData is an array before sorting
      if (!Array.isArray(resultData)) {
          console.error('API response data is not an array:', resultData);
          toast({
            title: "Admin Panel Error",
            description: 'Invalid data format received from API',
            variant: "destructive",
          });
          return;
      }

      // Sort data by ID
      const sortedData = [...resultData].sort((a, b) => { // Use spread to avoid mutating original
        // Handle potential non-numeric IDs gracefully, although they should be numbers
        const idA = typeof a.rowId === 'number' ? a.rowId : parseInt(String(a.rowId), 10);
        const idB = typeof b.rowId === 'number' ? b.rowId : parseInt(String(b.rowId), 10);
        if (isNaN(idA) || isNaN(idB)) return 0; // Avoid NaN issues
        return idA - idB;
      });

      setData(sortedData);
      setLastRefresh(new Date().toLocaleString()); // Update refresh time
      console.log(`SQLite available status from API: ${result.sqliteAvailable}`);

    } catch (error) {
      // Catch network errors or JSON parsing errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during fetch';
      console.error('Error in fetchData catch block:', error instanceof Error ? error.stack : error);
      toast({
        title: "Admin Panel Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveChanges = useCallback(async (updatedDataFromSpreadsheet: ChartDataRow[]) => {
    setIsSaving(true);
    console.log('AdminClient: handleSaveChanges triggered with data:', updatedDataFromSpreadsheet);

    // Basic validation: Check if it's an array
    if (!Array.isArray(updatedDataFromSpreadsheet)) {
      console.error('AdminClient: Invalid data received in handleSaveChanges. Expected an array.');
      toast({ title: "Save Error", description: "Invalid data format received.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Map SpreadsheetRow[] to SpreadsheetRowUpdate[] for the API
    const updates: SpreadsheetRowUpdate[] = updatedDataFromSpreadsheet.map(row => ({
      rowId: row.rowId,
      // Only include fields that might have changed and are relevant for the update
      ...(row.variableName !== undefined && { variableName: row.variableName }),
      ...(row.productionSqlExpression !== undefined && { productionSqlExpression: row.productionSqlExpression }),
      ...(row.value !== undefined && { value: row.value }),
    }));

    console.log('AdminClient: Mapped updates for API:', updates);

    try {
      const response = await fetch('/api/admin/spreadsheet-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Assuming the API returns the updated full data set or confirms success
      // It's often better to refetch data to ensure consistency
      await fetchData(); // Refetch data after successful save
      
      toast({ title: "Success", description: "Changes saved successfully." });
      console.log('AdminClient: Changes saved successfully.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during save.';
      console.error('AdminClient: Error saving spreadsheet data:', error);
      toast({ title: "Save Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [toast, fetchData]); // Added fetchData to dependencies

  const handleSaveToInitFile = async () => {
    try {
      // Change button color to red during loading
      // setSaveButtonColor('bg-red-500');
      
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
      // setSaveButtonColor('bg-green-500');
      
      // Set a timeout to change the button color back to white after 3 seconds
      // setTimeout(() => {
      //   setSaveButtonColor('bg-white');
      // }, 3000);
      
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
      // setSaveButtonColor('bg-white');
    }
  };

  const handleLoadFromInitFile = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/loadFromInitFile', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load data');
      }
      const result = await response.json();
      setData(result.data); // Update local data state
      toast({
        title: 'Success',
        description: 'Data loaded from single source data file',
        duration: 5000,
      });
      // Add a small delay to ensure the database has fully updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the data to show the newly loaded data, forcing a refresh
      console.log('Fetching updated data after database load with force refresh...');
      await fetchData(); // Pass true here
      
      // Force a re-render by setting a state variable (keep this for now)
      setLastRefresh(new Date().toISOString());
      
      // Change button color to green to indicate success
      // setLoadButtonColor('bg-green-500');
      
      // Set a timeout to change the button color back to white after 3 seconds
      // setTimeout(() => {
      //   setLoadButtonColor('bg-white');
      // }, 3000);
      
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
      // setLoadButtonColor('bg-white');
    } finally {
      setInitializing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const handleConnectionChange = (p21Connected: boolean, porConnected: boolean) => {
    console.log(`AdminClient: Connection status updated - P21: ${p21Connected}, POR: ${porConnected}`);
    // TODO: Update the static connection status indicators if needed
    // Currently, they are hardcoded as disconnected
  };

  const columns = [
    { header: 'Row ID', accessor: 'rowId', editable: false },
    { header: 'Chart Group', accessor: 'chartGroup', editable: false },
    { header: 'Variable Name', accessor: 'variableName', editable: true },
    { header: 'Data Point', accessor: 'DataPoint', editable: false },
    // { header: 'Chart Name', accessor: 'chartName', editable: false }, // Likely redundant
    { header: 'Server', accessor: 'serverName', editable: true }, // Make server editable (e.g., Dropdown)
    { header: 'Table Name', accessor: 'tableName', editable: false },
    { header: 'SQL Expression', accessor: 'productionSqlExpression', editable: true },
    { header: 'Value', accessor: 'value', editable: false }, // Value is calculated, not directly edited
    { header: 'Last Updated', accessor: 'lastUpdated', editable: false },
    { header: 'Calc Type', accessor: 'calculationType', editable: false },
    // { header: 'Axis Step', accessor: 'axisStep', editable: false }, // Likely not needed in admin view
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Top Controls and Status */}
      <div className="flex justify-between items-start gap-6">
        {/* Left Side: Admin Controls */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Admin Controls</h3>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleSaveToInitFile}
              variant="outline"
              title="Save current database content to single source data file"
              className={`transition-colors duration-300 hover:bg-blue-100`}
            >
              Save DB to File
            </Button>
            <Button 
              onClick={handleLoadFromInitFile}
              variant="outline"
              title="Load database content from single source data file"
              className={`transition-colors duration-300 hover:bg-blue-100`}
            >
              Load DB from File
            </Button>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              title="Refresh data from the database"
            >
              Refresh Data
            </Button>
          </div>
        </Card>

        {/* Right Side: Connection Status */}
        <DatabaseStatusDisplay statuses={connectionStatuses} />
      </div>

      {/* Spreadsheet Data Table Card */}
      <Card className="p-6">
        <AdminSpreadsheet 
          columns={columns}
          data={data} 
          onDataChange={handleSaveChanges}
          isRunning={isSaving}
          isProduction={false}
        />
      </Card>

      {/* This dialog is opened programmatically or via another button if needed */}
      <DatabaseConnectionDialog 
        isOpen={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
        onConnectionChange={handleConnectionChange}
      />
    </div>
  );
}
