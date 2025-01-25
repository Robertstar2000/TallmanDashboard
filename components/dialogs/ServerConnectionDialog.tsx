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
import { connectToServer } from '@/lib/db';

interface ConnectionData {
  serverName: string;
  ipAddress: string;
  port: string;
  database: string;
  username: string;
  password: string;
  instance: string;
  domain: string;
}

interface ServerConnectionDialogProps {
  serverType: 'P21' | 'POR';
  trigger: React.ReactNode;
  onConnectionChange: (connected: boolean) => void;
}

export function ServerConnectionDialog({ serverType, trigger, onConnectionChange }: ServerConnectionDialogProps) {
  const [formData, setFormData] = React.useState<ConnectionData>({
    serverName: '',
    ipAddress: '',
    port: '',
    database: '',
    username: '',
    password: '',
    instance: '',
    domain: '',
  });

  const [isConnected, setIsConnected] = React.useState(false);

  // Load saved connection data on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem(`${serverType}_connection`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved connection data:', error);
      }
    }
  }, [serverType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If already connected, disconnect
    if (isConnected) {
      try {
        const success = connectToServer(serverType, null);
        setIsConnected(false);
        onConnectionChange(false);
        console.log('Disconnected from', serverType);
      } catch (error) {
        console.error('Failed to disconnect from', serverType, ':', error);
      }
      return;
    }

    // Save connection data before connecting
    localStorage.setItem(`${serverType}_connection`, JSON.stringify(formData));
    
    // Attempt to connect to server
    try {
      const success = connectToServer(serverType, formData);
      setIsConnected(success);
      onConnectionChange(success);
      console.log('Connected to', serverType, 'with:', formData);
    } catch (error) {
      console.error('Failed to connect to', serverType, ':', error);
      onConnectionChange(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(`${serverType}_connection`, JSON.stringify(formData));
    console.log('Saving connection details for', serverType, ':', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      return newData;
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px] !p-0">
        <div className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Connect to {serverType}</DialogTitle>
              <DialogDescription className="text-xs">
                Enter connection details
              </DialogDescription>
            </DialogHeader>
            <DialogClose className="h-6 w-6 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
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
            {serverType === 'P21' && (
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="instance" className="text-xs">Instance</Label>
                <Input
                  id="instance"
                  name="instance"
                  value={formData.instance}
                  onChange={handleChange}
                  className="col-span-2 h-7 text-xs"
                  placeholder="SQL Instance"
                />
              </div>
            )}
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
            <DialogFooter className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                className="h-7 text-xs"
              >
                Save
              </Button>
              <Button 
                type="submit" 
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
