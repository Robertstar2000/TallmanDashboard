'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseConnections, DatabaseConnection } from '@/lib/types/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveConnectionSettings, getConnectionSettings } from '@/lib/db/connection-settings';
import { showSuccess, showError } from '@/lib/utils/toast';

interface DatabaseConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connections: DatabaseConnections) => Promise<void>;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

export default function DatabaseConnectionDialog({
  isOpen,
  onClose,
  onConnect
}: DatabaseConnectionDialogProps) {
  const [p21Connection, setP21Connection] = useState<DatabaseConnection>({
    server: '',
    database: '',
    username: '',
    password: '',
    port: 1433
  });

  const [porConnection, setPorConnection] = useState<DatabaseConnection>({
    server: '',
    database: '',
    username: '',
    password: '',
    port: 1433
  });

  const [p21State, setP21State] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false
  });

  const [porState, setPorState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getConnectionSettings();
      if (settings) {
        if (settings.p21) {
          setP21Connection(settings.p21);
        }
        if (settings.por) {
          setPorConnection(settings.por);
        }
      }
    };

    loadSettings();
  }, []);

  const handleP21Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setP21Connection(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 1433 : value
    }));
  };

  const handlePorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPorConnection(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 1433 : value
    }));
  };

  const handleTestP21Connection = async () => {
    setP21State({ isConnected: false, isConnecting: true });
    try {
      await onConnect({
        p21: p21Connection,
        por: null
      });
      setP21State({ isConnected: true, isConnecting: false });
      showSuccess('P21 connection successful');
    } catch (error) {
      setP21State({ 
        isConnected: false, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showError(`P21 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestPorConnection = async () => {
    setPorState({ isConnected: false, isConnecting: true });
    try {
      await onConnect({
        p21: null,
        por: porConnection
      });
      setPorState({ isConnected: true, isConnecting: false });
      showSuccess('POR connection successful');
    } catch (error) {
      setPorState({ 
        isConnected: false, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showError(`POR connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    try {
      await saveConnectionSettings({
        p21: p21Connection,
        por: porConnection
      });
      showSuccess('Connection settings saved');
      onClose();
    } catch (error) {
      showError(`Failed to save connection settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Database Connection Settings</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">P21 Connection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p21-server">Server</Label>
              <Input 
                id="p21-server" 
                name="server" 
                value={p21Connection.server} 
                onChange={handleP21Change} 
              />
            </div>
            <div>
              <Label htmlFor="p21-port">Port</Label>
              <Input 
                id="p21-port" 
                name="port" 
                type="number" 
                value={p21Connection.port} 
                onChange={handleP21Change} 
              />
            </div>
            <div>
              <Label htmlFor="p21-database">Database</Label>
              <Input 
                id="p21-database" 
                name="database" 
                value={p21Connection.database} 
                onChange={handleP21Change} 
              />
            </div>
            <div>
              <Label htmlFor="p21-username">Username</Label>
              <Input 
                id="p21-username" 
                name="username" 
                value={p21Connection.username} 
                onChange={handleP21Change} 
              />
            </div>
            <div>
              <Label htmlFor="p21-password">Password</Label>
              <Input 
                id="p21-password" 
                name="password" 
                type="password" 
                value={p21Connection.password} 
                onChange={handleP21Change} 
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleTestP21Connection}
                disabled={p21State.isConnecting}
                className="w-full"
              >
                {p21State.isConnecting ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </div>
          {p21State.isConnected && (
            <div className="mt-2 text-green-600">Connection successful</div>
          )}
          {p21State.error && (
            <div className="mt-2 text-red-600">{p21State.error}</div>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">POR Connection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="por-server">Server</Label>
              <Input 
                id="por-server" 
                name="server" 
                value={porConnection.server} 
                onChange={handlePorChange} 
              />
            </div>
            <div>
              <Label htmlFor="por-port">Port</Label>
              <Input 
                id="por-port" 
                name="port" 
                type="number" 
                value={porConnection.port} 
                onChange={handlePorChange} 
              />
            </div>
            <div>
              <Label htmlFor="por-database">Database</Label>
              <Input 
                id="por-database" 
                name="database" 
                value={porConnection.database} 
                onChange={handlePorChange} 
              />
            </div>
            <div>
              <Label htmlFor="por-username">Username</Label>
              <Input 
                id="por-username" 
                name="username" 
                value={porConnection.username} 
                onChange={handlePorChange} 
              />
            </div>
            <div>
              <Label htmlFor="por-password">Password</Label>
              <Input 
                id="por-password" 
                name="password" 
                type="password" 
                value={porConnection.password} 
                onChange={handlePorChange} 
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleTestPorConnection}
                disabled={porState.isConnecting}
                className="w-full"
              >
                {porState.isConnecting ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </div>
          {porState.isConnected && (
            <div className="mt-2 text-green-600">Connection successful</div>
          )}
          {porState.error && (
            <div className="mt-2 text-red-600">{porState.error}</div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
