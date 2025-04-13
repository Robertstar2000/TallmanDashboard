export class LocalStorage {
    constructor() {
        if (typeof window === 'undefined') {
            throw new Error('LocalStorage is not available on the server side');
        }
        this.storage = window.localStorage;
    }
    getItem(key) {
        const item = this.storage.getItem(key);
        if (!item)
            return null;
        try {
            return JSON.parse(item);
        }
        catch (_a) {
            return null;
        }
    }
    setItem(key, value) {
        this.storage.setItem(key, JSON.stringify(value));
    }
    removeItem(key) {
        this.storage.removeItem(key);
    }
    clear() {
        this.storage.clear();
    }
}
