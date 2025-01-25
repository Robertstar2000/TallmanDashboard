import { getAllVariables, updateVariable, resetDatabase } from './indexedDB';
import type { AdminVariable } from '@/lib/types/dashboard';

export async function getDashboardVariables(): Promise<AdminVariable[]> {
  return getAllVariables();
}

export async function updateDashboardVariable(id: number, field: string, value: string): Promise<boolean> {
  return updateVariable(id, field, value);
}

export { resetDatabase };