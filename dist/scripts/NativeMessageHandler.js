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
import { NativeConstants, NativeExtensionMethod, } from "../../utils/BrowserConstants.js";
import { createAuthError, AuthErrorCodes, AuthenticationScheme, PerformanceEvents, } from "@azure/msal-common/browser";
import { createNativeAuthError } from "../../error/NativeAuthError.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../../error/BrowserAuthError.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
export class NativeMessageHandler {
    constructor(logger, handshakeTimeoutMs, performanceClient, extensionId) {
        this.logger = logger;
        this.handshakeTimeoutMs = handshakeTimeoutMs;
        this.extensionId = extensionId;
        this.resolvers = new Map(); // Used for non-handshake messages
        this.handshakeResolvers = new Map(); // Used for handshake messages
        this.messageChannel = new MessageChannel();
        this.windowListener = this.onWindowMessage.bind(this); // Window event callback doesn't have access to 'this' unless it's bound
        this.performanceClient = performanceClient;
        this.handshakeEvent = performanceClient.startMeasurement(PerformanceEvents.NativeMessageHandlerHandshake);
    }
    /**
     * Sends a given message to the extension and resolves with the extension response
     * @param body
     */
    sendMessage(body) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("NativeMessageHandler - sendMessage called.");
            const req = {
                channel: NativeConstants.CHANNEL_ID,
                extensionId: this.extensionId,
                responseId: createNewGuid(),
                body: body,
            };
            this.logger.trace("NativeMessageHandler - Sending request to browser extension");
            this.logger.tracePii(`NativeMessageHandler - Sending request to browser extension: ${JSON.stringify(req)}`);
            this.messageChannel.port1.postMessage(req);
            return new Promise((resolve, reject) => {
                this.resolvers.set(req.responseId, { resolve, reject });
            });
        });
    }
    /**
     * Returns an instance of the MessageHandler that has successfully established a connection with an extension
     * @param {Logger} logger
     * @param {number} handshakeTimeoutMs
     * @param {IPerformanceClient} performanceClient
     * @param {ICrypto} crypto
     */
    static createProvider(logger, handshakeTimeoutMs, performanceClient) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.trace("NativeMessageHandler - createProvider called.");
            try {
                const preferredProvider = new NativeMessageHandler(logger, handshakeTimeoutMs, performanceClient, NativeConstants.PREFERRED_EXTENSION_ID);
                yield preferredProvider.sendHandshakeRequest();
                return preferredProvider;
            }
            catch (e) {
                // If preferred extension fails for whatever reason, fallback to using any installed extension
                const backupProvider = new NativeMessageHandler(logger, handshakeTimeoutMs, performanceClient);
                yield backupProvider.sendHandshakeRequest();
                return backupProvider;
            }
        });
    }
    /**
     * Send handshake request helper.
     */
    sendHandshakeRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("NativeMessageHandler - sendHandshakeRequest called.");
            // Register this event listener before sending handshake
            window.addEventListener("message", this.windowListener, false); // false is important, because content script message processing should work first
            const req = {
                channel: NativeConstants.CHANNEL_ID,
                extensionId: this.extensionId,
                responseId: createNewGuid(),
                body: {
                    method: NativeExtensionMethod.HandshakeRequest,
                },
            };
            this.handshakeEvent.add({
                extensionId: this.extensionId,
                extensionHandshakeTimeoutMs: this.handshakeTimeoutMs,
            });
            this.messageChannel.port1.onmessage = (event) => {
                this.onChannelMessage(event);
            };
            window.postMessage(req, window.origin, [this.messageChannel.port2]);
            return new Promise((resolve, reject) => {
                this.handshakeResolvers.set(req.responseId, { resolve, reject });
                this.timeoutId = window.setTimeout(() => {
                    /*
                     * Throw an error if neither HandshakeResponse nor original Handshake request are received in a reasonable timeframe.
                     * This typically suggests an event handler stopped propagation of the Handshake request but did not respond to it on the MessageChannel port
                     */
                    window.removeEventListener("message", this.windowListener, false);
                    this.messageChannel.port1.close();
                    this.messageChannel.port2.close();
                    this.handshakeEvent.end({
                        extensionHandshakeTimedOut: true,
                        success: false,
                    });
                    reject(createBrowserAuthError(BrowserAuthErrorCodes.nativeHandshakeTimeout));
                    this.handshakeResolvers.delete(req.responseId);
                }, this.handshakeTimeoutMs); // Use a reasonable timeout in milliseconds here
            });
        });
    }
    /**
     * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
     * @param event
     */
    onWindowMessage(event) {
        this.logger.trace("NativeMessageHandler - onWindowMessage called");
        // We only accept messages from ourselves
        if (event.source !== window) {
            return;
        }
        const request = event.data;
        if (!request.channel ||
            request.channel !== NativeConstants.CHANNEL_ID) {
            return;
        }
        if (request.extensionId && request.extensionId !== this.extensionId) {
            return;
        }
        if (request.body.method === NativeExtensionMethod.HandshakeRequest) {
            const handshakeResolver = this.handshakeResolvers.get(request.responseId);
            /*
             * Filter out responses with no matched resolvers sooner to keep channel ports open while waiting for
             * the proper response.
             */
            if (!handshakeResolver) {
                this.logger.trace(`NativeMessageHandler.onWindowMessage - resolver can't be found for request ${request.responseId}`);
                return;
            }
            // If we receive this message back it means no extension intercepted the request, meaning no extension supporting handshake protocol is installed
            this.logger.verbose(request.extensionId
                ? `Extension with id: ${request.extensionId} not installed`
                : "No extension installed");
            clearTimeout(this.timeoutId);
            this.messageChannel.port1.close();
            this.messageChannel.port2.close();
            window.removeEventListener("message", this.windowListener, false);
            this.handshakeEvent.end({
                success: false,
                extensionInstalled: false,
            });
            handshakeResolver.reject(createBrowserAuthError(BrowserAuthErrorCodes.nativeExtensionNotInstalled));
        }
    }
    /**
     * Invoked when a message is received from the extension on the MessageChannel port
     * @param event
     */
    onChannelMessage(event) {
        this.logger.trace("NativeMessageHandler - onChannelMessage called.");
        const request = event.data;
        const resolver = this.resolvers.get(request.responseId);
        const handshakeResolver = this.handshakeResolvers.get(request.responseId);
        try {
            const method = request.body.method;
            if (method === NativeExtensionMethod.Response) {
                if (!resolver) {
                    return;
                }
                const response = request.body.response;
                this.logger.trace("NativeMessageHandler - Received response from browser extension");
                this.logger.tracePii(`NativeMessageHandler - Received response from browser extension: ${JSON.stringify(response)}`);
                if (response.status !== "Success") {
                    resolver.reject(createNativeAuthError(response.code, response.description, response.ext));
                }
                else if (response.result) {
                    if (response.result["code"] &&
                        response.result["description"]) {
                        resolver.reject(createNativeAuthError(response.result["code"], response.result["description"], response.result["ext"]));
                    }
                    else {
                        resolver.resolve(response.result);
                    }
                }
                else {
                    throw createAuthError(AuthErrorCodes.unexpectedError, "Event does not contain result.");
                }
                this.resolvers.delete(request.responseId);
            }
            else if (method === NativeExtensionMethod.HandshakeResponse) {
                if (!handshakeResolver) {
                    this.logger.trace(`NativeMessageHandler.onChannelMessage - resolver can't be found for request ${request.responseId}`);
                    return;
                }
                clearTimeout(this.timeoutId); // Clear setTimeout
                window.removeEventListener("message", this.windowListener, false); // Remove 'No extension' listener
                this.extensionId = request.extensionId;
                this.extensionVersion = request.body.version;
                this.logger.verbose(`NativeMessageHandler - Received HandshakeResponse from extension: ${this.extensionId}`);
                this.handshakeEvent.end({
                    extensionInstalled: true,
                    success: true,
                });
                handshakeResolver.resolve();
                this.handshakeResolvers.delete(request.responseId);
            }
            // Do nothing if method is not Response or HandshakeResponse
        }
        catch (err) {
            this.logger.error("Error parsing response from WAM Extension");
            this.logger.errorPii(`Error parsing response from WAM Extension: ${err}`);
            this.logger.errorPii(`Unable to parse ${event}`);
            if (resolver) {
                resolver.reject(err);
            }
            else if (handshakeResolver) {
                handshakeResolver.reject(err);
            }
        }
    }
    /**
     * Returns the Id for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionId() {
        return this.extensionId;
    }
    /**
     * Returns the version for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionVersion() {
        return this.extensionVersion;
    }
    /**
     * Returns boolean indicating whether or not the request should attempt to use native broker
     * @param logger
     * @param config
     * @param nativeExtensionProvider
     * @param authenticationScheme
     */
    static isPlatformBrokerAvailable(config, logger, nativeExtensionProvider, authenticationScheme) {
        logger.trace("isPlatformBrokerAvailable called");
        if (!config.system.allowPlatformBroker) {
            logger.trace("isPlatformBrokerAvailable: allowPlatformBroker is not enabled, returning false");
            // Developer disabled WAM
            return false;
        }
        if (!nativeExtensionProvider) {
            logger.trace("isPlatformBrokerAvailable: Platform extension provider is not initialized, returning false");
            // Extension is not available
            return false;
        }
        if (authenticationScheme) {
            switch (authenticationScheme) {
                case AuthenticationScheme.BEARER:
                case AuthenticationScheme.POP:
                    logger.trace("isPlatformBrokerAvailable: authenticationScheme is supported, returning true");
                    return true;
                default:
                    logger.trace("isPlatformBrokerAvailable: authenticationScheme is not supported, returning false");
                    return false;
            }
        }
        return true;
    }
}
