import { create } from 'zustand';

export interface QueryStatusState {
  isRunning: boolean;
  currentRowId: number | null;
  totalRows: number;
  error: string | null;
  startQueryRunner: (total: number) => void;
  stopQueryRunner: () => void;
  setCurrentRowId: (id: number | null) => void;
  setError: (error: string | null) => void;
  resetStore: () => void;
}

const useQueryStatusStore = create<QueryStatusState>((set) => ({
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
