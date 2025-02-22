import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/custom-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { connectToServer } from '@/lib/db';

interface ConnectionData {
  serverName: string;
  ipAddress: string;
  port: string;
  database: string;
  username?: string;
  instance?: string;
  domain: string;
  password: string;
}

interface ServerConnectionDialogProps {
  serverType: 'P21' | 'POR';
  trigger: React.ReactNode;
  onConnectionChange: (connected: boolean) => void;
}

export function ServerConnectionDialog({ serverType, trigger, onConnectionChange }: ServerConnectionDialogProps) {
  const defaultP21Config = {
    serverName: 'SQL01',
    ipAddress: '10.10.20.28',
    port: '1433',
    database: 'P21play',
    username: 'SA',
    domain: 'tallman.com',
    password: '',
  };

  const defaultPORConfig = {
    serverName: 'TS03',
    ipAddress: '10.10.20.13',
    port: '1433',
    database: 'POR',
    domain: 'tallman.com',
    password: '',
  };

  const [formData, setFormData] = React.useState<ConnectionData>(
    serverType === 'P21' ? defaultP21Config : defaultPORConfig
  );

  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const initialLoadRef = React.useRef(false);

  // Load saved connection data and status on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem(`${serverType}_connection`);
    const savedStatus = localStorage.getItem(`${serverType}_connected`);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved connection data:', error);
      }
    }

    if (savedStatus) {
      const isConnectedSaved = savedStatus === 'true';
      setIsConnected(isConnectedSaved);
    }
    
    setIsLoading(false);
  }, [serverType]);

  // Notify parent of connection changes
  React.useEffect(() => {
    if (!isLoading) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If already connected, disconnect
    if (isConnected) {
      try {
        const success = await connectToServer(serverType, null);
        setIsConnected(false);
        localStorage.setItem(`${serverType}_connected`, 'false');
        console.log('Disconnected from', serverType);
      } catch (error) {
        console.error('Failed to disconnect from', serverType, ':', error);
        setError(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return;
    }

    // Save connection data before connecting
    localStorage.setItem(`${serverType}_connection`, JSON.stringify(formData));
    
    // Attempt to connect to server
    setIsConnecting(true);
    try {
      const success = await connectToServer(serverType, formData);
      setIsConnected(success);
      localStorage.setItem(`${serverType}_connected`, success.toString());
      
      if (success) {
        console.log('Connected to', serverType);
        setShowDialog(false); // Close dialog on successful connection
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Failed to connect to', serverType, ':', error);
      setError(getConnectionErrorMessage(error));
      localStorage.setItem(`${serverType}_connected`, 'false');
    } finally {
      setIsConnecting(false);
    }
  };

  const getConnectionErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return `Could not reach ${serverType} server at ${formData.ipAddress}. Please verify the server is running and the IP address is correct.`;
      }
      if (error.message.includes('Login failed')) {
        return `Authentication failed. Please verify your username and domain.`;
      }
      if (error.message.includes('database')) {
        return `Database "${formData.database}" not found. Please verify the database name.`;
      }
      return error.message;
    }
    return 'Failed to connect. Please check your connection details and try again.';
  };

  const handleSave = () => {
    localStorage.setItem(`${serverType}_connection`, JSON.stringify(formData));
    console.log('Saving connection details for', serverType, ':', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      localStorage.setItem(`${serverType}_connection`, JSON.stringify(newData));
      return newData;
    });
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild onClick={() => setShowDialog(true)}>
        {isLoading ? (
          <Button variant="outline" disabled>
            Loading...
          </Button>
        ) : (
          <Button
            variant={isConnected ? "default" : "outline"}
            className={isConnected ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px] !p-0">
        <div className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base">Connect to {serverType}</DialogTitle>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <DialogDescription className="text-xs">
                Enter connection details
              </DialogDescription>
            </DialogHeader>
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="serverName" className="text-xs">Server Name</Label>
              <Input
                id="serverName"
                name="serverName"
                value={formData.serverName}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="Server Name"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="ipAddress" className="text-xs">IP Address</Label>
              <Input
                id="ipAddress"
                name="ipAddress"
                value={formData.ipAddress}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="192.168.1.100"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="port" className="text-xs">Port</Label>
              <Input
                id="port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="1433"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="database" className="text-xs">Database</Label>
              <Input
                id="database"
                name="database"
                value={formData.database}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="Database Name"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="domain" className="text-xs">Domain</Label>
              <Input
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="Windows Domain"
              />
            </div>
            {serverType === 'P21' && (
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="col-span-2 h-7 text-xs"
                  placeholder="Username"
                />
              </div>
            )}
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="col-span-2 h-7 text-xs"
                placeholder="Password"
              />
            </div>
            <DialogFooter className="flex justify-between p-4">
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleSave}>
                Save
              </Button>
              <Button 
                type="submit" 
                variant="default" 
                size="sm" 
                className="h-7 text-xs"
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
