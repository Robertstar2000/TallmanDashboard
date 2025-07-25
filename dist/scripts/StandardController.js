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
import { CryptoOps } from "../crypto/CryptoOps.js";
import { InteractionRequiredAuthError, Constants, DEFAULT_CRYPTO_IMPLEMENTATION, AuthError, PerformanceEvents, PromptValue, getRequestThumbprint, AccountEntity, invokeAsync, createClientAuthError, ClientAuthErrorCodes, buildStaticAuthorityOptions, InteractionRequiredAuthErrorCodes, } from "@azure/msal-common/browser";
import { BrowserCacheManager, DEFAULT_BROWSER_CACHE_MANAGER, } from "../cache/BrowserCacheManager.js";
import * as AccountManager from "../cache/AccountManager.js";
import { InteractionType, ApiId, BrowserCacheLocation, TemporaryCacheKeys, CacheLookupPolicy, DEFAULT_REQUEST, BrowserConstants, iFrameRenewalPolicies, } from "../utils/BrowserConstants.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { EventType } from "../event/EventType.js";
import { EventHandler } from "../event/EventHandler.js";
import { PopupClient } from "../interaction_client/PopupClient.js";
import { RedirectClient } from "../interaction_client/RedirectClient.js";
import { SilentIframeClient } from "../interaction_client/SilentIframeClient.js";
import { SilentRefreshClient } from "../interaction_client/SilentRefreshClient.js";
import { TokenCache } from "../cache/TokenCache.js";
import { NativeInteractionClient } from "../interaction_client/NativeInteractionClient.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { NativeAuthError, isFatalNativeAuthError, } from "../error/NativeAuthError.js";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient.js";
import { SilentAuthCodeClient } from "../interaction_client/SilentAuthCodeClient.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { initializeSilentRequest } from "../request/RequestHelpers.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
function getAccountType(account) {
    const idTokenClaims = account === null || account === void 0 ? void 0 : account.idTokenClaims;
    if ((idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.tfp) || (idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.acr)) {
        return "B2C";
    }
    if (!(idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.tid)) {
        return undefined;
    }
    else if ((idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.tid) === "9188040d-6c67-4c5b-b112-36a304b66dad") {
        return "MSA";
    }
    return "AAD";
}
function preflightCheck(initialized, performanceEvent) {
    try {
        BrowserUtils.preflightCheck(initialized);
    }
    catch (e) {
        performanceEvent.end({ success: false }, e);
        throw e;
    }
}
export class StandardController {
    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param configuration Object for the MSAL PublicClientApplication instance
     */
    constructor(operatingContext) {
        this.operatingContext = operatingContext;
        this.isBrowserEnvironment =
            this.operatingContext.isBrowserEnvironment();
        // Set the configuration.
        this.config = operatingContext.getConfig();
        this.initialized = false;
        // Initialize logger
        this.logger = this.operatingContext.getLogger();
        // Initialize the network module class.
        this.networkClient = this.config.system.networkClient;
        // Initialize the navigation client class.
        this.navigationClient = this.config.system.navigationClient;
        // Initialize redirectResponse Map
        this.redirectResponse = new Map();
        // Initial hybrid spa map
        this.hybridAuthCodeResponses = new Map();
        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;
        // Initialize the crypto class.
        this.browserCrypto = this.isBrowserEnvironment
            ? new CryptoOps(this.logger, this.performanceClient)
            : DEFAULT_CRYPTO_IMPLEMENTATION;
        this.eventHandler = new EventHandler(this.logger);
        // Initialize the browser storage class.
        this.browserStorage = this.isBrowserEnvironment
            ? new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler, buildStaticAuthorityOptions(this.config.auth))
            : DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger, this.performanceClient, this.eventHandler);
        // initialize in memory storage for native flows
        const nativeCacheOptions = {
            cacheLocation: BrowserCacheLocation.MemoryStorage,
            temporaryCacheLocation: BrowserCacheLocation.MemoryStorage,
            storeAuthStateInCookie: false,
            secureCookies: false,
            cacheMigrationEnabled: false,
            claimsBasedCachingEnabled: false,
        };
        this.nativeInternalStorage = new BrowserCacheManager(this.config.auth.clientId, nativeCacheOptions, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler);
        // Initialize the token cache
        this.tokenCache = new TokenCache(this.config, this.browserStorage, this.logger, this.browserCrypto);
        this.activeSilentTokenRequests = new Map();
        // Register listener functions
        this.trackPageVisibility = this.trackPageVisibility.bind(this);
        // Register listener functions
        this.trackPageVisibilityWithMeasurement =
            this.trackPageVisibilityWithMeasurement.bind(this);
    }
    static createController(operatingContext, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new StandardController(operatingContext);
            yield controller.initialize(request);
            return controller;
        });
    }
    trackPageVisibility(correlationId) {
        if (!correlationId) {
            return;
        }
        this.logger.info("Perf: Visibility change detected");
        this.performanceClient.incrementFields({ visibilityChangeCount: 1 }, correlationId);
    }
    /**
     * Initializer function to perform async startup tasks such as connecting to WAM extension
     * @param request {?InitializeApplicationRequest} correlation id
     */
    initialize(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("initialize called");
            if (this.initialized) {
                this.logger.info("initialize has already been called, exiting early.");
                return;
            }
            if (!this.isBrowserEnvironment) {
                this.logger.info("in non-browser environment, exiting early.");
                this.initialized = true;
                this.eventHandler.emitEvent(EventType.INITIALIZE_END);
                return;
            }
            const initCorrelationId = (request === null || request === void 0 ? void 0 : request.correlationId) || this.getRequestCorrelationId();
            const allowPlatformBroker = this.config.system.allowPlatformBroker;
            const initMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.InitializeClientApplication, initCorrelationId);
            this.eventHandler.emitEvent(EventType.INITIALIZE_START);
            yield invokeAsync(this.browserStorage.initialize.bind(this.browserStorage), PerformanceEvents.InitializeCache, this.logger, this.performanceClient, initCorrelationId)(initCorrelationId);
            if (allowPlatformBroker) {
                try {
                    this.nativeExtensionProvider =
                        yield NativeMessageHandler.createProvider(this.logger, this.config.system.nativeBrokerHandshakeTimeout, this.performanceClient);
                }
                catch (e) {
                    this.logger.verbose(e);
                }
            }
            if (!this.config.cache.claimsBasedCachingEnabled) {
                this.logger.verbose("Claims-based caching is disabled. Clearing the previous cache with claims");
                yield invokeAsync(this.browserStorage.clearTokensAndKeysWithClaims.bind(this.browserStorage), PerformanceEvents.ClearTokensAndKeysWithClaims, this.logger, this.performanceClient, initCorrelationId)(this.performanceClient, initCorrelationId);
            }
            this.config.system.asyncPopups &&
                (yield this.preGeneratePkceCodes(initCorrelationId));
            this.initialized = true;
            this.eventHandler.emitEvent(EventType.INITIALIZE_END);
            initMeasurement.end({
                allowPlatformBroker: allowPlatformBroker,
                success: true,
            });
        });
    }
    // #region Redirect Flow
    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns Token response or null. If the return value is null, then no auth redirect was detected.
     */
    handleRedirectPromise(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("handleRedirectPromise called");
            // Block token acquisition before initialize has been called
            BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
            if (this.isBrowserEnvironment) {
                /**
                 * Store the promise on the PublicClientApplication instance if this is the first invocation of handleRedirectPromise,
                 * otherwise return the promise from the first invocation. Prevents race conditions when handleRedirectPromise is called
                 * several times concurrently.
                 */
                const redirectResponseKey = hash || "";
                let response = this.redirectResponse.get(redirectResponseKey);
                if (typeof response === "undefined") {
                    response = this.handleRedirectPromiseInternal(hash);
                    this.redirectResponse.set(redirectResponseKey, response);
                    this.logger.verbose("handleRedirectPromise has been called for the first time, storing the promise");
                }
                else {
                    this.logger.verbose("handleRedirectPromise has been called previously, returning the result from the first call");
                }
                return response;
            }
            this.logger.verbose("handleRedirectPromise returns null, not browser environment");
            return null;
        });
    }
    /**
     * The internal details of handleRedirectPromise. This is separated out to a helper to allow handleRedirectPromise to memoize requests
     * @param hash
     * @returns
     */
    handleRedirectPromiseInternal(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const loggedInAccounts = this.getAllAccounts();
            const request = this.browserStorage.getCachedNativeRequest();
            const useNative = request &&
                NativeMessageHandler.isPlatformBrokerAvailable(this.config, this.logger, this.nativeExtensionProvider) &&
                this.nativeExtensionProvider &&
                !hash;
            const correlationId = useNative
                ? request === null || request === void 0 ? void 0 : request.correlationId
                : this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, true) || "";
            const rootMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenRedirect, correlationId);
            this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
            let redirectResponse;
            if (useNative && this.nativeExtensionProvider) {
                this.logger.trace("handleRedirectPromise - acquiring token from native platform");
                const nativeClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.handleRedirectPromise, this.performanceClient, this.nativeExtensionProvider, request.accountId, this.nativeInternalStorage, request.correlationId);
                redirectResponse = invokeAsync(nativeClient.handleRedirectPromise.bind(nativeClient), PerformanceEvents.HandleNativeRedirectPromiseMeasurement, this.logger, this.performanceClient, rootMeasurement.event.correlationId)(this.performanceClient, rootMeasurement.event.correlationId);
            }
            else {
                this.logger.trace("handleRedirectPromise - acquiring token from web flow");
                const redirectClient = this.createRedirectClient(correlationId);
                redirectResponse = invokeAsync(redirectClient.handleRedirectPromise.bind(redirectClient), PerformanceEvents.HandleRedirectPromiseMeasurement, this.logger, this.performanceClient, rootMeasurement.event.correlationId)(hash, rootMeasurement);
            }
            return redirectResponse
                .then((result) => {
                if (result) {
                    // Emit login event if number of accounts change
                    const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
                    if (isLoggingIn) {
                        this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect, result);
                        this.logger.verbose("handleRedirectResponse returned result, login success");
                    }
                    else {
                        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Redirect, result);
                        this.logger.verbose("handleRedirectResponse returned result, acquire token success");
                    }
                    rootMeasurement.end({
                        success: true,
                        accountType: getAccountType(result.account),
                    });
                }
                else {
                    /*
                     * Instrument an event only if an error code is set. Otherwise, discard it when the redirect response
                     * is empty and the error code is missing.
                     */
                    if (rootMeasurement.event.errorCode) {
                        rootMeasurement.end({ success: false });
                    }
                    else {
                        rootMeasurement.discard();
                    }
                }
                this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                return result;
            })
                .catch((e) => {
                const eventError = e;
                // Emit login event if there is an account
                if (loggedInAccounts.length > 0) {
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, eventError);
                }
                else {
                    this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, eventError);
                }
                this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                rootMeasurement.end({
                    success: false,
                }, eventError);
                throw e;
            });
        });
    }
    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
     * the page, so any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    acquireTokenRedirect(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Preflight request
            const correlationId = this.getRequestCorrelationId(request);
            this.logger.verbose("acquireTokenRedirect called", correlationId);
            const atrMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenPreRedirect, correlationId);
            atrMeasurement.add({
                accountType: getAccountType(request.account),
                scenarioId: request.scenarioId,
            });
            // Override on request only if set, as onRedirectNavigate field is deprecated
            const onRedirectNavigateCb = request.onRedirectNavigate;
            if (onRedirectNavigateCb) {
                request.onRedirectNavigate = (url) => {
                    const navigate = typeof onRedirectNavigateCb === "function"
                        ? onRedirectNavigateCb(url)
                        : undefined;
                    if (navigate !== false) {
                        atrMeasurement.end({ success: true });
                    }
                    else {
                        atrMeasurement.discard();
                    }
                    return navigate;
                };
            }
            else {
                const configOnRedirectNavigateCb = this.config.auth.onRedirectNavigate;
                this.config.auth.onRedirectNavigate = (url) => {
                    const navigate = typeof configOnRedirectNavigateCb === "function"
                        ? configOnRedirectNavigateCb(url)
                        : undefined;
                    if (navigate !== false) {
                        atrMeasurement.end({ success: true });
                    }
                    else {
                        atrMeasurement.discard();
                    }
                    return navigate;
                };
            }
            // If logged in, emit acquire token events
            const isLoggedIn = this.getAllAccounts().length > 0;
            try {
                BrowserUtils.redirectPreflightCheck(this.initialized, this.config);
                this.browserStorage.setInteractionInProgress(true);
                if (isLoggedIn) {
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect, request);
                }
                else {
                    this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect, request);
                }
                let result;
                if (this.nativeExtensionProvider &&
                    this.canUsePlatformBroker(request)) {
                    const nativeClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenRedirect, this.performanceClient, this.nativeExtensionProvider, this.getNativeAccountId(request), this.nativeInternalStorage, correlationId);
                    result = nativeClient
                        .acquireTokenRedirect(request, atrMeasurement)
                        .catch((e) => {
                        if (e instanceof NativeAuthError &&
                            isFatalNativeAuthError(e)) {
                            this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                            const redirectClient = this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        }
                        else if (e instanceof InteractionRequiredAuthError) {
                            this.logger.verbose("acquireTokenRedirect - Resolving interaction required error thrown by native broker by falling back to web flow");
                            const redirectClient = this.createRedirectClient(correlationId);
                            return redirectClient.acquireToken(request);
                        }
                        this.browserStorage.setInteractionInProgress(false);
                        throw e;
                    });
                }
                else {
                    const redirectClient = this.createRedirectClient(correlationId);
                    result = redirectClient.acquireToken(request);
                }
                return yield result;
            }
            catch (e) {
                atrMeasurement.end({ success: false }, e);
                if (isLoggedIn) {
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
                }
                else {
                    this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
                }
                throw e;
            }
        });
    }
    // #endregion
    // #region Popup Flow
    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenPopup(request) {
        const correlationId = this.getRequestCorrelationId(request);
        const atPopupMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenPopup, correlationId);
        atPopupMeasurement.add({
            scenarioId: request.scenarioId,
            accountType: getAccountType(request.account),
        });
        try {
            this.logger.verbose("acquireTokenPopup called", correlationId);
            preflightCheck(this.initialized, atPopupMeasurement);
            this.browserStorage.setInteractionInProgress(true);
        }
        catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }
        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, request);
        }
        else {
            this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup, request);
        }
        let result;
        const pkce = this.getPreGeneratedPkceCodes(correlationId);
        if (this.canUsePlatformBroker(request)) {
            result = this.acquireTokenNative(Object.assign(Object.assign({}, request), { correlationId }), ApiId.acquireTokenPopup)
                .then((response) => {
                this.browserStorage.setInteractionInProgress(false);
                atPopupMeasurement.end({
                    success: true,
                    isNativeBroker: true,
                    accountType: getAccountType(response.account),
                });
                return response;
            })
                .catch((e) => {
                if (e instanceof NativeAuthError &&
                    isFatalNativeAuthError(e)) {
                    this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                    const popupClient = this.createPopupClient(correlationId);
                    return popupClient.acquireToken(request, pkce);
                }
                else if (e instanceof InteractionRequiredAuthError) {
                    this.logger.verbose("acquireTokenPopup - Resolving interaction required error thrown by native broker by falling back to web flow");
                    const popupClient = this.createPopupClient(correlationId);
                    return popupClient.acquireToken(request, pkce);
                }
                this.browserStorage.setInteractionInProgress(false);
                throw e;
            });
        }
        else {
            const popupClient = this.createPopupClient(correlationId);
            result = popupClient.acquireToken(request, pkce);
        }
        return result
            .then((result) => {
            /*
             *  If logged in, emit acquire token events
             */
            const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
            if (isLoggingIn) {
                this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Popup, result);
            }
            else {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup, result);
            }
            atPopupMeasurement.end({
                success: true,
                accessTokenSize: result.accessToken.length,
                idTokenSize: result.idToken.length,
                accountType: getAccountType(result.account),
            });
            return result;
        })
            .catch((e) => {
            if (loggedInAccounts.length > 0) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup, null, e);
            }
            else {
                this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Popup, null, e);
            }
            atPopupMeasurement.end({
                success: false,
            }, e);
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        })
            .finally(() => this.config.system.asyncPopups &&
            this.preGeneratePkceCodes(correlationId));
    }
    trackPageVisibilityWithMeasurement() {
        const measurement = this.ssoSilentMeasurement ||
            this.acquireTokenByCodeAsyncMeasurement;
        if (!measurement) {
            return;
        }
        this.logger.info("Perf: Visibility change detected in ", measurement.event.name);
        measurement.increment({
            visibilityChangeCount: 1,
        });
    }
    // #endregion
    // #region Silent Flow
    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
     * - Any browser using a form of Intelligent Tracking Prevention
     * - If there is not an established session with the service
     *
     * In these cases, the request must be done inside a popup or full frame redirect.
     *
     * For the cases where interaction is required, you cannot send a request with prompt=none.
     *
     * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
     * you session on the server still exists.
     * @param request {@link SsoSilentRequest}
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    ssoSilent(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const correlationId = this.getRequestCorrelationId(request);
            const validRequest = Object.assign(Object.assign({}, request), { 
                // will be PromptValue.NONE or PromptValue.NO_SESSION
                prompt: request.prompt, correlationId: correlationId });
            this.ssoSilentMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.SsoSilent, correlationId);
            (_a = this.ssoSilentMeasurement) === null || _a === void 0 ? void 0 : _a.add({
                scenarioId: request.scenarioId,
                accountType: getAccountType(request.account),
            });
            preflightCheck(this.initialized, this.ssoSilentMeasurement);
            (_b = this.ssoSilentMeasurement) === null || _b === void 0 ? void 0 : _b.increment({
                visibilityChangeCount: 0,
            });
            document.addEventListener("visibilitychange", this.trackPageVisibilityWithMeasurement);
            this.logger.verbose("ssoSilent called", correlationId);
            this.eventHandler.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, validRequest);
            let result;
            if (this.canUsePlatformBroker(validRequest)) {
                result = this.acquireTokenNative(validRequest, ApiId.ssoSilent).catch((e) => {
                    // If native token acquisition fails for availability reasons fallback to standard flow
                    if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                        this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                        const silentIframeClient = this.createSilentIframeClient(validRequest.correlationId);
                        return silentIframeClient.acquireToken(validRequest);
                    }
                    throw e;
                });
            }
            else {
                const silentIframeClient = this.createSilentIframeClient(validRequest.correlationId);
                result = silentIframeClient.acquireToken(validRequest);
            }
            return result
                .then((response) => {
                var _a;
                this.eventHandler.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, response);
                (_a = this.ssoSilentMeasurement) === null || _a === void 0 ? void 0 : _a.end({
                    success: true,
                    isNativeBroker: response.fromNativeBroker,
                    accessTokenSize: response.accessToken.length,
                    idTokenSize: response.idToken.length,
                    accountType: getAccountType(response.account),
                });
                return response;
            })
                .catch((e) => {
                var _a;
                this.eventHandler.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
                (_a = this.ssoSilentMeasurement) === null || _a === void 0 ? void 0 : _a.end({
                    success: false,
                }, e);
                throw e;
            })
                .finally(() => {
                document.removeEventListener("visibilitychange", this.trackPageVisibilityWithMeasurement);
            });
        });
    }
    /**
     * This function redeems an authorization code (passed as code) from the eSTS token endpoint.
     * This authorization code should be acquired server-side using a confidential client to acquire a spa_code.
     * This API is not indended for normal authorization code acquisition and redemption.
     *
     * Redemption of this authorization code will not require PKCE, as it was acquired by a confidential client.
     *
     * @param request {@link AuthorizationCodeRequest}
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenByCode(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = this.getRequestCorrelationId(request);
            this.logger.trace("acquireTokenByCode called", correlationId);
            const atbcMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenByCode, correlationId);
            preflightCheck(this.initialized, atbcMeasurement);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_BY_CODE_START, InteractionType.Silent, request);
            atbcMeasurement.add({ scenarioId: request.scenarioId });
            try {
                if (request.code && request.nativeAccountId) {
                    // Throw error in case server returns both spa_code and spa_accountid in exchange for auth code.
                    throw createBrowserAuthError(BrowserAuthErrorCodes.spaCodeAndNativeAccountIdPresent);
                }
                else if (request.code) {
                    const hybridAuthCode = request.code;
                    let response = this.hybridAuthCodeResponses.get(hybridAuthCode);
                    if (!response) {
                        this.logger.verbose("Initiating new acquireTokenByCode request", correlationId);
                        response = this.acquireTokenByCodeAsync(Object.assign(Object.assign({}, request), { correlationId }))
                            .then((result) => {
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_BY_CODE_SUCCESS, InteractionType.Silent, result);
                            this.hybridAuthCodeResponses.delete(hybridAuthCode);
                            atbcMeasurement.end({
                                success: true,
                                isNativeBroker: result.fromNativeBroker,
                                accessTokenSize: result.accessToken.length,
                                idTokenSize: result.idToken.length,
                                accountType: getAccountType(result.account),
                            });
                            return result;
                        })
                            .catch((error) => {
                            this.hybridAuthCodeResponses.delete(hybridAuthCode);
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_BY_CODE_FAILURE, InteractionType.Silent, null, error);
                            atbcMeasurement.end({
                                success: false,
                            }, error);
                            throw error;
                        });
                        this.hybridAuthCodeResponses.set(hybridAuthCode, response);
                    }
                    else {
                        this.logger.verbose("Existing acquireTokenByCode request found", correlationId);
                        atbcMeasurement.discard();
                    }
                    return yield response;
                }
                else if (request.nativeAccountId) {
                    if (this.canUsePlatformBroker(request, request.nativeAccountId)) {
                        const result = yield this.acquireTokenNative(Object.assign(Object.assign({}, request), { correlationId }), ApiId.acquireTokenByCode, request.nativeAccountId).catch((e) => {
                            // If native token acquisition fails for availability reasons fallback to standard flow
                            if (e instanceof NativeAuthError &&
                                isFatalNativeAuthError(e)) {
                                this.nativeExtensionProvider = undefined; // If extension gets uninstalled during session prevent future requests from continuing to attempt
                            }
                            throw e;
                        });
                        atbcMeasurement.end({
                            accountType: getAccountType(result.account),
                            success: true,
                        });
                        return result;
                    }
                    else {
                        throw createBrowserAuthError(BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform);
                    }
                }
                else {
                    throw createBrowserAuthError(BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired);
                }
            }
            catch (e) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_BY_CODE_FAILURE, InteractionType.Silent, null, e);
                atbcMeasurement.end({
                    success: false,
                }, e);
                throw e;
            }
        });
    }
    /**
     * Creates a SilentAuthCodeClient to redeem an authorization code.
     * @param request
     * @returns Result of the operation to redeem the authorization code
     */
    acquireTokenByCodeAsync(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.logger.trace("acquireTokenByCodeAsync called", request.correlationId);
            this.acquireTokenByCodeAsyncMeasurement =
                this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenByCodeAsync, request.correlationId);
            (_a = this.acquireTokenByCodeAsyncMeasurement) === null || _a === void 0 ? void 0 : _a.increment({
                visibilityChangeCount: 0,
            });
            document.addEventListener("visibilitychange", this.trackPageVisibilityWithMeasurement);
            const silentAuthCodeClient = this.createSilentAuthCodeClient(request.correlationId);
            const silentTokenResult = yield silentAuthCodeClient
                .acquireToken(request)
                .then((response) => {
                var _a;
                (_a = this.acquireTokenByCodeAsyncMeasurement) === null || _a === void 0 ? void 0 : _a.end({
                    success: true,
                    fromCache: response.fromCache,
                    isNativeBroker: response.fromNativeBroker,
                });
                return response;
            })
                .catch((tokenRenewalError) => {
                var _a;
                (_a = this.acquireTokenByCodeAsyncMeasurement) === null || _a === void 0 ? void 0 : _a.end({
                    success: false,
                }, tokenRenewalError);
                throw tokenRenewalError;
            })
                .finally(() => {
                document.removeEventListener("visibilitychange", this.trackPageVisibilityWithMeasurement);
            });
            return silentTokenResult;
        });
    }
    /**
     * Attempt to acquire an access token from the cache
     * @param silentCacheClient SilentCacheClient
     * @param commonRequest CommonSilentFlowRequest
     * @param silentRequest SilentRequest
     * @returns A promise that, when resolved, returns the access token
     */
    acquireTokenFromCache(commonRequest, cacheLookupPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.AcquireTokenFromCache, commonRequest.correlationId);
            switch (cacheLookupPolicy) {
                case CacheLookupPolicy.Default:
                case CacheLookupPolicy.AccessToken:
                case CacheLookupPolicy.AccessTokenAndRefreshToken:
                    const silentCacheClient = this.createSilentCacheClient(commonRequest.correlationId);
                    return invokeAsync(silentCacheClient.acquireToken.bind(silentCacheClient), PerformanceEvents.SilentCacheClientAcquireToken, this.logger, this.performanceClient, commonRequest.correlationId)(commonRequest);
                default:
                    throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
            }
        });
    }
    /**
     * Attempt to acquire an access token via a refresh token
     * @param commonRequest CommonSilentFlowRequest
     * @param cacheLookupPolicy CacheLookupPolicy
     * @returns A promise that, when resolved, returns the access token
     */
    acquireTokenByRefreshToken(commonRequest, cacheLookupPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.AcquireTokenByRefreshToken, commonRequest.correlationId);
            switch (cacheLookupPolicy) {
                case CacheLookupPolicy.Default:
                case CacheLookupPolicy.AccessTokenAndRefreshToken:
                case CacheLookupPolicy.RefreshToken:
                case CacheLookupPolicy.RefreshTokenAndNetwork:
                    const silentRefreshClient = this.createSilentRefreshClient(commonRequest.correlationId);
                    return invokeAsync(silentRefreshClient.acquireToken.bind(silentRefreshClient), PerformanceEvents.SilentRefreshClientAcquireToken, this.logger, this.performanceClient, commonRequest.correlationId)(commonRequest);
                default:
                    throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
            }
        });
    }
    /**
     * Attempt to acquire an access token via an iframe
     * @param request CommonSilentFlowRequest
     * @returns A promise that, when resolved, returns the access token
     */
    acquireTokenBySilentIframe(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.AcquireTokenBySilentIframe, request.correlationId);
            const silentIframeClient = this.createSilentIframeClient(request.correlationId);
            return invokeAsync(silentIframeClient.acquireToken.bind(silentIframeClient), PerformanceEvents.SilentIframeClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(request);
        });
    }
    // #endregion
    // #region Logout
    /**
     * Deprecated logout function. Use logoutRedirect or logoutPopup instead
     * @param logoutRequest
     * @deprecated
     */
    logout(logoutRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = this.getRequestCorrelationId(logoutRequest);
            this.logger.warning("logout API is deprecated and will be removed in msal-browser v3.0.0. Use logoutRedirect instead.", correlationId);
            return this.logoutRedirect(Object.assign({ correlationId }, logoutRequest));
        });
    }
    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    logoutRedirect(logoutRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = this.getRequestCorrelationId(logoutRequest);
            BrowserUtils.redirectPreflightCheck(this.initialized, this.config);
            this.browserStorage.setInteractionInProgress(true);
            const redirectClient = this.createRedirectClient(correlationId);
            return redirectClient.logout(logoutRequest);
        });
    }
    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logoutPopup(logoutRequest) {
        try {
            const correlationId = this.getRequestCorrelationId(logoutRequest);
            BrowserUtils.preflightCheck(this.initialized);
            this.browserStorage.setInteractionInProgress(true);
            const popupClient = this.createPopupClient(correlationId);
            return popupClient.logout(logoutRequest);
        }
        catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }
    }
    /**
     * Creates a cache interaction client to clear broswer cache.
     * @param logoutRequest
     */
    clearCache(logoutRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isBrowserEnvironment) {
                this.logger.info("in non-browser environment, returning early.");
                return;
            }
            const correlationId = this.getRequestCorrelationId(logoutRequest);
            const cacheClient = this.createSilentCacheClient(correlationId);
            return cacheClient.logout(logoutRequest);
        });
    }
    // #endregion
    // #region Account APIs
    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter) {
        return AccountManager.getAllAccounts(this.logger, this.browserStorage, this.isBrowserEnvironment, accountFilter);
    }
    /**
     * Returns the first account found in the cache that matches the account filter passed in.
     * @param accountFilter
     * @returns The first account found in the cache matching the provided filter or null if no account could be found.
     */
    getAccount(accountFilter) {
        return AccountManager.getAccount(accountFilter, this.logger, this.browserStorage);
    }
    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @param username
     * @returns The account object stored in MSAL
     */
    getAccountByUsername(username) {
        return AccountManager.getAccountByUsername(username, this.logger, this.browserStorage);
    }
    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param homeAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByHomeId(homeAccountId) {
        return AccountManager.getAccountByHomeId(homeAccountId, this.logger, this.browserStorage);
    }
    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param localAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByLocalId(localAccountId) {
        return AccountManager.getAccountByLocalId(localAccountId, this.logger, this.browserStorage);
    }
    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account) {
        AccountManager.setActiveAccount(account, this.browserStorage);
    }
    /**
     * Gets the currently active account
     */
    getActiveAccount() {
        return AccountManager.getActiveAccount(this.browserStorage);
    }
    // #endregion
    /**
     * Hydrates the cache with the tokens from an AuthenticationResult
     * @param result
     * @param request
     * @returns
     */
    hydrateCache(result, request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("hydrateCache called");
            // Account gets saved to browser storage regardless of native or not
            const accountEntity = AccountEntity.createFromAccountInfo(result.account, result.cloudGraphHostName, result.msGraphHost);
            yield this.browserStorage.setAccount(accountEntity, result.correlationId);
            if (result.fromNativeBroker) {
                this.logger.verbose("Response was from native broker, storing in-memory");
                // Tokens from native broker are stored in-memory
                return this.nativeInternalStorage.hydrateCache(result, request);
            }
            else {
                return this.browserStorage.hydrateCache(result, request);
            }
        });
    }
    // #region Helpers
    /**
     * Acquire a token from native device (e.g. WAM)
     * @param request
     */
    acquireTokenNative(request, apiId, accountId, cacheLookupPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("acquireTokenNative called");
            if (!this.nativeExtensionProvider) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.nativeConnectionNotEstablished);
            }
            const nativeClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, apiId, this.performanceClient, this.nativeExtensionProvider, accountId || this.getNativeAccountId(request), this.nativeInternalStorage, request.correlationId);
            return nativeClient.acquireToken(request, cacheLookupPolicy);
        });
    }
    /**
     * Returns boolean indicating if this request can use the platform broker
     * @param request
     */
    canUsePlatformBroker(request, accountId) {
        this.logger.trace("canUsePlatformBroker called");
        if (!NativeMessageHandler.isPlatformBrokerAvailable(this.config, this.logger, this.nativeExtensionProvider, request.authenticationScheme)) {
            this.logger.trace("canUsePlatformBroker: isPlatformBrokerAvailable returned false, returning false");
            return false;
        }
        if (request.prompt) {
            switch (request.prompt) {
                case PromptValue.NONE:
                case PromptValue.CONSENT:
                case PromptValue.LOGIN:
                    this.logger.trace("canUsePlatformBroker: prompt is compatible with platform broker flow");
                    break;
                default:
                    this.logger.trace(`canUsePlatformBroker: prompt = ${request.prompt} is not compatible with platform broker flow, returning false`);
                    return false;
            }
        }
        if (!accountId && !this.getNativeAccountId(request)) {
            this.logger.trace("canUsePlatformBroker: nativeAccountId is not available, returning false");
            return false;
        }
        return true;
    }
    /**
     * Get the native accountId from the account
     * @param request
     * @returns
     */
    getNativeAccountId(request) {
        const account = request.account ||
            this.getAccount({
                loginHint: request.loginHint,
                sid: request.sid,
            }) ||
            this.getActiveAccount();
        return (account && account.nativeAccountId) || "";
    }
    /**
     * Returns new instance of the Popup Interaction Client
     * @param correlationId
     */
    createPopupClient(correlationId) {
        return new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeInternalStorage, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Returns new instance of the Redirect Interaction Client
     * @param correlationId
     */
    createRedirectClient(correlationId) {
        return new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeInternalStorage, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Returns new instance of the Silent Iframe Interaction Client
     * @param correlationId
     */
    createSilentIframeClient(correlationId) {
        return new SilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.ssoSilent, this.performanceClient, this.nativeInternalStorage, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Returns new instance of the Silent Cache Interaction Client
     */
    createSilentCacheClient(correlationId) {
        return new SilentCacheClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Returns new instance of the Silent Refresh Interaction Client
     */
    createSilentRefreshClient(correlationId) {
        return new SilentRefreshClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Returns new instance of the Silent AuthCode Interaction Client
     */
    createSilentAuthCodeClient(correlationId) {
        return new SilentAuthCodeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenByCode, this.performanceClient, this.nativeExtensionProvider, correlationId);
    }
    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback, eventTypes) {
        return this.eventHandler.addEventCallback(callback, eventTypes);
    }
    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId) {
        this.eventHandler.removeEventCallback(callbackId);
    }
    /**
     * Registers a callback to receive performance events.
     *
     * @param {PerformanceCallbackFunction} callback
     * @returns {string}
     */
    addPerformanceCallback(callback) {
        BrowserUtils.blockNonBrowserEnvironment();
        return this.performanceClient.addPerformanceCallback(callback);
    }
    /**
     * Removes a callback registered with addPerformanceCallback.
     *
     * @param {string} callbackId
     * @returns {boolean}
     */
    removePerformanceCallback(callbackId) {
        return this.performanceClient.removePerformanceCallback(callbackId);
    }
    /**
     * Adds event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     * @deprecated These events will be raised by default and this method will be removed in a future major version.
     */
    enableAccountStorageEvents() {
        if (this.config.cache.cacheLocation !==
            BrowserCacheLocation.LocalStorage) {
            this.logger.info("Account storage events are only available when cacheLocation is set to localStorage");
            return;
        }
        this.eventHandler.subscribeCrossTab();
    }
    /**
     * Removes event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     * @deprecated These events will be raised by default and this method will be removed in a future major version.
     */
    disableAccountStorageEvents() {
        if (this.config.cache.cacheLocation !==
            BrowserCacheLocation.LocalStorage) {
            this.logger.info("Account storage events are only available when cacheLocation is set to localStorage");
            return;
        }
        this.eventHandler.unsubscribeCrossTab();
    }
    /**
     * Gets the token cache for the application.
     */
    getTokenCache() {
        return this.tokenCache;
    }
    /**
     * Returns the logger instance
     */
    getLogger() {
        return this.logger;
    }
    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger) {
        this.logger = logger;
    }
    /**
     * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
     * @param sku
     * @param version
     */
    initializeWrapperLibrary(sku, version) {
        // Validate the SKU passed in is one we expect
        this.browserStorage.setWrapperMetadata(sku, version);
    }
    /**
     * Sets navigation client
     * @param navigationClient
     */
    setNavigationClient(navigationClient) {
        this.navigationClient = navigationClient;
    }
    /**
     * Returns the configuration object
     */
    getConfiguration() {
        return this.config;
    }
    /**
     * Returns the performance client
     */
    getPerformanceClient() {
        return this.performanceClient;
    }
    /**
     * Returns the browser env indicator
     */
    isBrowserEnv() {
        return this.isBrowserEnvironment;
    }
    /**
     * Generates a correlation id for a request if none is provided.
     *
     * @protected
     * @param {?Partial<BaseAuthRequest>} [request]
     * @returns {string}
     */
    getRequestCorrelationId(request) {
        if (request === null || request === void 0 ? void 0 : request.correlationId) {
            return request.correlationId;
        }
        if (this.isBrowserEnvironment) {
            return createNewGuid();
        }
        /*
         * Included for fallback for non-browser environments,
         * and to ensure this method always returns a string.
         */
        return Constants.EMPTY_STRING;
    }
    // #endregion
    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    loginRedirect(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = this.getRequestCorrelationId(request);
            this.logger.verbose("loginRedirect called", correlationId);
            return this.acquireTokenRedirect(Object.assign({ correlationId }, (request || DEFAULT_REQUEST)));
        });
    }
    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    loginPopup(request) {
        const correlationId = this.getRequestCorrelationId(request);
        this.logger.verbose("loginPopup called", correlationId);
        return this.acquireTokenPopup(Object.assign({ correlationId }, (request || DEFAULT_REQUEST)));
    }
    /**
     * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
     *
     * @param {@link (SilentRequest:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    acquireTokenSilent(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = this.getRequestCorrelationId(request);
            const atsMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);
            atsMeasurement.add({
                cacheLookupPolicy: request.cacheLookupPolicy,
                scenarioId: request.scenarioId,
            });
            preflightCheck(this.initialized, atsMeasurement);
            this.logger.verbose("acquireTokenSilent called", correlationId);
            const account = request.account || this.getActiveAccount();
            if (!account) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.noAccountError);
            }
            atsMeasurement.add({ accountType: getAccountType(account) });
            return this.acquireTokenSilentDeduped(request, account, correlationId)
                .then((result) => {
                atsMeasurement.end({
                    success: true,
                    fromCache: result.fromCache,
                    isNativeBroker: result.fromNativeBroker,
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                });
                return Object.assign(Object.assign({}, result), { state: request.state, correlationId: correlationId });
            })
                .catch((error) => {
                if (error instanceof AuthError) {
                    // Ensures PWB scenarios can correctly match request to response
                    error.setCorrelationId(correlationId);
                }
                atsMeasurement.end({
                    success: false,
                }, error);
                throw error;
            });
        });
    }
    /**
     * Checks if identical request is already in flight and returns reference to the existing promise or fires off a new one if this is the first
     * @param request
     * @param account
     * @param correlationId
     * @returns
     */
    acquireTokenSilentDeduped(request, account, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const thumbprint = getRequestThumbprint(this.config.auth.clientId, Object.assign(Object.assign({}, request), { authority: request.authority || this.config.auth.authority, correlationId: correlationId }), account.homeAccountId);
            const silentRequestKey = JSON.stringify(thumbprint);
            const inProgressRequest = this.activeSilentTokenRequests.get(silentRequestKey);
            if (typeof inProgressRequest === "undefined") {
                this.logger.verbose("acquireTokenSilent called for the first time, storing active request", correlationId);
                this.performanceClient.addFields({ deduped: false }, correlationId);
                const activeRequest = invokeAsync(this.acquireTokenSilentAsync.bind(this), PerformanceEvents.AcquireTokenSilentAsync, this.logger, this.performanceClient, correlationId)(Object.assign(Object.assign({}, request), { correlationId }), account);
                this.activeSilentTokenRequests.set(silentRequestKey, activeRequest);
                return activeRequest.finally(() => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                });
            }
            else {
                this.logger.verbose("acquireTokenSilent has been called previously, returning the result from the first call", correlationId);
                this.performanceClient.addFields({ deduped: true }, correlationId);
                return inProgressRequest;
            }
        });
    }
    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * @param {@link (SilentRequest:type)}
     * @param {@link (AccountInfo:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse}
     */
    acquireTokenSilentAsync(request, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackPageVisibility = () => this.trackPageVisibility(request.correlationId);
            this.performanceClient.addQueueMeasurement(PerformanceEvents.AcquireTokenSilentAsync, request.correlationId);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);
            if (request.correlationId) {
                this.performanceClient.incrementFields({ visibilityChangeCount: 0 }, request.correlationId);
            }
            document.addEventListener("visibilitychange", trackPageVisibility);
            const silentRequest = yield invokeAsync(initializeSilentRequest, PerformanceEvents.InitializeSilentRequest, this.logger, this.performanceClient, request.correlationId)(request, account, this.config, this.performanceClient, this.logger);
            const cacheLookupPolicy = request.cacheLookupPolicy || CacheLookupPolicy.Default;
            const result = this.acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy).catch((refreshTokenError) => __awaiter(this, void 0, void 0, function* () {
                const shouldTryToResolveSilently = checkIfRefreshTokenErrorCanBeResolvedSilently(refreshTokenError, cacheLookupPolicy);
                if (shouldTryToResolveSilently) {
                    if (!this.activeIframeRequest) {
                        let _resolve;
                        // Always set the active request tracker immediately after checking it to prevent races
                        this.activeIframeRequest = [
                            new Promise((resolve) => {
                                _resolve = resolve;
                            }),
                            silentRequest.correlationId,
                        ];
                        this.logger.verbose("Refresh token expired/invalid or CacheLookupPolicy is set to Skip, attempting acquire token by iframe.", silentRequest.correlationId);
                        return invokeAsync(this.acquireTokenBySilentIframe.bind(this), PerformanceEvents.AcquireTokenBySilentIframe, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest)
                            .then((iframeResult) => {
                            _resolve(true);
                            return iframeResult;
                        })
                            .catch((e) => {
                            _resolve(false);
                            throw e;
                        })
                            .finally(() => {
                            this.activeIframeRequest = undefined;
                        });
                    }
                    else if (cacheLookupPolicy !== CacheLookupPolicy.Skip) {
                        const [activePromise, activeCorrelationId] = this.activeIframeRequest;
                        this.logger.verbose(`Iframe request is already in progress, awaiting resolution for request with correlationId: ${activeCorrelationId}`, silentRequest.correlationId);
                        const awaitConcurrentIframeMeasure = this.performanceClient.startMeasurement(PerformanceEvents.AwaitConcurrentIframe, silentRequest.correlationId);
                        awaitConcurrentIframeMeasure.add({
                            awaitIframeCorrelationId: activeCorrelationId,
                        });
                        const activePromiseResult = yield activePromise;
                        awaitConcurrentIframeMeasure.end({
                            success: activePromiseResult,
                        });
                        if (activePromiseResult) {
                            this.logger.verbose(`Parallel iframe request with correlationId: ${activeCorrelationId} succeeded. Retrying cache and/or RT redemption`, silentRequest.correlationId);
                            // Retry cache lookup and/or RT exchange after iframe completes
                            return this.acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy);
                        }
                        else {
                            this.logger.info(`Iframe request with correlationId: ${activeCorrelationId} failed. Interaction is required.`);
                            // If previous iframe request failed, it's unlikely to succeed this time. Throw original error.
                            throw refreshTokenError;
                        }
                    }
                    else {
                        // Cache policy set to skip and another iframe request is already in progress
                        this.logger.warning("Another iframe request is currently in progress and CacheLookupPolicy is set to Skip. This may result in degraded performance and/or reliability for both calls. Please consider changing the CacheLookupPolicy to take advantage of request queuing and token cache.", silentRequest.correlationId);
                        return invokeAsync(this.acquireTokenBySilentIframe.bind(this), PerformanceEvents.AcquireTokenBySilentIframe, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest);
                    }
                }
                else {
                    // Error cannot be silently resolved or iframe renewal is not allowed, interaction required
                    throw refreshTokenError;
                }
            }));
            return result
                .then((response) => {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, response);
                if (request.correlationId) {
                    this.performanceClient.addFields({
                        fromCache: response.fromCache,
                        isNativeBroker: response.fromNativeBroker,
                    }, request.correlationId);
                }
                return response;
            })
                .catch((tokenRenewalError) => {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            })
                .finally(() => {
                document.removeEventListener("visibilitychange", trackPageVisibility);
            });
        });
    }
    /**
     * AcquireTokenSilent without the iframe fallback. This is used to enable the correct fallbacks in cases where there's a potential for multiple silent requests to be made in parallel and prevent those requests from making concurrent iframe requests.
     * @param silentRequest
     * @param cacheLookupPolicy
     * @returns
     */
    acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            // if the cache policy is set to access_token only, we should not be hitting the native layer yet
            if (NativeMessageHandler.isPlatformBrokerAvailable(this.config, this.logger, this.nativeExtensionProvider, silentRequest.authenticationScheme) &&
                silentRequest.account.nativeAccountId) {
                this.logger.verbose("acquireTokenSilent - attempting to acquire token from native platform");
                return this.acquireTokenNative(silentRequest, ApiId.acquireTokenSilent_silentFlow, silentRequest.account.nativeAccountId, cacheLookupPolicy).catch((e) => __awaiter(this, void 0, void 0, function* () {
                    // If native token acquisition fails for availability reasons fallback to web flow
                    if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                        this.logger.verbose("acquireTokenSilent - native platform unavailable, falling back to web flow");
                        this.nativeExtensionProvider = undefined; // Prevent future requests from continuing to attempt
                        // Cache will not contain tokens, given that previous WAM requests succeeded. Skip cache and RT renewal and go straight to iframe renewal
                        throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
                    }
                    throw e;
                }));
            }
            else {
                this.logger.verbose("acquireTokenSilent - attempting to acquire token from web flow");
                // add logs to identify embedded cache retrieval
                if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                    this.logger.verbose("acquireTokenSilent - cache lookup policy set to AccessToken, attempting to acquire token from local cache");
                }
                return invokeAsync(this.acquireTokenFromCache.bind(this), PerformanceEvents.AcquireTokenFromCache, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest, cacheLookupPolicy).catch((cacheError) => {
                    if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                        throw cacheError;
                    }
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, silentRequest);
                    return invokeAsync(this.acquireTokenByRefreshToken.bind(this), PerformanceEvents.AcquireTokenByRefreshToken, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest, cacheLookupPolicy);
                });
            }
        });
    }
    /**
     * Pre-generates PKCE codes and stores it in local variable
     * @param correlationId
     */
    preGeneratePkceCodes(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("Generating new PKCE codes");
            this.pkceCode = yield invokeAsync(generatePkceCodes, PerformanceEvents.GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
            return Promise.resolve();
        });
    }
    /**
     * Provides pre-generated PKCE codes, if any
     * @param correlationId
     */
    getPreGeneratedPkceCodes(correlationId) {
        this.logger.verbose("Attempting to pick up pre-generated PKCE codes");
        const res = this.pkceCode ? Object.assign({}, this.pkceCode) : undefined;
        this.pkceCode = undefined;
        this.logger.verbose(`${res ? "Found" : "Did not find"} pre-generated PKCE codes`);
        this.performanceClient.addFields({ usePreGeneratedPkce: !!res }, correlationId);
        return res;
    }
}
/**
 * Determines whether an error thrown by the refresh token endpoint can be resolved without interaction
 * @param refreshTokenError
 * @param silentRequest
 * @param cacheLookupPolicy
 * @returns
 */
