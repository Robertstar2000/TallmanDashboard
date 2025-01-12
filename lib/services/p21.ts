'use client';

import { DatabaseManager } from '@/lib/db/database-connection';

export class P21ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'P21ConnectionError';
  }
}

export async function checkP21Connection(): Promise<boolean> {
  const dbManager = DatabaseManager.getInstance();
  const state = dbManager.getConnectionState();
  return state.p21Connected;
}

export async function executeP21Query(sqlExpression: string, p21DataDictionary: string): Promise<string> {
  const dbManager = DatabaseManager.getInstance();
  const state = dbManager.getConnectionState();
  
  if (!state.p21Connected) {
    throw new P21ConnectionError('No P21 database connection available');
  }
  
  try {
    return await dbManager.executeQuery(sqlExpression, p21DataDictionary);
  } catch (error) {
    throw new P21ConnectionError(error instanceof Error ? error.message : 'Failed to execute P21 query');
  }
}
