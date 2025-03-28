import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SpreadsheetRow } from '../db/initial-data';

interface QueryState {
  isRunning: boolean;
  currentRowIndex: number;
  data: SpreadsheetRow[];
  setIsRunning: (isRunning: boolean) => void;
  setCurrentRowIndex: (index: number) => void;
  updateData: (data: SpreadsheetRow[]) => void;
  updateRowValue: (rowId: string, value: string | number) => void;
}

export const useQueryState = create<QueryState>()(
  persist(
    (set) => ({
      isRunning: false,
      currentRowIndex: -1,
      data: [],
      setIsRunning: (isRunning) => set({ isRunning }),
      setCurrentRowIndex: (index) => set({ currentRowIndex: index }),
      updateData: (data) => set({ data }),
      updateRowValue: (rowId, value) =>
        set((state) => ({
          data: state.data.map((row) =>
            row.id === rowId ? { ...row, value } : row
          ),
        })),
    }),
    {
      name: 'query-state',
      partialize: (state) => ({ data: state.data }), // Only persist the data
    }
  )
);
