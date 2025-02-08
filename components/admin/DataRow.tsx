'use client';

import React, { useState } from 'react';
import type { AdminVariable } from '@/lib/types/dashboard';
import { Input } from '@/components/ui/input';

interface DataRowProps {
  row: AdminVariable;
  rowNumber: number;
  editingCell: { id: string; field: string } | null;
  onEdit: (field: string, value: string) => void;
  onStartEdit: (field: string) => void;
  getValue: (field: string) => string;
}

export function DataRow({ row, rowNumber, editingCell, onEdit, onStartEdit, getValue }: DataRowProps) {
  const isEmptyRow = row.id < 0;
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (field: string, value: string) => {
    setEditValue(value);
    onStartEdit(field);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleBlur = (field: string) => {
    onEdit(field, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === 'Enter') {
      onEdit(field, editValue);
    } else if (e.key === 'Escape') {
      onEdit(field, getValue(field));
    }
  };

  const renderCell = (field: string) => {
    if (isEmptyRow) return null;

    const isEditing = editingCell?.id === row.id && editingCell?.field === field;
    const displayValue = getValue(field);

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={handleChange}
          onBlur={() => handleBlur(field)}
          onKeyDown={(e) => handleKeyDown(e, field)}
          autoFocus
          className="w-full h-8 px-2"
        />
      );
    }

    return (
      <div 
        onClick={() => handleStartEdit(field, displayValue)}
        className="cursor-text hover:bg-gray-50 px-2 py-1 rounded min-h-[2rem] flex items-center"
      >
        {displayValue}
      </div>
    );
  };

  return (
    <tr className={isEmptyRow ? 'text-gray-300 hover:bg-gray-50' : 'hover:bg-gray-50'}>
      <td className="p-2 align-middle w-[80px]">{isEmptyRow ? '-' : rowNumber}</td>
      <td className="p-2 align-middle w-[200px]">{isEmptyRow ? '-' : renderCell('name')}</td>
      <td className="p-2 align-middle w-[120px]">{isEmptyRow ? '-' : renderCell('subGroup')}</td>
      <td className="p-2 align-middle w-[120px]">{isEmptyRow ? '-' : renderCell('value')}</td>
      <td className="p-2 align-middle w-[120px]">{isEmptyRow ? '-' : renderCell('secondaryValue')}</td>
      <td className="p-2 align-middle w-[200px]">{isEmptyRow ? '-' : renderCell('chartGroup')}</td>
      <td className="p-2 align-middle w-[200px]">{isEmptyRow ? '-' : renderCell('calculation')}</td>
      <td className="p-2 align-middle min-w-[200px]">{isEmptyRow ? '-' : renderCell('sqlExpression')}</td>
      <td className="p-2 align-middle w-[120px]">{isEmptyRow ? '-' : renderCell('updateTime')}</td>
      <td className="p-2 align-middle min-w-[200px]">{isEmptyRow ? '-' : renderCell('p21DataDictionary')}</td>
    </tr>
  );
}