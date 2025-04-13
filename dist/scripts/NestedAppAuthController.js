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
import { DEFAULT_CRYPTO_IMPLEMENTATION, PerformanceEvents, TimeUtils, buildStaticAuthorityOptions, AccountEntity, OIDC_DEFAULT_SCOPES, AuthError, } from "@azure/msal-common/browser";
import { InteractionType, DEFAULT_REQUEST, CacheLookupPolicy, } from "../utils/BrowserConstants.js";
import { CryptoOps } from "../crypto/CryptoOps.js";
import { NestedAppAuthAdapter } from "../naa/mapping/NestedAppAuthAdapter.js";
import { NestedAppAuthError } from "../error/NestedAppAuthError.js";
import { EventHandler } from "../event/EventHandler.js";
import { EventType } from "../event/EventType.js";
import { BrowserCacheManager, DEFAULT_BROWSER_CACHE_MANAGER, } from "../cache/BrowserCacheManager.js";
import * as AccountManager from "../cache/AccountManager.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
export class NestedAppAuthController {
    constructor(operatingContext) {
        this.operatingContext = operatingContext;
        const proxy = this.operatingContext.getBridgeProxy();
        if (proxy !== undefined) {
            this.bridgeProxy = proxy;
        }
        else {
            throw new Error("unexpected: bridgeProxy is undefined");
        }
        // Set the configuration.
        this.config = operatingContext.getConfig();
        // Initialize logger
        this.logger = this.operatingContext.getLogger();
        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;
        // Initialize the crypto class.
        this.browserCrypto = operatingContext.isBrowserEnvironment()
            ? new CryptoOps(this.logger, this.performanceClient, true)
            : DEFAULT_CRYPTO_IMPLEMENTATION;
        this.eventHandler = new EventHandler(this.logger);
        // Initialize the browser storage class.
        this.browserStorage = this.operatingContext.isBrowserEnvironment()
            ? new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler, buildStaticAuthorityOptions(this.config.auth))
            : DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger, this.performanceClient, this.eventHandler);
        this.nestedAppAuthAdapter = new NestedAppAuthAdapter(this.config.auth.clientId, this.config.auth.clientCapabilities, this.browserCrypto, this.logger);
        // Set the active account if available
        const accountContext = this.bridgeProxy.getAccountContext();
        this.currentAccountContext = accountContext ? accountContext : null;
    }
    /**
     * Factory function to create a new instance of NestedAppAuthController
     * @param operatingContext
     * @returns Promise<IController>
     */
    static createController(operatingContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new NestedAppAuthController(operatingContext);
            return Promise.resolve(controller);
        });
    }
    /**
     * Specific implementation of initialize function for NestedAppAuthController
     * @returns
     */
    initialize(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCorrelationId = (request === null || request === void 0 ? void 0 : request.correlationId) || createNewGuid();
            yield this.browserStorage.initialize(initCorrelationId);
            return Promise.resolve();
        });
    }
    /**
     * Validate the incoming request and add correlationId if not present
     * @param request
     * @returns
     */
    ensureValidRequest(request) {
        if (request === null || request === void 0 ? void 0 : request.correlationId) {
            return request;
        }
        return Object.assign(Object.assign({}, request), { correlationId: this.browserCrypto.createNewGuid() });
    }
    /**
     * Internal implementation of acquireTokenInteractive flow
     * @param request
     * @returns
     */
    acquireTokenInteractive(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const validRequest = this.ensureValidRequest(request);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, validRequest);
            const atPopupMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenPopup, validRequest.correlationId);
            atPopupMeasurement === null || atPopupMeasurement === void 0 ? void 0 : atPopupMeasurement.add({ nestedAppAuthRequest: true });
            try {
                const naaRequest = this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
                const reqTimestamp = TimeUtils.nowSeconds();
                const response = yield this.bridgeProxy.getTokenInteractive(naaRequest);
                const result = Object.assign({}, this.nestedAppAuthAdapter.fromNaaTokenResponse(naaRequest, response, reqTimestamp));
                // cache the tokens in the response
                yield this.hydrateCache(result, request);
                // cache the account context in memory after successful token fetch
                this.currentAccountContext = {
                    homeAccountId: result.account.homeAccountId,
                    environment: result.account.environment,
                    tenantId: result.account.tenantId,
                };
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup, result);
                atPopupMeasurement.add({
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                });
                atPopupMeasurement.end({
                    success: true,
                    requestId: result.requestId,
                });
                return result;
            }
            catch (e) {
                const error = e instanceof AuthError
                    ? e
                    : this.nestedAppAuthAdapter.fromBridgeError(e);
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup, null, e);
                atPopupMeasurement.end({
                    success: false,
                }, e);
                throw error;
            }
        });
    }
    /**
     * Internal implementation of acquireTokenSilent flow
     * @param request
     * @returns
     */
    acquireTokenSilentInternal(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const validRequest = this.ensureValidRequest(request);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, validRequest);
            // Look for tokens in the cache first
            const result = yield this.acquireTokenFromCache(validRequest);
            if (result) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, result);
                return result;
            }
            // proceed with acquiring tokens via the host
            const ssoSilentMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.SsoSilent, validRequest.correlationId);
            ssoSilentMeasurement === null || ssoSilentMeasurement === void 0 ? void 0 : ssoSilentMeasurement.increment({
                visibilityChangeCount: 0,
            });
            ssoSilentMeasurement === null || ssoSilentMeasurement === void 0 ? void 0 : ssoSilentMeasurement.add({
                nestedAppAuthRequest: true,
            });
            try {
                const naaRequest = this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
                const reqTimestamp = TimeUtils.nowSeconds();
                const response = yield this.bridgeProxy.getTokenSilent(naaRequest);
                const result = this.nestedAppAuthAdapter.fromNaaTokenResponse(naaRequest, response, reqTimestamp);
                // cache the tokens in the response
                yield this.hydrateCache(result, request);
                // cache the account context in memory after successful token fetch
                this.currentAccountContext = {
                    homeAccountId: result.account.homeAccountId,
                    environment: result.account.environment,
                    tenantId: result.account.tenantId,
                };
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, result);
                ssoSilentMeasurement === null || ssoSilentMeasurement === void 0 ? void 0 : ssoSilentMeasurement.add({
                    accessTokenSize: result.accessToken.length,
                    idTokenSize: result.idToken.length,
                });
                ssoSilentMeasurement === null || ssoSilentMeasurement === void 0 ? void 0 : ssoSilentMeasurement.end({
                    success: true,
                    requestId: result.requestId,
                });
                return result;
            }
            catch (e) {
                const error = e instanceof AuthError
                    ? e
                    : this.nestedAppAuthAdapter.fromBridgeError(e);
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, e);
                ssoSilentMeasurement === null || ssoSilentMeasurement === void 0 ? void 0 : ssoSilentMeasurement.end({
                    success: false,
                }, e);
                throw error;
            }
        });
    }
    /**
     * acquires tokens from cache
     * @param request
     * @returns
     */
    acquireTokenFromCache(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const atsMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, request.correlationId);
            atsMeasurement === null || atsMeasurement === void 0 ? void 0 : atsMeasurement.add({
                nestedAppAuthRequest: true,
            });
            // if the request has claims, we cannot look up in the cache
            if (request.claims) {
                this.logger.verbose("Claims are present in the request, skipping cache lookup");
                return null;
            }
            // if the request has forceRefresh, we cannot look up in the cache
            if (request.forceRefresh) {
                this.logger.verbose("forceRefresh is set to true, skipping cache lookup");
                return null;
            }
            // respect cache lookup policy
            let result = null;
            if (!request.cacheLookupPolicy) {
                request.cacheLookupPolicy = CacheLookupPolicy.Default;
            }
            switch (request.cacheLookupPolicy) {
                case CacheLookupPolicy.Default:
                case CacheLookupPolicy.AccessToken:
                case CacheLookupPolicy.AccessTokenAndRefreshToken:
                    result = yield this.acquireTokenFromCacheInternal(request);
                    break;
                default:
                    return null;
            }
            if (result) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, result);
                atsMeasurement === null || atsMeasurement === void 0 ? void 0 : atsMeasurement.add({
                    accessTokenSize: result === null || result === void 0 ? void 0 : result.accessToken.length,
                    idTokenSize: result === null || result === void 0 ? void 0 : result.idToken.length,
                });
                atsMeasurement === null || atsMeasurement === void 0 ? void 0 : atsMeasurement.end({
                    success: true,
                });
                return result;
            }
            this.logger.error("Cached tokens are not found for the account, proceeding with silent token request.");
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null);
            atsMeasurement === null || atsMeasurement === void 0 ? void 0 : atsMeasurement.end({
                success: false,
            });
            return null;
        });
    }
    /**
     *
     * @param request
     * @returns
     */
    acquireTokenFromCacheInternal(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // always prioritize the account context from the bridge
            const accountContext = this.bridgeProxy.getAccountContext() || this.currentAccountContext;
            let currentAccount = null;
            if (accountContext) {
                currentAccount = AccountManager.getAccount(accountContext, this.logger, this.browserStorage);
            }
            // fall back to brokering if no cached account is found
            if (!currentAccount) {
                this.logger.verbose("No active account found, falling back to the host");
                return Promise.resolve(null);
            }
            this.logger.verbose("active account found, attempting to acquire token silently");
            const authRequest = Object.assign(Object.assign({}, request), { correlationId: request.correlationId || this.browserCrypto.createNewGuid(), authority: request.authority || currentAccount.environment, scopes: ((_a = request.scopes) === null || _a === void 0 ? void 0 : _a.length)
                    ? request.scopes
                    : [...OIDC_DEFAULT_SCOPES] });
            // fetch access token and check for expiry
            const tokenKeys = this.browserStorage.getTokenKeys();
            const cachedAccessToken = this.browserStorage.getAccessToken(currentAccount, authRequest, tokenKeys, currentAccount.tenantId, this.performanceClient, authRequest.correlationId);
            // If there is no access token, log it and return null
            if (!cachedAccessToken) {
                this.logger.verbose("No cached access token found");
                return Promise.resolve(null);
            }
            else if (TimeUtils.wasClockTurnedBack(cachedAccessToken.cachedAt) ||
                TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.system.tokenRenewalOffsetSeconds)) {
                this.logger.verbose("Cached access token has expired");
                return Promise.resolve(null);
            }
            const cachedIdToken = this.browserStorage.getIdToken(currentAccount, tokenKeys, currentAccount.tenantId, this.performanceClient, authRequest.correlationId);
            if (!cachedIdToken) {
                this.logger.verbose("No cached id token found");
                return Promise.resolve(null);
            }
            return this.nestedAppAuthAdapter.toAuthenticationResultFromCache(currentAccount, cachedIdToken, cachedAccessToken, authRequest, authRequest.correlationId);
        });
    }
    /**
     * acquireTokenPopup flow implementation
     * @param request
     * @returns
     */
    acquireTokenPopup(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.acquireTokenInteractive(request);
        });
    }
    /**
     * acquireTokenRedirect flow is not supported in nested app auth
     * @param request
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    /**
     * acquireTokenSilent flow implementation
     * @param silentRequest
     * @returns
     */
    acquireTokenSilent(silentRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.acquireTokenSilentInternal(silentRequest);
        });
    }
    /**
     * Hybrid flow is not currently supported in nested app auth
     * @param request
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenByCode(request // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    /**
     * acquireTokenNative flow is not currently supported in nested app auth
     * @param request
     * @param apiId
     * @param accountId
     */
    acquireTokenNative(request, apiId, // eslint-disable-line @typescript-eslint/no-unused-vars
    accountId // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    /**
     * acquireTokenByRefreshToken flow is not currently supported in nested app auth
     * @param commonRequest
     * @param silentRequest
     */
    acquireTokenByRefreshToken(commonRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    silentRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    /**
     * Adds event callbacks to array
     * @param callback
     * @param eventTypes
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addPerformanceCallback(callback) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removePerformanceCallback(callbackId) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    enableAccountStorageEvents() {
        throw NestedAppAuthError.createUnsupportedError();
    }
    disableAccountStorageEvents() {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // #region Account APIs
    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter) {
        return AccountManager.getAllAccounts(this.logger, this.browserStorage, this.isBrowserEnv(), accountFilter);
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
        /*
         * StandardController uses this to allow the developer to set the active account
         * in the nested app auth scenario the active account is controlled by the app hosting the nested app
         */
        return AccountManager.setActiveAccount(account, this.browserStorage);
    }
    /**
     * Gets the currently active account
     */
    getActiveAccount() {
        return AccountManager.getActiveAccount(this.browserStorage);
    }
    // #endregion
    handleRedirectPromise(hash // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        return Promise.resolve(null);
    }
    loginPopup(request // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        return this.acquireTokenInteractive(request || DEFAULT_REQUEST);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginRedirect(request) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout(logoutRequest) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    logoutRedirect(logoutRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    logoutPopup(logoutRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {
        throw NestedAppAuthError.createUnsupportedError();
    }
    ssoSilent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request) {
        return this.acquireTokenSilentInternal(request);
    }
    getTokenCache() {
        throw NestedAppAuthError.createUnsupportedError();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeWrapperLibrary(sku, version) {
        /*
         * Standard controller uses this to set the sku and version of the wrapper library in the storage
         * we do nothing here
         */
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNavigationClient(navigationClient) {
        this.logger.warning("setNavigationClient is not supported in nested app auth");
    }
    getConfiguration() {
        return this.config;
    }
    isBrowserEnv() {
        return this.operatingContext.isBrowserEnvironment();
    }
    getBrowserCrypto() {
        return this.browserCrypto;
    }
    getPerformanceClient() {
        throw NestedAppAuthError.createUnsupportedError();
    }
    getRedirectResponse() {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearCache(logoutRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            throw NestedAppAuthError.createUnsupportedError();
        });
    }
    hydrateCache(result, request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("hydrateCache called");
            const accountEntity = AccountEntity.createFromAccountInfo(result.account, result.cloudGraphHostName, result.msGraphHost);
            yield this.browserStorage.setAccount(accountEntity, result.correlationId);
            return this.browserStorage.hydrateCache(result, request);
        });
    }
}
