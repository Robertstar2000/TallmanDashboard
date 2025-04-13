'use client';
import React from 'react';
import { cn } from '@/lib/utils';
export function Divider({ className, orientation = 'horizontal' }) {
    return (<div className={cn('bg-border', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className)}/>);
}
