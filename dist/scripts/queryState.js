import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useQueryState = create()(persist((set) => ({
    isRunning: false,
    currentRowIndex: -1,
    data: [],
    setIsRunning: (isRunning) => set({ isRunning }),
    setCurrentRowIndex: (index) => set({ currentRowIndex: index }),
    updateData: (data) => set({ data }),
    updateRowValue: (rowId, value) => set((state) => ({
        data: state.data.map((row) => row.id === rowId ? Object.assign(Object.assign({}, row), { value }) : row),
    })),
}), {
    name: 'query-state',
    partialize: (state) => ({ data: state.data }), // Only persist the data
}));
