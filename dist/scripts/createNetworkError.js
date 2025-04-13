export function createNetworkError(cause) {
    return Object.assign(new TypeError('Failed to fetch'), {
        cause,
    });
}
