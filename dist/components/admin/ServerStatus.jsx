'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServerStatusComponent } from './ServerStatusComponent';
export function ServerStatus({ isP21Connected, isPORConnected }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkHealth = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/api/health');
                const data = yield response.json();
                setStatus(data);
            }
            catch (error) {
                console.error('Error checking health:', error);
            }
            finally {
                setLoading(false);
            }
        });
        // Check immediately and then every 30 seconds
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return <div>Checking server status...</div>;
    }
    return (<Card>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
        <CardDescription>Current health status of database connections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span>SQLite Database:</span>
            <Badge variant={(status === null || status === void 0 ? void 0 : status.isHealthy) ? "default" : "destructive"}>
              {(status === null || status === void 0 ? void 0 : status.isHealthy) ? "Healthy" : "Error"}
            </Badge>
          </div>
          
          <ServerStatusComponent serverName="P21" status={{
            isConnected: isP21Connected,
            error: !isP21Connected ? 'Failed to connect' : undefined,
            details: isP21Connected ? ['Connected successfully'] : undefined,
        }}/>

          <ServerStatusComponent serverName="POR" status={{
            isConnected: isPORConnected,
            error: !isPORConnected ? 'Failed to connect' : undefined,
            details: isPORConnected ? ['Connected successfully'] : undefined,
        }}/>

          {(status === null || status === void 0 ? void 0 : status.details) && (<div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Database Details:</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>File Access:</span>
                  <Badge variant={status.details.fileAccessible ? "default" : "destructive"}>
                    {status.details.fileAccessible ? "OK" : "Error"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>WAL Mode:</span>
                  <Badge variant={status.details.walModeEnabled ? "default" : "destructive"}>
                    {status.details.walModeEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Foreign Keys:</span>
                  <Badge variant={status.details.foreignKeysEnabled ? "default" : "destructive"}>
                    {status.details.foreignKeysEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tables:</span>
                  <Badge variant={status.details.tablesInitialized ? "default" : "destructive"}>
                    {status.details.tablesInitialized ? "Initialized" : "Not Ready"}
                  </Badge>
                </div>
              </div>
            </div>)}

          {(status === null || status === void 0 ? void 0 : status.error) && (<Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>)}
        </div>
      </CardContent>
    </Card>);
}
