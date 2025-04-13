/**
 * Admin Controls Component
 * Provides UI controls for running SQL expressions and monitoring execution status
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RefreshCw, Settings } from "lucide-react";

interface AdminControlsProps {
  lastRefresh: string;
  onRefresh: () => void;
  onManageConnections: () => void;
}

export function AdminControls({
  lastRefresh,
  onRefresh,
  onManageConnections
}: AdminControlsProps) {
  const { toast } = useToast();

  // Handle refresh click
  const handleRefreshClick = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <Card className="p-4 shadow-md">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onManageConnections}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {lastRefresh ? `Last refreshed: ${lastRefresh}` : "Not refreshed yet"}
            </span>
            
            <Button
              onClick={handleRefreshClick}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4" aria-label="Refresh Data"/>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
