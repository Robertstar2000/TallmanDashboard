'use client';
import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { apiGetAdminVariables, apiUpdateAdminVariable, apiTestPORConnection } from '@/lib/db/sqlite';
import { DatabaseConnection, ServerConfig } from '@/lib/db/types';

interface PORConnectionSettingsProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function PORConnectionSettings({ onConnectionChange }: PORConnectionSettingsProps) {
  const [filePath, setFilePath] = useState<string>('');
  const [porConfigId, setPorConfigId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    error?: string;
  }>({ isConnected: false });

  useEffect(() => {
    const loadInitialPath = async () => {
      setIsLoadingInitial(true);
      try {
        const allConfigs = await apiGetAdminVariables();
        const porConfig = allConfigs.find(config => config.name === 'POR_FILE_PATH');
        if (porConfig && porConfig.value) {
          setFilePath(porConfig.value);
          setPorConfigId(porConfig.id ?? null);
        } else {
          console.warn("POR file path configuration not found or has no value.");
        }
      } catch (error) {
        console.error("Failed to load admin variables:", error);
        setConnectionStatus({ isConnected: false, error: 'Failed to load settings.' });
      } finally {
        setIsLoadingInitial(false);
      }
    };
    loadInitialPath();
  }, []);

  const handleTestConnection = async () => {
    if (!filePath) {
      console.error('File path cannot be empty.');
      return;
    }
    setIsConnecting(true);
    setConnectionStatus({ isConnected: false });

    try {
      const connectionDetails: DatabaseConnection = {
        filePath: filePath,
        server: null,
        database: null,
        username: null,
        password: null, 
        port: null,
      };
      const result = await apiTestPORConnection(connectionDetails);
      setConnectionStatus({
        isConnected: result.success,
        error: result.message || 'Unknown error during connection test.'
      });

      if (result.success) {
        if (porConfigId) {
          const configToUpdate: Partial<ServerConfig> = {
            value: filePath,
          };
          const success = await apiUpdateAdminVariable(porConfigId, configToUpdate);
          if (success) {
            console.log("POR file path updated successfully.");
          } else {
            console.error("Failed to update POR file path.");
          }
        } else {
          console.error("Cannot update POR file path: Configuration ID is missing.");
        }

        if (onConnectionChange) {
          onConnectionChange(true);
        }
      } else if (onConnectionChange) {
        onConnectionChange(false);
      }
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      if (onConnectionChange) {
        onConnectionChange(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoadingInitial) {
    return <CircularProgress />;
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        POR Connection Settings (MS Access)
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="MS Access File Path"
          variant="outlined"
          fullWidth
          value={filePath}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilePath(e.target.value)}
          placeholder="C:\Path\To\POR.mdb"
          helperText="Path to the MS Access database file on TS03 (10.10.20)"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleTestConnection}
          disabled={isConnecting || !filePath}
          sx={{ mr: 2 }}
        >
          {isConnecting ? <CircularProgress size={24} /> : 'Test Connection'}
        </Button>
        
        {connectionStatus.isConnected && (
          <Typography color="success.main" sx={{ mt: 1 }}>
            ✓ Connected successfully
          </Typography>
        )}
        
        {connectionStatus.error && (
          <Typography color="error" sx={{ mt: 1 }}>
            Error: {connectionStatus.error}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
