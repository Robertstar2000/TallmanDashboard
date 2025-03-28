'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AdminHeaderProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  mode: boolean;
  onModeChange: (value: boolean) => void;
}

export default function AdminHeader({ isRunning, onRun, onStop, mode, onModeChange }: AdminHeaderProps) {
  return (
    <div className="flex justify-between items-center pb-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={mode ? "default" : "outline"}>
            {mode ? "Production Mode" : "Test Mode"}
          </Badge>
          <div className="flex items-center space-x-2">
            <Switch 
              id="mode-switch" 
              checked={mode} 
              onCheckedChange={onModeChange} 
            />
            <Label htmlFor="mode-switch">Production Mode</Label>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          onClick={isRunning ? onStop : onRun}
          variant={isRunning ? "destructive" : "default"}
        >
          {isRunning ? 'Stop Queries' : 'Run Queries'}
        </Button>
      </div>
    </div>
  );
}
