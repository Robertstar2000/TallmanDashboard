'use client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
export function AdminControls({ isRunning, onRun, mode, onModeChange }) {
    return (<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <Button onClick={onRun} disabled={isRunning} variant={isRunning ? "secondary" : "default"}>
        {isRunning ? 'Running...' : 'Run Queries'}
      </Button>
      
      <div className="flex items-center gap-2">
        <Switch checked={mode} onCheckedChange={onModeChange} id="mode-toggle"/>
        <label htmlFor="mode-toggle" className="text-sm font-medium">
          {mode ? 'Production Mode' : 'Test Mode'}
        </label>
      </div>
    </div>);
}
