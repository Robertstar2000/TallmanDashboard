/**
 * Admin Controls Component
 * Provides UI controls for running SQL expressions and monitoring execution status
 */
'use client';
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useQueryStatusStore from "@/lib/stores/queryStatusStore";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Play, Square, RefreshCw } from "lucide-react";
export function AdminControls({ onRunSelected, onRunAll, onStop, isRunning, lastRefresh, onRefresh }) {
    const { toast } = useToast();
    const [isStoppingInProgress, setIsStoppingInProgress] = useState(false);
    const { activeRowId } = useQueryStatusStore();
    // Selected row IDs for running specific expressions
    const [selectedIds, setSelectedIds] = useState([]);
    // Track progress
    const [progress, setProgress] = useState({
        currentRow: 0,
        totalRows: 0,
        percentComplete: 0,
    });
    // Handle run selected click
    const handleRunSelectedClick = useCallback(() => {
        if (selectedIds.length === 0) {
            toast({
                title: "No Rows Selected",
                description: "Please select at least one row to run",
                variant: "destructive"
            });
            return;
        }
        onRunSelected(selectedIds);
    }, [selectedIds, onRunSelected, toast]);
    // Handle run all click
    const handleRunAllClick = useCallback(() => {
        onRunAll();
    }, [onRunAll]);
    // Handle stop click
    const handleStopClick = useCallback(() => {
        setIsStoppingInProgress(true);
        onStop();
        // Reset stopping state after a delay
        setTimeout(() => {
            setIsStoppingInProgress(false);
        }, 2000);
    }, [onStop]);
    // Handle refresh click
    const handleRefreshClick = useCallback(() => {
        onRefresh();
    }, [onRefresh]);
    // Handle row selection
    const handleRowSelect = useCallback((id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        }
        else {
            setSelectedIds(prev => prev.filter(rowId => rowId !== id));
        }
    }, []);
    return (<Card className="p-4 shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button onClick={handleRunSelectedClick} disabled={isRunning} className="bg-green-600 hover:bg-green-700 text-white">
              <Play className="mr-2 h-4 w-4"/>
              Run Selected
            </Button>
            
            <Button onClick={handleRunAllClick} disabled={isRunning} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="mr-2 h-4 w-4"/>
              Run All
            </Button>
            
            <Button onClick={handleStopClick} disabled={!isRunning || isStoppingInProgress} className="bg-red-600 hover:bg-red-700 text-white">
              <Square className="mr-2 h-4 w-4"/>
              {isStoppingInProgress ? "Stopping..." : "Stop"}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {lastRefresh ? `Last refreshed: ${lastRefresh}` : "Not refreshed yet"}
            </span>
            
            <Button onClick={handleRefreshClick} variant="outline" size="sm" className="ml-2">
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </div>
        </div>
        
        {isRunning && (<div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Executing SQL expressions...</span>
              <span>
                {activeRowId ? `Current: Row ${activeRowId}` : "Initializing..."}
              </span>
            </div>
            
            <Progress value={progress.percentComplete} className="h-2"/>
          </div>)}
      </div>
    </Card>);
}
