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
import { Button, TextField, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { getPORConnection, setPORConnection } from '@/lib/state/dashboardState';
export default function PORConnectionSettings({ onConnectionChange }) {
    const [filePath, setFilePath] = useState('C:\\Users\\BobM\\Desktop\\POR');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
    useEffect(() => {
        // Load existing connection settings
        const savedConnection = getPORConnection();
        if (savedConnection && savedConnection.filePath) {
            setFilePath(savedConnection.filePath);
        }
    }, []);
    const handleTestConnection = () => __awaiter(this, void 0, void 0, function* () {
        setIsConnecting(true);
        setConnectionStatus({ isConnected: false });
        try {
            const response = yield fetch('/api/testConnection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'POR',
                    config: {
                        server: 'TS03',
                        database: 'POR',
                        filePath,
                        type: 'POR'
                    }
                }),
            });
            const data = yield response.json();
            setConnectionStatus({
                isConnected: data.isConnected,
                error: data.error
            });
            if (data.isConnected) {
                // Save the connection settings
                const connection = {
                    server: 'TS03',
                    database: 'POR',
                    username: '',
                    password: '',
                    port: 0,
                    filePath
                };
                setPORConnection(connection);
                if (onConnectionChange) {
                    onConnectionChange(true);
                }
            }
            else if (onConnectionChange) {
                onConnectionChange(false);
            }
        }
        catch (error) {
            setConnectionStatus({
                isConnected: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
            if (onConnectionChange) {
                onConnectionChange(false);
            }
        }
        finally {
            setIsConnecting(false);
        }
    });
    return (<Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        POR Connection Settings (MS Access)
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField label="MS Access File Path" variant="outlined" fullWidth value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="C:\Path\To\POR.mdb" helperText="Path to the MS Access database file on TS03 (10.10.20)" sx={{ mb: 2 }}/>
        
        <Button variant="contained" color="primary" onClick={handleTestConnection} disabled={isConnecting || !filePath} sx={{ mr: 2 }}>
          {isConnecting ? <CircularProgress size={24}/> : 'Test Connection'}
        </Button>
        
        {connectionStatus.isConnected && (<Typography color="success.main" sx={{ mt: 1 }}>
            ✓ Connected successfully
          </Typography>)}
        
        {connectionStatus.error && (<Typography color="error" sx={{ mt: 1 }}>
            Error: {connectionStatus.error}
          </Typography>)}
      </Box>
    </Paper>);
}
