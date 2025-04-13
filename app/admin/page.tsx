'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminClient from './AdminClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { HelpDialog } from '@/components/admin/HelpDialog';
import DatabaseConnectionTester from '@/components/admin/DatabaseConnectionTester';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function AdminPage() {
  const router = useRouter();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showQueryTester, setShowQueryTester] = useState(false);
  const [showConnectionTester, setShowConnectionTester] = useState(false);

  // Worker State
  const [workerIsRunning, setWorkerIsRunning] = useState<boolean | null>(null); // null initially
  const [workerStatusMessage, setWorkerStatusMessage] = useState<string>('');
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  // Helper function for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- API Functions ---
  const fetchWorkerStatus = useCallback(async () => {
    // Only set loading if not already loading to avoid flicker during polling
    if(workerIsRunning === null) setIsLoadingStatus(true); 
    setWorkerStatusMessage(''); // Clear previous message
    try {
      const response = await fetch('/api/admin/worker/status');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error message
        throw new Error(`Failed to fetch status: ${response.statusText} ${errorData.message || ''}`.trim());
      }
      const data = await response.json();
      setWorkerIsRunning(data.isRunning);
    } catch (error) {
      console.error('Error fetching worker status:', error);
      setWorkerStatusMessage(`Error fetching status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setWorkerIsRunning(null); // Indicate unknown status on error
    } finally {
       // Only stop loading indicator on initial load or error
      if(workerIsRunning === null || isLoadingStatus) setIsLoadingStatus(false);
    }
  }, [isLoadingStatus, workerIsRunning]); // Depend on isLoadingStatus and workerIsRunning to control loading state correctly

  const handleStartWorker = useCallback(async () => {
    setIsLoadingStatus(true); // Show loading while action is performed
    setWorkerStatusMessage('Sending start command...');
    try {
      const response = await fetch('/api/admin/worker/start', { method: 'POST' });
      const data = await response.json();
      setWorkerStatusMessage(data.message || (response.ok ? 'Start command sent. Checking status...' : 'Failed to send start command.'));
      // Re-fetch status immediately after attempting start
      await fetchWorkerStatus(); 
    } catch (error) {
      console.error('Error starting worker:', error);
      setWorkerStatusMessage(`Error starting worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // setIsLoadingStatus(false); // Ensure loading stops on error - MOVED TO FINALLY
      // Optionally fetch status again even on error
      await fetchWorkerStatus();
    } finally {
       setIsLoadingStatus(false); // Stop loading AFTER status check is done
    }
  }, [fetchWorkerStatus]);

  const handleStopWorker = useCallback(async () => {
    setIsLoadingStatus(true); // Show loading while action is performed
    setWorkerStatusMessage('Sending stop command...');
    try {
      const response = await fetch('/api/admin/worker/stop', { method: 'POST' });
      const data = await response.json();
      setWorkerStatusMessage(data.message || (response.ok ? 'Stop command sent. Checking status...' : 'Failed to send stop command.'));
      // Add a short delay before checking status after stop command
      await delay(1000); // Wait 1 second
      // Re-fetch status immediately after attempting stop
      await fetchWorkerStatus();
    } catch (error) {
      console.error('Error stopping worker:', error);
      setWorkerStatusMessage(`Error stopping worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // setIsLoadingStatus(false); // Ensure loading stops on error - MOVED TO FINALLY
      // Fetch status again even on error
      // Add delay here too before checking status after an error during stop attempt
      await delay(1000);
      await fetchWorkerStatus();
    } finally {
       setIsLoadingStatus(false); // Stop loading AFTER status check is done
    }
  }, [fetchWorkerStatus]);

  // --- Effects ---
  // Fetch status on mount
  useEffect(() => {
    fetchWorkerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Fetch status periodically
  useEffect(() => {
    // Don't poll if status is currently unknown due to an error
    if (workerIsRunning === null && !isLoadingStatus) return;

    const intervalId = setInterval(() => {
      fetchWorkerStatus();
    }, 5000); // Check every 5 seconds

    // Cleanup function to clear the interval when the component unmounts or status becomes unknown
    return () => clearInterval(intervalId);
  }, [fetchWorkerStatus, workerIsRunning, isLoadingStatus]); // Re-run effect if dependencies change

  const handleNavigateToDashboard = () => {
    // Don't stop the worker when navigating to dashboard
    // Just navigate directly
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Control Buttons Row */}
        <div className="flex justify-end items-center space-x-2 mb-8">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowHelpDialog(true)}
              className="bg-blue-50 hover:bg-blue-100"
            >
              Help
            </Button>
            <Button variant="outline" onClick={() => setShowQueryTester(!showQueryTester)}>
              Test Queries
            </Button>
            <Button variant="outline" onClick={() => setShowConnectionTester(true)}>
              Test Connections
            </Button>
            <Button variant="outline" onClick={handleNavigateToDashboard}>
              Return to Dashboard
            </Button>
          </div>
        </div>

        {/* Worker Control Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Background SQL Worker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span>Status:</span>
              {isLoadingStatus && workerIsRunning === null ? (
                <Badge variant="outline">Loading...</Badge>
              ) : workerIsRunning === true ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Running</Badge>
              ) : workerIsRunning === false ? (
                <Badge variant="destructive">Stopped</Badge>
              ) : (
                 <Badge variant="secondary">Unknown</Badge> // Status unknown due to error
              )}
            </div>
             <p className="text-sm text-gray-600 min-h-[1.25rem]">{workerStatusMessage}&nbsp;</p> 
             {/* Added min-height and nbsp to prevent layout jumps */}
          </CardContent>
          <CardFooter className="flex space-x-2">
            <Button
              onClick={handleStartWorker}
              disabled={workerIsRunning === true || isLoadingStatus}
              aria-label="Start SQL execution worker"
            >
              Start Worker
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopWorker}
              disabled={workerIsRunning !== true || isLoadingStatus} // Disable if not running or loading
              aria-label="Stop SQL execution worker"
            >
              Stop Worker
            </Button>
          </CardFooter>
        </Card>

        {/* Note: AdminClient component ensures data is sorted by ID in ascending order */}
        <AdminClient />
        
        {/* Help Dialog */}
        <HelpDialog 
          open={showHelpDialog} 
          onOpenChange={setShowHelpDialog} 
        />

        {/* Connection Tester Dialog */}
        <Dialog open={showConnectionTester} onOpenChange={setShowConnectionTester}>
           <DialogContent className="sm:max-w-[600px]"> 
             <DialogHeader>
               <DialogTitle>Database Connection Tester</DialogTitle> 
             </DialogHeader>
             {/* Render the tester component inside the dialog content */}
             <DatabaseConnectionTester />
             <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">
                     Close
                   </Button>
                 </DialogClose>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         {/* Query Tester Dialog */}
         <Dialog open={showQueryTester} onOpenChange={setShowQueryTester}>
           <DialogContent className="sm:max-w-[800px]"> 
             <DialogHeader>
               <DialogTitle>SQL Query Tester</DialogTitle> 
             </DialogHeader>
             <p>Query Tester Component Placeholder</p>  // Placeholder
             <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">
                     Close
                   </Button>
                 </DialogClose>
             </DialogFooter>
           </DialogContent>
         </Dialog>

      </div>
    </div>
  );
}
