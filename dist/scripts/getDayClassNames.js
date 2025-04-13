import { InternalModifier } from 'types/Modifiers';
function isInternalModifier(modifier) {
    return Object.values(InternalModifier).includes(modifier);
}
/**
 * Return the class names for the Day element, according to the given active
 * modifiers.
 *
 * Custom class names are set via `modifiersClassNames` or `classNames`,
 * where the first have the precedence.
 */
export function getDayClassNames(dayPicker, activeModifiers) {
    const classNames = [dayPicker.classNames.day];
    Object.keys(activeModifiers).forEach((modifier) => {
        const customClassName = dayPicker.modifiersClassNames[modifier];
        if (customClassName) {
            classNames.push(customClassName);
        }
        else if (isInternalModifier(modifier)) {
            const internalClassName = dayPicker.classNames[`day_${modifier}`];
            if (internalClassName) {
                classNames.push(internalClassName);
            }
        }
    });
    return classNames;
}
