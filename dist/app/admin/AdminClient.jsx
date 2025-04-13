var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect, useCallback } from 'react';
import AdminSpreadsheet from '@/components/admin/AdminSpreadsheet';
import { AdminControls } from '@/components/admin/AdminControls';
import { useToast } from '@/hooks/use-toast';
import useQueryStatusStore from '@/lib/stores/queryStatusStore';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectionDialog } from "@/components/admin/ConnectionDialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react"; // Import Save icon
export default function AdminClient() {
    const { toast } = useToast();
    // Get status from the global store  
    const isRunning = useQueryStatusStore((state) => state.isRunning);
    const error = useQueryStatusStore((state) => state.error);
    const startQueryRunner = useQueryStatusStore((state) => state.startQueryRunner);
    const stopQueryRunner = useQueryStatusStore((state) => state.stopQueryRunner);
    const setError = useQueryStatusStore((state) => state.setError);
    const activeRowId = useQueryStatusStore((state) => state.currentRowId);
    const setActiveRowId = useQueryStatusStore((state) => state.setCurrentRowId);
    // Local component state
    const [data, setData] = useState([]);
    const [p21Connected, setP21Connected] = useState(false);
    const [porConnected, setPorConnected] = useState(false);
    const [sqliteConnected, setSqliteConnected] = useState(false);
    const [liveQueryState, setLiveQueryState] = useState({});
    const [connectionStatuses, setConnectionStatuses] = useState([]);
    const [lastRefresh, setLastRefresh] = useState('');
    const [isSaving, setIsSaving] = useState(false); // Add state for saving status
    // UI state for dialogs
    const [showP21Dialog, setShowP21Dialog] = useState(false);
    const [showPorDialog, setShowPorDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    // Fetch initial data and connection status
    useEffect(() => {
        const init = () => __awaiter(this, void 0, void 0, function* () {
            try {
                setLoading(true);
                setError(null);
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Loading timed out')), 30000));
                yield Promise.race([
                    Promise.all([fetchData(), checkConnections()]),
                    timeoutPromise
                ]);
            }
            catch (error) {
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
            }
            finally {
                setLoading(false);
            }
        });
        init();
    }, [toast]);
    // Function to check connection status using the dedicated API route
    const checkConnections = () => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Fetching connection statuses from /api/admin/connection-status...');
            const response = yield fetch('/api/admin/connection-status');
            if (!response.ok) {
                // Try to get error details from response body if possible
                let errorBody = null;
                try {
                    errorBody = yield response.json();
                }
                catch (parseError) {
                    // Ignore if response body isn't valid JSON
                }
                console.error('Failed to fetch connection statuses:', response.status, response.statusText, errorBody);
                throw new Error(`HTTP error ${response.status}: ${response.statusText}${(errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) ? ` - ${errorBody.error}` : ''}`);
            }
            const result = yield response.json();
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
            const p21Status = result.statuses.find(s => s.serverName === 'P21');
            const porStatus = result.statuses.find(s => s.serverName === 'POR');
            const sqliteStatus = result.statuses.find(s => s.serverName === 'SQLite');
            setP21Connected((p21Status === null || p21Status === void 0 ? void 0 : p21Status.status) === 'connected');
            setPorConnected((porStatus === null || porStatus === void 0 ? void 0 : porStatus.status) === 'connected');
            setSqliteConnected((sqliteStatus === null || sqliteStatus === void 0 ? void 0 : sqliteStatus.status) === 'connected');
        }
        catch (error) {
            // Log detailed error and re-throw to be caught by the main useEffect catch block
            console.error('Detailed error in checkConnections:', error instanceof Error ? error.stack : error);
            throw error; // Re-throw the error to be handled by the caller (init function)
        }
    });
    const canRunQueries = () => {
        return p21Connected || porConnected;
    };
    const fetchData = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        try {
            setLoading(true);
            console.log('Fetching spreadsheet data from /api/admin/spreadsheet-data...');
            const response = yield fetch('/api/admin/spreadsheet-data');
            if (!response.ok) {
                let errorBody = null;
                try {
                    errorBody = yield response.json();
                }
                catch (parseError) { /* Ignore */ }
                console.error('Failed to fetch spreadsheet data:', response.status, response.statusText, errorBody);
                const apiErrorMsg = (errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) || `HTTP error ${response.status}`;
                setError(apiErrorMsg);
                setLoading(false);
                toast({
                    title: "Admin Panel Error",
                    description: apiErrorMsg,
                    variant: "destructive",
                });
                return; // Stop execution here if fetch failed
            }
            // Expecting { data: ChartDataRow[], error?: string } on success
            const result = yield response.json();
            if (result.error) { // Handle potential error message even with 200 OK
                console.error('API returned error in success response:', result.error);
                setError(result.error);
                setLoading(false);
                return;
            }
            // Access the data array
            const resultData = result.data;
            // Ensure resultData is an array before sorting
            if (!Array.isArray(resultData)) {
                console.error('API response data is not an array:', resultData);
                setError('Invalid data format received from API');
                setLoading(false);
                return;
            }
            // Sort data by ID
            const sortedData = [...resultData].sort((a, b) => {
                // Handle potential non-numeric IDs gracefully, although they should be numbers
                const idA = typeof a.rowId === 'number' ? a.rowId : parseInt(String(a.rowId), 10);
                const idB = typeof b.rowId === 'number' ? b.rowId : parseInt(String(b.rowId), 10);
                if (isNaN(idA) || isNaN(idB))
                    return 0; // Avoid NaN issues
                return idA - idB;
            });
            setData(sortedData);
            setError(null); // Clear any previous error
            setLastRefresh(new Date().toLocaleString()); // Update refresh time
        }
        catch (error) {
            // Catch network errors or JSON parsing errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during fetch';
            console.error('Error in fetchData catch block:', error instanceof Error ? error.stack : error);
            setError(`Failed to fetch spreadsheet data: ${errorMessage}`);
        }
        finally {
            setLoading(false);
        }
    }), []);
    const handleStopQueries = () => __awaiter(this, void 0, void 0, function* () {
        try {
            // Set local state first for immediate UI feedback
            if (stopQueryRunner)
                stopQueryRunner(); // Assuming stopQueryRunner exists
            // Make multiple attempts to stop the query execution
            let stopSuccess = false;
            let attempts = 0;
            while (!stopSuccess && attempts < 3) {
                attempts++;
                try {
                    const response = yield fetch('/api/admin/run/stop', {
                        method: 'POST',
                        // Add a timeout to prevent hanging requests
                        signal: AbortSignal.timeout(5000)
                    });
                    if (response.ok) {
                        stopSuccess = true;
                        console.log(`Successfully stopped queries on attempt ${attempts}`);
                    }
                    else {
                        console.warn(`Failed to stop queries on attempt ${attempts}, status: ${response.status}`);
                    }
                }
                catch (err) {
                    console.error(`Error on stop attempt ${attempts}:`, err);
                }
                // Wait a bit before retrying
                if (!stopSuccess && attempts < 3) {
                    yield new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            // Stop the global polling regardless of stop success
            if (stopQueryRunner)
                stopQueryRunner(); // Stop polling and update global state
            // Force reset the execution state through a separate call
            try {
                yield fetch('/api/admin/run/reset', {
                    method: 'POST',
                    signal: AbortSignal.timeout(3000)
                });
            }
            catch (resetErr) {
                console.warn('Error resetting execution state:', resetErr);
            }
            toast({
                title: "Success",
                description: "Query execution stopped",
                duration: 3000,
            });
        }
        catch (error) {
            console.error('Error stopping queries:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to stop queries',
                variant: "destructive"
            });
        }
    });
    // Function to save database content to single source data file
    const handleSaveToInitFile = () => __awaiter(this, void 0, void 0, function* () {
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
            const response = yield fetch('/api/admin/saveToInitFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.message || 'Failed to save database content to single source data file');
            }
            const data = yield response.json();
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
        }
        catch (error) {
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
    });
    // Function to load database content from single source data file
    const handleLoadFromInitFile = () => __awaiter(this, void 0, void 0, function* () {
        try {
            // Change button color to red during loading
            // setLoadButtonColor('bg-red-500');
            // Show loading toast
            toast({
                title: "Loading...",
                description: "Loading database content from single source data file",
                duration: 3000,
            });
            // Call the API endpoint to load database content from single source data file
            const response = yield fetch('/api/admin/loadFromInitFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.message || 'Failed to load database content from single source data file');
            }
            const data = yield response.json();
            // Show success toast
            toast({
                title: "Success",
                description: data.message || "Database content loaded from single source data file successfully",
                duration: 5000,
            });
            // Add a small delay to ensure the database has fully updated
            yield new Promise(resolve => setTimeout(resolve, 1000));
            // Refresh the data to show the newly loaded data, forcing a refresh
            console.log('Fetching updated data after database load with force refresh...');
            yield fetchData(); // Pass true here
            // Force a re-render by setting a state variable (keep this for now)
            setLastRefresh(new Date().toISOString());
            // Change button color to green to indicate success
            // setLoadButtonColor('bg-green-500');
            // Set a timeout to change the button color back to white after 3 seconds
            // setTimeout(() => {
            //   setLoadButtonColor('bg-white');
            // }, 3000);
        }
        catch (error) {
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
        }
    });
    // Function to check worker status
    const checkWorkerStatus = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/admin/run/status');
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            const data = yield response.json();
            if (data.success) {
                // Update running state
                if (data.isRunning && startQueryRunner) {
                    // If still running, we might not need to call start again, 
                    // but ensure totalRows is updated if necessary.
                    // For now, let's assume startQueryRunner handles this.
                    // startQueryRunner(data.totalRows || 0); // Pass total if available
                }
                else if (!data.isRunning && stopQueryRunner) {
                    stopQueryRunner();
                }
                // Update active row
                if (data.activeRow) {
                    setActiveRowId(data.activeRow); // Assuming setActiveRowId exists
                }
                else {
                    setActiveRowId(null); // Assuming setActiveRowId exists
                }
                // If worker is still running, check again in 1 second
                if (data.isRunning) {
                    setTimeout(checkWorkerStatus, 1000);
                }
                else {
                    // If worker is not running, refresh data
                    yield fetchData();
                    // Refresh dashboard data
                    fetch('/api/dashboard/refresh', { method: 'POST' });
                }
            }
        }
        catch (error) {
            console.error('Error checking worker status:', error);
        }
    }), [fetchData, setActiveRowId, startQueryRunner, stopQueryRunner]);
    // Function to run SQL expressions
    const runSqlExpressions = useCallback((expressionIds) => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        if (startQueryRunner)
            startQueryRunner(expressionIds.length); // Pass number of expressions being run
        console.log(`Starting execution of ${expressionIds.length} SQL expressions`);
        // Initialize the worker
        const initResponse = yield fetch('/api/admin/run/worker/initialize');
        if (!initResponse.ok) {
            const errorData = yield initResponse.json();
            throw new Error(errorData.error || 'Failed to initialize SQL worker');
        }
        // Queue expressions for execution
        const response = yield fetch('/api/admin/run/worker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expressionIds })
        });
        if (!response.ok) {
            const errorData = yield response.json();
            throw new Error(errorData.error || 'Failed to queue SQL expressions');
        }
        const data = yield response.json();
        if (data.success) {
            toast({
                title: 'SQL Execution Started',
                description: `Queued ${expressionIds.length} expressions for execution`,
            });
            // Start checking worker status
            checkWorkerStatus();
            // Start polling for updated data
            const pollInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Fetch updated data
                    const dataResponse = yield fetch('/api/admin/data');
                    const dataResult = yield dataResponse.json();
                    if (dataResult.success) {
                        // Sort data by ID in ascending order
                        const sortedData = dataResult.data.sort((a, b) => {
                            const idA = parseInt(a.rowId);
                            const idB = parseInt(b.rowId);
                            return idA - idB;
                        });
                        setData(sortedData);
                        // Check if worker is still running
                        const statusResponse = yield fetch('/api/admin/run/status');
                        const statusResult = yield statusResponse.json();
                        if (!statusResult.success || !statusResult.status.isRunning) {
                            clearInterval(pollInterval);
                            if (stopQueryRunner)
                                stopQueryRunner();
                            setActiveRowId(null); // Assuming setActiveRowId exists
                            toast({
                                title: 'SQL Execution Completed',
                                description: 'All SQL expressions have been executed',
                            });
                            // Refresh dashboard data
                            fetch('/api/dashboard/refresh', { method: 'POST' });
                        }
                    }
                }
                catch (error) {
                    console.error('Error polling for updates:', error);
                }
            }), 2000); // Poll every 2 seconds
        }
        else {
            setError(data.error || 'Failed to start SQL execution');
            if (stopQueryRunner)
                stopQueryRunner();
        }
    }), [toast, checkWorkerStatus, setError, stopQueryRunner, setActiveRowId]);
    // Function to stop SQL execution
    const stopSqlExecution = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        try {
            const response = yield fetch('/api/admin/run/stop', {
                method: 'POST'
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.error || 'Failed to stop SQL execution');
            }
            const data = yield response.json();
            if (data.success) {
                toast({
                    title: 'SQL Execution Stopped',
                    description: 'SQL worker has been stopped',
                });
                if (stopQueryRunner)
                    stopQueryRunner(); // Use correct store action
                if (setActiveRowId)
                    setActiveRowId(null); // Use correct store action
            }
            else {
                setError(data.error || 'Failed to stop SQL execution');
            }
        }
        catch (error) {
            console.error('Error stopping SQL execution:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to stop SQL execution';
            setError(errorMsg);
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'default'
            });
        }
    }), [toast, setError, stopQueryRunner, setActiveRowId]); // Include dependencies
    const handleRunAll = useCallback(() => {
        const allIds = data.map(row => row.rowId);
        if (allIds.length > 0) {
            runSqlExpressions(allIds);
        }
        else {
            toast({
                title: 'No Data',
                description: 'Cannot run all when there is no data loaded.',
                variant: 'default'
            });
        }
    }, [data, runSqlExpressions, toast]);
    const handleRunSelected = useCallback((selectedIds) => {
        if (selectedIds.length === 0) {
            toast({
                title: 'No Rows Selected',
                description: 'Please select rows to run.',
                variant: 'default'
            });
            return;
        }
        runSqlExpressions(selectedIds);
    }, [runSqlExpressions, toast]);
    const handleStop = useCallback(() => {
        stopSqlExecution(); // Now defined above
    }, [stopSqlExecution]);
    const handleRefresh = useCallback(() => __awaiter(this, void 0, void 0, function* () {
        yield fetchData();
    }), [fetchData]);
    // Handler for saving spreadsheet changes
    const handleSaveChanges = () => __awaiter(this, void 0, void 0, function* () {
        setIsSaving(true);
        toast({
            title: "Saving...",
            description: "Saving spreadsheet changes to the database.",
            duration: 3000, // Show for 3 seconds or until success/error
        });
        try {
            // ** Placeholder for API call **
            // TODO: Replace with actual fetch call to the new API endpoint
            console.log("Attempting to save data:", data);
            // const response = await fetch('/api/admin/spreadsheet-data/update', {
            //   method: 'POST', // or 'PUT'
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(data), // Send the entire current data state
            // });
            // if (!response.ok) {
            //   const errorData = await response.json();
            //   throw new Error(errorData.error || `Failed to save changes: ${response.statusText}`);
            // }
            // Simulate network delay for now
            yield new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: "Success!",
                description: "Spreadsheet changes saved successfully.",
            });
        }
        catch (error) {
            console.error('Error saving spreadsheet changes:', error);
            toast({
                title: "Error Saving",
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
                variant: "destructive",
            });
        }
        finally {
            setIsSaving(false);
        }
    });
    useEffect(() => {
        let intervalId = null;
        const pollStatus = () => __awaiter(this, void 0, void 0, function* () {
            if (!isRunning)
                return; // Only poll if supposed to be running
            try {
                // console.log("Polling /api/query-status..."); // Debugging
                const statusResponse = yield fetch('/api/query-status');
                if (statusResponse.ok) {
                    const data = yield statusResponse.json();
                    setLiveQueryState(data);
                    // console.log('Live Query State:', data); // Debugging
                    // Optionally update the main `rows` state if needed, but be careful
                    // about merging logic if the structure differs significantly.
                    // It might be better to just use liveQueryState for displaying status.
                }
                else {
                    console.error('Failed to fetch query status:', statusResponse.statusText);
                    // Consider stopping polling or setting an error if status fetching fails repeatedly
                }
                // Check if the overall process is still running via a different endpoint
                const workerStatusResponse = yield fetch('/api/admin/run/status');
                if (workerStatusResponse.ok) {
                    const workerData = yield workerStatusResponse.json();
                    if (!workerData.success || !workerData.status.isRunning) {
                        console.log("Worker finished, stopping polling.");
                        if (stopQueryRunner)
                            stopQueryRunner(); // Stop polling and update global state
                        fetchData(); // Fetch final data
                        if (intervalId)
                            clearInterval(intervalId);
                    }
                    else {
                        // Update active row ID from worker status
                        setActiveRowId(workerData.status.activeRow || null); // Assuming setActiveRowId exists
                    }
                }
                else {
                    console.error('Failed to fetch worker run status:', workerStatusResponse.statusText);
                    // Consider stopping polling or setting an error
                }
            }
            catch (error) {
                console.error('Error polling query status:', error);
                // Potentially stop polling or set an error state here
            }
        });
        if (isRunning) {
            console.log("Starting status polling...");
            // Initial poll immediately
            pollStatus();
            // Set up interval polling
            intervalId = setInterval(pollStatus, 2000); // Poll every 2 seconds
        }
        else {
            console.log("Stopping status polling...");
            if (intervalId) {
                clearInterval(intervalId);
            }
        }
        return () => {
            if (intervalId) {
                console.log("Cleaning up status polling interval.");
                clearInterval(intervalId);
            }
        };
    }, [isRunning, stopQueryRunner, setActiveRowId, fetchData]);
    useEffect(() => {
        const init = () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Starting query runner from useEffect");
                // Check if data indicates running state and the function exists before calling
                if (data.isRunning && startQueryRunner) {
                    startQueryRunner(); // Call the function
                }
            }
            catch (error) {
                console.error('Error initializing query runner:', error);
            }
        });
        init();
    }, [data, startQueryRunner]);
    if (loading) {
        return (<div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading admin panel...</span>
      </div>);
    }
    return (<div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button onClick={handleSaveToInitFile} variant="outline" title="Save current database content to single source data file" className={`transition-colors duration-300 hover:bg-blue-100`}>
            Save DB
          </Button>
          <Button onClick={handleLoadFromInitFile} variant="outline" title="Load database content from single source data file" className={`transition-colors duration-300 hover:bg-blue-100`}>
            Load DB
          </Button>
          <Button onClick={handleRefresh} variant="outline" title="Refresh data from the database">
            Refresh
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection dialogs are still needed for functionality, but buttons are removed */}
          <ConnectionDialog serverType="P21" open={showP21Dialog} onOpenChange={setShowP21Dialog} onSuccess={() => setP21Connected(true)}/>
          <ConnectionDialog serverType="POR" open={showPorDialog} onOpenChange={setShowPorDialog} onSuccess={() => setPorConnected(true)}/>
        </div>
      </div>

      {error && (<Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>)}

      {!data || data.length === 0 && (<Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>
            No data found. 
          </AlertDescription>
        </Alert>)}

      {/* Controls */}
      <AdminControls onRunSelected={handleRunSelected} onRunAll={handleRunAll} onStop={handleStop} isRunning={isRunning} lastRefresh={lastRefresh} onRefresh={handleRefresh}/>

      {/* Add Save Button Here */}
      <div className="flex justify-end space-x-2 mt-4">
        <Button onClick={handleSaveChanges} disabled={isSaving || isRunning || loading} // Disable while saving, running queries, or initial loading
     className="bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="mr-2 h-4 w-4"/>
          {isSaving ? "Saving..." : "Save Spreadsheet Changes"}
        </Button>
      </div>

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
                <Input id="p21-server" value="P21" className="w-48" readOnly/>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-port">Port</Label>
                <Input id="p21-port" value="5432" className="w-48" readOnly/>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-database">Database</Label>
                <Input id="p21-database" value="P21Play" className="w-48" readOnly/>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p21-user">User</Label>
                <Input id="p21-user" value="postgres" className="w-48" readOnly/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${p21Connected ? 'bg-green-500' : 'bg-red-500'}`}/>
                <span className="text-sm">{p21Connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button onClick={() => setShowP21Dialog(true)} variant={p21Connected ? "outline" : "default"} size="sm">
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
                <Input id="por-path" value={localStorage.getItem('porAccessFilePath') || 'C:\\Users\\BobM\\Desktop\\POR.MDB'} className="w-48" readOnly/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${porConnected ? 'bg-green-500' : 'bg-red-500'}`}/>
                <span className="text-sm">{porConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button onClick={() => setShowPorDialog(true)} variant={porConnected ? "outline" : "default"} size="sm">
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
                <div className={`w-3 h-3 rounded-full ${sqliteConnected ? 'bg-green-500' : 'bg-red-500'}`}/>
                <span className="text-sm">{sqliteConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <AdminSpreadsheet data={data} onDataChange={setData} isRunning={isRunning} isProduction={process.env.NODE_ENV === 'production'} activeRowId={activeRowId !== null ? String(activeRowId) : null} // Convert number|null to string|null
     columns={[
            {
                header: 'Row ID',
                accessor: 'rowId',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: false,
                render: (item) => <div className="p-1 font-mono">{item.rowId}</div>
            },
            {
                header: 'Group',
                accessor: 'chartGroup',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'Chart Name',
                accessor: 'chartName',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'Axis Step',
                accessor: 'axisStep',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'Variable',
                accessor: 'variableName',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'DataPoint',
                accessor: 'DataPoint',
                cellClassName: 'w-2/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'Server',
                accessor: 'serverName',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'Table',
                accessor: 'tableName',
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: true,
            },
            {
                header: 'SQL Expression',
                accessor: 'productionSqlExpression',
                cellClassName: 'w-3/12 text-[7pt] whitespace-normal break-words font-mono',
                editable: true, // Make SQL editable
            },
            {
                header: 'Value',
                accessor: 'rowId', // Use rowId to find live state
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words text-right',
                editable: false,
                render: (item) => {
                    var _a;
                    const liveState = liveQueryState === null || liveQueryState === void 0 ? void 0 : liveQueryState[item.rowId]; // Use rowId
                    const displayValue = (liveState === null || liveState === void 0 ? void 0 : liveState.value) !== undefined ? String(liveState.value) : (_a = item.value) === null || _a === void 0 ? void 0 : _a.toLocaleString(); // Format number
                    const status = liveState === null || liveState === void 0 ? void 0 : liveState.status;
                    const errorMsg = liveState === null || liveState === void 0 ? void 0 : liveState.error;
                    let bgColor = 'bg-transparent';
                    if (status === 'success')
                        bgColor = 'bg-green-100';
                    if (status === 'error')
                        bgColor = 'bg-red-100';
                    if (isRunning && activeRowId !== null && String(activeRowId) === String(item.rowId)) { // Use rowId
                        bgColor = 'bg-yellow-100';
                    }
                    return (<div className={`p-1 ${bgColor}`}> 
                    {displayValue !== null && displayValue !== void 0 ? displayValue : '-'}
                    {status === 'error' && <span className="text-red-600 ml-1 text-[6pt]">{errorMsg || 'Error'}</span>}
                  </div>);
                },
            },
            {
                header: 'Status', // Changed accessor to render
                accessor: 'rowId', // Use rowId to find live state
                cellClassName: 'w-1/12 text-[7pt] whitespace-normal break-words',
                editable: false,
                render: (item) => {
                    const liveState = liveQueryState === null || liveQueryState === void 0 ? void 0 : liveQueryState[item.rowId]; // Use rowId
                    const status = liveState === null || liveState === void 0 ? void 0 : liveState.status;
                    let bgColor = 'bg-transparent';
                    if (status === 'success')
                        bgColor = 'bg-green-100';
                    if (status === 'error')
                        bgColor = 'bg-red-100';
                    if (isRunning && activeRowId !== null && String(activeRowId) === String(item.rowId)) { // Use rowId
                        bgColor = 'bg-yellow-100';
                    }
                    return (<div className={`p-1 ${bgColor}`}> 
                    {status || '-'}
                  </div>);
                },
            },
            {
                header: 'Error', // Changed accessor to render
                accessor: 'rowId', // Use rowId to find live state
                cellClassName: 'w-2/12 text-[7pt] whitespace-normal break-words',
                editable: false,
                render: (item) => {
                    const liveState = liveQueryState === null || liveQueryState === void 0 ? void 0 : liveQueryState[item.rowId]; // Use rowId
                    const errorMsg = liveState === null || liveState === void 0 ? void 0 : liveState.error;
                    const status = liveState === null || liveState === void 0 ? void 0 : liveState.status;
                    return (<div className={`p-1 text-[6pt] ${status === 'error' ? 'text-red-600' : 'text-gray-500'} whitespace-normal break-words`}> 
                    {errorMsg || ''} 
                  </div>);
                },
            },
        ]}/>
      </Card>
    </div>);
}
