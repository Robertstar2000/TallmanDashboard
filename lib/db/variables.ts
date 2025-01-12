'use client';

import { db } from './sqlite';
import { AdminVariable } from '@/lib/types/dashboard';

export async function getVariableValue(variable: AdminVariable): Promise<string> {
  try {
    if (!variable.sqlExpression) {
      return variable.p21 || '0';
    }
    const result = await db.execute(variable.sqlExpression);
    return result.rows[0]?.value?.toString() || '0';
  } catch (error) {
    console.error(`Error executing SQL for ${variable.name}:`, error);
    return variable.p21 || '0';
  }
}

export async function updateVariableData(variables: AdminVariable[]): Promise<AdminVariable[]> {
  const updatedVariables = [];
  
  for (const variable of variables) {
    if (variable.sqlExpression) {
      const value = await getVariableValue(variable);
      updatedVariables.push({
        ...variable,
        p21: value
      });
    } else {
      updatedVariables.push(variable);
    }
  }
  
  return updatedVariables;
}