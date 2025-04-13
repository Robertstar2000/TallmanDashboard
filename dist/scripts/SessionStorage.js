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
import { BrowserConfigurationAuthErrorCodes, createBrowserConfigurationAuthError, } from "../error/BrowserConfigurationAuthError.js";
export class SessionStorage {
    constructor() {
        if (!window.sessionStorage) {
            throw createBrowserConfigurationAuthError(BrowserConfigurationAuthErrorCodes.storageNotSupported);
        }
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Session storage does not require initialization
        });
    }
    getItem(key) {
        return window.sessionStorage.getItem(key);
    }
    getUserData(key) {
        return this.getItem(key);
    }
    setItem(key, value) {
        window.sessionStorage.setItem(key, value);
    }
    setUserData(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setItem(key, value);
        });
    }
    removeItem(key) {
        window.sessionStorage.removeItem(key);
    }
    getKeys() {
        return Object.keys(window.sessionStorage);
    }
    containsKey(key) {
        return window.sessionStorage.hasOwnProperty(key);
    }
}
