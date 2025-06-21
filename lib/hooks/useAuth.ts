'use client';

import { useContext } from 'react';
// Correct the path if AuthContext is in a different location relative to this file
// Assuming AuthContext.tsx is in ../context/AuthContext.tsx
import { AuthContext } from '../context/AuthContext'; 

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
