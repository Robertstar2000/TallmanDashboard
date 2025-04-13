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
import { PromptValue, AuthError, ProtocolUtils, PerformanceEvents, invokeAsync, invoke, } from "@azure/msal-common/browser";
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { InteractionType, BrowserConstants, } from "../utils/BrowserConstants.js";
import { initiateAuthRequest, monitorIframeForHash, } from "../interaction_handler/SilentHandler.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { NativeInteractionClient } from "./NativeInteractionClient.js";
import { InteractionHandler } from "../interaction_handler/InteractionHandler.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import * as ResponseHandler from "../response/ResponseHandler.js";
import { getAuthCodeRequestUrl } from "../protocol/Authorize.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
export class SilentIframeClient extends StandardInteractionClient {
    constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, nativeStorageImpl, nativeMessageHandler, correlationId) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.apiId = apiId;
        this.nativeStorage = nativeStorageImpl;
    }
    /**
     * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none or prompt=no_session
     * @param request
     */
    acquireToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentIframeClientAcquireToken, request.correlationId);
            // Check that we have some SSO data
            if (!request.loginHint &&
                !request.sid &&
                (!request.account || !request.account.username)) {
                this.logger.warning("No user hint provided. The authorization server may need more information to complete this request.");
            }
            // Check the prompt value
            const inputRequest = Object.assign({}, request);
            if (inputRequest.prompt) {
                if (inputRequest.prompt !== PromptValue.NONE &&
                    inputRequest.prompt !== PromptValue.NO_SESSION) {
                    this.logger.warning(`SilentIframeClient. Replacing invalid prompt ${inputRequest.prompt} with ${PromptValue.NONE}`);
                    inputRequest.prompt = PromptValue.NONE;
                }
            }
            else {
                inputRequest.prompt = PromptValue.NONE;
            }
            // Create silent request
            const silentRequest = yield invokeAsync(this.initializeAuthorizationRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, request.correlationId)(inputRequest, InteractionType.Silent);
            BrowserUtils.preconnect(silentRequest.authority);
            const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
            let authClient;
            try {
                // Initialize the client
                authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, request.correlationId)({
                    serverTelemetryManager,
                    requestAuthority: silentRequest.authority,
                    requestAzureCloudOptions: silentRequest.azureCloudOptions,
                    requestExtraQueryParameters: silentRequest.extraQueryParameters,
                    account: silentRequest.account,
                });
                return yield invokeAsync(this.silentTokenHelper.bind(this), PerformanceEvents.SilentIframeClientTokenHelper, this.logger, this.performanceClient, request.correlationId)(authClient, silentRequest);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(this.correlationId);
                    serverTelemetryManager.cacheFailedRequest(e);
                }
                if (!authClient ||
                    !(e instanceof AuthError) ||
                    e.errorCode !== BrowserConstants.INVALID_GRANT_ERROR) {
                    throw e;
                }
                this.performanceClient.addFields({
                    retryError: e.errorCode,
                }, this.correlationId);
                const retrySilentRequest = yield invokeAsync(this.initializeAuthorizationRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, request.correlationId)(inputRequest, InteractionType.Silent);
                return yield invokeAsync(this.silentTokenHelper.bind(this), PerformanceEvents.SilentIframeClientTokenHelper, this.logger, this.performanceClient, this.correlationId)(authClient, retrySilentRequest);
            }
        });
    }
    /**
     * Currently Unsupported
     */
    logout() {
        // Synchronous so we must reject
        return Promise.reject(createBrowserAuthError(BrowserAuthErrorCodes.silentLogoutUnsupported));
    }
    /**
     * Helper which acquires an authorization code silently using a hidden iframe from given url
     * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl
     * @param userRequestScopes
     */
    silentTokenHelper(authClient, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = request.correlationId;
            this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentIframeClientTokenHelper, correlationId);
            const pkceCodes = yield invokeAsync(generatePkceCodes, PerformanceEvents.GeneratePkceCodes, this.logger, this.performanceClient, this.correlationId)(this.performanceClient, this.logger, this.correlationId);
            const silentRequest = Object.assign(Object.assign({}, request), { codeChallenge: pkceCodes.challenge });
            // Create authorize request url
            const navigateUrl = yield invokeAsync(getAuthCodeRequestUrl, PerformanceEvents.GetAuthCodeUrl, this.logger, this.performanceClient, correlationId)(this.config, authClient.authority, Object.assign(Object.assign({}, silentRequest), { platformBroker: NativeMessageHandler.isPlatformBrokerAvailable(this.config, this.logger, this.nativeMessageHandler, silentRequest.authenticationScheme) }), this.logger, this.performanceClient);
            // Get the frame handle for the silent request
            const msalFrame = yield invokeAsync(initiateAuthRequest, PerformanceEvents.SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, correlationId)(navigateUrl, this.performanceClient, this.logger, correlationId, this.config.system.navigateFrameWait);
            const responseType = this.config.auth.OIDCOptions.serverResponseType;
            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const responseString = yield invokeAsync(monitorIframeForHash, PerformanceEvents.SilentHandlerMonitorIframeForHash, this.logger, this.performanceClient, correlationId)(msalFrame, this.config.system.iframeHashTimeout, this.config.system.pollIntervalMilliseconds, this.performanceClient, this.logger, correlationId, responseType);
            const serverParams = invoke(ResponseHandler.deserializeResponse, PerformanceEvents.DeserializeResponse, this.logger, this.performanceClient, this.correlationId)(responseString, responseType, this.logger);
            if (serverParams.accountId) {
                this.logger.verbose("Account id found in hash, calling WAM for token");
                if (!this.nativeMessageHandler) {
                    throw createBrowserAuthError(BrowserAuthErrorCodes.nativeConnectionNotEstablished);
                }
                const nativeInteractionClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.apiId, this.performanceClient, this.nativeMessageHandler, serverParams.accountId, this.browserStorage, correlationId);
                const { userRequestState } = ProtocolUtils.parseRequestState(this.browserCrypto, silentRequest.state);
                return invokeAsync(nativeInteractionClient.acquireToken.bind(nativeInteractionClient), PerformanceEvents.NativeInteractionClientAcquireToken, this.logger, this.performanceClient, correlationId)(Object.assign(Object.assign({}, silentRequest), { state: userRequestState, prompt: silentRequest.prompt || PromptValue.NONE }));
            }
            const authCodeRequest = Object.assign(Object.assign({}, silentRequest), { code: serverParams.code || "", codeVerifier: pkceCodes.verifier });
            // Create silent handler
            const interactionHandler = new InteractionHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.performanceClient);
            // Handle response from hash string
            return invokeAsync(interactionHandler.handleCodeResponse.bind(interactionHandler), PerformanceEvents.HandleCodeResponse, this.logger, this.performanceClient, correlationId)(serverParams, silentRequest);
        });
    }
}
