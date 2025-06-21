'use client';

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/lib/context/AuthContext';

export function LogoutButton() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    auth?.logout();
    // Optionally also clear the token cookie; client-side cookies set with httpOnly:false can be removed
    try {
      document.cookie = 'token=; Max-Age=0; path=/';
    } catch (err) {
      // ignore if cookie API not available
    }
    router.push('/login');
  };

  return (
    <Button
      onClick={handleLogout}
      className="ml-4 bg-gray-600 hover:bg-gray-700 text-white h-6 text-xs"
      variant="default"
    >
      Logout
    </Button>
  );
}
