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
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { DB_NAME, DB_TABLE_NAME, DB_VERSION, } from "../utils/BrowserConstants.js";
/**
 * Storage wrapper for IndexedDB storage in browsers: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export class DatabaseStorage {
    constructor() {
        this.dbName = DB_NAME;
        this.version = DB_VERSION;
        this.tableName = DB_TABLE_NAME;
        this.dbOpen = false;
    }
    /**
     * Opens IndexedDB instance.
     */
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const openDB = window.indexedDB.open(this.dbName, this.version);
                openDB.addEventListener("upgradeneeded", (e) => {
                    const event = e;
                    event.target.result.createObjectStore(this.tableName);
                });
                openDB.addEventListener("success", (e) => {
                    const event = e;
                    this.db = event.target.result;
                    this.dbOpen = true;
                    resolve();
                });
                openDB.addEventListener("error", () => reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseUnavailable)));
            });
        });
    }
    /**
     * Closes the connection to IndexedDB database when all pending transactions
     * complete.
     */
    closeConnection() {
        const db = this.db;
        if (db && this.dbOpen) {
            db.close();
            this.dbOpen = false;
        }
    }
    /**
     * Opens database if it's not already open
     */
    validateDbIsOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.dbOpen) {
                return this.open();
            }
        });
    }
    /**
     * Retrieves item from IndexedDB instance.
     * @param key
     */
    getItem(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateDbIsOpen();
            return new Promise((resolve, reject) => {
                // TODO: Add timeouts?
                if (!this.db) {
                    return reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseNotOpen));
                }
                const transaction = this.db.transaction([this.tableName], "readonly");
                const objectStore = transaction.objectStore(this.tableName);
                const dbGet = objectStore.get(key);
                dbGet.addEventListener("success", (e) => {
                    const event = e;
                    this.closeConnection();
                    resolve(event.target.result);
                });
                dbGet.addEventListener("error", (e) => {
                    this.closeConnection();
                    reject(e);
                });
            });
        });
    }
    /**
     * Adds item to IndexedDB under given key
     * @param key
     * @param payload
     */
    setItem(key, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateDbIsOpen();
            return new Promise((resolve, reject) => {
                // TODO: Add timeouts?
                if (!this.db) {
                    return reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseNotOpen));
                }
                const transaction = this.db.transaction([this.tableName], "readwrite");
                const objectStore = transaction.objectStore(this.tableName);
                const dbPut = objectStore.put(payload, key);
                dbPut.addEventListener("success", () => {
                    this.closeConnection();
                    resolve();
                });
                dbPut.addEventListener("error", (e) => {
                    this.closeConnection();
                    reject(e);
                });
            });
        });
    }
    /**
     * Removes item from IndexedDB under given key
     * @param key
     */
    removeItem(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateDbIsOpen();
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    return reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseNotOpen));
                }
                const transaction = this.db.transaction([this.tableName], "readwrite");
                const objectStore = transaction.objectStore(this.tableName);
                const dbDelete = objectStore.delete(key);
                dbDelete.addEventListener("success", () => {
                    this.closeConnection();
                    resolve();
                });
                dbDelete.addEventListener("error", (e) => {
                    this.closeConnection();
                    reject(e);
                });
            });
        });
    }
    /**
     * Get all the keys from the storage object as an iterable array of strings.
     */
    getKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateDbIsOpen();
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    return reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseNotOpen));
                }
                const transaction = this.db.transaction([this.tableName], "readonly");
                const objectStore = transaction.objectStore(this.tableName);
                const dbGetKeys = objectStore.getAllKeys();
                dbGetKeys.addEventListener("success", (e) => {
                    const event = e;
                    this.closeConnection();
                    resolve(event.target.result);
                });
                dbGetKeys.addEventListener("error", (e) => {
                    this.closeConnection();
                    reject(e);
                });
            });
        });
    }
    /**
     *
     * Checks whether there is an object under the search key in the object store
     */
    containsKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateDbIsOpen();
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    return reject(createBrowserAuthError(BrowserAuthErrorCodes.databaseNotOpen));
                }
                const transaction = this.db.transaction([this.tableName], "readonly");
                const objectStore = transaction.objectStore(this.tableName);
                const dbContainsKey = objectStore.count(key);
                dbContainsKey.addEventListener("success", (e) => {
                    const event = e;
                    this.closeConnection();
                    resolve(event.target.result === 1);
                });
                dbContainsKey.addEventListener("error", (e) => {
                    this.closeConnection();
                    reject(e);
                });
            });
        });
    }
    /**
     * Deletes the MSAL database. The database is deleted rather than cleared to make it possible
     * for client applications to downgrade to a previous MSAL version without worrying about forward compatibility issues
     * with IndexedDB database versions.
     */
    deleteDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if database being deleted exists
            if (this.db && this.dbOpen) {
                this.closeConnection();
            }
            return new Promise((resolve, reject) => {
                const deleteDbRequest = window.indexedDB.deleteDatabase(DB_NAME);
                const id = setTimeout(() => reject(false), 200); // Reject if events aren't raised within 200ms
                deleteDbRequest.addEventListener("success", () => {
                    clearTimeout(id);
                    return resolve(true);
                });
                deleteDbRequest.addEventListener("blocked", () => {
                    clearTimeout(id);
                    return resolve(true);
                });
                deleteDbRequest.addEventListener("error", () => {
                    clearTimeout(id);
                    return reject(false);
                });
            });
        });
    }
}
