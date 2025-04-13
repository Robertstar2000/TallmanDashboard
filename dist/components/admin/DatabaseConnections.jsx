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
import { Button } from "@/components/ui/button";
import { ServerConnectionDialog } from "@/components/ServerConnectionDialog";
import { Badge } from "@/components/ui/badge";
import { checkAllConnections } from '@/lib/db/connections';
import { DatabaseIcon, ServerIcon, DownloadIcon, UploadIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
export function DatabaseConnections({ isProduction }) {
    const [p21DialogOpen, setP21DialogOpen] = useState(false);
    const [porDialogOpen, setPorDialogOpen] = useState(false);
    const [p21Status, setP21Status] = useState({
        isConnected: false,
        lastChecked: new Date()
    });
    const [porStatus, setPorStatus] = useState({
        isConnected: false,
        lastChecked: new Date()
    });
    const [isCheckingConnections, setIsCheckingConnections] = useState(false);
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    const [isSavingDb, setIsSavingDb] = useState(false);
    // Check connection status on mount and periodically
    useEffect(() => {
        checkConnections();
        // Check connections every 5 minutes
        const interval = setInterval(() => {
            checkConnections();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);
    // Load database from initial-data.ts on startup
    useEffect(() => {
        loadDatabaseFromInitFile();
    }, []);
    const checkConnections = () => __awaiter(this, void 0, void 0, function* () {
        setIsCheckingConnections(true);
        try {
            const { p21Status: p21Result, porStatus: porResult } = yield checkAllConnections();
            setP21Status({
                isConnected: p21Result.isConnected,
                lastChecked: new Date(),
                error: p21Result.error
            });
            setPorStatus({
                isConnected: porResult.isConnected,
                lastChecked: new Date(),
                error: porResult.error
            });
        }
        catch (error) {
            console.error('Error checking connections:', error);
        }
        finally {
            setIsCheckingConnections(false);
        }
    });
    const handleP21ConnectionChange = (isConnected) => {
        setP21Status(prev => (Object.assign(Object.assign({}, prev), { isConnected, lastChecked: new Date() })));
    };
    const handlePorConnectionChange = (isConnected) => {
        setPorStatus(prev => (Object.assign(Object.assign({}, prev), { isConnected, lastChecked: new Date() })));
    };
    const loadDatabaseFromInitFile = () => __awaiter(this, void 0, void 0, function* () {
        setIsLoadingDb(true);
        try {
            const response = yield fetch('/api/admin/load-database', {
                method: 'POST',
            });
            const result = yield response.json();
            if (result.success) {
                toast({
                    title: "Database Loaded",
                    description: "Database has been successfully loaded from initial-data.ts file.",
                    variant: "default",
                });
            }
            else {
                toast({
                    title: "Error Loading Database",
                    description: result.error || "Failed to load database from initial-data.ts file.",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Error loading database:', error);
            toast({
                title: "Error Loading Database",
                description: "An unexpected error occurred while loading the database.",
                variant: "destructive",
            });
        }
        finally {
            setIsLoadingDb(false);
        }
    });
    const saveDatabaseToInitFile = () => __awaiter(this, void 0, void 0, function* () {
        setIsSavingDb(true);
        try {
            const response = yield fetch('/api/admin/save-database', {
                method: 'POST',
            });
            const result = yield response.json();
            if (result.success) {
                toast({
                    title: "Database Saved",
                    description: "Database has been successfully saved to initial-data.ts file.",
                    variant: "default",
                });
            }
            else {
                toast({
                    title: "Error Saving Database",
                    description: result.error || "Failed to save database to initial-data.ts file.",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Error saving database:', error);
            toast({
                title: "Error Saving Database",
                description: "An unexpected error occurred while saving the database.",
                variant: "destructive",
            });
        }
        finally {
            setIsSavingDb(false);
        }
    });
    return (<div className="flex flex-col space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">Database Connections</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2 p-3 border rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-5 w-5"/>
              <span className="font-medium">P21 Database</span>
            </div>
            <Badge variant={p21Status.isConnected ? "success" : "destructive"} className={p21Status.isConnected ? "bg-green-100 text-green-800" : ""}>
              {p21Status.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          {p21Status.details && p21Status.isConnected && (<div className="text-xs text-gray-500 mt-1">
              {p21Status.details.server && p21Status.details.database && (<p>Connected to {p21Status.details.database} on {p21Status.details.server}</p>)}
              <p>Last checked: {p21Status.lastChecked.toLocaleTimeString()}</p>
            </div>)}
          
          {p21Status.error && (<div className="text-xs text-red-500 mt-1">
              Error: {p21Status.error}
            </div>)}
          
          <Button size="sm" variant="outline" onClick={() => setP21DialogOpen(true)}>
            Configure
          </Button>
        </div>
        
        <div className="flex flex-col space-y-2 p-3 border rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <DatabaseIcon className="h-5 w-5"/>
              <span className="font-medium">POR Database</span>
            </div>
            <Badge variant={porStatus.isConnected ? "success" : "destructive"} className={porStatus.isConnected ? "bg-green-100 text-green-800" : ""}>
              {porStatus.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          {porStatus.details && porStatus.isConnected && (<div className="text-xs text-gray-500 mt-1">
              {porStatus.details.server && porStatus.details.database && (<p>Connected to {porStatus.details.database} on {porStatus.details.server}</p>)}
              <p>Last checked: {porStatus.lastChecked.toLocaleTimeString()}</p>
            </div>)}
          
          {porStatus.error && (<div className="text-xs text-red-500 mt-1">
              Error: {porStatus.error}
            </div>)}
          
          <Button size="sm" variant="outline" onClick={() => setPorDialogOpen(true)}>
            Configure
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Button variant="outline" size="sm" onClick={checkConnections} disabled={isCheckingConnections}>
          {isCheckingConnections ? "Checking..." : "Check Connections"}
        </Button>

        <Button variant="outline" size="sm" onClick={loadDatabaseFromInitFile} disabled={isLoadingDb} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4"/>
          {isLoadingDb ? "Loading..." : "Load DB"}
        </Button>

        <Button variant="outline" size="sm" onClick={saveDatabaseToInitFile} disabled={isSavingDb} className="flex items-center gap-2">
          <UploadIcon className="h-4 w-4"/>
          {isSavingDb ? "Saving..." : "Save DB"}
        </Button>
      </div>
      
      <ServerConnectionDialog serverType="P21" isOpen={p21DialogOpen} onOpenChange={setP21DialogOpen} onConnectionChange={handleP21ConnectionChange}/>
      
      <ServerConnectionDialog serverType="POR" isOpen={porDialogOpen} onOpenChange={setPorDialogOpen} onConnectionChange={handlePorConnectionChange}/>
    </div>);
}
