var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { create } from 'zustand';
import { mockQuery } from '../db/mockDb';
import { updateVariable } from '../db/indexedDB';
export const useAdminStore = create()((set, get) => ({
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
    setVariables: (variables) => set({ variables }),
    // Initialize production variables with zero values
    initializeProductionVariables: (variables) => {
        const initializedVariables = variables.map(variable => (Object.assign(Object.assign({}, variable), { value: 0, error: undefined })));
        set({ variables: initializedVariables });
    },
    setTestMode: (isTestMode) => set((state) => {
        // When switching to production mode, reset values to 0
        if (!isTestMode) {
            const resetVariables = state.variables.map(variable => (Object.assign(Object.assign({}, variable), { value: 0, error: undefined })));
            return {
                isTestMode,
                variables: resetVariables,
                settings: Object.assign(Object.assign({}, state.settings), { isTestMode })
            };
        }
        return {
            isTestMode,
            settings: Object.assign(Object.assign({}, state.settings), { isTestMode })
        };
    }),
    processNextVariable: () => __awaiter(void 0, void 0, void 0, function* () {
        const state = get();
        const { variables, currentIndex, isTestMode } = state;
        if (!variables.length)
            return;
        const variable = variables[currentIndex];
        try {
            // In production mode, only execute SQL if sqlExpression is present
            if (!isTestMode && !variable.sqlExpression) {
                set((state) => ({
                    currentIndex: (state.currentIndex + 1) % state.variables.length
                }));
                return;
            }
            const sqlExpression = isTestMode ? variable.testSqlExpression : variable.sqlExpression || '';
            const result = yield mockQuery(sqlExpression);
            const updatedVariable = Object.assign(Object.assign({}, variable), { value: Number(result.value) || 0, error: undefined });
            // In production mode, only update value and error fields
            if (!isTestMode) {
                yield updateVariable(Number(updatedVariable.id), 'value', String(updatedVariable.value));
            }
            else {
                yield updateVariable(Number(updatedVariable.id), 'value', String(updatedVariable.value));
            }
            // Update the variables array with the new value
            const updatedVariables = [...variables];
            updatedVariables[currentIndex] = updatedVariable;
            set((state) => ({
                variables: updatedVariables,
                currentIndex: (state.currentIndex + 1) % state.variables.length,
                settings: Object.assign(Object.assign({}, state.settings), { lastUpdate: new Date().toISOString() })
            }));
        }
        catch (error) {
            console.error(`Error processing variable ${variable.id}:`, error);
            const errorVariable = Object.assign(Object.assign({}, variable), { error: error instanceof Error ? error.message : 'Unknown error' });
            // Update the variables array with the error state
            const updatedVariables = [...variables];
            updatedVariables[currentIndex] = errorVariable;
            yield updateVariable(Number(errorVariable.id), 'error', errorVariable.error || '');
            set((state) => ({
                variables: updatedVariables
            }));
        }
    }),
    startProcessing: () => {
        const state = get();
        const { isProcessing, processingInterval } = state;
        if (isProcessing || processingInterval)
            return;
        const interval = window.setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const store = get();
            yield store.processNextVariable();
        }), 5000);
        set((state) => ({
            isProcessing: true,
            processingInterval: interval,
            currentIndex: 0,
            settings: Object.assign(Object.assign({}, state.settings), { isRunning: true })
        }));
        const store = get();
        store.processNextVariable();
    },
    stopProcessing: () => {
        const state = get();
        const { processingInterval } = state;
        if (processingInterval) {
            window.clearInterval(processingInterval);
        }
        set((state) => ({
            isProcessing: false,
            processingInterval: null,
            settings: Object.assign(Object.assign({}, state.settings), { isRunning: false })
        }));
    }
}));
