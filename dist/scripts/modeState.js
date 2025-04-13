'use client';
import { create } from 'zustand';
// Create the store
const useModeStore = create((set) => ({
    isProduction: false, // Default to test mode
    setProduction: (isProduction) => set({ isProduction }),
}));
// Helper function to get the current mode
export function getMode() {
    // For server-side usage, default to production mode
    if (typeof window === 'undefined') {
        return process.env.NODE_ENV === 'production';
    }
    // For client-side, use the store
    return useModeStore.getState().isProduction;
}
// Export the store for component usage
export default useModeStore;
