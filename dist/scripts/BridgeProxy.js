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
import { BridgeStatusCode } from "./BridgeStatusCode.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";
import { BrowserConstants } from "../utils/BrowserConstants.js";
import { version } from "../packageMetadata.js";
/**
 * BridgeProxy
 * Provides a proxy for accessing a bridge to a host app and/or
 * platform broker
 */
export class BridgeProxy {
    /**
     * initializeNestedAppAuthBridge - Initializes the bridge to the host app
     * @returns a promise that resolves to an InitializeBridgeResponse or rejects with an Error
     * @remarks This method will be called by the create factory method
     * @remarks If the bridge is not available, this method will throw an error
     */
    static initializeNestedAppAuthBridge() {
        return __awaiter(this, void 0, void 0, function* () {
            if (window === undefined) {
                throw new Error("window is undefined");
            }
            if (window.nestedAppAuthBridge === undefined) {
                throw new Error("window.nestedAppAuthBridge is undefined");
            }
            try {
                window.nestedAppAuthBridge.addEventListener("message", (response) => {
                    const responsePayload = typeof response === "string" ? response : response.data;
                    const responseEnvelope = JSON.parse(responsePayload);
                    const request = BridgeProxy.bridgeRequests.find((element) => element.requestId === responseEnvelope.requestId);
                    if (request !== undefined) {
                        BridgeProxy.bridgeRequests.splice(BridgeProxy.bridgeRequests.indexOf(request), 1);
                        if (responseEnvelope.success) {
                            request.resolve(responseEnvelope);
                        }
                        else {
                            request.reject(responseEnvelope.error);
                        }
                    }
                });
                const bridgeResponse = yield new Promise((resolve, reject) => {
                    const message = BridgeProxy.buildRequest("GetInitContext");
                    const request = {
                        requestId: message.requestId,
                        method: message.method,
                        resolve: resolve,
                        reject: reject,
                    };
                    BridgeProxy.bridgeRequests.push(request);
                    window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
                });
                return BridgeProxy.validateBridgeResultOrThrow(bridgeResponse.initContext);
            }
            catch (error) {
                window.console.log(error);
                throw error;
            }
        });
    }
    /**
     * getTokenInteractive - Attempts to get a token interactively from the bridge
     * @param request A token request
     * @returns a promise that resolves to an auth result or rejects with a BridgeError
     */
    getTokenInteractive(request) {
        return this.getToken("GetTokenPopup", request);
    }
    /**
     * getTokenSilent Attempts to get a token silently from the bridge
     * @param request A token request
     * @returns a promise that resolves to an auth result or rejects with a BridgeError
     */
    getTokenSilent(request) {
        return this.getToken("GetToken", request);
    }
    getToken(requestType, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendRequest(requestType, {
                tokenParams: request,
            });
            return {
                token: BridgeProxy.validateBridgeResultOrThrow(result.token),
                account: BridgeProxy.validateBridgeResultOrThrow(result.account),
            };
        });
    }
    getHostCapabilities() {
        var _a;
        return (_a = this.capabilities) !== null && _a !== void 0 ? _a : null;
    }
    getAccountContext() {
        return this.accountContext ? this.accountContext : null;
    }
    static buildRequest(method, requestParams) {
        return Object.assign({ messageType: "NestedAppAuthRequest", method: method, requestId: BrowserCrypto.createNewGuid(), sendTime: Date.now(), clientLibrary: BrowserConstants.MSAL_SKU, clientLibraryVersion: version }, requestParams);
    }
    /**
     * A method used to send a request to the bridge
     * @param request A token request
     * @returns a promise that resolves to a response of provided type or rejects with a BridgeError
     */
    sendRequest(method, requestParams) {
        const message = BridgeProxy.buildRequest(method, requestParams);
        const promise = new Promise((resolve, reject) => {
            const request = {
                requestId: message.requestId,
                method: message.method,
                resolve: resolve,
                reject: reject,
            };
            BridgeProxy.bridgeRequests.push(request);
            window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
        });
        return promise;
    }
    static validateBridgeResultOrThrow(input) {
        if (input === undefined) {
            const bridgeError = {
                status: BridgeStatusCode.NestedAppAuthUnavailable,
            };
            throw bridgeError;
        }
        return input;
    }
    /**
     * Private constructor for BridgeProxy
     * @param sdkName The name of the SDK being used to make requests on behalf of the app
     * @param sdkVersion The version of the SDK being used to make requests on behalf of the app
     * @param capabilities The capabilities of the bridge / SDK / platform broker
     */
    constructor(sdkName, sdkVersion, accountContext, capabilities) {
        this.sdkName = sdkName;
        this.sdkVersion = sdkVersion;
        this.accountContext = accountContext;
        this.capabilities = capabilities;
    }
    /**
     * Factory method for creating an implementation of IBridgeProxy
     * @returns A promise that resolves to a BridgeProxy implementation
     */
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield BridgeProxy.initializeNestedAppAuthBridge();
            return new BridgeProxy(response.sdkName, response.sdkVersion, response.accountContext, response.capabilities);
        });
    }
}
BridgeProxy.bridgeRequests = [];
export default BridgeProxy;
