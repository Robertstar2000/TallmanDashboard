'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
export function DataDetailsDialog({ title, data, formatValue = (value) => String(value), children }) {
    const safeData = Array.isArray(data) ? data : [];
    return (<Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[80vw] max-h-[80vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full rounded-md border p-2">
          <div className="space-y-1">
            {safeData.map((item, index) => (<div key={index} className="grid grid-cols-2 gap-2 py-1 border-b text-xs">
                {Object.entries(item).map(([key, value]) => (<React.Fragment key={key}>
                    <div className="font-medium capitalize text-muted-foreground">{key}</div>
                    <div>{formatValue(value)}</div>
                  </React.Fragment>))}
              </div>))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);
}
