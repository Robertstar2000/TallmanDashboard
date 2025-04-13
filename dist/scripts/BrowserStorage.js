/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BrowserConfigurationAuthErrorCodes, createBrowserConfigurationAuthError, } from "../error/BrowserConfigurationAuthError.js";
import { BrowserCacheLocation } from "../utils/BrowserConstants.js";
import { LocalStorage } from "./LocalStorage.js";
import { SessionStorage } from "./SessionStorage.js";
/**
 * @deprecated This class will be removed in a future major version
 */
export class BrowserStorage {
    constructor(cacheLocation) {
        if (cacheLocation === BrowserCacheLocation.LocalStorage) {
            this.windowStorage = new LocalStorage();
        }
        else if (cacheLocation === BrowserCacheLocation.SessionStorage) {
            this.windowStorage = new SessionStorage();
        }
        else {
            throw createBrowserConfigurationAuthError(BrowserConfigurationAuthErrorCodes.storageNotSupported);
        }
    }
    getItem(key) {
        return this.windowStorage.getItem(key);
    }
    setItem(key, value) {
        this.windowStorage.setItem(key, value);
    }
    removeItem(key) {
        this.windowStorage.removeItem(key);
    }
    getKeys() {
        return Object.keys(this.windowStorage);
    }
    containsKey(key) {
        return this.windowStorage.hasOwnProperty(key);
    }
}
