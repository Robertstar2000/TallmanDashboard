'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/formatting';

export type ChartData = {
  [key: string]: string | number;
};

export type ColumnDef = {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'date';
};

interface ChartDialogProps {
  isOpen: boolean;
  title: string;
  data: ChartData[];
  columns: ColumnDef[];
  onClose: () => void;
}

export function ChartDialog({
  isOpen,
  title,
  data,
  columns,
  onClose,
}: ChartDialogProps) {
  const formatValue = (value: any, format?: 'currency' | 'number' | 'date') => {
    if (value === undefined) return '-';
    if (format === 'currency') return formatCurrency(Number(value));
    if (format === 'number') return formatNumber(Number(value));
    if (format === 'date') return formatDate(value);
    return value;
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {formatValue(row[column.key], column.format)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
