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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import Spinner from '@/components/ui/spinner';
export function ConnectionDialog({ open, onOpenChange, onSave, initialP21Config, initialPORConfig, }) {
    // Default configurations
    const defaultP21Config = {
        server: 'SQL01',
        database: 'P21play',
        username: 'sa',
        password: '',
        useWindowsAuth: true,
        port: 1433,
        type: 'P21'
    };
    const defaultPORConfig = {
        server: 'TS03',
        database: 'POR',
        username: 'sa',
        password: '',
        useWindowsAuth: true,
        port: 1433,
        type: 'POR'
    };
    // State for configurations
    const [p21Config, setP21Config] = useState(initialP21Config || defaultP21Config);
    const [porConfig, setPORConfig] = useState(initialPORConfig || defaultPORConfig);
    // State for test results
    const [p21TestResult, setP21TestResult] = useState(null);
    const [porTestResult, setPORTestResult] = useState(null);
    // Loading states
    const [p21Testing, setP21Testing] = useState(false);
    const [porTesting, setPORTesting] = useState(false);
    // Active tab
    const [activeTab, setActiveTab] = useState('p21');
    // Update state when initial configs change
    useEffect(() => {
        if (initialP21Config) {
            setP21Config(initialP21Config);
        }
        if (initialPORConfig) {
            setPORConfig(initialPORConfig);
        }
    }, [initialP21Config, initialPORConfig]);
    // Handle input changes for P21
    const handleP21Change = (field, value) => {
        setP21Config((prev) => (Object.assign(Object.assign({}, prev), { [field]: value })));
        setP21TestResult(null);
    };
    // Handle input changes for POR
    const handlePORChange = (field, value) => {
        setPORConfig((prev) => (Object.assign(Object.assign({}, prev), { [field]: value })));
        setPORTestResult(null);
    };
    // Test P21 connection
    const testP21Connection = () => __awaiter(this, void 0, void 0, function* () {
        setP21Testing(true);
        setP21TestResult(null);
        try {
            const response = yield fetch('/api/connection/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config: p21Config }),
            });
            const result = yield response.json();
            setP21TestResult(result);
        }
        catch (error) {
            setP21TestResult({
                success: false,
                message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
        finally {
            setP21Testing(false);
        }
    });
    // Test POR connection
    const testPORConnection = () => __awaiter(this, void 0, void 0, function* () {
        setPORTesting(true);
        setPORTestResult(null);
        try {
            const response = yield fetch('/api/connection/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config: porConfig }),
            });
            const result = yield response.json();
            setPORTestResult(result);
        }
        catch (error) {
            setPORTestResult({
                success: false,
                message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
        finally {
            setPORTesting(false);
        }
    });
    // Handle save
    const handleSave = () => {
        onSave(p21Config, porConfig);
        onOpenChange(false);
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Database Connections</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="p21">P21 Connection</TabsTrigger>
            <TabsTrigger value="por">POR Connection</TabsTrigger>
          </TabsList>
          
          {/* P21 Connection Tab */}
          <TabsContent value="p21" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p21-server">Server</Label>
                <Input id="p21-server" value={p21Config.server} onChange={(e) => handleP21Change('server', e.target.value)} placeholder="SQL01"/>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="p21-database">Database</Label>
                <Input id="p21-database" value={p21Config.database} onChange={(e) => handleP21Change('database', e.target.value)} placeholder="P21play"/>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="p21-windows-auth" checked={p21Config.useWindowsAuth} onCheckedChange={(checked) => handleP21Change('useWindowsAuth', Boolean(checked))}/>
                <Label htmlFor="p21-windows-auth">Use Windows Authentication</Label>
              </div>
            </div>
            
            {!p21Config.useWindowsAuth && (<div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p21-username">Username</Label>
                  <Input id="p21-username" value={p21Config.username} onChange={(e) => handleP21Change('username', e.target.value)} placeholder="sa"/>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="p21-password">Password</Label>
                  <Input id="p21-password" type="password" value={p21Config.password} onChange={(e) => handleP21Change('password', e.target.value)} placeholder="Password"/>
                </div>
              </div>)}
            
            <div className="space-y-2">
              <Label htmlFor="p21-port">Port (Optional)</Label>
              <Input id="p21-port" value={p21Config.port} onChange={(e) => handleP21Change('port', Number(e.target.value))} placeholder="1433"/>
            </div>
            
            <Button onClick={testP21Connection} disabled={p21Testing} className="w-full">
              {p21Testing ? <Spinner className="mr-2"/> : null}
              Test Connection
            </Button>
            
            {p21TestResult && (<Alert variant={p21TestResult.success ? "default" : "destructive"}>
                <AlertDescription>{p21TestResult.message}</AlertDescription>
              </Alert>)}
          </TabsContent>
          
          {/* POR Connection Tab */}
          <TabsContent value="por" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="por-server">Server</Label>
                <Input id="por-server" value={porConfig.server} onChange={(e) => handlePORChange('server', e.target.value)} placeholder="TS03"/>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="por-database">Database</Label>
                <Input id="por-database" value={porConfig.database} onChange={(e) => handlePORChange('database', e.target.value)} placeholder="POR"/>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="por-windows-auth" checked={porConfig.useWindowsAuth} onCheckedChange={(checked) => handlePORChange('useWindowsAuth', Boolean(checked))}/>
                <Label htmlFor="por-windows-auth">Use Windows Authentication</Label>
              </div>
            </div>
            
            {!porConfig.useWindowsAuth && (<div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="por-username">Username</Label>
                  <Input id="por-username" value={porConfig.username} onChange={(e) => handlePORChange('username', e.target.value)} placeholder="sa"/>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="por-password">Password</Label>
                  <Input id="por-password" type="password" value={porConfig.password} onChange={(e) => handlePORChange('password', e.target.value)} placeholder="Password"/>
                </div>
              </div>)}
            
            <div className="space-y-2">
              <Label htmlFor="por-port">Port (Optional)</Label>
              <Input id="por-port" value={porConfig.port} onChange={(e) => handlePORChange('port', Number(e.target.value))} placeholder="1433"/>
            </div>
            
            <Button onClick={testPORConnection} disabled={porTesting} className="w-full">
              {porTesting ? <Spinner className="mr-2"/> : null}
              Test Connection
            </Button>
            
            {porTestResult && (<Alert variant={porTestResult.success ? "default" : "destructive"}>
                <AlertDescription>{porTestResult.message}</AlertDescription>
              </Alert>)}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Connections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
