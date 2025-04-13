'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { DatabaseConnection, ServerConfig } from '@/lib/db/types';
import { apiTestP21Connection, apiTestPORConnection, apiGetAdminVariables, apiUpdateAdminVariable } from '@/lib/db/sqlite';
import { CircularProgress } from '@mui/material';

const extractConnection = (configs: ServerConfig[], type: 'P21' | 'POR'): Partial<DatabaseConnection> => {
  const details: Partial<DatabaseConnection> = {};
  if (type === 'POR') {
    details.filePath = configs.find(c => c.name === 'POR_FILE_PATH')?.value ?? '';
  }
  return details;
};

const findConfigId = (configs: ServerConfig[], name: string): string | undefined => {
  return configs.find(c => c.name === name)?.id;
};

interface DatabaseConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: (p21Connected: boolean, porConnected: boolean) => void;
}

export default function DatabaseConnectionDialog({ isOpen, onClose, onConnectionChange }: DatabaseConnectionDialogProps) {
  const [allConfigs, setAllConfigs] = useState<ServerConfig[]>([]); 
  const [porDetails, setPorDetails] = useState<Partial<DatabaseConnection>>({});
  
  const [p21State, setP21State] = useState({ isConnecting: false, isConnected: false, error: null as string | null });
  const [porState, setPorState] = useState({ isConnecting: false, isConnected: false, error: null as string | null });
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadInitialSettings = async () => {
        setIsLoadingInitial(true);
        setP21State({ isConnecting: false, isConnected: false, error: null });
        setPorState({ isConnecting: false, isConnected: false, error: null });
        try {
          console.log("P21 connection uses System DSN specified by P21_DSN env var.");
          console.log("Using hardcoded POR connection details for testing.");
          setPorDetails({
            filePath: 'C:\\Users\\BobM\\Desktop\\POR.mdb' 
          });
          setAllConfigs([]); 

        } catch (error) {
          console.error("Error setting initial connection settings:", error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          toast({ variant: "destructive", title: "Error", description: `Failed to load settings: ${errorMessage}` });
        } finally {
          setIsLoadingInitial(false);
        }
      };
      loadInitialSettings();
    }
  }, [isOpen]);

  const handleTestP21 = async () => {
    setP21State({ isConnecting: true, isConnected: false, error: null });
    try {
      console.log("Calling P21 test API (uses DSN configured on server)...");
      const dummyP21Config: DatabaseConnection = {
        type: 'P21', 
        serverAddress: null, 
        databaseName: null,  
        userName: null,      
        password: null,      
        filePath: null       
      };
      const result = await apiTestP21Connection(dummyP21Config); 
      
      setP21State({ isConnecting: false, isConnected: result.success, error: result.success ? null : result.message });
      if (result.success) {
        toast({ title: "P21 Test", description: "Connection successful!" });
        onConnectionChange(true, porState.isConnected); 
      } else {
        toast({ variant: "destructive", title: "P21 Test Failed", description: result.message });
        onConnectionChange(false, porState.isConnected); 
      }
    } catch (error) {
      console.error("Error testing P21 connection:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setP21State({ isConnecting: false, isConnected: false, error: errorMessage });
      toast({ variant: "destructive", title: "P21 Test Error", description: errorMessage });
      onConnectionChange(false, porState.isConnected); 
    }
  };

  const handleTestPOR = async () => {
    if (!porDetails.filePath) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please provide the File Path for the POR database." });
        return;
    }

    setPorState({ isConnecting: true, isConnected: false, error: null });
    try {
       const connectionToTest: DatabaseConnection = {
        type: 'POR',
        serverAddress: null,
        databaseName: null,
        userName: null,
        password: null,
        filePath: porDetails.filePath || '',
      };

      console.log('Calling testPORConnection API with:', { filePath: connectionToTest.filePath });
      const result = await apiTestPORConnection(connectionToTest);
      setPorState({ isConnecting: false, isConnected: result.success, error: result.success ? null : result.message });
      if (result.success) {
        toast({ title: "POR Test", description: "Connection successful!" });
        onConnectionChange(p21State.isConnected, true); 
      } else {
        toast({ variant: "destructive", title: "POR Test Failed", description: result.message });
        onConnectionChange(p21State.isConnected, false); 
      }
    } catch (error) {
      console.error("Error testing POR connection:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setPorState({ isConnecting: false, isConnected: false, error: errorMessage });
      toast({ variant: "destructive", title: "POR Test Error", description: errorMessage });
      onConnectionChange(p21State.isConnected, false); 
    }
  };

  const handleSave = async () => {
    console.log("Saving connection settings...");
    try {
      const updates: { id: string; value: string }[] = [];

      const porFilePathId = findConfigId(allConfigs, 'POR_FILE_PATH');
      if (porFilePathId && porDetails.filePath !== undefined) {
        updates.push({ id: porFilePathId, value: porDetails.filePath });
      } else if (porDetails.filePath !== undefined && !porFilePathId) {
        console.warn("POR_FILE_PATH config ID not found, cannot update. Consider insert logic.");
        toast({ variant: "default", title: "Save Note", description: "POR File Path setting not found in database to update." });
      }

      if (updates.length > 0) {
        console.log('Updating Admin Variables:', updates);
        toast({ title: "Settings Saved", description: "POR connection details updated." });
      } else {
        toast({ title: "No Changes", description: "No settings were modified to save." });
      } 
      onClose(); 
    } catch (error) {
      console.error("Error saving settings:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ variant: "destructive", title: "Error", description: `Failed to save settings: ${errorMessage}` });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Database Connections</DialogTitle>
          <DialogDescription>
            Configure and test connections to P21 (SQL Server) and POR (MS Access).
          </DialogDescription>
        </DialogHeader>
        {isLoadingInitial ? (
          <div className="flex justify-center items-center h-40">
            <CircularProgress />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <h3 className="font-semibold">P21 (SQL Server via ODBC DSN)</h3>
            <p className="text-sm text-muted-foreground col-span-4">
              Connection uses the System DSN configured in Windows ODBC Data Sources (x64) 
              and specified by the P21_DSN environment variable on the server.
            </p>
            <div className="flex justify-end items-center gap-2 mt-2">
              {p21State.error && <span className="text-red-500 text-sm">Error: {p21State.error}</span>}
              {p21State.isConnected && <span className="text-green-500 text-sm">Connected!</span>}
              <Button 
                onClick={handleTestP21} 
                variant="outline" 
                size="sm" 
                disabled={p21State.isConnecting}
              >
                {p21State.isConnecting ? <CircularProgress size={16} color="inherit" /> : "Test Connection"} 
              </Button>
            </div>

            <h3 className="font-semibold mt-6">POR (MS Access via ODBC File Path)</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="por-filepath" className="text-right">File Path</Label>
              <Input id="por-filepath" value={porDetails.filePath || ''} onChange={(e) => setPorDetails({...porDetails, filePath: e.target.value})} className="col-span-3" placeholder="C:\Path\To\POR.mdb" />
            </div>
             <div className="flex justify-end items-center gap-2">
              {porState.error && <span className="text-red-500 text-sm">Error: {porState.error}</span>}
              {porState.isConnected && <span className="text-green-500 text-sm">Connected!</span>}
              <Button onClick={handleTestPOR} variant="outline" size="sm" disabled={porState.isConnecting || !porDetails.filePath}>
                {porState.isConnecting ? <CircularProgress size={16} color="inherit" /> : "Test Connection"}
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoadingInitial || !porDetails.filePath} title="Save POR File Path">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
