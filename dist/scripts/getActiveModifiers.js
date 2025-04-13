import { isSameMonth } from 'date-fns';
import { isMatch } from './isMatch';
/** Return the active modifiers for the given day. */
export function getActiveModifiers(day, 
/** The modifiers to match for the given date. */
modifiers, 
/** The month where the day is displayed, to add the "outside" modifiers.  */
displayMonth) {
    const matchedModifiers = Object.keys(modifiers).reduce((result, key) => {
        const modifier = modifiers[key];
        if (isMatch(day, modifier)) {
            result.push(key);
        }
        return result;
    }, []);
    const activeModifiers = {};
    matchedModifiers.forEach((modifier) => (activeModifiers[modifier] = true));
    if (displayMonth && !isSameMonth(day, displayMonth)) {
        activeModifiers.outside = true;
    }
    return activeModifiers;
}
