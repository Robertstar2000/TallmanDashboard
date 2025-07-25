import { getStrictProperties, hasOwn, sameValueZeroEqual } from './utils';
const PREACT_VNODE = '__v';
const PREACT_OWNER = '__o';
const REACT_OWNER = '_owner';
const { getOwnPropertyDescriptor, keys } = Object;
/**
 * Whether the arrays are equal in value.
 */
export function areArraysEqual(a, b, state) {
    let index = a.length;
    if (b.length !== index) {
        return false;
    }
    while (index-- > 0) {
        if (!state.equals(a[index], b[index], index, index, a, b, state)) {
            return false;
        }
    }
    return true;
}
/**
 * Whether the dates passed are equal in value.
 */
export function areDatesEqual(a, b) {
    return sameValueZeroEqual(a.getTime(), b.getTime());
}
/**
 * Whether the errors passed are equal in value.
 */
export function areErrorsEqual(a, b) {
    return (a.name === b.name &&
        a.message === b.message &&
        a.cause === b.cause &&
        a.stack === b.stack);
}
/**
 * Whether the functions passed are equal in value.
 */
export function areFunctionsEqual(a, b) {
    return a === b;
}
/**
 * Whether the `Map`s are equal in value.
 */
export function areMapsEqual(a, b, state) {
    const size = a.size;
    if (size !== b.size) {
        return false;
    }
    if (!size) {
        return true;
    }
    const matchedIndices = new Array(size);
    const aIterable = a.entries();
    let aResult;
    let bResult;
    let index = 0;
    while ((aResult = aIterable.next())) {
        if (aResult.done) {
            break;
        }
        const bIterable = b.entries();
        let hasMatch = false;
        let matchIndex = 0;
        while ((bResult = bIterable.next())) {
            if (bResult.done) {
                break;
            }
            if (matchedIndices[matchIndex]) {
                matchIndex++;
                continue;
            }
            const aEntry = aResult.value;
            const bEntry = bResult.value;
            if (state.equals(aEntry[0], bEntry[0], index, matchIndex, a, b, state) &&
                state.equals(aEntry[1], bEntry[1], aEntry[0], bEntry[0], a, b, state)) {
                hasMatch = matchedIndices[matchIndex] = true;
                break;
            }
            matchIndex++;
        }
        if (!hasMatch) {
            return false;
        }
        index++;
    }
    return true;
}
/**
 * Whether the numbers are equal in value.
 */
export const areNumbersEqual = sameValueZeroEqual;
/**
 * Whether the objects are equal in value.
 */
export function areObjectsEqual(a, b, state) {
    const properties = keys(a);
    let index = properties.length;
    if (keys(b).length !== index) {
        return false;
    }
    // Decrementing `while` showed faster results than either incrementing or
    // decrementing `for` loop and than an incrementing `while` loop. Declarative
    // methods like `some` / `every` were not used to avoid incurring the garbage
    // cost of anonymous callbacks.
    while (index-- > 0) {
        if (!isPropertyEqual(a, b, state, properties[index])) {
            return false;
        }
    }
    return true;
}
/**
 * Whether the objects are equal in value with strict property checking.
 */
export function areObjectsEqualStrict(a, b, state) {
    const properties = getStrictProperties(a);
    let index = properties.length;
    if (getStrictProperties(b).length !== index) {
        return false;
    }
    let property;
    let descriptorA;
    let descriptorB;
    // Decrementing `while` showed faster results than either incrementing or
    // decrementing `for` loop and than an incrementing `while` loop. Declarative
    // methods like `some` / `every` were not used to avoid incurring the garbage
    // cost of anonymous callbacks.
    while (index-- > 0) {
        property = properties[index];
        if (!isPropertyEqual(a, b, state, property)) {
            return false;
        }
        descriptorA = getOwnPropertyDescriptor(a, property);
        descriptorB = getOwnPropertyDescriptor(b, property);
        if ((descriptorA || descriptorB) &&
            (!descriptorA ||
                !descriptorB ||
                descriptorA.configurable !== descriptorB.configurable ||
                descriptorA.enumerable !== descriptorB.enumerable ||
                descriptorA.writable !== descriptorB.writable)) {
            return false;
        }
    }
    return true;
}
/**
 * Whether the primitive wrappers passed are equal in value.
 */
export function arePrimitiveWrappersEqual(a, b) {
    return sameValueZeroEqual(a.valueOf(), b.valueOf());
}
/**
 * Whether the regexps passed are equal in value.
 */
export function areRegExpsEqual(a, b) {
    return a.source === b.source && a.flags === b.flags;
}
/**
 * Whether the `Set`s are equal in value.
 */
export function areSetsEqual(a, b, state) {
    const size = a.size;
    if (size !== b.size) {
        return false;
    }
    if (!size) {
        return true;
    }
    const matchedIndices = new Array(size);
    const aIterable = a.values();
    let aResult;
    let bResult;
    while ((aResult = aIterable.next())) {
        if (aResult.done) {
            break;
        }
        const bIterable = b.values();
        let hasMatch = false;
        let matchIndex = 0;
        while ((bResult = bIterable.next())) {
            if (bResult.done) {
                break;
            }
            if (!matchedIndices[matchIndex] &&
                state.equals(aResult.value, bResult.value, aResult.value, bResult.value, a, b, state)) {
                hasMatch = matchedIndices[matchIndex] = true;
                break;
            }
            matchIndex++;
        }
        if (!hasMatch) {
            return false;
        }
    }
    return true;
}
/**
 * Whether the TypedArray instances are equal in value.
 */
export function areTypedArraysEqual(a, b) {
    let index = a.length;
    if (b.length !== index) {
        return false;
    }
    while (index-- > 0) {
        if (a[index] !== b[index]) {
            return false;
        }
    }
    return true;
}
/**
 * Whether the URL instances are equal in value.
 */
export function areUrlsEqual(a, b) {
    return (a.hostname === b.hostname &&
        a.pathname === b.pathname &&
        a.protocol === b.protocol &&
        a.port === b.port &&
        a.hash === b.hash &&
        a.username === b.username &&
        a.password === b.password);
}
function isPropertyEqual(a, b, state, property) {
    if ((property === REACT_OWNER ||
        property === PREACT_OWNER ||
        property === PREACT_VNODE) &&
        (a.$$typeof || b.$$typeof)) {
        return true;
    }
    return (hasOwn(b, property) &&
        state.equals(a[property], b[property], property, property, a, b, state));
}
