import { SpreadsheetRow } from '@/lib/types/dashboard';

// Store the current execution state
export const executionState = {
  status: 'idle' as 'idle' | 'running' | 'complete' | 'error',
  activeRow: null as string | null,
  updatedData: [] as SpreadsheetRow[],
  error: null as string | null
};
