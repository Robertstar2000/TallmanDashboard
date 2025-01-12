'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AdminSpreadsheet } from '@/components/admin/AdminSpreadsheet';
import { useAdminData } from '@/lib/hooks/useAdminData';
import { Toaster } from '@/components/ui/toaster';
import { RefreshCcw, RotateCcw, Loader2, Play, Square, AlertCircle, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ResetDialog } from '@/components/admin/ResetDialog';
import DatabaseConnectionDialog from '@/components/DatabaseConnectionDialog';
import { HelpDialog } from '@/components/admin/HelpDialog';

export default function AdminPage() {
  const router = useRouter();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [dbDialogOpen, setDbDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { 
    data, 
    loading, 
    error, 
    updateVariable, 
    refreshData, 
    restoreTestData, 
    resetData,
    isRunning,
    startPolling,
    stopPolling,
    isRealTime,
    handleTimeSourceChange,
    p21Connected,
    pendingChanges,
    handleSave,
    handleDatabaseConnect
  } = useAdminData();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !isRealTime) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Variables</h1>
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={isRunning ? stopPolling : startPolling}
                  className={cn(
                    "w-32 text-white",
                    isRunning ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  )}
                >
                  {isRunning ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDbDialogOpen(true)}
                  className={cn(
                    "w-32",
                    isRealTime && p21Connected ? "text-green-600 border-green-600" : "text-gray-600"
                  )}
                >
                  {isRealTime && p21Connected ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Connected
                    </>
                  ) : (
                    "Connect DB"
                  )}
                </Button>
              </div>
              {isRunning && (
                <span className="text-sm text-gray-600">
                  Polling every {isRealTime ? '1 hour' : '5 seconds'}
                </span>
              )}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-6">
                <Label htmlFor="time-mode" className="text-sm">
                  Test Time
                </Label>
                <Switch
                  id="time-mode"
                  checked={isRealTime}
                  onCheckedChange={handleTimeSourceChange}
                />
                <Label htmlFor="time-mode" className="text-sm">
                  Real Time
                </Label>
              </div>
              {Object.keys(pendingChanges).length > 0 && (
                <Button 
                  onClick={handleSave}
                  className="ml-6 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHelpDialogOpen(true)}
              >
                <span>Help</span>
              </Button>
              <Button
                variant="outline"
                onClick={refreshData}
                className="gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(true)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Initial Values
              </Button>
            </div>
          </div>

          {isRealTime && !p21Connected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No connection to P21 database. Data may be stale.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSpreadsheet data={data} onUpdate={updateVariable} />
          </CardContent>
        </Card>
      </div>
      <Toaster />
      <DatabaseConnectionDialog
        isOpen={dbDialogOpen}
        onClose={() => setDbDialogOpen(false)}
        onConnect={handleDatabaseConnect}
      />
      <ResetDialog 
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirmReset={resetData}
      />
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
    </div>
  );
}