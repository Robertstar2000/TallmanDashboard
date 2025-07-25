'use client';

import { useEffect } from 'react';

export default function ConsoleErrorSuppressor() {
  useEffect(() => {
    // Store original console.error
    const originalConsoleError = console.error;
    
    // Override console.error to filter out expected auth errors
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      // Suppress expected authentication-related 401 errors
      if (
        message.includes('GET http://localhost:5500/api/auth/validate 401') ||
        message.includes('POST http://localhost:5500/api/auth/login 401') ||
        (message.includes('401') && message.includes('Unauthorized') && message.includes('/api/auth/'))
      ) {
        // Don't log these expected errors
        return;
      }
      
      // Log all other errors normally
      originalConsoleError.apply(console, args);
    };
    
    // Cleanup on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null; // This component doesn't render anything
}
