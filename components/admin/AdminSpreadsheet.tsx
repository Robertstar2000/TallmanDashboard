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
  
  // Helper function to get column width classes
  const getColumnWidth = (accessor: string) => {
    switch (accessor) {
      case 'id':
        return 'w-12 min-w-[3rem]'; // Row ID - narrow
      case 'chartGroup':
        return 'w-20 min-w-[5rem]'; // Chart Group - compact
      case 'variableName':
        return 'w-24 min-w-[6rem]'; // Variable Name - compact
      case 'DataPoint':
        return 'w-32 min-w-[8rem] break-words'; // Data Point - medium
      case 'serverName':
        return 'w-16 min-w-[4rem]'; // Server - narrow
      case 'tableName':
        return 'w-24 min-w-[6rem]'; // Table Name - compact
      case 'productionSqlExpression':
        return 'w-96 min-w-[24rem] max-w-[30rem]'; // SQL - wide but capped
      case 'value':
        return 'w-20 min-w-[5rem]'; // Value - compact
      case 'axisStep':
        return 'w-20 min-w-[5rem] break-words'; // Axis Step - compact
      default:
        return 'w-auto';
    }
  };

  // Helper function to get cell styling classes
  const getCellClassName = (accessor: string) => {
    switch (accessor) {
      case 'productionSqlExpression':
        return 'font-mono break-words max-w-[30rem] overflow-hidden';
      case 'DataPoint':
      case 'axisStep':
        return 'break-words overflow-hidden';
      case 'value':
        return 'text-right font-mono';
      case 'id':
        return 'text-center font-mono';
      default:
        return 'whitespace-nowrap overflow-hidden text-ellipsis';
    }
  };

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
      <div className="w-full overflow-x-auto max-h-[80vh]">
        <div className="min-w-full" style={{ fontSize: '0.75rem' }}>
          <Table>
            <TableHeader className="bg-gray-100 sticky top-0 z-10">
              <TableRow>
                {columns.map((column, index) => (
                  // Reduce horizontal padding (px-1), keep vertical padding (py-2)
                   <TableHead key={column.header} className={`px-1 py-1 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${getColumnWidth(column.accessor)}`}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, index) => {
                // Determine if this row is active (currently executing)
                const isActive = activeRowId === row.id;
                // Determine if the row has an error based on live state (passed via columns render)
                // This logic might be redundant if the render function handles it, but keep for row styling
                const hasError = !!liveQueryState?.[row.id]?.error;
                
                // Define a simple key for debugging
                const rowKey = row.id; 
                
                return (
                  <TableRow 
                    key={rowKey} // Simplified key
                    className={`hover:bg-gray-50 ${isActive ? 'bg-blue-100 animate-pulse' : ''}`}
                  >
                    {columns.map((column) => {
                      const cellValue = row[column.accessor as keyof ChartDataRow];
                      const isEditable = column.editable && !isRunning;
                      
                      return (
                        // Increase vertical padding (py-2), decrease horizontal padding (px-1)
                        // Apply wrapping logic for specific columns
                         <TableCell key={`${rowKey}-${column.accessor || column.header || 'unknown'}`} 
                           className={`px-1 py-1 text-[9px] text-gray-700 ${getCellClassName(column.accessor)}`}>
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
                                <SelectTrigger className="h-6 text-[9px]">
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
                                className="w-full p-1 text-[9px] font-mono border rounded-md min-h-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="h-6 text-[9px]"
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