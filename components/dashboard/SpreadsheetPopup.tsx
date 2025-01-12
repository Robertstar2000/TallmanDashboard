'use client';

import { MonthlyData } from '@/lib/types/dashboard';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/formatting';

interface SpreadsheetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData[];
  title: string;
  onDataChange?: (updatedData: MonthlyData[]) => void;
}

export function SpreadsheetPopup({ isOpen, onClose, data, title, onDataChange }: SpreadsheetPopupProps) {
  const getHeaders = () => {
    if (!data.length) return [];
    const sample = data[0];
    const headers: string[] = ['Date'];
    
    if (sample.p21Value !== undefined) headers.push('P21', 'POR');
    if (sample.accountsPayable) headers.push('Total', 'Overdue');
    if (sample.customers) headers.push('New Customers', 'Prospects');
    if (sample.sites) headers.push('Columbus', 'Addison', 'Lake City');
    
    return headers;
  };

  const formatValue = (value: number | undefined, isMonetary: boolean = false) => {
    if (value === undefined) return '-';
    return isMonetary ? formatCurrency(value) : formatNumber(value);
  };

  const getCellValue = (item: MonthlyData, header: string) => {
    switch (header) {
      case 'Date':
        return formatDate(item.date);
      case 'P21':
        return formatValue(item.p21Value);
      case 'POR':
        return formatValue(item.porValue);
      case 'Total':
        return formatValue(item.accountsPayable?.total, true);
      case 'Overdue':
        return formatValue(item.accountsPayable?.overdue, true);
      case 'New Customers':
        return formatValue(item.customers?.new);
      case 'Prospects':
        return formatValue(item.customers?.prospects);
      case 'Columbus':
        return formatValue(item.sites?.columbus);
      case 'Addison':
        return formatValue(item.sites?.addison);
      case 'Lake City':
        return formatValue(item.sites?.lakeCity);
      default:
        return '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {getHeaders().map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {getHeaders().map((header) => (
                    <TableCell key={header}>
                      {getCellValue(item, header)}
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
