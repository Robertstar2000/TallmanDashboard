'use client';

import { useEffect } from 'react';
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
import { useChartData } from '@/hooks/useChartData';

interface EditableChartProps {
  title: string;
  data: any[];
  children: React.ReactNode;
  onUpdate: (updatedData: any[]) => void;
}

export const EditableChart = ({
  title,
  data: initialData,
  children,
  onUpdate,
}: EditableChartProps) => {
  const {
    data,
    editableData,
    isEditing,
    startEditing,
    cancelEditing,
    saveChanges,
    updateEditableData
  } = useChartData(initialData);

  useEffect(() => {
    if (data !== initialData) {
      onUpdate(data);
    }
  }, [data, initialData, onUpdate]);

  const handleSave = () => {
    saveChanges();
  };

  const handleClose = () => {
    cancelEditing();
  };

  const handleCellChange = (index: number, key: string, value: string) => {
    const parsedValue = key === 'date' || key === 'month' ? value : Number(value);
    updateEditableData(index, key, parsedValue);
  };

  const formatHeader = (key: string) => {
    if (key === 'p21') return 'P21';
    if (key === 'por') return 'POR';
    if (key === 'newProducts') return 'New Prospects';
    return key.split(/(?=[A-Z])/).join(' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const tableHeaders = editableData.length > 0 ? Object.keys(editableData[0]) : [];

  return (
    <div className="cursor-pointer group relative" onClick={startEditing}>
      {children}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
          Click to edit data
        </span>
      </div>

      <Dialog open={isEditing} onOpenChange={cancelEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{title} Data</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0" 
              onClick={handleClose}
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
                {editableData.map((row, index) => (
                  <TableRow key={index}>
                    {tableHeaders.map((key) => (
                      <TableCell key={key}>
                        <Input
                          type={key === 'date' || key === 'month' ? 'text' : 'number'}
                          value={row[key]}
                          onChange={(e) => handleCellChange(index, key, e.target.value)}
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
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};