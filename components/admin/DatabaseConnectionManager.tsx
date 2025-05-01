import React, { useState, useEffect } from 'react';
import { ServerConfig } from '@/lib/db/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Spinner from '../ui/spinner';
// import { useLocalStorage } from '@/lib/hooks/use-local-storage';

/**
 * Database Connection Manager component for the admin dashboard
 * Allows users to configure and test connections to P21 and POR databases
 */
export function DatabaseConnectionManager() {
  // Default P21 connection settings
  const defaultP21Config: ServerConfig = {
    type: 'P21',
    server: 'SQL01',
    database: 'P21play',
    username: 'sa',
    password: '',
    useWindowsAuth: true,
    port: 1433,
  };

  // Default POR (MS Access) connection settings
  const defaultPORConfig: ServerConfig = {
    type: 'POR',
    filePath: 'C:\\Users\\BobM\\Desktop\\POR.MDB',
  };

  // Local storage hooks for persisting connection configurations - Temporarily disabled
  // const [storedP21Config, setStoredP21Config] = useLocalStorage<ServerConfig>('p21-connection-config', defaultP21Config);
  // const [storedPORConfig, setStoredPORConfig] = useLocalStorage<ServerConfig>('por-connection-config', defaultPORConfig);

  // State for configurations - Initialize directly with defaults
  const [p21Config, setP21Config] = useState<ServerConfig>(defaultP21Config);
  const [porConfig, setPORConfig] = useState<ServerConfig>(defaultPORConfig);
  
  // State for test results
  const [p21TestResult, setP21TestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [porTestResult, setPORTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Loading states
  const [p21Testing, setP21Testing] = useState(false);
  const [porTesting, setPORTesting] = useState(false);
  
  // Connection states
  const [p21Connected, setP21Connected] = useState(false);
  const [porConnected, setPORConnected] = useState(false);

  // Update state when stored configs change - Temporarily disabled
  // useEffect(() => {
  //   setP21Config(storedP21Config);
  //   setPORConfig(storedPORConfig);
  // }, [storedP21Config, storedPORConfig]);

  // Handle input changes for P21
  const handleP21Change = (field: keyof ServerConfig, value: string | boolean) => {
    setP21Config((prev: ServerConfig) => ({
      ...prev,
      [field]: field === 'port' && typeof value === 'string' ? parseInt(value, 10) || 1433 : value,
    }));
    setP21TestResult(null);
    setP21Connected(false);
  };

  // Handle input changes for POR
  const handlePORChange = (field: keyof ServerConfig, value: string | boolean) => {
    setPORConfig((prev: ServerConfig) => ({
      ...prev,
      [field]: field === 'port' && typeof value === 'string' ? parseInt(value, 10) || 0 : value,
    }));
    setPORTestResult(null);
    setPORConnected(false);
  };

  // Test P21 connection
  const testP21Connection = async () => {
    setP21Testing(true);
    setP21TestResult(null);
    
    try {
      const response = await fetch('/api/connection/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p21Config),
      });
      
      const result = (await response.json()) as { success: boolean; message: string };
      setP21TestResult(result);
      setP21Connected(result.success);
      
      if (result.success) {
        // Save successful configuration - Temporarily disabled
        // setStoredP21Config(p21Config);
      }
    } catch (error) {
      setP21TestResult({
        success: false,
        message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      setP21Connected(false);
    } finally {
      setP21Testing(false);
    }
  };

  // Test POR connection
  const testPORConnection = async () => {
    setPORTesting(true);
    setPORTestResult(null);
    
    try {
      // Validate filePath locally first
      if (!porConfig.filePath) {
        setPORTestResult({ success: false, message: 'MS Access File Path is required.' });
        setPORTesting(false);
        return;
      }

      // --- DEBUG LOG --- 
      console.log('Frontend: Sending POR test request with filePath:', porConfig.filePath);

      const response = await fetch('/api/admin/test-por', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(porConfig),
      });
      
      const result = (await response.json()) as { success: boolean; message: string };
      setPORTestResult(result);
      setPORConnected(result.success);
      
      if (result.success) {
        // Save successful configuration (only if needed, potentially just the path) - Temporarily disabled
        // Keeping the existing save logic for now
        // setStoredPORConfig({
        //   ...porConfig,
        //   type: 'POR',
        //   filePath: porConfig.filePath
        // });
      }
    } catch (error) {
      setPORTestResult({
        success: false,
        message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      setPORConnected(false);
    } finally {
      setPORTesting(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setP21Config(defaultP21Config);
    setPORConfig(defaultPORConfig);
    setP21TestResult(null);
    setPORTestResult(null);
    setP21Connected(false);
    setPORConnected(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Connections</CardTitle>
        <CardDescription>
          Configure connections to P21play and POR databases
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="p21" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="p21">
              P21 Connection
              {p21Connected && <span className="ml-2 text-green-500">●</span>}
            </TabsTrigger>
            <TabsTrigger value="por">
              POR Connection (MS Access)
              {porConnected && <span className="ml-2 text-green-500">●</span>}
            </TabsTrigger>
          </TabsList>
          
          {/* P21 Connection Tab */}
          <TabsContent value="p21" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p21-server">Server</Label>
                <Input
                  id="p21-server"
                  value={p21Config.server ?? ''}
                  onChange={(e) => handleP21Change('server', e.target.value)}
                  placeholder="SQL01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="p21-database">Database</Label>
                <Input
                  id="p21-database"
                  value={p21Config.database ?? ''}
                  onChange={(e) => handleP21Change('database', e.target.value)}
                  placeholder="P21play"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="p21-windows-auth"
                  checked={Boolean(p21Config.useWindowsAuth)}
                  onCheckedChange={(checked) => handleP21Change('useWindowsAuth', Boolean(checked))}
                />
                <Label htmlFor="p21-windows-auth">Use Windows Authentication</Label>
              </div>
            </div>
            
            {!p21Config.useWindowsAuth && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p21-username">Username</Label>
                  <Input
                    id="p21-username"
                    value={p21Config.username ?? ''}
                    onChange={(e) => handleP21Change('username', e.target.value)}
                    placeholder="sa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="p21-password">Password</Label>
                  <Input
                    id="p21-password"
                    type="password"
                    value={p21Config.password ?? ''}
                    onChange={(e) => handleP21Change('password', e.target.value)}
                    placeholder="Password"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="p21-port">Port (Optional)</Label>
              <Input
                id="p21-port"
                value={p21Config.port?.toString() ?? ''}
                onChange={(e) => handleP21Change('port', e.target.value)}
                placeholder="1433"
              />
            </div>
            
            <Button 
              onClick={testP21Connection} 
              disabled={p21Testing}
              className="w-full"
            >
              {p21Testing ? <Spinner className="mr-2" /> : null}
              Test Connection
            </Button>
            
            {p21TestResult && (
              <Alert variant={p21TestResult.success ? "default" : "destructive"}>
                <AlertDescription>{p21TestResult.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          {/* POR Connection Tab */}
          <TabsContent value="por" className="space-y-4 mt-4">
            
            <div className="space-y-2">
              <Label htmlFor="por-file-path">MS Access File Path</Label>
              <Input
                id="por-file-path"
                value={porConfig.filePath || ''}
                onChange={(e) => handlePORChange('filePath', e.target.value)}
                placeholder="C:\\Path\\To\\Your\\Database.mdb"
              />
              <p className="text-xs text-muted-foreground">Full path to the MS Access database file (e.g., .mdb or .accdb)</p>
            </div>
            
            <Button
              onClick={testPORConnection}
              disabled={porTesting}
              className="w-full"
            >
              {porTesting ? <Spinner className="mr-2" /> : null}
              Test MS Access Connection
            </Button>
            
            {porTestResult && (
              <Alert variant={porTestResult.success ? "default" : "destructive"}>
                <AlertDescription>{porTestResult.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            onClick={testP21Connection}
            disabled={p21Testing}
          >
            Test P21
          </Button>
          <Button 
            variant="secondary" 
            onClick={testPORConnection}
            disabled={porTesting}
          >
            Test POR
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
