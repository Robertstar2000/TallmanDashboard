import { findPropertySource } from './findPropertySource';
export function createProxy(target, options) {
    const proxy = new Proxy(target, optionsToProxyHandler(options));
    return proxy;
}
function optionsToProxyHandler(options) {
    const { constructorCall, methodCall, getProperty, setProperty } = options;
    const handler = {};
    if (typeof constructorCall !== 'undefined') {
        handler.construct = function (target, args, newTarget) {
            const next = Reflect.construct.bind(null, target, args, newTarget);
            return constructorCall.call(newTarget, args, next);
        };
    }
    handler.set = function (target, propertyName, nextValue) {
        const next = () => {
            const propertySource = findPropertySource(target, propertyName) || target;
            const ownDescriptors = Reflect.getOwnPropertyDescriptor(propertySource, propertyName);
            // Respect any custom setters present for this property.
            if (typeof (ownDescriptors === null || ownDescriptors === void 0 ? void 0 : ownDescriptors.set) !== 'undefined') {
                ownDescriptors.set.apply(target, [nextValue]);
                return true;
            }
            // Otherwise, set the property on the source.
            return Reflect.defineProperty(propertySource, propertyName, {
                writable: true,
                enumerable: true,
                configurable: true,
                value: nextValue,
            });
        };
        if (typeof setProperty !== 'undefined') {
            return setProperty.call(target, [propertyName, nextValue], next);
        }
        return next();
    };
    handler.get = function (target, propertyName, receiver) {
        /**
         * @note Using `Reflect.get()` here causes "TypeError: Illegal invocation".
         */
        const next = () => target[propertyName];
        const value = typeof getProperty !== 'undefined'
            ? getProperty.call(target, [propertyName, receiver], next)
            : next();
        if (typeof value === 'function') {
            return (...args) => {
                const next = value.bind(target, ...args);
                if (typeof methodCall !== 'undefined') {
                    return methodCall.call(target, [propertyName, args], next);
                }
                return next();
            };
        }
        return value;
    };
    return handler;
}
