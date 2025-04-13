"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ServerConfig } from '@/lib/db/types'; // Corrected import path
import { Loader2 } from "lucide-react";

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
}

// Define a type for the P21 connection form data
interface P21ConnectionFormData {
  server: string;
  database: string;
  username?: string; // Optional if using Windows Auth
  password?: string; // Optional if using Windows Auth
  useWindowsAuth: boolean;
  port: number;
  type: 'P21'; // Keep type for clarity/consistency if needed
}

export default function DatabaseConnectionTester() {
  const { toast } = useToast();

  // P21 Connection Config - Use the new dedicated type
  const [p21Config, setP21Config] = useState<P21ConnectionFormData>({
    server: 'SQL01',
    database: 'P21play',
    username: 'sa',
    password: '',
    useWindowsAuth: true,
    port: 1433,
    type: 'P21'
  });

  // POR Connection Config - Updated for MS Access File Path
  // Using Partial<ServerConfig> because we don't need most fields, plus adding filePath
  const [porConfig, setPORConfig] = useState<Partial<ServerConfig> & { filePath?: string }>({
    filePath: 'C:\\Users\\BobM\\Desktop\\POR.mdb', // Initialize with default file path
    type: 'POR'
  });

  // Testing states
  const [testingP21, setTestingP21] = useState(false);
  const [testingPOR, setTestingPOR] = useState(false);
  const [p21Result, setP21Result] = useState<ConnectionTestResult | null>(null);
  const [porResult, setPORResult] = useState<ConnectionTestResult | null>(null);
  const [loadingP21, setLoadingP21] = useState(false);
  const [loadingPOR, setLoadingPOR] = useState(false);

  // Updated handler for P21 form changes
  const handleP21Change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target; // Capture target
    const { name, value, type } = target;

    // Handle checkbox separately
    if (type === 'checkbox' && target instanceof HTMLInputElement) {
      // Use the narrowed 'target' reference
      setP21Config(prev => ({ ...prev, [name]: target.checked }));
    } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) { // Ensure target is one of these before accessing value
      // Handle port separately to ensure it's a number
      if (name === 'port') {
        const portValue = parseInt(value, 10);
        setP21Config(prev => ({ ...prev, [name]: isNaN(portValue) ? 1433 : portValue })); // Default/fallback if NaN
      } else {
        setP21Config(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  // Handle POR config changes - Updated for filePath
  const handlePORChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPORConfig({
      ...porConfig,
      filePath: e.target.value // Directly update filePath
    });
  };

  // Updated testP21Connection to send the correct P21 form data
  const testP21Connection = async () => {
    try {
      setLoadingP21(true);
      setP21Result(null);

      console.log('P21 Config before fetch:', p21Config); // Keep for debugging if needed

      const response = await fetch('/api/admin/test-p21', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the p21Config object directly (matches P21ConnectionFormData)
        body: JSON.stringify(p21Config),
      });

      const data: ConnectionTestResult = await response.json();

      setP21Result({
        success: data.success,
        message: data.message,
        details: data.details
      });

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to P21 database ${p21Config.database} on ${p21Config.server}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing P21 connection:', error);
      setP21Result({
        success: false,
        message: 'Error testing connection. See console for details.'
      });
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the P21 connection",
        variant: "destructive",
      });
    } finally {
      setLoadingP21(false);
    }
  };

  // Test POR Connection (already manually updated logic)
  const testPORConnection = async () => {
    try {
      setLoadingPOR(true);
      setPORResult(null);

      // Make sure porConfig and filePath exist before sending
      if (!porConfig || !porConfig.filePath) {
          console.error('POR config or file path is missing');
          setPORResult({ success: false, message: 'POR configuration or file path is missing.' });
          toast({
            title: "Configuration Error",
            description: "POR configuration or file path is missing.",
            variant: "destructive",
          });
          setLoadingPOR(false);
          return;
      }

      const response = await fetch('/api/admin/test-por', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send only the filePath, as expected by the API route
        body: JSON.stringify({ filePath: porConfig.filePath }),
      });

      const data = await response.json();

      setPORResult({
        success: data.success,
        message: data.message,
        details: data.details
      });

      if (data.success) {
        toast({
          title: "Connection Successful",
          // Updated toast message to reflect file path connection
          description: `Successfully connected to POR database at ${porConfig.filePath}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
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
    } finally {
      setLoadingPOR(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg"> {/* Added padding and border */}
      <h2 className="text-2xl font-bold mb-4"> {/* Increased margin */}
        Database Connection Tester
      </h2>
      <p className="text-sm text-muted-foreground mb-6"> {/* Added margin */}
        Configure and test connections to P21 and POR databases. Successful configurations will be saved automatically (if implemented).
      </p>

      {/* P21 Connection Section */}
      <Card className="mb-6"> {/* Increased margin */}
        <CardHeader>
          <CardTitle>P21 Database Connection</CardTitle>
          <CardDescription>Configure connection to P21 SQL Server database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="p21-server" className="text-right">Server</Label>
              <Input
                id="p21-server"
                name="server" // Matches key in P21ConnectionFormData
                value={p21Config.server}
                onChange={handleP21Change}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="p21-port" className="text-right">Port</Label>
               <Input
                   id="p21-port"
                   name="port" // Matches key in P21ConnectionFormData
                   type="number"
                   value={p21Config.port}
                   onChange={handleP21Change}
               />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="p21-database" className="text-right">Database</Label>
              <Input
                id="p21-database"
                name="database" // Matches key in P21ConnectionFormData
                value={p21Config.database}
                onChange={handleP21Change}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="p21-useWindowsAuth" className="text-right">Windows Auth</Label>
              <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="p21-useWindowsAuth"
                    name="useWindowsAuth" // Matches key in P21ConnectionFormData
                    checked={p21Config.useWindowsAuth}
                    onCheckedChange={(checked) => {
                      // Adapt Checkbox's onCheckedChange to fit our handler pattern
                      // Type assertion needed as checked is boolean | 'indeterminate'
                      const isChecked = checked === true;
                      handleP21Change({
                        target: { name: 'useWindowsAuth', value: String(isChecked), type: 'checkbox' },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                  />
                  <Label htmlFor="p21-useWindowsAuth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Use Windows Authentication
                  </Label>
              </div>
            </div>
            {!p21Config.useWindowsAuth && (
              <div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="p21-username" className="text-right">Username</Label>
                  <Input
                    id="p21-username"
                    name="username" // Matches key in P21ConnectionFormData
                    value={p21Config.username || ''} // Handle potential undefined
                    onChange={handleP21Change}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="p21-password" className="text-right">Password</Label>
                  <Input
                    id="p21-password"
                    name="password" // Matches key in P21ConnectionFormData
                    type="password"
                    value={p21Config.password || ''} // Handle potential undefined
                    onChange={handleP21Change}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <Button onClick={testP21Connection} disabled={loadingP21}>
              {loadingP21 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test P21 Connection
            </Button>
            {p21Result && (
              <div className={`mt-4 p-3 rounded ${p21Result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p><strong>Status:</strong> {p21Result.success ? 'Success' : 'Failed'}</p>
                <p><strong>Message:</strong> {p21Result.message}</p>
                {p21Result.details && <pre className="mt-2 text-xs whitespace-pre-wrap">{p21Result.details}</pre>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* POR Connection Section - Updated for MS Access */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>POR Database Connection</CardTitle>
          <CardDescription>Configure connection to MS Access POR database.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* MS Access File Path Input */}
            <div className="space-y-2">
              <Label htmlFor="por-filePath">MS Access File Path</Label>
              <Input
                id="por-filePath"
                name="filePath" // Matches key in porConfig state extension
                value={porConfig.filePath || ''}
                onChange={handlePORChange}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full local or network path to the .mdb file.
              </p>
            </div>

            {/* Removed old inputs for Server, Port, Database, Auth */}

            <Button onClick={testPORConnection} disabled={testingPOR || !porConfig.filePath}>
              {testingPOR ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test POR Connection
            </Button>
            {porResult && (
              <div className={`mt-4 p-3 rounded ${porResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p><strong>Status:</strong> {porResult.success ? 'Success' : 'Failed'}</p>
                <p><strong>Message:</strong> {porResult.message}</p>
                {porResult.details && <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{porResult.details}</pre>} {/* Added break-all */}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Removed Snackbar as toasts are used */}
    </div>
  );
}
