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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';
import { showSuccess } from '@/lib/utils/toast';

interface EditableChartDialogProps {
  isOpen: boolean;
  title: string;
  data: any[];
  onClose: () => void;
  onSave: (data: any[]) => void;
}

export function EditableChartDialog({
  isOpen,
  title,
  data,
  onClose,
  onSave,
}: EditableChartDialogProps) {
  const [editableData, setEditableData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditableData(JSON.parse(JSON.stringify(data)));
    }
  }, [data, isOpen]);

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...editableData];
    const parsedValue = key === 'date' || key === 'month' ? value : Number(value);
    newData[rowIndex] = { ...newData[rowIndex], [key]: parsedValue };
    setEditableData(newData);
  };

  const handleSave = () => {
    onSave(editableData);
    showSuccess('Data Updated', `${title} data has been updated successfully.`);
  };

  const formatHeader = (key: string) => {
    if (key === 'p21') return 'P21';
    if (key === 'por') return 'POR';
    return key.split(/(?=[A-Z])/).join(' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const tableHeaders = editableData.length > 0 ? Object.keys(editableData[0]) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title} Data</DialogTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                {tableHeaders.map((key) => (
                  <TableHead key={key} className="capitalize">
                    {formatHeader(key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableHeaders.map((key) => (
                    <TableCell key={key}>
                      <Input
                        type={key === 'date' || key === 'month' ? 'text' : 'number'}
                        value={row[key]}
                        onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}