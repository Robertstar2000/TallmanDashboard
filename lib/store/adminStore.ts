import { create } from 'zustand';
import { mockQuery } from '../db/mockDb';
import { updateVariable } from '../db/indexedDB';
import { AdminVariable, AdminSettings } from '../types';

interface AdminStore {
  isTestMode: boolean;
  isProcessing: boolean;
  processingInterval: number | null;
  variables: AdminVariable[];
  currentIndex: number;
  settings: AdminSettings;
  startProcessing: () => void;
  stopProcessing: () => void;
  setVariables: (variables: AdminVariable[]) => void;
  processNextVariable: () => Promise<void>;
  setTestMode: (isTestMode: boolean) => void;
  initializeProductionVariables: (variables: AdminVariable[]) => void;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  isTestMode: true,
  isProcessing: false,
  processingInterval: null,
  variables: [],
  currentIndex: 0,
  settings: {
    isTestMode: true,
    isRunning: false,
    lastUpdate: new Date().toISOString()
  },

  setVariables: (variables: AdminVariable[]) => set({ variables }),

  // Initialize production variables with zero values
  initializeProductionVariables: (variables: AdminVariable[]) => {
    const initializedVariables = variables.map(variable => ({
      ...variable,
      value: 0,
      error: undefined
    }));
    set({ variables: initializedVariables });
  },

  setTestMode: (isTestMode: boolean) => set((state: AdminStore) => {
    // When switching to production mode, reset values to 0
    if (!isTestMode) {
      const resetVariables = state.variables.map(variable => ({
        ...variable,
        value: 0,
        error: undefined
      }));
      return {
        isTestMode,
        variables: resetVariables,
        settings: {
          ...state.settings,
          isTestMode
        }
      };
    }
    return {
      isTestMode,
      settings: {
        ...state.settings,
        isTestMode
      }
    };
  }),

  processNextVariable: async () => {
    const state = get() as AdminStore;
    const { variables, currentIndex, isTestMode } = state;
    if (!variables.length) return;

    const variable = variables[currentIndex];
    try {
      // In production mode, only execute SQL if sqlExpression is present
      if (!isTestMode && !variable.sqlExpression) {
        set((state: AdminStore) => ({
          currentIndex: (state.currentIndex + 1) % state.variables.length
        }));
        return;
      }

      const sqlExpression = isTestMode ? variable.testSqlExpression : variable.sqlExpression || '';
      const result = await mockQuery(sqlExpression);
      
      const updatedVariable: AdminVariable = {
        ...variable,
        value: Number(result.value) || 0,
        error: undefined
      };

      // In production mode, only update value and error fields
      if (!isTestMode) {
        await updateVariable(Number(updatedVariable.id), 'value', String(updatedVariable.value));
      } else {
        await updateVariable(Number(updatedVariable.id), 'value', String(updatedVariable.value));
      }

      // Update the variables array with the new value
      const updatedVariables = [...variables];
      updatedVariables[currentIndex] = updatedVariable;

      set((state: AdminStore) => ({
        variables: updatedVariables,
        currentIndex: (state.currentIndex + 1) % state.variables.length,
        settings: {
          ...state.settings,
          lastUpdate: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`Error processing variable ${variable.id}:`, error);
      const errorVariable: AdminVariable = {
        ...variable,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      // Update the variables array with the error state
      const updatedVariables = [...variables];
      updatedVariables[currentIndex] = errorVariable;
      
      await updateVariable(Number(errorVariable.id), 'error', errorVariable.error || '');
      set((state: AdminStore) => ({
        variables: updatedVariables
      }));
    }
  },

  startProcessing: () => {
    const state = get() as AdminStore;
    const { isProcessing, processingInterval } = state;
    if (isProcessing || processingInterval) return;

    const interval = window.setInterval(async () => {
      const store = get() as AdminStore;
      await store.processNextVariable();
    }, 5000);

    set((state: AdminStore) => ({ 
      isProcessing: true, 
      processingInterval: interval,
      currentIndex: 0,
      settings: {
        ...state.settings,
        isRunning: true
      }
    }));

    const store = get() as AdminStore;
    store.processNextVariable();
  },

  stopProcessing: () => {
    const state = get() as AdminStore;
    const { processingInterval } = state;
    if (processingInterval) {
      window.clearInterval(processingInterval);
    }
    set((state: AdminStore) => ({ 
      isProcessing: false, 
      processingInterval: null,
      settings: {
        ...state.settings,
        isRunning: false
      }
    }));
  }
}));
