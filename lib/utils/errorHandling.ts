import { adminStateMachine } from '@/lib/state/adminStateMachine';

export function handleError(error: unknown, context: string, variableId?: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const fullMessage = `${context}: ${errorMessage}`;
  console.error(fullMessage, error);

  const currentState = adminStateMachine.getState();

  if (variableId) {
    // Update the specific variable with the error, preserving its current value
    const currentVariable = currentState.variables.find(v => v.id === variableId);
    if (currentVariable) {
      adminStateMachine.dispatch({
        type: 'UPDATE_VARIABLE',
        payload: {
          ...currentVariable,
          error: fullMessage
        }
      });
    }
  } else {
    // Create a system error entry
    const systemVariable = currentState.variables.find(v => v.id === 'system_error');
    if (systemVariable) {
      adminStateMachine.dispatch({
        type: 'UPDATE_VARIABLE',
        payload: {
          ...systemVariable,
          error: fullMessage
        }
      });
    }
  }
}
