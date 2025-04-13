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
import { PerformanceEvents, } from "@azure/msal-common/browser";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants.js";
import { urlEncodeArr } from "../encode/Base64Encode.js";
import { base64DecToArr } from "../encode/Base64Decode.js";
/**
 * This file defines functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
/**
 * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
 */
// Algorithms
const PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
const AES_GCM = "AES-GCM";
const HKDF = "HKDF";
// SHA-256 hashing algorithm
const S256_HASH_ALG = "SHA-256";
// MOD length for PoP tokens
const MODULUS_LENGTH = 2048;
// Public Exponent
const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
// UUID hex digits
const UUID_CHARS = "0123456789abcdef";
// Array to store UINT32 random value
const UINT32_ARR = new Uint32Array(1);
// Key Format
const RAW = "raw";
// Key Usages
const ENCRYPT = "encrypt";
const DECRYPT = "decrypt";
const DERIVE_KEY = "deriveKey";
// Suberror
const SUBTLE_SUBERROR = "crypto_subtle_undefined";
const keygenAlgorithmOptions = {
    name: PKCS1_V15_KEYGEN_ALG,
    hash: S256_HASH_ALG,
    modulusLength: MODULUS_LENGTH,
    publicExponent: PUBLIC_EXPONENT,
};
/**
 * Check whether browser crypto is available.
 */
export function validateCryptoAvailable(skipValidateSubtleCrypto) {
    if (!window) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.nonBrowserEnvironment);
    }
    if (!window.crypto) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.cryptoNonExistent);
    }
    if (!skipValidateSubtleCrypto && !window.crypto.subtle) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.cryptoNonExistent, SUBTLE_SUBERROR);
    }
}
/**
 * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
 * @param dataString {string} data string
 * @param performanceClient {?IPerformanceClient}
 * @param correlationId {?string} correlation id
 */
export function sha256Digest(dataString, performanceClient, correlationId) {
    return __awaiter(this, void 0, void 0, function* () {
        performanceClient === null || performanceClient === void 0 ? void 0 : performanceClient.addQueueMeasurement(PerformanceEvents.Sha256Digest, correlationId);
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        return window.crypto.subtle.digest(S256_HASH_ALG, data);
    });
}
/**
 * Populates buffer with cryptographically random values.
 * @param dataBuffer
 */
export function getRandomValues(dataBuffer) {
    return window.crypto.getRandomValues(dataBuffer);
}
/**
 * Returns random Uint32 value.
 * @returns {number}
 */
function getRandomUint32() {
    window.crypto.getRandomValues(UINT32_ARR);
    return UINT32_ARR[0];
}
/**
 * Creates a UUID v7 from the current timestamp.
 * Implementation relies on the system clock to guarantee increasing order of generated identifiers.
 * @returns {number}
 */
export function createNewGuid() {
    const currentTimestamp = Date.now();
    const baseRand = getRandomUint32() * 0x400 + (getRandomUint32() & 0x3ff);
    // Result byte array
    const bytes = new Uint8Array(16);
    // A 12-bit `rand_a` field value
    const randA = Math.trunc(baseRand / Math.pow(2, 30));
    // The higher 30 bits of 62-bit `rand_b` field value
    const randBHi = baseRand & (Math.pow(2, 30) - 1);
    // The lower 32 bits of 62-bit `rand_b` field value
    const randBLo = getRandomUint32();
    bytes[0] = currentTimestamp / Math.pow(2, 40);
    bytes[1] = currentTimestamp / Math.pow(2, 32);
    bytes[2] = currentTimestamp / Math.pow(2, 24);
    bytes[3] = currentTimestamp / Math.pow(2, 16);
    bytes[4] = currentTimestamp / Math.pow(2, 8);
    bytes[5] = currentTimestamp;
    bytes[6] = 0x70 | (randA >>> 8);
    bytes[7] = randA;
    bytes[8] = 0x80 | (randBHi >>> 24);
    bytes[9] = randBHi >>> 16;
    bytes[10] = randBHi >>> 8;
    bytes[11] = randBHi;
    bytes[12] = randBLo >>> 24;
    bytes[13] = randBLo >>> 16;
    bytes[14] = randBLo >>> 8;
    bytes[15] = randBLo;
    let text = "";
    for (let i = 0; i < bytes.length; i++) {
        text += UUID_CHARS.charAt(bytes[i] >>> 4);
        text += UUID_CHARS.charAt(bytes[i] & 0xf);
        if (i === 3 || i === 5 || i === 7 || i === 9) {
            text += "-";
        }
    }
    return text;
}
/**
 * Generates a keypair based on current keygen algorithm config.
 * @param extractable
 * @param usages
 */
