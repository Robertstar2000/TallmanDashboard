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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
// Default configurations
const DEFAULT_P21_CONFIG = {
    server: 'localhost',
    database: 'P21',
    user: 'sa',
    password: '',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};
const DEFAULT_POR_CONFIG = {
    server: 'localhost',
    database: 'POR',
    user: 'sa',
    password: '',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};
export function ServerConfigDialog({ server, config, onSave, onTest }) {
    const [open, setOpen] = useState(false);
    const defaultConfig = server === 'P21' ? DEFAULT_P21_CONFIG : DEFAULT_POR_CONFIG;
    const [localConfig, setLocalConfig] = useState(config || defaultConfig);
    // Update local config when props change
    useEffect(() => {
        setLocalConfig(config || defaultConfig);
    }, [config, defaultConfig]);
    const handleChange = (field, value) => {
        setLocalConfig(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    const handleSave = () => __awaiter(this, void 0, void 0, function* () {
        try {
            onSave(localConfig);
            setOpen(false);
            toast({
                title: "Configuration Saved",
                description: `${server} server configuration has been updated.`
            });
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to save server configuration.",
                variant: "destructive"
            });
        }
    });
    const handleTest = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield onTest();
            toast({
                title: "Connection Test",
                description: `Successfully connected to ${server} server.`
            });
        }
        catch (error) {
            toast({
                title: "Connection Test Failed",
                description: error instanceof Error ? error.message : "Failed to connect to server.",
                variant: "destructive"
            });
        }
    });
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Configure {server}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{server} Server Configuration</DialogTitle>
          <DialogDescription>
            Enter the connection details for the {server} server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="server" className="text-right">
              Server
            </Label>
            <Input id="server" value={localConfig.server} onChange={(e) => handleChange('server', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right">
              Database
            </Label>
            <Input id="database" value={localConfig.database} onChange={(e) => handleChange('database', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Username
            </Label>
            <Input id="user" value={localConfig.user} onChange={(e) => handleChange('user', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input id="password" type="password" value={localConfig.password} onChange={(e) => handleChange('password', e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input id="port" type="number" value={localConfig.port || 1433} onChange={(e) => handleChange('port', parseInt(e.target.value))} className="col-span-3"/>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleTest}>
            Test Connection
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
