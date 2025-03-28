'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ServerConfig, saveServerConfig } from '@/lib/db/connections';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ServerConnectionDialogProps {
  serverType: 'P21' | 'POR';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionChange: (isConnected: boolean) => void;
}

const DEFAULT_P21_CONFIG: ServerConfig = {
  server: 'SQL01',
  port: 1433,
  database: 'P21play',
  user: 'SA',
  password: '',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const DEFAULT_POR_CONFIG: ServerConfig = {
  server: 'localhost',
  port: 1433,
  database: 'POR',
  user: 'sa',
  password: '',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

export function ServerConnectionDialog({
  serverType,
  isOpen,
  onOpenChange,
  onConnectionChange
}: ServerConnectionDialogProps) {
  const [connectionConfig, setConnectionConfig] = useState<ServerConfig>(
    serverType === 'P21' ? DEFAULT_P21_CONFIG : DEFAULT_POR_CONFIG
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Reset test status when dialog opens
    if (isOpen) {
      setTestStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Load saved config from localStorage if available
  useEffect(() => {
    if (isOpen) {
      try {
        const savedConfig = localStorage.getItem(`${serverType.toLowerCase()}_config`);
        if (savedConfig) {
          setConnectionConfig(JSON.parse(savedConfig));
        }
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
  }, [isOpen, serverType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'port') {
      setConnectionConfig(prev => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined
      }));
    } else if (name.startsWith('options.')) {
      const optionName = name.replace('options.', '') as keyof ServerConfig['options'];
      setConnectionConfig(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [optionName]: value === 'true'
        }
      }));
    } else {
      setConnectionConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const testConnection = async () => {
    setTestStatus('testing');
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/testConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionConfig),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        onConnectionChange(true);
      } else {
        setTestStatus('error');
        setErrorMessage(data.error || 'Failed to connect to server');
        onConnectionChange(false);
      }
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      onConnectionChange(false);
    }
  };

  const saveConnection = () => {
    try {
      // Save to localStorage for persistence
      saveServerConfig(serverType, connectionConfig);
      
      // Close the dialog
      onOpenChange(false);
      
      // Notify parent that connection is successful
      onConnectionChange(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{serverType} Server Connection</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="server" className="text-right">Server</Label>
            <Input 
              id="server" 
              name="server"
              value={connectionConfig.server}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">Port</Label>
            <Input 
              id="port" 
              name="port"
              type="number"
              value={connectionConfig.port || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right">Database</Label>
            <Input 
              id="database" 
              name="database"
              value={connectionConfig.database}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">Username</Label>
            <Input 
              id="user" 
              name="user"
              value={connectionConfig.user}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input 
              id="password" 
              name="password"
              type="password"
              value={connectionConfig.password}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          {serverType === 'P21' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">Domain</Label>
              <Input 
                id="domain" 
                name="domain"
                value={connectionConfig.domain}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          )}
          
          {testStatus === 'success' && (
            <div className="col-span-4 mt-2">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Successfully connected to {connectionConfig.database} on {connectionConfig.server}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {errorMessage && (
            <div className="col-span-4 mt-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              variant="outline"
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveConnection} 
              disabled={testStatus !== 'success'}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
