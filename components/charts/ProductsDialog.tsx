'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ProductsTable } from './ProductsTable';

interface ProductsDialogProps {
  isOpen: boolean;
  title: string;
  data: any[];
  onClose: () => void;
  onSave: (data: any[]) => void;
  onDataChange: (index: number, key: string, value: any) => void;
}

export function ProductsDialog({
  isOpen,
  title,
  data,
  onClose,
  onSave,
  onDataChange,
}: ProductsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <ProductsTable data={data} onDataChange={onDataChange} />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(data)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}