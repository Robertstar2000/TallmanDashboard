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
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Spinner from '../ui/spinner';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
export default function DatabaseConnectionTester() {
    // P21 Connection Config
    const [p21Config, setP21Config] = useState({
        server: 'SQL01',
        database: 'P21play',
        username: 'sa',
        password: '',
        useWindowsAuth: true,
        port: 1433,
        type: 'P21'
    });
    // POR Connection Config
    const [porConfig, setPORConfig] = useState({
        server: 'TS03',
        database: 'POR',
        username: 'sa',
        password: '',
        useWindowsAuth: true,
        port: 1433,
        type: 'POR'
    });
    // Testing states
    const [testingP21, setTestingP21] = useState(false);
    const [testingPOR, setTestingPOR] = useState(false);
    const [p21Result, setP21Result] = useState(null);
    const [porResult, setPORResult] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    // Handle P21 config changes
    const handleP21Change = (field) => (e) => {
        setP21Config(Object.assign(Object.assign({}, p21Config), { [field]: field === 'port' ? parseInt(e.target.value) : e.target.value }));
    };
    // Handle P21 Windows Auth toggle
    const handleP21WindowsAuthChange = (checked) => {
        setP21Config(Object.assign(Object.assign({}, p21Config), { useWindowsAuth: checked }));
    };
    // Handle POR config changes
    const handlePORChange = (field) => (e) => {
        setPORConfig(Object.assign(Object.assign({}, porConfig), { [field]: field === 'port' ? parseInt(e.target.value) : e.target.value }));
    };
    // Handle POR Windows Auth toggle
    const handlePORWindowsAuthChange = (checked) => {
        setPORConfig(Object.assign(Object.assign({}, porConfig), { useWindowsAuth: checked }));
    };
    // Test P21 Connection
    const testP21Connection = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setTestingP21(true);
            setP21Result(null);
            const response = yield fetch('/api/admin/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'P21',
                    config: p21Config
                }),
            });
            const data = yield response.json();
            setP21Result({
                success: data.success,
                message: data.message,
                details: data.details
            });
            if (data.success) {
                toast({
                    title: "Connection Successful",
                    description: `Successfully connected to P21 database on ${p21Config.server}`,
                });
            }
            else {
                toast({
                    title: "Connection Failed",
                    description: data.message,
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Error testing P21 connection:', error);
            setP21Result({
                success: false,
                message: 'Error testing connection. See console for details.'
            });
            toast({
                title: "Connection Error",
                description: "An error occurred while testing the connection",
                variant: "destructive",
            });
        }
        finally {
            setTestingP21(false);
        }
    });
    // Test POR Connection
    const testPORConnection = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setTestingPOR(true);
            setPORResult(null);
            const response = yield fetch('/api/admin/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    server: 'POR',
                    config: porConfig
                }),
            });
            const data = yield response.json();
            setPORResult({
                success: data.success,
                message: data.message,
                details: data.details
            });
            if (data.success) {
                toast({
                    title: "Connection Successful",
                    description: `Successfully connected to POR database on ${porConfig.server}`,
                });
            }
            else {
                toast({
                    title: "Connection Failed",
                    description: data.message,
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            console.error('Error testing POR connection:', error);
            setPORResult({
                success: false,
                message: 'Error testing connection. See console for details.'
            });
            toast({
                title: "Connection Error",
                description: "An error occurred while testing the connection",
                variant: "destructive",
            });
        }
        finally {
            setTestingPOR(false);
        }
    });
    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    return (<div className="mb-4">
      <h2 className="text-2xl font-bold mb-2">
        Database Connection Tester
      </h2>
      <p className="text-gray-500 mb-4">
        Configure and test connections to P21 and POR databases. Successful configurations will be saved automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* P21 Connection Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>P21 Database Connection</CardTitle>
              <CardDescription>Configure connection to P21play on SQL01</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <Label htmlFor="p21-server">Server</Label>
                  <Input id="p21-server" value={p21Config.server} onChange={handleP21Change('server')} className="mt-1"/>
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="p21-port">Port</Label>
                  <Input id="p21-port" type="number" value={p21Config.port} onChange={handleP21Change('port')} className="mt-1"/>
                </div>
                <div className="sm:col-span-4">
                  <Label htmlFor="p21-database">Database</Label>
                  <Input id="p21-database" value={p21Config.database} onChange={handleP21Change('database')} className="mt-1"/>
                </div>
                <div className="sm:col-span-4">
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch id="p21-windows-auth" checked={p21Config.useWindowsAuth} onCheckedChange={handleP21WindowsAuthChange}/>
                    <Label htmlFor="p21-windows-auth">Use Windows Authentication</Label>
                  </div>
                </div>
                {!p21Config.useWindowsAuth && (<>
                    <div className="sm:col-span-2">
                      <Label htmlFor="p21-username">Username</Label>
                      <Input id="p21-username" value={p21Config.username} onChange={handleP21Change('username')} className="mt-1"/>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="p21-password">Password</Label>
                      <Input id="p21-password" type="password" value={p21Config.password} onChange={handleP21Change('password')} className="mt-1"/>
                    </div>
                  </>)}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="w-full">
                <Button onClick={testP21Connection} disabled={testingP21} className="w-full">
                  {testingP21 ? (<div className="flex items-center justify-center">
                      <Spinner size="small"/>
                      <span className="ml-2">Testing...</span>
                    </div>) : 'Test Connection'}
                </Button>
              </div>
            </CardFooter>
          </Card>

          {p21Result && (<div className="mt-4">
              {p21Result.success ? (<Alert>
                  <AlertDescription>
                    {p21Result.message}
                  </AlertDescription>
                </Alert>) : (<Alert variant="destructive">
                  <AlertDescription>
                    {p21Result.message}
                  </AlertDescription>
                </Alert>)}
            </div>)}
        </div>

        {/* POR Connection Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>POR Database Connection</CardTitle>
              <CardDescription>Configure connection to POR on TS03</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <Label htmlFor="por-server">Server</Label>
                  <Input id="por-server" value={porConfig.server} onChange={handlePORChange('server')} className="mt-1"/>
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="por-port">Port</Label>
                  <Input id="por-port" type="number" value={porConfig.port} onChange={handlePORChange('port')} className="mt-1"/>
                </div>
                <div className="sm:col-span-4">
                  <Label htmlFor="por-database">Database</Label>
                  <Input id="por-database" value={porConfig.database} onChange={handlePORChange('database')} className="mt-1"/>
                </div>
                <div className="sm:col-span-4">
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch id="por-windows-auth" checked={porConfig.useWindowsAuth} onCheckedChange={handlePORWindowsAuthChange}/>
                    <Label htmlFor="por-windows-auth">Use Windows Authentication</Label>
                  </div>
                </div>
                {!porConfig.useWindowsAuth && (<>
                    <div className="sm:col-span-2">
                      <Label htmlFor="por-username">Username</Label>
                      <Input id="por-username" value={porConfig.username} onChange={handlePORChange('username')} className="mt-1"/>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="por-password">Password</Label>
                      <Input id="por-password" type="password" value={porConfig.password} onChange={handlePORChange('password')} className="mt-1"/>
                    </div>
                  </>)}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="w-full">
                <Button onClick={testPORConnection} disabled={testingPOR} className="w-full">
                  {testingPOR ? (<div className="flex items-center justify-center">
                      <Spinner size="small"/>
                      <span className="ml-2">Testing...</span>
                    </div>) : 'Test Connection'}
                </Button>
              </div>
            </CardFooter>
          </Card>

          {porResult && (<div className="mt-4">
              {porResult.success ? (<Alert>
                  <AlertDescription>
                    {porResult.message}
                  </AlertDescription>
                </Alert>) : (<Alert variant="destructive">
                  <AlertDescription>
                    {porResult.message}
                  </AlertDescription>
                </Alert>)}
            </div>)}
        </div>
      </div>
    </div>);
}
