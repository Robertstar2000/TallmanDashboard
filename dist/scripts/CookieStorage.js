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
import { ClientAuthErrorCodes, createClientAuthError, } from "@azure/msal-common/browser";
// Cookie life calculation (hours * minutes * seconds * ms)
const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;
export const SameSiteOptions = {
    Lax: "Lax",
    None: "None",
};
export class CookieStorage {
    initialize() {
        return Promise.resolve();
    }
    getItem(key) {
        const name = `${encodeURIComponent(key)}`;
        const cookieList = document.cookie.split(";");
        for (let i = 0; i < cookieList.length; i++) {
            const cookie = cookieList[i];
            const [key, ...rest] = decodeURIComponent(cookie).trim().split("=");
            const value = rest.join("=");
            if (key === name) {
                return value;
            }
        }
        return "";
    }
    getUserData() {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    setItem(key, value, cookieLifeDays, secure = true, sameSite = SameSiteOptions.Lax) {
        let cookieStr = `${encodeURIComponent(key)}=${encodeURIComponent(value)};path=/;SameSite=${sameSite};`;
        if (cookieLifeDays) {
            const expireTime = getCookieExpirationTime(cookieLifeDays);
            cookieStr += `expires=${expireTime};`;
        }
        if (secure || sameSite === SameSiteOptions.None) {
            // SameSite None requires Secure flag
            cookieStr += "Secure;";
        }
        document.cookie = cookieStr;
    }
    setUserData() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.reject(createClientAuthError(ClientAuthErrorCodes.methodNotImplemented));
        });
    }
    removeItem(key) {
        // Setting expiration to -1 removes it
        this.setItem(key, "", -1);
    }
    getKeys() {
        const cookieList = document.cookie.split(";");
        const keys = [];
        cookieList.forEach((cookie) => {
            const cookieParts = decodeURIComponent(cookie).trim().split("=");
            keys.push(cookieParts[0]);
        });
        return keys;
    }
    containsKey(key) {
        return this.getKeys().includes(key);
    }
}
/**
 * Get cookie expiration time
 * @param cookieLifeDays
 */
export function getCookieExpirationTime(cookieLifeDays) {
    const today = new Date();
    const expr = new Date(today.getTime() + cookieLifeDays * COOKIE_LIFE_MULTIPLIER);
    return expr.toUTCString();
}
