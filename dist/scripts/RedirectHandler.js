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
import { ServerError, createClientAuthError, ClientAuthErrorCodes, invokeAsync, PerformanceEvents, AuthorizeProtocol, } from "@azure/msal-common/browser";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { ApiId, TemporaryCacheKeys } from "../utils/BrowserConstants.js";
export class RedirectHandler {
    constructor(authCodeModule, storageImpl, authCodeRequest, logger, performanceClient) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }
    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    initiateAuthRequest(requestUrl, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("RedirectHandler.initiateAuthRequest called");
            // Navigate if valid URL
            if (requestUrl) {
                // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
                if (params.redirectStartPage) {
                    this.logger.verbose("RedirectHandler.initiateAuthRequest: redirectStartPage set, caching start page");
                    this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, params.redirectStartPage, true);
                }
                // Set interaction status in the library.
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, this.authCodeRequest.correlationId, true);
                this.browserStorage.cacheCodeRequest(this.authCodeRequest);
                this.logger.infoPii(`RedirectHandler.initiateAuthRequest: Navigate to: ${requestUrl}`);
                const navigationOptions = {
                    apiId: ApiId.acquireTokenRedirect,
                    timeout: params.redirectTimeout,
                    noHistory: false,
                };
                // If onRedirectNavigate is implemented, invoke it and provide requestUrl
                if (typeof params.onRedirectNavigate === "function") {
                    this.logger.verbose("RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback");
                    const navigate = params.onRedirectNavigate(requestUrl);
                    // Returning false from onRedirectNavigate will stop navigation
                    if (navigate !== false) {
                        this.logger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating");
                        yield params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                        return;
                    }
                    else {
                        this.logger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation");
                        return;
                    }
                }
                else {
                    // Navigate window to request URL
                    this.logger.verbose("RedirectHandler.initiateAuthRequest: Navigating window to navigate url");
                    yield params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                    return;
                }
            }
            else {
                // Throw error if request URL is empty.
                this.logger.info("RedirectHandler.initiateAuthRequest: Navigate url is empty");
                throw createBrowserAuthError(BrowserAuthErrorCodes.emptyNavigateUri);
            }
        });
    }
    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    handleCodeResponse(response, state) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("RedirectHandler.handleCodeResponse called");
            // Interaction is completed - remove interaction status.
            this.browserStorage.setInteractionInProgress(false);
            // Handle code response.
            const stateKey = this.browserStorage.generateStateKey(state);
            const requestState = this.browserStorage.getTemporaryCache(stateKey);
            if (!requestState) {
                throw createClientAuthError(ClientAuthErrorCodes.stateNotFound, "Cached State");
            }
            let authCodeResponse;
            try {
                authCodeResponse = AuthorizeProtocol.getAuthorizationCodePayload(response, requestState);
            }
            catch (e) {
                if (e instanceof ServerError &&
                    e.subError === BrowserAuthErrorCodes.userCancelled) {
                    // Translate server error caused by user closing native prompt to corresponding first class MSAL error
                    throw createBrowserAuthError(BrowserAuthErrorCodes.userCancelled);
                }
                else {
                    throw e;
                }
            }
            // Get cached items
            const nonceKey = this.browserStorage.generateNonceKey(requestState);
            const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
            // Assign code to request
            this.authCodeRequest.code = authCodeResponse.code;
            // Check for new cloud instance
            if (authCodeResponse.cloud_instance_host_name) {
                yield invokeAsync(this.authModule.updateAuthority.bind(this.authModule), PerformanceEvents.UpdateTokenEndpointAuthority, this.logger, this.performanceClient, this.authCodeRequest.correlationId)(authCodeResponse.cloud_instance_host_name, this.authCodeRequest.correlationId);
            }
            authCodeResponse.nonce = cachedNonce || undefined;
            authCodeResponse.state = requestState;
            // Add CCS parameters if available
            if (authCodeResponse.client_info) {
                this.authCodeRequest.clientInfo = authCodeResponse.client_info;
            }
            else {
                const cachedCcsCred = this.checkCcsCredentials();
                if (cachedCcsCred) {
                    this.authCodeRequest.ccsCredential = cachedCcsCred;
                }
            }
            // Acquire token with retrieved code.
            const tokenResponse = (yield this.authModule.acquireToken(this.authCodeRequest, authCodeResponse));
            this.browserStorage.cleanRequestByState(state);
            return tokenResponse;
        });
    }
    /**
     * Looks up ccs creds in the cache
     */
    checkCcsCredentials() {
        // Look up ccs credential in temp cache
        const cachedCcsCred = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true);
        if (cachedCcsCred) {
            try {
                return JSON.parse(cachedCcsCred);
            }
            catch (e) {
                this.authModule.logger.error("Cache credential could not be parsed");
                this.authModule.logger.errorPii(`Cache credential could not be parsed: ${cachedCcsCred}`);
            }
        }
        return null;
    }
}
