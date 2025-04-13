import { create } from 'zustand';
const useQueryStatusStore = create((set) => ({
    isRunning: false,
    currentRowId: null,
    totalRows: 0,
    error: null,
    startQueryRunner: (total) => set({ isRunning: true, error: null, currentRowId: null, totalRows: total }),
    stopQueryRunner: () => set({ isRunning: false, currentRowId: null }),
    setCurrentRowId: (id) => set({ currentRowId: id }),
    setError: (error) => set({ error: error, isRunning: false }), // Stop running on error
    resetStore: () => set({ isRunning: false, currentRowId: null, error: null, totalRows: 0 }),
}));
export default useQueryStatusStore;
