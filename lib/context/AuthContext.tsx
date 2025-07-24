'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  status: 'admin' | 'user' | 'active';
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();

  useEffect(() => {
    // Try to load token and user from localStorage on initial mount
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // If data is corrupted or "undefined", clear it to prevent future errors
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
      // Clear potentially corrupted storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('authToken', authToken);
    setUser(userData);
    setToken(authToken);
    // Redirect handled by login page, or could be handled here
    // router.push('/dashboard'); 
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
