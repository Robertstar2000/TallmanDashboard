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
import { Constants, invokeAsync, PerformanceEvents, invoke, } from "@azure/msal-common/browser";
import { createNewGuid, decrypt, encrypt, generateBaseKey, generateHKDF, } from "../crypto/BrowserCrypto.js";
import { base64DecToArr } from "../encode/Base64Decode.js";
import { urlEncodeArr } from "../encode/Base64Encode.js";
import { BrowserAuthErrorCodes, createBrowserAuthError, } from "../error/BrowserAuthError.js";
import { BrowserConfigurationAuthErrorCodes, createBrowserConfigurationAuthError, } from "../error/BrowserConfigurationAuthError.js";
import { CookieStorage, SameSiteOptions } from "./CookieStorage.js";
import { MemoryStorage } from "./MemoryStorage.js";
import { getAccountKeys, getTokenKeys } from "./CacheHelpers.js";
import { StaticCacheKeys } from "../utils/BrowserConstants.js";
const ENCRYPTION_KEY = "msal.cache.encryption";
const BROADCAST_CHANNEL_NAME = "msal.broadcast.cache";
export class LocalStorage {
    constructor(clientId, logger, performanceClient) {
        if (!window.localStorage) {
            throw createBrowserConfigurationAuthError(BrowserConfigurationAuthErrorCodes.storageNotSupported);
        }
        this.memoryStorage = new MemoryStorage();
        this.initialized = false;
        this.clientId = clientId;
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }
    initialize(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.initialized = true;
            const cookies = new CookieStorage();
            const cookieString = cookies.getItem(ENCRYPTION_KEY);
            let parsedCookie = { key: "", id: "" };
            if (cookieString) {
                try {
                    parsedCookie = JSON.parse(cookieString);
                }
                catch (e) { }
            }
            if (parsedCookie.key && parsedCookie.id) {
                // Encryption key already exists, import
                const baseKey = invoke(base64DecToArr, PerformanceEvents.Base64Decode, this.logger, this.performanceClient, correlationId)(parsedCookie.key);
                this.encryptionCookie = {
                    id: parsedCookie.id,
                    key: yield invokeAsync(generateHKDF, PerformanceEvents.GenerateHKDF, this.logger, this.performanceClient, correlationId)(baseKey),
                };
                yield invokeAsync(this.importExistingCache.bind(this), PerformanceEvents.ImportExistingCache, this.logger, this.performanceClient, correlationId)(correlationId);
            }
            else {
                // Encryption key doesn't exist or is invalid, generate a new one and clear existing cache
                this.clear();
                const id = createNewGuid();
                const baseKey = yield invokeAsync(generateBaseKey, PerformanceEvents.GenerateBaseKey, this.logger, this.performanceClient, correlationId)();
                const keyStr = invoke(urlEncodeArr, PerformanceEvents.UrlEncodeArr, this.logger, this.performanceClient, correlationId)(new Uint8Array(baseKey));
                this.encryptionCookie = {
                    id: id,
                    key: yield invokeAsync(generateHKDF, PerformanceEvents.GenerateHKDF, this.logger, this.performanceClient, correlationId)(baseKey),
                };
                const cookieData = {
                    id: id,
                    key: keyStr,
                };
                cookies.setItem(ENCRYPTION_KEY, JSON.stringify(cookieData), 0, // Expiration - 0 means cookie will be cleared at the end of the browser session
                true, // Secure flag
                SameSiteOptions.None // SameSite must be None to support iframed apps
                );
            }
            // Register listener for cache updates in other tabs
            this.broadcast.addEventListener("message", this.updateCache.bind(this));
        });
    }
    getItem(key) {
        return window.localStorage.getItem(key);
    }
    getUserData(key) {
        if (!this.initialized) {
            throw createBrowserAuthError(BrowserAuthErrorCodes.uninitializedPublicClientApplication);
        }
        return this.memoryStorage.getItem(key);
    }
    setItem(key, value) {
        window.localStorage.setItem(key, value);
    }
    setUserData(key, value, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized || !this.encryptionCookie) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.uninitializedPublicClientApplication);
            }
            const { data, nonce } = yield invokeAsync(encrypt, PerformanceEvents.Encrypt, this.logger, this.performanceClient, correlationId)(this.encryptionCookie.key, value, this.getContext(key));
            const encryptedData = {
                id: this.encryptionCookie.id,
                nonce: nonce,
                data: data,
            };
            this.memoryStorage.setItem(key, value);
            this.setItem(key, JSON.stringify(encryptedData));
            // Notify other frames to update their in-memory cache
            this.broadcast.postMessage({
                key: key,
                value: value,
                context: this.getContext(key),
            });
        });
    }
    removeItem(key) {
        if (this.memoryStorage.containsKey(key)) {
            this.memoryStorage.removeItem(key);
            this.broadcast.postMessage({
                key: key,
                value: null,
                context: this.getContext(key),
            });
        }
        window.localStorage.removeItem(key);
    }
    getKeys() {
        return Object.keys(window.localStorage);
    }
    containsKey(key) {
        return window.localStorage.hasOwnProperty(key);
    }
    /**
     * Removes all known MSAL keys from the cache
     */
    clear() {
        // Removes all remaining MSAL cache items
        this.memoryStorage.clear();
        const accountKeys = getAccountKeys(this);
        accountKeys.forEach((key) => this.removeItem(key));
        const tokenKeys = getTokenKeys(this.clientId, this);
        tokenKeys.idToken.forEach((key) => this.removeItem(key));
        tokenKeys.accessToken.forEach((key) => this.removeItem(key));
        tokenKeys.refreshToken.forEach((key) => this.removeItem(key));
        // Clean up anything left
        this.getKeys().forEach((cacheKey) => {
            if (cacheKey.startsWith(Constants.CACHE_PREFIX) ||
                cacheKey.indexOf(this.clientId) !== -1) {
                this.removeItem(cacheKey);
            }
        });
    }
    /**
     * Helper to decrypt all known MSAL keys in localStorage and save them to inMemory storage
     * @returns
     */
    importExistingCache(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.encryptionCookie) {
                return;
            }
            let accountKeys = getAccountKeys(this);
            accountKeys = yield this.importArray(accountKeys, correlationId);
            // Write valid account keys back to map
            this.setItem(StaticCacheKeys.ACCOUNT_KEYS, JSON.stringify(accountKeys));
            const tokenKeys = getTokenKeys(this.clientId, this);
            tokenKeys.idToken = yield this.importArray(tokenKeys.idToken, correlationId);
            tokenKeys.accessToken = yield this.importArray(tokenKeys.accessToken, correlationId);
            tokenKeys.refreshToken = yield this.importArray(tokenKeys.refreshToken, correlationId);
            // Write valid token keys back to map
            this.setItem(`${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`, JSON.stringify(tokenKeys));
        });
    }
    /**
     * Helper to decrypt and save cache entries
     * @param key
     * @returns
     */
    getItemFromEncryptedCache(key, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.encryptionCookie) {
                return null;
            }
            const rawCache = this.getItem(key);
            if (!rawCache) {
                return null;
            }
            let encObj;
            try {
                encObj = JSON.parse(rawCache);
            }
            catch (e) {
                // Not a valid encrypted object, remove
                return null;
            }
            if (!encObj.id || !encObj.nonce || !encObj.data) {
                // Data is not encrypted, likely from old version of MSAL. It must be removed because we don't know how old it is.
                this.performanceClient.incrementFields({ unencryptedCacheCount: 1 }, correlationId);
                return null;
            }
            if (encObj.id !== this.encryptionCookie.id) {
                // Data was encrypted with a different key. It must be removed because it is from a previous session.
                this.performanceClient.incrementFields({ encryptedCacheExpiredCount: 1 }, correlationId);
                return null;
            }
            return invokeAsync(decrypt, PerformanceEvents.Decrypt, this.logger, this.performanceClient, correlationId)(this.encryptionCookie.key, encObj.nonce, this.getContext(key), encObj.data);
        });
    }
    /**
     * Helper to decrypt and save an array of cache keys
     * @param arr
     * @returns Array of keys successfully imported
     */
    importArray(arr, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const importedArr = [];
            const promiseArr = [];
            arr.forEach((key) => {
                const promise = this.getItemFromEncryptedCache(key, correlationId).then((value) => {
                    if (value) {
                        this.memoryStorage.setItem(key, value);
                        importedArr.push(key);
                    }
                    else {
                        // If value is empty, unencrypted or expired remove
                        this.removeItem(key);
                    }
                });
                promiseArr.push(promise);
            });
            yield Promise.all(promiseArr);
            return importedArr;
        });
    }
    /**
     * Gets encryption context for a given cache entry. This is clientId for app specific entries, empty string for shared entries
     * @param key
     * @returns
     */
    getContext(key) {
        let context = "";
        if (key.includes(this.clientId)) {
            context = this.clientId; // Used to bind encryption key to this appId
        }
        return context;
    }
    updateCache(event) {
        this.logger.trace("Updating internal cache from broadcast event");
        const perfMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.LocalStorageUpdated);
        perfMeasurement.add({ isBackground: true });
        const { key, value, context } = event.data;
        if (!key) {
            this.logger.error("Broadcast event missing key");
            perfMeasurement.end({ success: false, errorCode: "noKey" });
            return;
        }
        if (context && context !== this.clientId) {
            this.logger.trace(`Ignoring broadcast event from clientId: ${context}`);
            perfMeasurement.end({
                success: false,
                errorCode: "contextMismatch",
            });
            return;
        }
        if (!value) {
            this.memoryStorage.removeItem(key);
            this.logger.verbose("Removed item from internal cache");
        }
        else {
            this.memoryStorage.setItem(key, value);
            this.logger.verbose("Updated item in internal cache");
        }
        perfMeasurement.end({ success: true });
    }
}
