import { getAllVariables, resetDatabase } from './indexedDB';
import type { AdminVariable } from '@/lib/types/dashboard';

async function updateVariable(id: string, field: string, value: string): Promise<void> {
  // Implementation here (ensure no boolean return)
}

export async function getDashboardVariables(): Promise<AdminVariable[]> {
  return getAllVariables();
}

export async function updateDashboardVariable(id: string, field: string, value: string): Promise<void> {
  await updateVariable(id, field, value);
}

export { resetDatabase, getAllVariables };