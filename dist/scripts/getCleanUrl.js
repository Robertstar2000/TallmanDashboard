/**
 * Removes query parameters and hashes from a given URL.
 */
export function getCleanUrl(url, isAbsolute = true) {
    return [isAbsolute && url.origin, url.pathname].filter(Boolean).join('');
}
