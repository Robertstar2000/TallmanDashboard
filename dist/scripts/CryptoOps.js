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
import { JoseHeader, PerformanceEvents, } from "@azure/msal-common/browser";
import { base64Encode, urlEncode, urlEncodeArr, } from "../encode/Base64Encode.js";
import { base64Decode } from "../encode/Base64Decode.js";
import * as BrowserCrypto from "./BrowserCrypto.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { AsyncMemoryStorage } from "../cache/AsyncMemoryStorage.js";
/**
 * This class implements MSAL's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and
 * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
 */
export class CryptoOps {
    constructor(logger, performanceClient, skipValidateSubtleCrypto) {
        this.logger = logger;
        // Browser crypto needs to be validated first before any other classes can be set.
        BrowserCrypto.validateCryptoAvailable(skipValidateSubtleCrypto !== null && skipValidateSubtleCrypto !== void 0 ? skipValidateSubtleCrypto : false);
        this.cache = new AsyncMemoryStorage(this.logger);
        this.performanceClient = performanceClient;
    }
    /**
     * Creates a new random GUID - used to populate state and nonce.
     * @returns string (GUID)
     */
    createNewGuid() {
        return BrowserCrypto.createNewGuid();
    }
    /**
     * Encodes input string to base64.
     * @param input
     */
    base64Encode(input) {
        return base64Encode(input);
    }
    /**
     * Decodes input string from base64.
     * @param input
     */
    base64Decode(input) {
        return base64Decode(input);
    }
    /**
     * Encodes input string to base64 URL safe string.
     * @param input
     */
    base64UrlEncode(input) {
        return urlEncode(input);
    }
    /**
     * Stringifies and base64Url encodes input public key
     * @param inputKid
     * @returns Base64Url encoded public key
     */
    encodeKid(inputKid) {
        return this.base64UrlEncode(JSON.stringify({ kid: inputKid }));
    }
    /**
     * Generates a keypair, stores it and returns a thumbprint
     * @param request
     */
    getPublicKeyThumbprint(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const publicKeyThumbMeasurement = (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.startMeasurement(PerformanceEvents.CryptoOptsGetPublicKeyThumbprint, request.correlationId);
            // Generate Keypair
            const keyPair = yield BrowserCrypto.generateKeyPair(CryptoOps.EXTRACTABLE, CryptoOps.POP_KEY_USAGES);
            // Generate Thumbprint for Public Key
            const publicKeyJwk = yield BrowserCrypto.exportJwk(keyPair.publicKey);
            const pubKeyThumprintObj = {
                e: publicKeyJwk.e,
                kty: publicKeyJwk.kty,
                n: publicKeyJwk.n,
            };
            const publicJwkString = getSortedObjectString(pubKeyThumprintObj);
            const publicJwkHash = yield this.hashString(publicJwkString);
            // Generate Thumbprint for Private Key
            const privateKeyJwk = yield BrowserCrypto.exportJwk(keyPair.privateKey);
            // Re-import private key to make it unextractable
            const unextractablePrivateKey = yield BrowserCrypto.importJwk(privateKeyJwk, false, ["sign"]);
            // Store Keypair data in keystore
            yield this.cache.setItem(publicJwkHash, {
                privateKey: unextractablePrivateKey,
                publicKey: keyPair.publicKey,
                requestMethod: request.resourceRequestMethod,
                requestUri: request.resourceRequestUri,
            });
            if (publicKeyThumbMeasurement) {
                publicKeyThumbMeasurement.end({
                    success: true,
                });
            }
            return publicJwkHash;
        });
    }
    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid
     */
    removeTokenBindingKey(kid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.cache.removeItem(kid);
            const keyFound = yield this.cache.containsKey(kid);
            return !keyFound;
        });
    }
    /**
     * Removes all cryptographic keys from IndexedDB storage
     */
    clearKeystore() {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete in-memory keystores
            this.cache.clearInMemory();
            /**
             * There is only one database, so calling clearPersistent on asymmetric keystore takes care of
             * every persistent keystore
             */
            try {
                yield this.cache.clearPersistent();
                return true;
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(`Clearing keystore failed with error: ${e.message}`);
                }
                else {
                    this.logger.error("Clearing keystore failed with unknown error");
                }
                return false;
            }
        });
    }
    /**
     * Signs the given object as a jwt payload with private key retrieved by given kid.
     * @param payload
     * @param kid
     */
    signJwt(payload, kid, shrOptions, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const signJwtMeasurement = (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.startMeasurement(PerformanceEvents.CryptoOptsSignJwt, correlationId);
            const cachedKeyPair = yield this.cache.getItem(kid);
            if (!cachedKeyPair) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.cryptoKeyNotFound);
            }
            // Get public key as JWK
            const publicKeyJwk = yield BrowserCrypto.exportJwk(cachedKeyPair.publicKey);
            const publicKeyJwkString = getSortedObjectString(publicKeyJwk);
            // Base64URL encode public key thumbprint with keyId only: BASE64URL({ kid: "FULL_PUBLIC_KEY_HASH" })
            const encodedKeyIdThumbprint = urlEncode(JSON.stringify({ kid: kid }));
            // Generate header
            const shrHeader = JoseHeader.getShrHeaderString(Object.assign(Object.assign({}, shrOptions === null || shrOptions === void 0 ? void 0 : shrOptions.header), { alg: publicKeyJwk.alg, kid: encodedKeyIdThumbprint }));
            const encodedShrHeader = urlEncode(shrHeader);
            // Generate payload
            payload.cnf = {
                jwk: JSON.parse(publicKeyJwkString),
            };
            const encodedPayload = urlEncode(JSON.stringify(payload));
            // Form token string
            const tokenString = `${encodedShrHeader}.${encodedPayload}`;
            // Sign token
            const encoder = new TextEncoder();
            const tokenBuffer = encoder.encode(tokenString);
            const signatureBuffer = yield BrowserCrypto.sign(cachedKeyPair.privateKey, tokenBuffer);
            const encodedSignature = urlEncodeArr(new Uint8Array(signatureBuffer));
            const signedJwt = `${tokenString}.${encodedSignature}`;
            if (signJwtMeasurement) {
                signJwtMeasurement.end({
                    success: true,
                });
            }
            return signedJwt;
        });
    }
    /**
     * Returns the SHA-256 hash of an input string
     * @param plainText
     */
    hashString(plainText) {
        return __awaiter(this, void 0, void 0, function* () {
            return BrowserCrypto.hashString(plainText);
        });
    }
}
CryptoOps.POP_KEY_USAGES = ["sign", "verify"];
CryptoOps.EXTRACTABLE = true;
function getSortedObjectString(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}
