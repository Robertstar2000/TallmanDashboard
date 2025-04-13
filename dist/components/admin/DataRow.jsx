'use client';
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function DataRow({ row, onValueChange, onSqlChange, onTableNameChange, onServerNameChange, isProcessing, currentRowId }) {
    // Track if this row is currently being processed
    const isCurrentRow = currentRowId === row.id;
    return (<div className={`grid grid-cols-5 gap-4 p-4 ${isCurrentRow ? 'bg-blue-50' : ''}`}>
      {/* Value Field */}
      <div>
        <Label htmlFor={`value-${row.id}`}>Value</Label>
        <Input id={`value-${row.id}`} type="number" value={row.value} onChange={(e) => onValueChange(row, e.target.value)} disabled={isProcessing}/>
      </div>

      {/* SQL Expression Field */}
      <div>
        <Label htmlFor={`sql-${row.id}`}>SQL Expression</Label>
        <Input id={`sql-${row.id}`} value={row.productionSqlExpression || ''} onChange={(e) => onSqlChange(row, e.target.value)} disabled={isProcessing} placeholder="Enter SQL query"/>
      </div>

      {/* Table Name Field */}
      <div>
        <Label htmlFor={`table-${row.id}`}>Table Name</Label>
        <Input id={`table-${row.id}`} value={row.tableName || ''} onChange={(e) => onTableNameChange(row, e.target.value)} disabled={isProcessing} placeholder="Enter table name"/>
      </div>

      {/* Server Selection */}
      <div>
        <Label htmlFor={`server-${row.id}`}>Server</Label>
        <select id={`server-${row.id}`} value={row.serverName || ''} onChange={(e) => onServerNameChange(row, e.target.value)} disabled={isProcessing} className="w-full p-2 border rounded">
          <option value="">Select Server</option>
          <option value="P21">P21</option>
          <option value="POR">POR</option>
        </select>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center">
        {isCurrentRow && (<div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-500">Processing...</span>
          </div>)}
      </div>
    </div>);
}
