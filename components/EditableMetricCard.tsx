'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EditableMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  gradient: string;
  onUpdate: (value: number) => void;
}

export const EditableMetricCard = ({
  icon,
  title,
  value,
  gradient,
  onUpdate,
}: EditableMetricCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newValue, setNewValue] = useState(value.toString());

  const handleUpdate = () => {
    onUpdate(Number(newValue));
    setIsOpen(false);
  };

  const handleClose = () => {
    setNewValue(value.toString());
    setIsOpen(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card
          className={`${gradient} text-white cursor-pointer hover:shadow-lg transition-shadow duration-200`}
          onClick={() => setIsOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {icon}
                <p className="text-sm font-medium">{title}</p>
              </div>
              <h3 className="text-2xl font-bold">{value}</h3>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="text-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};