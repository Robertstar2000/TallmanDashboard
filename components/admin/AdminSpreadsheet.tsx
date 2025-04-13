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
import { ChartDataRow } from '@/lib/db/types';

interface AdminSpreadsheetProps {
  columns: any[];
  data: ChartDataRow[];
  onDataChange: (data: ChartDataRow[]) => Promise<void>;
  isRunning: boolean;
  isProduction: boolean;
  activeRowId?: string | null;
  liveQueryState?: any;
}

const AdminSpreadsheet = ({ 
  data, 
  onDataChange, 
  columns, 
  isRunning, 
  isProduction,
  activeRowId,
  liveQueryState
}: AdminSpreadsheetProps) => {
  // Log when data or activeRowId changes for debugging
  useEffect(() => {
    // Add check to ensure data is an array before proceeding
    if (!Array.isArray(data)) {
      console.warn('AdminSpreadsheet useEffect: data is not an array yet.');
      return; // Exit early if data is not valid
    }

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

  const handleCellChange = (id: string, field: keyof ChartDataRow, value: string) => {
    // Log the change for debugging
    console.log(`Cell change: Row ${id}, Field ${field}, Value ${value}`);
    
    const updatedData = data.map(row => {
      if (row.id === id) {
        return { 
          ...row, 
          [String(field)]: field === 'serverName' ? (value as 'P21' | 'POR') : value,
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
  
  // Sort data by Row ID in ascending order
  const sortedData = [...data].sort((a, b) => {
    // Convert IDs to numbers for proper numeric sorting
    const idA = parseInt(a.id);
    const idB = parseInt(b.id);
    return idA - idB;
  });

  return (
    <>
      {/* Add detailed logging before rendering */}
      {console.log('AdminSpreadsheet: Rendering sortedData IDs:', sortedData.map(row => row.id))}
      <div className="w-full overflow-x-auto">
        <div className="min-w-full" style={{ fontSize: '0.85rem' }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.header} className={column.cellClassName}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => {
                // Determine if this row is active (currently executing)
                const isActive = activeRowId === row.id;
                // Determine if the row has an error based on live state (passed via columns render)
                // This logic might be redundant if the render function handles it, but keep for row styling
                const hasError = !!liveQueryState?.[row.id]?.error;
                
                return (
                  <TableRow 
                    key={row.id}
                    className={`${isActive ? 'bg-yellow-100' : hasError ? 'bg-red-50' : ''}`}
                  >
                    {columns.map((column) => {
                      const cellValue = row[column.accessor as keyof ChartDataRow];
                      const isEditable = column.editable && !isRunning;
                      
                      return (
                        <TableCell key={`${row.id}-${column.header}`} className={column.cellClassName}>
                          {column.render ? (
                            // Use render function if provided
                            column.render(row)
                          ) : isEditable ? (
                            // Handle specific editable fields if needed (example for 'serverName')
                            column.accessor === 'serverName' ? (
                              <Select
                                value={cellValue as string}
                                onValueChange={(value) => handleCellChange(row.id, column.accessor as keyof ChartDataRow, value)}
                                disabled={!isEditable}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select server" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="P21">P21</SelectItem>
                                  <SelectItem value="POR">POR</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : column.accessor === 'productionSqlExpression' ? (
                              <textarea
                                value={String(cellValue ?? '')}
                                onChange={(e) => handleCellChange(row.id, column.accessor as keyof ChartDataRow, e.target.value)}
                                disabled={!isEditable}
                                className="w-full p-2 text-xs font-mono border rounded-md min-h-[2.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{
                                  height: 'auto',
                                  resize: 'vertical',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              />
                            ) : (
                              // Default Input for other editable fields
                              <Input
                                className="h-8"
                                value={String(cellValue ?? '')}
                                onChange={(e) => handleCellChange(row.id, column.accessor as keyof ChartDataRow, e.target.value)}
                                disabled={!isEditable}
                              />
                            )
                          ) : (
                            // Default rendering for non-editable, non-render fields
                            column.accessor === 'lastUpdated' && cellValue ? new Date(cellValue as string).toLocaleString() : String(cellValue ?? '')
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default AdminSpreadsheet;