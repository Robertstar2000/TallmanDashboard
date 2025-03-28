'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useQueryStatusStore } from "@/lib/stores/queryStatusStore";
import { checkAllConnections } from '@/lib/db/connections';
import { Progress } from "@/components/ui/progress";

interface AdminControlsProps {
  isRunning: boolean;
  onRunClick: () => void;
  onStopClick: () => void;
  isProduction: boolean;
  p21Connected: boolean;
  porConnected: boolean;
}

export function AdminControls({
  isRunning,
  onRunClick,
  onStopClick,
  isProduction,
  p21Connected,
  porConnected,
}: AdminControlsProps) {
  const { toast } = useToast();
  const [isStoppingInProgress, setIsStoppingInProgress] = useState(false);
  const { activeRowId, updatedData } = useQueryStatusStore();
  
  // Track button click attempts to provide better feedback
  const [runAttempts, setRunAttempts] = useState(0);
  // Track cycle count
  const [cycleCount, setCycleCount] = useState(0);
  // Track last processed row ID to detect cycle completion
  const [lastProcessedRowId, setLastProcessedRowId] = useState<string | null>(null);
  
  // Calculate progress information
  const [progress, setProgress] = useState({
    currentRow: 0,
    totalRows: 0,
    percentComplete: 0,
  });
  
  // Update progress when activeRowId changes
  useEffect(() => {
    if (activeRowId && updatedData && updatedData.length > 0) {
      const totalRows = updatedData.length;
      const currentRowIndex = updatedData.findIndex(row => row.id === activeRowId);
      
      if (currentRowIndex !== -1) {
        // Update progress
        setProgress({
          currentRow: currentRowIndex + 1,
          totalRows,
          percentComplete: Math.round(((currentRowIndex + 1) / totalRows) * 100),
        });
        
        // Check if we've completed a cycle
        if (currentRowIndex === 0 && lastProcessedRowId === updatedData[updatedData.length - 1].id) {
          setCycleCount(prev => prev + 1);
        }
        
        // Update last processed row ID
        setLastProcessedRowId(activeRowId);
      }
    }
  }, [activeRowId, updatedData, lastProcessedRowId]);
  
  // Reset the stopping state when isRunning changes to false
  useEffect(() => {
    if (!isRunning) {
      setIsStoppingInProgress(false);
      
      // Reset cycle count when stopped
      if (isStoppingInProgress) {
        setCycleCount(0);
      }
    }
  }, [isRunning, isStoppingInProgress]);
  
  // Handle the run button click
  const handleRunClick = useCallback(() => {
    // Increment the run attempts counter
    setRunAttempts(prev => prev + 1);
    
    // Reset cycle count
    setCycleCount(0);
    
    // Check if we have at least one connection in production mode
    if (isProduction && !p21Connected && !porConnected) {
      toast({
        title: "Error",
        description: "Please connect to at least one database (P21 or POR) first",
        variant: "destructive"
      });
      return;
    }
    
    // Call the parent's onRunClick handler
    onRunClick();
    
    // Show a toast message
    toast({
      title: "Starting Continuous Execution",
      description: "The system will execute all queries in sequence and restart automatically",
      duration: 5000,
    });
  }, [onRunClick, isProduction, p21Connected, porConnected, toast]);
  
  // Handle the stop button click
  const handleStopClick = useCallback(() => {
    // Set stopping in progress state
    setIsStoppingInProgress(true);
    
    // Call the parent's onStopClick handler
    onStopClick();
    
    // Show a toast message
    toast({
      title: "Stopping Execution",
      description: "The system will stop after completing the current query",
      duration: 3000,
    });
    
    // Set a timeout to reset the stopping state if it doesn't change within 5 seconds
    setTimeout(() => {
      setIsStoppingInProgress(prev => {
        if (prev) {
          // If still stopping after 5 seconds, show another toast
          toast({
            title: "Still Stopping",
            description: "The system is still trying to stop. This may take a moment.",
            duration: 3000,
          });
        }
        return prev;
      });
    }, 5000);
  }, [onStopClick, toast]);
  
  // Determine button states
  const runDisabled = isRunning || isStoppingInProgress;
  const stopDisabled = !isRunning || isStoppingInProgress;
  
  // Determine button text
  let runButtonText = "Run";
  let stopButtonText = "Stop";
  
  if (isRunning) {
    runButtonText = "Running...";
    stopButtonText = "Stop";
  } else if (isStoppingInProgress) {
    runButtonText = "Run";
    stopButtonText = "Stopping...";
  }
  
  // Determine connection status text
  const connectionStatus = isProduction
    ? `Connected to: ${p21Connected ? 'P21' : ''}${p21Connected && porConnected ? ' & ' : ''}${porConnected ? 'POR' : ''}`
    : 'Using Test Database';
  
  // Determine active row text
  const activeRowText = activeRowId 
    ? `Processing row ${progress.currentRow} of ${progress.totalRows}: ${activeRowId}`
    : '';
  
  // Determine cycle text
  const cycleText = cycleCount > 0 
    ? `Completed cycles: ${cycleCount}` 
    : '';
  
  return (
    <div className="flex flex-col space-y-2 p-4 bg-muted rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button 
            onClick={handleRunClick} 
            disabled={runDisabled}
            variant={runDisabled ? "outline" : "default"}
            className="min-w-[80px]"
          >
            {runButtonText}
          </Button>
          <Button 
            onClick={handleStopClick} 
            disabled={stopDisabled}
            variant={stopDisabled ? "outline" : "destructive"}
            className="min-w-[80px]"
          >
            {stopButtonText}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {connectionStatus}
        </div>
      </div>
      
      {isRunning && (
        <div className="mt-2">
          <Progress value={progress.percentComplete} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{progress.currentRow} of {progress.totalRows}</span>
            <span>{progress.percentComplete}%</span>
          </div>
        </div>
      )}
      
      {activeRowId && (
        <div className="text-sm text-muted-foreground mt-2">
          {activeRowText}
        </div>
      )}
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{isProduction ? 'Production Mode' : 'Test Mode'}</span>
        <span>{cycleText}</span>
        <span>{runAttempts > 0 ? `Run attempts: ${runAttempts}` : 'Ready'}</span>
      </div>
    </div>
  );
}
