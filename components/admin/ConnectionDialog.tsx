import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_P21_CONFIG, DEFAULT_POR_CONFIG } from '@/lib/db/server';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ServerConfig } from '@/lib/db/connections';

interface ConnectionDialogProps {
  serverType: 'P21' | 'POR';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConnectionDialog({ serverType, open, onOpenChange, onSuccess }: ConnectionDialogProps) {
  const defaultConfig = serverType === 'P21' ? DEFAULT_P21_CONFIG : DEFAULT_POR_CONFIG;
  const [config, setConfig] = useState<ServerConfig>(() => ({
    ...defaultConfig,
    type: serverType
  }));
  const [filePath, setFilePath] = useState<string>('C:\\Users\\BobM\\Desktop\\POR.MDB');
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'connecting' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Reset to defaults when dialog opens or server type changes
  useEffect(() => {
    const currentConfig = serverType === 'P21' ? DEFAULT_P21_CONFIG : DEFAULT_POR_CONFIG;
    setConfig({
      ...currentConfig,
      type: serverType
    });
    
    // Load saved file path from localStorage for POR
    if (serverType === 'POR') {
      const savedFilePath = localStorage.getItem('porAccessFilePath');
      if (savedFilePath) {
        setFilePath(savedFilePath);
      }
    }
    
    // Reset status
    setStatus({ type: 'idle' });
  }, [serverType, open]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus({ type: 'connecting' });

    try {
      let connectionConfig: ServerConfig;
      
      if (serverType === 'P21') {
        // For P21, we're using ODBC DSN connection
        connectionConfig = {
          type: 'P21',
          dsn: config.dsn,
          database: config.database,
          user: config.user,
          password: config.password,
        };
      } else {
        // For POR, use the file path
        connectionConfig = {
          ...config,
          filePath,
          type: 'POR'
        };
      }

      const response = await fetch('/api/testConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: serverType,
          config: connectionConfig
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: data.message
        });

        // Save connection settings to localStorage
        if (serverType === 'P21') {
          localStorage.setItem('p21Config', JSON.stringify(connectionConfig));
        } else {
          localStorage.setItem('porConfig', JSON.stringify(config));
          localStorage.setItem('porAccessFilePath', filePath);
        }
        
        // Save connection settings to database
        try {
          const saveResponse = await fetch('/api/saveConnectionSettings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serverType,
              config: serverType === 'P21' ? connectionConfig : { filePath }
            }),
          });
          
          const saveData = await saveResponse.json();
          
          if (!saveData.success) {
            console.error('Failed to save connection settings to database:', saveData.message);
          } else {
            console.log('Connection settings saved to database successfully');
          }
        } catch (error) {
          console.error('Error saving connection settings to database:', error);
        }

        // Notify parent of success
        onSuccess();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        setStatus({
          type: 'error',
          message: data.message
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {serverType === 'P21' ? (
            <div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="dsn" className="text-right">ODBC DSN</Label>
                <Input
                  id="dsn"
                  name="dsn"
                  value={config.dsn || 'P21Play'}
                  onChange={(e) => setConfig({...config, dsn: e.target.value})}
                  className="col-span-3"
                  placeholder="P21Play"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="database" className="text-right">Database</Label>
                <Input
                  id="database"
                  name="database"
                  value={config.database || 'P21Play'}
                  onChange={(e) => setConfig({...config, database: e.target.value})}
                  className="col-span-3"
                  placeholder="P21Play"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <Label htmlFor="username" className="text-right">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={config.user || ''}
                  onChange={(e) => setConfig({...config, user: e.target.value})}
                  className="col-span-3"
                  placeholder="SA"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => setConfig({...config, password: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="px-4 py-3 bg-muted rounded-md mt-4">
                <p className="text-sm">Using ODBC DSN connection.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The system will connect to the P21 database using the configured ODBC DSN.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filePath" className="text-right">File Path</Label>
              <Input
                id="filePath"
                name="filePath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
          
          {status.type === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {status.message}
              </AlertDescription>
            </Alert>
          )}
          
          {status.type === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {status.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
