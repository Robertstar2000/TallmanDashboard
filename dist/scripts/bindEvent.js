export function bindEvent(target, event) {
    Object.defineProperties(event, {
        target: {
            value: target,
            enumerable: true,
            writable: true,
        },
        currentTarget: {
            value: target,
            enumerable: true,
            writable: true,
        },
    });
    return event;
}
