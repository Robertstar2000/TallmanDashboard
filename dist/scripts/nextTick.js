export function nextTick(callback) {
    setTimeout(callback, 0);
}
export function nextTickAsync(callback) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(callback());
        }, 0);
    });
}
