'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DataRow } from './DataRow';
import type { AdminVariable } from '@/lib/types/dashboard';

interface AdminSpreadsheetProps {
  data: AdminVariable[];
  onUpdate: (id: string, field: string, value: string) => void;
}

export function AdminSpreadsheet({ data, onUpdate }: AdminSpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row => 
    (row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    row.chartGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (row: AdminVariable, field: string) => {
    setEditingCell({ id: row.id.toString(), field });
  };

  const handleEdit = (row: AdminVariable, field: string, value: string) => {
    onUpdate(row.id.toString(), field, value);
    setEditingCell(null);
  };

  const getValue = (row: AdminVariable, field: string): string => {
    switch (field) {
      case 'name': return row.name || '';
      case 'chartGroup': return row.chartGroup;
      case 'calculation': return row.calculation || '';
      case 'sqlExpression': return row.sqlExpression || '';
      case 'p21DataDictionary': return row.p21DataDictionary || '';
      case 'value': 
        if (row.chartGroup === 'Historical Data') return row.p21 || '';
        if (row.chartGroup === 'Inventory Value & Turnover') return row.inventory || '';
        if (row.chartGroup === 'Accounts Payable Overview') return row.total || '';
        if (row.chartGroup === 'New Customers vs. New Prospects') return row.new || '';
        return row.value || '';
      case 'secondaryValue':
        if (row.chartGroup === 'Historical Data') return row.por || '';
        if (row.chartGroup === 'Inventory Value & Turnover') return row.turnover || '';
        if (row.chartGroup === 'Accounts Payable Overview') return row.overdue || '';
        if (row.chartGroup === 'New Customers vs. New Prospects') return row.prospects || '';
        return row.secondaryValue || '';
      case 'subGroup': return row.subGroup || '';
      case 'updateTime': 
        if (row.chartGroup === 'Daily Shipments' || row.chartGroup === 'Top Products') return 'day';
        if (row.chartGroup === 'Metrics') return 'hour';
        return 'month';
      default: return '';
    }
  };

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search by name or chart group..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <ScrollArea className="h-[600px]">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left w-[80px]">#</th>
              <th className="p-4 text-left w-[200px]">Name</th>
              <th className="p-4 text-left w-[120px]">Sub Group</th>
              <th className="p-4 text-left w-[120px]">Value</th>
              <th className="p-4 text-left w-[120px]">Secondary Value</th>
              <th className="p-4 text-left w-[200px]">Chart Group</th>
              <th className="p-4 text-left w-[200px]">Calculation</th>
              <th className="p-4 text-left min-w-[200px]">SQL Expression</th>
              <th className="p-4 text-left w-[120px]">Update Time</th>
              <th className="p-4 text-left min-w-[200px]">P21 Data Dictionary</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <DataRow
                key={row.id}
                row={row}
                rowNumber={index + 1}
                editingCell={editingCell}
                onStartEdit={(field) => handleStartEdit(row, field)}
                onEdit={(field, value) => handleEdit(row, field, value as string)}
                getValue={(field) => getValue(row, field)}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}