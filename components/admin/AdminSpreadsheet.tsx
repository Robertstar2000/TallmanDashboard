'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpreadsheetRow } from '@/lib/types/dashboard';

interface AdminSpreadsheetProps {
  data: SpreadsheetRow[];
  onDataChange: (data: SpreadsheetRow[]) => void;
  isRunning: boolean;
  isProduction: boolean;
  activeRowId?: string | null;
}

const AdminSpreadsheet = ({ 
  data, 
  onDataChange, 
  isRunning, 
  isProduction,
  activeRowId
}: AdminSpreadsheetProps) => {
  // Log when data or activeRowId changes for debugging
  useEffect(() => {
    console.log('AdminSpreadsheet received data update:', data.length, 'rows');
    
    // Log the values of all rows for debugging
    data.forEach(row => {
      console.log(`Row ${row.id}: ${row.chartGroup} - ${row.variableName} = ${row.value}`);
    });
    
    if (activeRowId) {
      console.log('Active row ID:', activeRowId);
      const activeRow = data.find(row => row.id === activeRowId);
      if (activeRow) {
        console.log('Active row details:', {
          chartGroup: activeRow.chartGroup,
          variableName: activeRow.variableName,
          value: activeRow.value
        });
      }
    }
  }, [data, activeRowId]);

  const handleCellChange = (id: string, field: keyof SpreadsheetRow, value: string) => {
    // Log the change for debugging
    console.log(`Cell change: Row ${id}, Field ${field}, Value ${value}`);
    
    const updatedData = data.map(row => {
      if (row.id === id) {
        return { 
          ...row, 
          [field]: field === 'serverName' ? (value as 'P21' | 'POR') : value,
          lastUpdated: new Date().toISOString()
        };
      }
      return row;
    });
    
    onDataChange(updatedData);
  };

  // Updated chart groups to match exactly what's in the dashboard
  const validChartGroups = [
    'Key Metrics',
    'Customer Metrics',
    'Historical Data',
    'Accounts',
    'Inventory',
    'POR Overview',
    'Daily Orders',
    'Web Orders',
    'AR Aging',
    'Site Distribution'
  ];

  if (!Array.isArray(data)) {
    console.error('AdminSpreadsheet: data prop is not an array', data);
    return <div>Error: Invalid data format</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full" style={{ fontSize: '0.85rem' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Row ID</TableHead>
              <TableHead className="w-[150px]">Chart Group</TableHead>
              <TableHead className="w-[120px]">Variable Name</TableHead>
              <TableHead className="w-[120px]">Data Point</TableHead>
              <TableHead className="w-[80px]">Server</TableHead>
              <TableHead className="w-[120px]">Table Name</TableHead>
              <TableHead className="w-[400px]">Production SQL</TableHead>
              <TableHead className="w-[100px]">Value</TableHead>
              <TableHead className="w-[120px]">Last Updated</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow 
                key={row.id}
                className={activeRowId === row.id ? 'bg-blue-300 animate-pulse border-2 border-blue-500' : ''}
              >
                <TableCell>
                  <div className="px-2 py-1 border rounded bg-gray-100 text-gray-800 text-xs">
                    {row.id}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="px-2 py-1 border rounded bg-gray-100 text-gray-800">
                    {row.chartGroup}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.variableName}
                    onChange={(e) => handleCellChange(row.id, 'variableName', e.target.value)}
                    disabled={isRunning}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.DataPoint}
                    onChange={(e) => handleCellChange(row.id, 'DataPoint', e.target.value)}
                    disabled={isRunning}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.serverName}
                    onValueChange={(value) => handleCellChange(row.id, 'serverName', value)}
                    disabled={isRunning}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select server" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P21">P21</SelectItem>
                      <SelectItem value="POR">POR</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.tableName}
                    onChange={(e) => handleCellChange(row.id, 'tableName', e.target.value)}
                    disabled={isRunning}
                  />
                </TableCell>
                <TableCell className="p-0">
                  <textarea
                    value={row.productionSqlExpression}
                    onChange={(e) => handleCellChange(row.id, 'productionSqlExpression', e.target.value)}
                    disabled={isRunning}
                    className="w-full p-2 text-xs font-mono border rounded-md min-h-[2.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      height: 'auto',
                      resize: 'vertical',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium text-center">
                  {/* Ensure the value is displayed properly */}
                  <div className="px-2 py-1 bg-gray-100 rounded-md">
                    {row.value !== undefined && row.value !== null && row.value !== '' 
                      ? (isNaN(parseFloat(row.value)) ? row.value : parseFloat(row.value) === 0 ? '0' : row.value)
                      : '0'}
                  </div>
                </TableCell>
                <TableCell>
                  {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell>
                  {row.error ? (
                    <div className="text-xs">
                      <span className={`font-semibold px-2 py-1 rounded-md ${
                        row.errorType === 'connection' ? 'bg-red-100 text-red-800' :
                        row.errorType === 'execution' ? 'bg-orange-100 text-orange-800' :
                        row.errorType === 'syntax' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.errorType === 'connection' ? 'Connection Error' :
                         row.errorType === 'execution' ? 'Execution Error' :
                         row.errorType === 'syntax' ? 'Syntax Error' :
                         'Error'}
                      </span>
                      <div className="mt-1 text-red-600 truncate max-w-[120px]" title={row.error}>
                        {row.error}
                      </div>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">OK</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSpreadsheet;