import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ServerStatusProps {
  serverName: string;
  status: {
    isConnected: boolean;
    error?: string;
    details?: string[];
  };
}

export function ServerStatusComponent({ serverName, status }: ServerStatusProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium">{serverName} Server:</span>
        {status.error && (
          <p className="text-sm text-destructive mt-1">{status.error}</p>
        )}
        {status.details && status.details.length > 0 && (
          <ul className="text-sm mt-1 list-disc pl-5">
            {status.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <Badge variant={status.isConnected ? "default" : "destructive"}>
        {status.isConnected ? "Connected" : "Disconnected"}
      </Badge>
    </div>
  );
}
