'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DailyShipment } from '@/lib/types/dashboard';
import { format } from 'date-fns';

interface DailyShipmentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: DailyShipment[];
}

export function DailyShipmentsPopup({
  isOpen,
  onClose,
  shipments,
}: DailyShipmentsPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Shipments - Last 7 Days</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.date}>
                  <TableCell>
                    {format(new Date(shipment.date), 'EEE, MMM d')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {shipment.shipments.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">7-Day Total</TableCell>
                <TableCell className="text-right font-medium">
                  {shipments.reduce((total, shipment) => total + shipment.shipments, 0).toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Daily Average</TableCell>
                <TableCell className="text-right font-medium">
                  {Math.round(shipments.reduce((total, shipment) => total + shipment.shipments, 0) / shipments.length).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
