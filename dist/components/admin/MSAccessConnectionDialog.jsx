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
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Spinner from '../ui/spinner';
import { toast } from '@/hooks/use-toast';
export default function MSAccessConnectionDialog() {
    const [filePath, setFilePath] = useState('C:\\Users\\BobM\\Desktop\\POR.MDB');
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);
    // Load saved file path from localStorage on component mount
    useEffect(() => {
        const savedPath = localStorage.getItem('porAccessFilePath');
        if (savedPath) {
            setFilePath(savedPath);
        }
    }, []);
    // Handle file path change
    const handleFilePathChange = (e) => {
        setFilePath(e.target.value);
        // Clear previous result when path changes
        setResult(null);
    };
    // Test connection
    const testConnection = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setTesting(true);
            setResult(null);
            // Make sure the file path includes the .MDB extension
            if (!filePath.toLowerCase().endsWith('.mdb') && !filePath.toLowerCase().endsWith('.accdb')) {
                setResult({
                    success: false,
                    message: 'File path must end with .mdb or .accdb extension'
                });
                toast({
                    title: "Validation Error",
                    description: "File path must end with .mdb or .accdb extension",
                    variant: "destructive",
                });
                setTesting(false);
                return;
            }
            const response = yield fetch('/api/testAccessConnection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath: filePath
                }),
            });
            const data = yield response.json();
            setResult({
                success: data.success,
                message: data.message,
                details: data.details
            });
            if (data.success) {
                // Save the file path to localStorage
                localStorage.setItem('porAccessFilePath', filePath);
                // Also save to environment variable via API
                yield fetch('/api/admin/saveConfig', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: 'POR_ACCESS_FILE_PATH',
                        value: filePath
                    }),
                });
                toast({
                    title: "Connection Successful",
                    description: `Successfully connected to POR database at ${filePath}`,
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
            setResult({
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
            setTesting(false);
        }
    });
    return (<Card>
      <CardHeader>
        <CardTitle>POR Database Connection (MS Access)</CardTitle>
        <CardDescription>Configure the connection to your POR database using MS Access.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="file-path">File Path</Label>
            <Input id="file-path" value={filePath} onChange={handleFilePathChange} className="mt-1" placeholder="C:\Path\To\POR.MDB"/>
            <p className="text-sm text-gray-500 mt-1">
              Enter the full path to your POR.MDB file including the filename
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => setResult(null)} disabled={testing} variant="outline">
          Cancel
        </Button>
        <Button onClick={testConnection} disabled={testing}>
          {testing ? (<div className="flex items-center justify-center">
              <Spinner size="small"/>
              <span className="ml-2">Testing...</span>
            </div>) : 'Save & Test Connection'}
        </Button>
      </CardFooter>
      
      {result && (<div className="p-4 pt-0">
          {result.success ? (<Alert>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>) : (<Alert variant="destructive">
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>)}
        </div>)}
    </Card>);
}
