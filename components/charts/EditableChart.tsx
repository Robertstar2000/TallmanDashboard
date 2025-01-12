'use client';

import { useState } from 'react';
import { EditableChartDialog } from './EditableChartDialog';

interface EditableChartProps {
  title: string;
  data: any[];
  children: React.ReactNode;
  onUpdate: (updatedData: any[]) => void;
}

export function EditableChart({
  title,
  data,
  children,
  onUpdate,
}: EditableChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  
  const handleSave = (newData: any[]) => {
    onUpdate(newData);
    handleCloseDialog();
  };

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handleOpenDialog}>
        {children}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs text-gray-700 bg-white/90 px-2 py-1 rounded">
            Click to edit data
          </span>
        </div>
      </div>
      <EditableChartDialog
        isOpen={isDialogOpen}
        title={title}
        data={data}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />
    </>
  );
}