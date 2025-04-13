import { Logger } from '@open-draft/logger';
const logger = new Logger('cloneObject');
function isPlainObject(obj) {
    var _a;
    logger.info('is plain object?', obj);
    if (obj == null || !((_a = obj.constructor) === null || _a === void 0 ? void 0 : _a.name)) {
        logger.info('given object is undefined, not a plain object...');
        return false;
    }
    logger.info('checking the object constructor:', obj.constructor.name);
    return obj.constructor.name === 'Object';
}
export function cloneObject(obj) {
    logger.info('cloning object:', obj);
    const enumerableProperties = Object.entries(obj).reduce((acc, [key, value]) => {
        logger.info('analyzing key-value pair:', key, value);
        // Recursively clone only plain objects, omitting class instances.
        acc[key] = isPlainObject(value) ? cloneObject(value) : value;
        return acc;
    }, {});
    return isPlainObject(obj)
        ? enumerableProperties
        : Object.assign(Object.getPrototypeOf(obj), enumerableProperties);
}
