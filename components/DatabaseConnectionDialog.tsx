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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved connection settings
  useEffect(() => {
    const loadSettings = async () => {
      const p21Settings = await getConnectionSettings('p21');
      const porSettings = await getConnectionSettings('por');
      
      if (p21Settings) {
        setP21Connection(p21Settings);
      }
      if (porSettings) {
        setPorConnection(porSettings);
      }
    };
    
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        saveConnectionSettings('p21', p21Connection),
        saveConnectionSettings('por', porConnection)
      ]);
      setHasUnsavedChanges(false);
      showSuccess('Connection settings saved successfully');
    } catch (error) {
      showError('Failed to save connection settings');
    }
  };

  const handleP21Connect = async () => {
    setP21State({ ...p21State, isConnecting: true, error: undefined });
    try {
      await onConnect({ 
        p21Connection, 
        porConnection: undefined as DatabaseConnection | undefined
      });
      setP21State({ isConnected: true, isConnecting: false });
      showSuccess('Connected to P21 successfully');
    } catch (error) {
      setP21State({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect'
      });
      showError('Failed to connect to P21');
    }
  };

  const handlePorConnect = async () => {
    setPorState({ ...porState, isConnecting: true, error: undefined });
    try {
      await onConnect({ 
        p21Connection: undefined as DatabaseConnection | undefined, 
        porConnection 
      });
      setPorState({ isConnected: true, isConnecting: false });
      showSuccess('Connected to POR successfully');
    } catch (error) {
      setPorState({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect'
      });
      showError('Failed to connect to POR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Database Connections</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* P21 Connection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">P21 Connection</h3>
              <Button
                size="sm"
                onClick={handleP21Connect}
                disabled={p21State.isConnecting}
                className={p21State.isConnected ? "bg-green-500" : undefined}
              >
                {p21State.isConnecting ? "Connecting..." : p21State.isConnected ? "Connected" : "Connect"}
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Server"
              value={p21Connection.server}
              onChange={(e) => {
                setP21Connection({ ...p21Connection, server: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="text"
              placeholder="Database"
              value={p21Connection.database}
              onChange={(e) => {
                setP21Connection({ ...p21Connection, database: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="text"
              placeholder="Username"
              value={p21Connection.username}
              onChange={(e) => {
                setP21Connection({ ...p21Connection, username: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="password"
              placeholder="Password"
              value={p21Connection.password}
              onChange={(e) => {
                setP21Connection({ ...p21Connection, password: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="number"
              placeholder="Port"
              value={p21Connection.port}
              onChange={(e) => {
                setP21Connection({ ...p21Connection, port: parseInt(e.target.value) });
                setHasUnsavedChanges(true);
              }}
            />
            {p21State.error && (
              <div className="text-sm text-red-500">{p21State.error}</div>
            )}
          </div>

          {/* POR Connection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">POR Connection</h3>
              <Button
                size="sm"
                onClick={handlePorConnect}
                disabled={porState.isConnecting}
                className={porState.isConnected ? "bg-green-500" : undefined}
              >
                {porState.isConnecting ? "Connecting..." : porState.isConnected ? "Connected" : "Connect"}
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Server"
              value={porConnection.server}
              onChange={(e) => {
                setPorConnection({ ...porConnection, server: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="text"
              placeholder="Database"
              value={porConnection.database}
              onChange={(e) => {
                setPorConnection({ ...porConnection, database: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="text"
              placeholder="Username"
              value={porConnection.username}
              onChange={(e) => {
                setPorConnection({ ...porConnection, username: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="password"
              placeholder="Password"
              value={porConnection.password}
              onChange={(e) => {
                setPorConnection({ ...porConnection, password: e.target.value });
                setHasUnsavedChanges(true);
              }}
            />
            <Input
              type="number"
              placeholder="Port"
              value={porConnection.port}
              onChange={(e) => {
                setPorConnection({ ...porConnection, port: parseInt(e.target.value) });
                setHasUnsavedChanges(true);
              }}
            />
            {porState.error && (
              <div className="text-sm text-red-500">{porState.error}</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges}
            className={!hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
