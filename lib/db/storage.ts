'use client';

class Storage {
  constructor() {
    // Initialize storage if needed
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.getItem('initialized');
      } catch (error) {
        console.error('Storage not available:', error);
      }
    }
  }

  getItem(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  }

  setItem(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage', error);
    }
  }
}

export const storage = new Storage();