'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseConnection } from '@/lib/db/types';

interface ServerConnectionDialogProps {
  serverType: 'P21' | 'POR';
  onConnectionChange: (isConnected: boolean) => void;
  trigger: React.ReactNode;
}

export function ServerConnectionDialog({
  serverType,
  onConnectionChange,
  trigger
}: ServerConnectionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [connection, setConnection] = React.useState<DatabaseConnection>({
    server: 'localhost',
    database: serverType.toLowerCase(),
    username: 'admin',
    password: '',
    port: 1433
  });

  const handleConnect = () => {
    onConnectionChange(true);
    setOpen(false);
  };

  const handleDisconnect = () => {
    onConnectionChange(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{serverType} Connection Settings</DialogTitle>
          <DialogDescription>
            Configure your {serverType} database connection settings. Make sure to enter valid credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="server" className="text-right">
              Server
            </Label>
            <Input
              id="server"
              value={connection.server}
              onChange={(e) => setConnection({ ...connection, server: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right">
              Database
            </Label>
            <Input
              id="database"
              value={connection.database}
              onChange={(e) => setConnection({ ...connection, database: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={connection.username}
              onChange={(e) => setConnection({ ...connection, username: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={connection.password}
              onChange={(e) => setConnection({ ...connection, password: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input
              id="port"
              type="number"
              value={connection.port}
              onChange={(e) => setConnection({ ...connection, port: parseInt(e.target.value, 10) })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleDisconnect}>
            Disconnect
          </Button>
          <Button onClick={handleConnect}>Connect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
