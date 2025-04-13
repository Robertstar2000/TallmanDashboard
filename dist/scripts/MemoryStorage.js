/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class MemoryStorage {
    constructor() {
        this.cache = new Map();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Memory storage does not require initialization
        });
    }
    getItem(key) {
        return this.cache.get(key) || null;
    }
    getUserData(key) {
        return this.getItem(key);
    }
    setItem(key, value) {
        this.cache.set(key, value);
    }
    setUserData(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setItem(key, value);
        });
    }
    removeItem(key) {
        this.cache.delete(key);
    }
    getKeys() {
        const cacheKeys = [];
        this.cache.forEach((value, key) => {
            cacheKeys.push(key);
        });
        return cacheKeys;
    }
    containsKey(key) {
        return this.cache.has(key);
    }
    clear() {
        this.cache.clear();
    }
}
