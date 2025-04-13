// LRU cache inspired from hashlru (https://github.com/dominictarr/hashlru/blob/v1.0.4/index.js) but object replaced with Map to improve performance
export const createLruCache = (maxCacheSize) => {
    if (maxCacheSize < 1) {
        return {
            get: () => undefined,
            set: () => { },
        };
    }
    let cacheSize = 0;
    let cache = new Map();
    let previousCache = new Map();
    const update = (key, value) => {
        cache.set(key, value);
        cacheSize++;
        if (cacheSize > maxCacheSize) {
            cacheSize = 0;
            previousCache = cache;
            cache = new Map();
        }
    };
    return {
        get(key) {
            let value = cache.get(key);
            if (value !== undefined) {
                return value;
            }
            if ((value = previousCache.get(key)) !== undefined) {
                update(key, value);
                return value;
            }
        },
        set(key, value) {
            if (cache.has(key)) {
                cache.set(key, value);
            }
            else {
                update(key, value);
            }
        },
    };
};
