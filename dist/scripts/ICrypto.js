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
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
export const DEFAULT_CRYPTO_IMPLEMENTATION = {
    createNewGuid: () => {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    },
    base64Decode: () => {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    },
    base64Encode: () => {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    },
    base64UrlEncode: () => {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    },
    encodeKid: () => {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    },
    getPublicKeyThumbprint() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
    removeTokenBindingKey() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
    clearKeystore() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
    signJwt() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
    hashString() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
};
