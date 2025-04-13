/**
 * cache
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CacheItem_isNull, _CacheItem_item;
import { LRUCache } from 'lru-cache';
import { valueToJsonString } from './util';
/* numeric constants */
const MAX_CACHE = 4096;
/**
 * CacheItem
 */
export class CacheItem {
    /**
     * constructor
     */
    constructor(item, isNull = false) {
        /* private */
        _CacheItem_isNull.set(this, void 0);
        _CacheItem_item.set(this, void 0);
        __classPrivateFieldSet(this, _CacheItem_item, item, "f");
        __classPrivateFieldSet(this, _CacheItem_isNull, !!isNull, "f");
    }
    get item() {
        return __classPrivateFieldGet(this, _CacheItem_item, "f");
    }
    get isNull() {
        return __classPrivateFieldGet(this, _CacheItem_isNull, "f");
    }
}
_CacheItem_isNull = new WeakMap(), _CacheItem_item = new WeakMap();
/**
 * NullObject
 */
export class NullObject extends CacheItem {
    /**
     * constructor
     */
    constructor() {
        super(Symbol('null'), true);
    }
}
/*
 * lru cache
 */
export const lruCache = new LRUCache({
    max: MAX_CACHE
});
/**
 * set cache
 * @param key - cache key
 * @param value - value to cache
 * @returns void
 */
export const setCache = (key, value) => {
    if (key) {
        if (value === null) {
            lruCache.set(key, new NullObject());
        }
        else if (value instanceof CacheItem) {
            lruCache.set(key, value);
        }
        else {
            lruCache.set(key, new CacheItem(value));
        }
    }
};
/**
 * get cache
 * @param key - cache key
 * @returns cached item or false otherwise
 */
export const getCache = (key) => {
    if (key && lruCache.has(key)) {
        const item = lruCache.get(key);
        if (item instanceof CacheItem) {
            return item;
        }
        // delete unexpected cached item
        lruCache.delete(key);
        return false;
    }
    return false;
};
/**
 * create cache key
 * @param keyData - key data
 * @param [opt] - options
 * @returns cache key
 */
export const createCacheKey = (keyData, opt = {}) => {
    const { customProperty = {}, dimension = {} } = opt;
    let cacheKey = '';
    if (keyData &&
        Object.keys(keyData).length &&
        typeof customProperty.callback !== 'function' &&
        typeof dimension.callback !== 'function') {
        keyData.opt = valueToJsonString(opt);
        cacheKey = valueToJsonString(keyData);
    }
    return cacheKey;
};
