import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export function AdminButton() {
  return (
    <Button variant="outline" size="icon">
      <Settings className="h-4 w-4" />
    </Button>
  );
}
