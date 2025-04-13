var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removed direct import of server-side constants: DEFAULT_P21_CONFIG, DEFAULT_POR_CONFIG
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
export function ConnectionDialog({ serverType, open, onOpenChange, onSuccess }) {
    var _a, _b, _c, _d;
    // State now uses ConnectionDetails type
    const [config, setConfig] = useState(() => ({
        type: serverType
        // Initialize other fields as needed, e.g., dsn: '', database: '' etc. or fetch defaults later
    }));
    const [filePath, setFilePath] = useState('C:\\Users\\BobM\\Desktop\\POR.MDB');
    const [isConnecting, setIsConnecting] = useState(false);
    const [status, setStatus] = useState({ type: 'idle' });
    // Reset to defaults when dialog opens or server type changes
    useEffect(() => {
        const fetchDefaults = () => __awaiter(this, void 0, void 0, function* () {
            console.log(`Fetching default config for: ${serverType}`);
            try {
                const response = yield fetch(`/api/admin/default-config?serverType=${serverType}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch defaults: ${response.statusText}`);
                }
                const defaults = yield response.json();
                console.log('Received defaults:', defaults);
                // Set state, ensuring type compatibility and preserving the core type
                setConfig(Object.assign({ type: serverType }, defaults));
                // Special handling for POR filePath from localStorage overrides fetched default
                if (serverType === 'POR') {
                    const savedFilePath = localStorage.getItem('porAccessFilePath');
                    if (savedFilePath) {
                        console.log('Using saved POR path from localStorage:', savedFilePath);
                        setFilePath(savedFilePath);
                        // Update the main config state as well if needed, or rely on the separate filePath state
                        // setConfig(prev => ({ ...prev, filePath: savedFilePath }));
                    }
                    else if (defaults.filePath) {
                        console.log('Using default POR path from API:', defaults.filePath);
                        setFilePath(defaults.filePath);
                    }
                }
            }
            catch (error) {
                console.error("Error fetching default config:", error);
                // Fallback to basic reset if fetch fails
                setConfig({ type: serverType });
                if (serverType === 'POR') {
                    setFilePath(''); // Clear path on error
                }
            }
        });
        if (open) { // Only fetch if the dialog is open
            fetchDefaults();
        }
        setStatus({ type: 'idle' }); // Reset status
    }, [serverType, open]);
    const handleConnect = () => __awaiter(this, void 0, void 0, function* () {
        setIsConnecting(true);
        setStatus({ type: 'connecting' });
        // Use the current state directly, which is ConnectionDetails
        const connectionConfig = Object.assign({}, config);
        if (serverType === 'POR') {
            connectionConfig.filePath = filePath; // Add filePath for POR
        }
        try {
            if (serverType === 'P21') {
                // Ensure properties exist on connectionConfig, which is now ConnectionDetails
            }
            else {
                // Ensure properties exist on connectionConfig
            }
            const response = yield fetch('/api/testConnection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: serverType,
                    config: connectionConfig
                }),
            });
            const data = yield response.json();
            if (data.success) {
                setStatus({
                    type: 'success',
                    message: data.message
                });
                // Save connection settings to localStorage
                if (serverType === 'P21') {
                    localStorage.setItem('p21Config', JSON.stringify(connectionConfig));
                }
                else {
                    localStorage.setItem('porConfig', JSON.stringify(config));
                    localStorage.setItem('porAccessFilePath', filePath);
                }
                // Save connection settings to database
                try {
                    const saveResponse = yield fetch('/api/saveConnectionSettings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            serverType,
                            config: serverType === 'P21' ? connectionConfig : { filePath }
                        }),
                    });
                    const saveData = yield saveResponse.json();
                    if (!saveData.success) {
                        console.error('Failed to save connection settings to database:', saveData.message);
                    }
                    else {
                        console.log('Connection settings saved to database successfully');
                    }
                }
                catch (error) {
                    console.error('Error saving connection settings to database:', error);
                }
                // Notify parent of success
                onSuccess();
                // Close dialog after a short delay
                setTimeout(() => {
                    onOpenChange(false);
                }, 1500);
            }
            else {
                setStatus({
                    type: 'error',
                    message: data.message
                });
            }
        }
        catch (error) {
            setStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
        finally {
            setIsConnecting(false);
        }
    });
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {serverType === 'P21' ? 'P21 Connection Settings' : 'POR Connection Settings'}
          </DialogTitle>
          <DialogDescription>
            {serverType === 'P21'
            ? 'Connect to your P21 database using ODBC DSN.'
            : 'Configure the connection to your POR database using MS Access.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {serverType === 'P21' ? (<div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="dsn" className="text-right">ODBC DSN</Label>
                <Input id="dsn" name="dsn" value={(_a = config.dsn) !== null && _a !== void 0 ? _a : ''} // Use nullish coalescing for optional prop
         onChange={(e) => setConfig(Object.assign(Object.assign({}, config), { dsn: e.target.value }))} className="col-span-3" placeholder="P21Play"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="database" className="text-right">Database</Label>
                <Input id="database" name="database" value={(_b = config.database) !== null && _b !== void 0 ? _b : ''} // Use nullish coalescing
         onChange={(e) => setConfig(Object.assign(Object.assign({}, config), { database: e.target.value }))} className="col-span-3" placeholder="P21Play"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="username" className="text-right">Username</Label>
                <Input id="username" name="username" value={(_c = config.user) !== null && _c !== void 0 ? _c : ''} // Use nullish coalescing
         onChange={(e) => setConfig(Object.assign(Object.assign({}, config), { user: e.target.value }))} className="col-span-3" placeholder="SA"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input id="password" name="password" type="password" value={(_d = config.password) !== null && _d !== void 0 ? _d : ''} // Use nullish coalescing
         onChange={(e) => setConfig(Object.assign(Object.assign({}, config), { password: e.target.value }))} className="col-span-3"/>
              </div>
              <div className="px-4 py-3 bg-muted rounded-md mt-4">
                <p className="text-sm">Using ODBC DSN connection.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The system will connect to the P21 database using the configured ODBC DSN.
                </p>
              </div>
            </div>) : (<div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filePath" className="text-right">File Path</Label>
              <Input id="filePath" name="filePath" value={filePath} // Keep using separate state for POR filePath
         onChange={(e) => {
                setFilePath(e.target.value);
                localStorage.setItem('porAccessFilePath', e.target.value); // Save path
            }} className="col-span-3" placeholder="C:\path\to\your\database.mdb"/>
            </div>)}
          
          {status.type === 'error' && (<Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>
                {status.message}
              </AlertDescription>
            </Alert>)}
          
          {status.type === 'success' && (<Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600"/>
              <AlertDescription className="text-green-600">
                {status.message}
              </AlertDescription>
            </Alert>)}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
}
