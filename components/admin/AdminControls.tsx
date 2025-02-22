'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getMode } from '@/lib/state/dashboardState';

interface AdminControlsProps {
  onRefresh: () => void;
  onRestoreTestValues: () => void;
  isRealTime: boolean;
  onTimeSourceChange: (useRealTime: boolean) => void;
}

export function AdminControls({
  onRefresh,
  onRestoreTestValues,
  isRealTime,
  onTimeSourceChange
}: AdminControlsProps) {
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await onRefresh();
      toast({
        title: "Refresh Successful",
        description: "Data has been refreshed from the database.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreTestValues = async () => {
    try {
      await onRestoreTestValues();
      toast({
        title: "Test Values Restored",
        description: "Test data has been restored successfully.",
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore test values. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Keep UI in sync with mode state
  useEffect(() => {
    const interval = setInterval(() => {
      const currentMode = getMode();
      if (currentMode !== isRealTime) {
        onTimeSourceChange(currentMode);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRealTime, onTimeSourceChange]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button onClick={handleRefresh}>
            Refresh Data
          </Button>
          <Button onClick={handleRestoreTestValues} variant="outline">
            Restore Test Values
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="time-source"
            checked={isRealTime}
            onCheckedChange={onTimeSourceChange}
          />
          <Label htmlFor="time-source">
            {isRealTime ? "Production Mode" : "Test Mode"}
          </Label>
        </div>
      </div>
    </Card>
  );
}
