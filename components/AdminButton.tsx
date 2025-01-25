'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AdminButton() {
  const router = useRouter();

  return (
    <Button 
      onClick={() => router.push('/admin')}
      className="absolute top-1 right-2 h-6 text-xs bg-red-600 hover:bg-red-700 text-white"
      variant="default"
    >
      Admin
    </Button>
  );
}
