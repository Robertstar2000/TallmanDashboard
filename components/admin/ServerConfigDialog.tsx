import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ServerConfig } from '@/lib/db/connections';

// Default configurations
const DEFAULT_P21_CONFIG: ServerConfig = {
  server: 'localhost',
  database: 'P21',
  user: 'sa',
  password: '',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const DEFAULT_POR_CONFIG: ServerConfig = {
  server: 'localhost',
  database: 'POR',
  user: 'sa',
  password: '',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

interface ServerConfigDialogProps {
  server: 'P21' | 'POR';
  config: ServerConfig | null;
  onSave: (config: ServerConfig) => void;
  onTest: () => Promise<void>;
}

export function ServerConfigDialog({ server, config, onSave, onTest }: ServerConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const defaultConfig = server === 'P21' ? DEFAULT_P21_CONFIG : DEFAULT_POR_CONFIG;
  const [localConfig, setLocalConfig] = useState<ServerConfig>(config || defaultConfig);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(config || defaultConfig);
  }, [config, defaultConfig]);

  const handleChange = (field: keyof ServerConfig, value: string | number) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      onSave(localConfig);
      setOpen(false);
      toast({
        title: "Configuration Saved",
        description: `${server} server configuration has been updated.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save server configuration.",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    try {
      await onTest();
      toast({
        title: "Connection Test",
        description: `Successfully connected to ${server} server.`
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to server.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Configure {server}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{server} Server Configuration</DialogTitle>
          <DialogDescription>
            Enter the connection details for the {server} server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="server" className="text-right">
              Server
            </Label>
            <Input
              id="server"
              value={localConfig.server}
              onChange={(e) => handleChange('server', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right">
              Database
            </Label>
            <Input
              id="database"
              value={localConfig.database}
              onChange={(e) => handleChange('database', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Username
            </Label>
            <Input
              id="user"
              value={localConfig.user}
              onChange={(e) => handleChange('user', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={localConfig.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input
              id="port"
              type="number"
              value={localConfig.port || 1433}
              onChange={(e) => handleChange('port', parseInt(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleTest}>
            Test Connection
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