export function generateKeyPair(extractable, usages) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.generateKey(keygenAlgorithmOptions, extractable, usages);
    });
}
/**
 * Export key as Json Web Key (JWK)
 * @param key
 */
export function exportJwk(key) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key);
    });
}
/**
 * Imports key as Json Web Key (JWK), can set extractable and usages.
 * @param key
 * @param extractable
 * @param usages
 */
export function importJwk(key, extractable, usages) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.importKey(KEY_FORMAT_JWK, key, keygenAlgorithmOptions, extractable, usages);
    });
}
/**
 * Signs given data with given key
 * @param key
 * @param data
 */
export function sign(key, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.sign(keygenAlgorithmOptions, key, data);
    });
}
/**
 * Generates symmetric base encryption key. This may be stored as all encryption/decryption keys will be derived from this one.
 */
export function generateBaseKey() {
    return __awaiter(this, void 0, void 0, function* () {
        const key = yield window.crypto.subtle.generateKey({
            name: AES_GCM,
            length: 256,
        }, true, [ENCRYPT, DECRYPT]);
        return window.crypto.subtle.exportKey(RAW, key);
    });
}
/**
 * Returns the raw key to be passed into the key derivation function
 * @param baseKey
 * @returns
 */
export function generateHKDF(baseKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.importKey(RAW, baseKey, HKDF, false, [
            DERIVE_KEY,
        ]);
    });
}
/**
 * Given a base key and a nonce generates a derived key to be used in encryption and decryption.
 * Note: every time we encrypt a new key is derived
 * @param baseKey
 * @param nonce
 * @returns
 */
function deriveKey(baseKey, nonce, context) {
    return __awaiter(this, void 0, void 0, function* () {
        return window.crypto.subtle.deriveKey({
            name: HKDF,
            salt: nonce,
            hash: S256_HASH_ALG,
            info: new TextEncoder().encode(context),
        }, baseKey, { name: AES_GCM, length: 256 }, false, [ENCRYPT, DECRYPT]);
    });
}
/**
 * Encrypt the given data given a base key. Returns encrypted data and a nonce that must be provided during decryption
 * @param key
 * @param rawData
 */
export function encrypt(baseKey, rawData, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const encodedData = new TextEncoder().encode(rawData);
        // The nonce must never be reused with a given key.
        const nonce = window.crypto.getRandomValues(new Uint8Array(16));
        const derivedKey = yield deriveKey(baseKey, nonce, context);
        const encryptedData = yield window.crypto.subtle.encrypt({
            name: AES_GCM,
            iv: new Uint8Array(12), // New key is derived for every encrypt so we don't need a new nonce
        }, derivedKey, encodedData);
        return {
            data: urlEncodeArr(new Uint8Array(encryptedData)),
            nonce: urlEncodeArr(nonce),
        };
    });
}
/**
 * Decrypt data with the given key and nonce
 * @param key
 * @param nonce
 * @param encryptedData
 * @returns
 */
export function decrypt(baseKey, nonce, context, encryptedData) {
    return __awaiter(this, void 0, void 0, function* () {
        const encodedData = base64DecToArr(encryptedData);
        const derivedKey = yield deriveKey(baseKey, base64DecToArr(nonce), context);
        const decryptedData = yield window.crypto.subtle.decrypt({
            name: AES_GCM,
            iv: new Uint8Array(12), // New key is derived for every encrypt so we don't need a new nonce
        }, derivedKey, encodedData);
        return new TextDecoder().decode(decryptedData);
    });
}
/**
 * Returns the SHA-256 hash of an input string
 * @param plainText
 */
export function hashString(plainText) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashBuffer = yield sha256Digest(plainText);
        const hashBytes = new Uint8Array(hashBuffer);
        return urlEncodeArr(hashBytes);
    });
}
