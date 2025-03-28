'use client';

import React from 'react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EditableSqlCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function EditableSqlCell({ value, onSave }: EditableSqlCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full"
        />
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "cursor-pointer hover:bg-gray-100 p-1 rounded",
        "whitespace-pre-wrap break-words max-h-24 overflow-y-auto"
      )}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
}
