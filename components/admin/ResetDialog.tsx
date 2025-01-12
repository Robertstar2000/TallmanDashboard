'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmReset: () => void;
}

export function ResetDialog({ open, onOpenChange, onConfirmReset }: ResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Reset Confirmation</DialogTitle>
          <DialogDescription className="text-base mt-4 text-red-600">
            Are you sure you want to destroy all changes and revert to initial settings?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirmReset();
              onOpenChange(false);
            }}
          >
            Danger Reset Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
