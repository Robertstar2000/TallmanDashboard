/** Normalize to array a matcher input. */
export function matcherToArray(matcher) {
    if (Array.isArray(matcher)) {
        return [...matcher];
    }
    else if (matcher !== undefined) {
        return [matcher];
    }
    else {
        return [];
    }
}
