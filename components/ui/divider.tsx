'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ 
  className, 
  orientation = 'horizontal' 
}: DividerProps) {
  return (
    <div 
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
    />
  );
}
