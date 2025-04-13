'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
const COLORS = [
    'bg-[#2563eb]', // blue
    'bg-[#7c3aed]', // purple
    'bg-[#0891b2]', // cyan
    'bg-[#059669]', // emerald
    'bg-[#4f46e5]', // indigo
    'bg-[#c026d3]', // fuchsia
    'bg-[#0284c7]', // sky
    'bg-[#9333ea]' // violet
];
export function EditableMetricCard({ title, value, icon, gradient, }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const handleStartEditing = () => {
        setEditValue(value);
        setIsEditing(true);
    };
    const handleUpdate = (newValue) => {
        setIsEditing(false);
    };
    // Get a color based on the title to ensure consistent colors
    const colorIndex = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % COLORS.length;
    const backgroundColor = gradient || COLORS[colorIndex];
    return (<Card className={`${backgroundColor} ${gradient} text-white border-0 cursor-pointer hover:opacity-90 transition-opacity`} onClick={handleStartEditing}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5">
            {icon}
          </div>
          <div className="text-sm font-medium">
            {title}
          </div>
        </div>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {title}</DialogTitle>
          </DialogHeader>
          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-4"/>
          <DialogFooter className="mt-4">
            <Button onClick={() => handleUpdate(editValue)}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>);
}
