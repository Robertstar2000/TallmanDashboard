import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ServerConnectionDialogProps {
  serverType: 'P21' | 'POR';
  buttonVariant?: 'default' | 'outline';
}

export function ServerConnectionDialog({ 
  serverType, 
  buttonVariant = 'default' 
}: ServerConnectionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          {serverType} Connection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{serverType} Server Connection</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {serverType} connection settings are managed via the web.config file.
          </p>
          <div className="px-4 py-2 bg-muted rounded-md">
            <code className="text-sm">
              {`<add name="${serverType}_CONNECTION" value="Server=...;Database=...;User Id=...;Password=...;" />`}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
