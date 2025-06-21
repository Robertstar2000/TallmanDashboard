'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/lib/context/AuthContext';

export function AdminButton() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const isAdmin = auth?.user?.status === 'admin';

  return (
    <Button 
      onClick={() => {
        if (isAdmin) router.push('/admin');
      }}
      disabled={!isAdmin}
      className={`absolute top-1 right-2 h-6 text-xs text-white ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
      variant="default"
    >
      Admin
    </Button>
  );
}
