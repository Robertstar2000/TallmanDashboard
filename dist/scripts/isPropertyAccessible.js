/**
 * A function that validates if property access is possible on an object
 * without throwing. It returns `true` if the property access is possible
 * and `false` otherwise.
 *
 * Environments like miniflare will throw on property access on certain objects
 * like Request and Response, for unimplemented properties.
 */
export function isPropertyAccessible(obj, key) {
    try {
        obj[key];
        return true;
    }
    catch (_a) {
        return false;
    }
}
