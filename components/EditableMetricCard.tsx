'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EditableMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  gradient: string;
  onUpdate: (value: number) => void;
}

export function EditableMetricCard({
  title,
  value,
  icon,
  gradient,
  onUpdate
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  return (
    <Card className={`w-full h-full ${gradient} text-white`}>
      <CardHeader className="p-0.5 h-[14px]">
        <div className="flex justify-between items-center">
          <div className="w-2.5 h-2.5">{icon}</div>
          <CardTitle className="text-[clamp(0.6rem,0.9vw,0.8rem)] font-medium">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0.5">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              if (editValue && !isNaN(Number(editValue))) {
                onUpdate(Number(editValue));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                onUpdate(Number(editValue));
              }
            }}
            className="w-full text-[clamp(0.8rem,1.2vw,1rem)] font-bold text-center bg-transparent border-b border-white text-white focus:outline-none focus:border-blue-300"
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-[clamp(0.8rem,1.2vw,1rem)] font-bold text-center cursor-pointer text-white"
          >
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}