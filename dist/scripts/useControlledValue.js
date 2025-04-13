import { useState } from 'react';
/**
 * Helper hook for using controlled/uncontrolled values from a component props.
 *
 * When the value is not controlled, pass `undefined` as `controlledValue` and
 * use the returned setter to update it.
 *
 * When the value is controlled, pass the controlled value as second
 * argument, which will be always returned as `value`.
 */
export function useControlledValue(defaultValue, controlledValue) {
    const [uncontrolledValue, setValue] = useState(defaultValue);
    const value = controlledValue === undefined ? uncontrolledValue : controlledValue;
    return [value, setValue];
}
