import { matcherToArray } from './matcherToArray';
/** Create CustomModifiers from dayModifiers */
export function getCustomModifiers(dayModifiers) {
    const customModifiers = {};
    Object.entries(dayModifiers).forEach(([modifier, matcher]) => {
        customModifiers[modifier] = matcherToArray(matcher);
    });
    return customModifiers;
}
