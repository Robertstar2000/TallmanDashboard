'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface MetricDialogProps {
  isOpen: boolean;
  title: string;
  value: number | string;
  onClose: () => void;
  onSave: (value: number) => void;
}

export function MetricDialog({ isOpen, title, value, onClose, onSave }: MetricDialogProps) {
  const [newValue, setNewValue] = useState(value.toString());

  // Reset newValue when the dialog opens with a new value
  useEffect(() => {
    setNewValue(value.toString());
  }, [value, isOpen]);

  const handleSave = () => {
    const numericValue = Number(newValue);
    if (!isNaN(numericValue)) {
      onSave(numericValue);
    }
  };

  const handleClose = () => {
    setNewValue(value.toString()); // Reset to original value
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Edit {title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="text-lg"
            autoFocus
          />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}