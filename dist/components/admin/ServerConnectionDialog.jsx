import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useLocalStorage } from '../../lib/hooks/use-local-storage';
export function ServerConnectionDialog({ serverType, buttonVariant = 'default' }) {
    const [filePath, setFilePath] = useState('C:\\Users\\BobM\\Desktop');
    // Store POR file path in local storage
    const [storedFilePath, setStoredFilePath] = useLocalStorage('por-file-path', 'C:\\Users\\BobM\\Desktop');
    useEffect(() => {
        if (serverType === 'POR' && storedFilePath) {
            setFilePath(storedFilePath);
        }
    }, [serverType, storedFilePath]);
    const handleSaveFilePath = () => {
        if (serverType === 'POR') {
            setStoredFilePath(filePath);
        }
    };
    return (<Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          {serverType} Connection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {serverType === 'P21'
            ? 'P21 Server Connection'
            : 'POR Database Connection (MS Access)'}
          </DialogTitle>
        </DialogHeader>
        
        {serverType === 'P21' ? (<div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              P21 connection settings are managed via the web.config file.
            </p>
            <div className="px-4 py-2 bg-muted rounded-md">
              <code className="text-sm">
                {`<add name="P21_CONNECTION" value="Server=...;Database=...;User Id=...;Password=...;" />`}
              </code>
            </div>
          </div>) : (<div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Configure the connection to your POR database. POR uses MS Access database on your local machine.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="por-file-path">MS Access File Path</Label>
              <Input id="por-file-path" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="C:\\Users\\BobM\\Desktop"/>
              <p className="text-xs text-muted-foreground">Path to the folder containing your MS Access database file</p>
            </div>
            
            <Button onClick={handleSaveFilePath}>
              Save Path
            </Button>
          </div>)}
      </DialogContent>
    </Dialog>);
}