function checkIfRefreshTokenErrorCanBeResolvedSilently(refreshTokenError, cacheLookupPolicy) {
    const noInteractionRequired = !(refreshTokenError instanceof InteractionRequiredAuthError &&
        // For refresh token errors, bad_token does not always require interaction (silently resolvable)
        refreshTokenError.subError !==
            InteractionRequiredAuthErrorCodes.badToken);
    // Errors that result when the refresh token needs to be replaced
    const refreshTokenRefreshRequired = refreshTokenError.errorCode === BrowserConstants.INVALID_GRANT_ERROR ||
        refreshTokenError.errorCode ===
            ClientAuthErrorCodes.tokenRefreshRequired;
    // Errors that may be resolved before falling back to interaction (through iframe renewal)
    const isSilentlyResolvable = (noInteractionRequired && refreshTokenRefreshRequired) ||
        refreshTokenError.errorCode ===
            InteractionRequiredAuthErrorCodes.noTokensFound ||
        refreshTokenError.errorCode ===
            InteractionRequiredAuthErrorCodes.refreshTokenExpired;
    // Only these policies allow for an iframe renewal attempt
    const tryIframeRenewal = iFrameRenewalPolicies.includes(cacheLookupPolicy);
    return isSilentlyResolvable && tryIframeRenewal;
}
