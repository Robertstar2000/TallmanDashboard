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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { PromptValue, AuthToken, Constants, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, UrlString, OIDC_DEFAULT_SCOPES, PopTokenGenerator, PerformanceEvents, AADServerParamKeys, createClientAuthError, ClientAuthErrorCodes, invokeAsync, createAuthError, AuthErrorCodes, updateAccountTenantProfileData, CacheHelpers, buildAccountToCache, ServerTelemetryManager, } from "@azure/msal-common/browser";
import { BaseInteractionClient } from "./BaseInteractionClient.js";
import { NativeExtensionMethod, ApiId, TemporaryCacheKeys, NativeConstants, BrowserConstants, CacheLookupPolicy, } from "../utils/BrowserConstants.js";
import { NativeAuthError, NativeAuthErrorCodes, createNativeAuthError, isFatalNativeAuthError, } from "../error/NativeAuthError.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { SilentCacheClient } from "./SilentCacheClient.js";
import { base64Decode } from "../encode/Base64Decode.js";
import { version } from "../packageMetadata.js";
export class NativeInteractionClient extends BaseInteractionClient {
    constructor(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, provider, accountId, nativeStorageImpl, correlationId) {
        var _a;
        super(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, performanceClient, provider, correlationId);
        this.apiId = apiId;
        this.accountId = accountId;
        this.nativeMessageHandler = provider;
        this.nativeStorageManager = nativeStorageImpl;
        this.silentCacheClient = new SilentCacheClient(config, this.nativeStorageManager, browserCrypto, logger, eventHandler, navigationClient, performanceClient, provider, correlationId);
        const extensionName = this.nativeMessageHandler.getExtensionId() ===
            NativeConstants.PREFERRED_EXTENSION_ID
            ? "chrome"
            : ((_a = this.nativeMessageHandler.getExtensionId()) === null || _a === void 0 ? void 0 : _a.length)
                ? "unknown"
                : undefined;
        this.skus = ServerTelemetryManager.makeExtraSkuString({
            libraryName: BrowserConstants.MSAL_SKU,
            libraryVersion: version,
            extensionName: extensionName,
            extensionVersion: this.nativeMessageHandler.getExtensionVersion(),
        });
    }
    /**
     * Adds SKUs to request extra query parameters
     * @param request {NativeTokenRequest}
     * @private
     */
    addRequestSKUs(request) {
        request.extraParameters = Object.assign(Object.assign({}, request.extraParameters), { [AADServerParamKeys.X_CLIENT_EXTRA_SKU]: this.skus });
    }
    /**
     * Acquire token from native platform via browser extension
     * @param request
     */
    acquireToken(request, cacheLookupPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.NativeInteractionClientAcquireToken, request.correlationId);
            this.logger.trace("NativeInteractionClient - acquireToken called.");
            // start the perf measurement
            const nativeATMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.NativeInteractionClientAcquireToken, request.correlationId);
            const reqTimestamp = TimeUtils.nowSeconds();
            const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
            try {
                // initialize native request
                const nativeRequest = yield this.initializeNativeRequest(request);
                // check if the tokens can be retrieved from internal cache
                try {
                    const result = yield this.acquireTokensFromCache(this.accountId, nativeRequest);
                    nativeATMeasurement.end({
                        success: true,
                        isNativeBroker: false, // Should be true only when the result is coming directly from the broker
                        fromCache: true,
                    });
                    return result;
                }
                catch (e) {
                    if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
                        this.logger.info("MSAL internal Cache does not contain tokens, return error as per cache policy");
                        throw e;
                    }
                    // continue with a native call for any and all errors
                    this.logger.info("MSAL internal Cache does not contain tokens, proceed to make a native call");
                }
                const nativeTokenRequest = __rest(nativeRequest, []);
                // fall back to native calls
                const messageBody = {
                    method: NativeExtensionMethod.GetToken,
                    request: nativeTokenRequest,
                };
                const response = yield this.nativeMessageHandler.sendMessage(messageBody);
                const validatedResponse = this.validateNativeResponse(response);
                return yield this.handleNativeResponse(validatedResponse, nativeRequest, reqTimestamp)
                    .then((result) => {
                    nativeATMeasurement.end({
                        success: true,
                        isNativeBroker: true,
                        requestId: result.requestId,
                    });
                    serverTelemetryManager.clearNativeBrokerErrorCode();
                    return result;
                })
                    .catch((error) => {
                    nativeATMeasurement.end({
                        success: false,
                        errorCode: error.errorCode,
                        subErrorCode: error.subError,
                        isNativeBroker: true,
                    });
                    throw error;
                });
            }
            catch (e) {
                if (e instanceof NativeAuthError) {
                    serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
                }
                throw e;
            }
        });
    }
    /**
     * Creates silent flow request
     * @param request
     * @param cachedAccount
     * @returns CommonSilentFlowRequest
     */
    createSilentCacheRequest(request, cachedAccount) {
        return {
            authority: request.authority,
            correlationId: this.correlationId,
            scopes: ScopeSet.fromString(request.scope).asArray(),
            account: cachedAccount,
            forceRefresh: false,
        };
    }
    /**
     * Fetches the tokens from the cache if un-expired
     * @param nativeAccountId
     * @param request
     * @returns authenticationResult
     */
    acquireTokensFromCache(nativeAccountId, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!nativeAccountId) {
                this.logger.warning("NativeInteractionClient:acquireTokensFromCache - No nativeAccountId provided");
                throw createClientAuthError(ClientAuthErrorCodes.noAccountFound);
            }
            // fetch the account from browser cache
            const account = this.browserStorage.getBaseAccountInfo({
                nativeAccountId,
            });
            if (!account) {
                throw createClientAuthError(ClientAuthErrorCodes.noAccountFound);
            }
            // leverage silent flow for cached tokens retrieval
            try {
                const silentRequest = this.createSilentCacheRequest(request, account);
                const result = yield this.silentCacheClient.acquireToken(silentRequest);
                const fullAccount = Object.assign(Object.assign({}, account), { idTokenClaims: result === null || result === void 0 ? void 0 : result.idTokenClaims, idToken: result === null || result === void 0 ? void 0 : result.idToken });
                return Object.assign(Object.assign({}, result), { account: fullAccount });
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Acquires a token from native platform then redirects to the redirectUri instead of returning the response
     * @param {RedirectRequest} request
     * @param {InProgressPerformanceEvent} rootMeasurement
     */
    acquireTokenRedirect(request, rootMeasurement) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("NativeInteractionClient - acquireTokenRedirect called.");
            const remainingParameters = __rest(request, []);
            delete remainingParameters.onRedirectNavigate;
            const nativeRequest = yield this.initializeNativeRequest(remainingParameters);
            const messageBody = {
                method: NativeExtensionMethod.GetToken,
                request: nativeRequest,
            };
            try {
                const response = yield this.nativeMessageHandler.sendMessage(messageBody);
                this.validateNativeResponse(response);
            }
            catch (e) {
                // Only throw fatal errors here to allow application to fallback to regular redirect. Otherwise proceed and the error will be thrown in handleRedirectPromise
                if (e instanceof NativeAuthError) {
                    const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
                    serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
                    if (isFatalNativeAuthError(e)) {
                        throw e;
                    }
                }
            }
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, JSON.stringify(nativeRequest), true);
            const navigationOptions = {
                apiId: ApiId.acquireTokenRedirect,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false,
            };
            const redirectUri = this.config.auth.navigateToLoginRequestUrl
                ? window.location.href
                : this.getRedirectUri(request.redirectUri);
            rootMeasurement.end({ success: true });
            yield this.navigationClient.navigateExternal(redirectUri, navigationOptions); // Need to treat this as external to ensure handleRedirectPromise is run again
        });
    }
    /**
     * If the previous page called native platform for a token using redirect APIs, send the same request again and return the response
     * @param performanceClient {IPerformanceClient?}
     * @param correlationId {string?} correlation identifier
     */
    handleRedirectPromise(performanceClient, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("NativeInteractionClient - handleRedirectPromise called.");
            if (!this.browserStorage.isInteractionInProgress(true)) {
                this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
                return null;
            }
            // remove prompt from the request to prevent WAM from prompting twice
            const cachedRequest = this.browserStorage.getCachedNativeRequest();
            if (!cachedRequest) {
                this.logger.verbose("NativeInteractionClient - handleRedirectPromise called but there is no cached request, returning null.");
                if (performanceClient && correlationId) {
                    performanceClient === null || performanceClient === void 0 ? void 0 : performanceClient.addFields({ errorCode: "no_cached_request" }, correlationId);
                }
                return null;
            }
            const { prompt } = cachedRequest, request = __rest(cachedRequest, ["prompt"]);
            if (prompt) {
                this.logger.verbose("NativeInteractionClient - handleRedirectPromise called and prompt was included in the original request, removing prompt from cached request to prevent second interaction with native broker window.");
            }
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));
            const messageBody = {
                method: NativeExtensionMethod.GetToken,
                request: request,
            };
            const reqTimestamp = TimeUtils.nowSeconds();
            try {
                this.logger.verbose("NativeInteractionClient - handleRedirectPromise sending message to native broker.");
                const response = yield this.nativeMessageHandler.sendMessage(messageBody);
                this.validateNativeResponse(response);
                const result = this.handleNativeResponse(response, request, reqTimestamp);
                this.browserStorage.setInteractionInProgress(false);
                const res = yield result;
                const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
                serverTelemetryManager.clearNativeBrokerErrorCode();
                return res;
            }
            catch (e) {
                this.browserStorage.setInteractionInProgress(false);
                throw e;
            }
        });
    }
    /**
     * Logout from native platform via browser extension
     * @param request
     */
    logout() {
        this.logger.trace("NativeInteractionClient - logout called.");
        return Promise.reject("Logout not implemented yet");
    }
    /**
     * Transform response from native platform into AuthenticationResult object which will be returned to the end user
     * @param response
     * @param request
     * @param reqTimestamp
     */
    handleNativeResponse(response, request, reqTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.logger.trace("NativeInteractionClient - handleNativeResponse called.");
            // generate identifiers
            const idTokenClaims = AuthToken.extractTokenClaims(response.id_token, base64Decode);
            const homeAccountIdentifier = this.createHomeAccountIdentifier(response, idTokenClaims);
            const cachedhomeAccountId = (_a = this.browserStorage.getAccountInfoFilteredBy({
                nativeAccountId: request.accountId,
            })) === null || _a === void 0 ? void 0 : _a.homeAccountId;
            // add exception for double brokering, please note this is temporary and will be fortified in future
            if (((_b = request.extraParameters) === null || _b === void 0 ? void 0 : _b.child_client_id) &&
                response.account.id !== request.accountId) {
                this.logger.info("handleNativeServerResponse: Double broker flow detected, ignoring accountId mismatch");
            }
            else if (homeAccountIdentifier !== cachedhomeAccountId &&
                response.account.id !== request.accountId) {
                // User switch in native broker prompt is not supported. All users must first sign in through web flow to ensure server state is in sync
                throw createNativeAuthError(NativeAuthErrorCodes.userSwitch);
            }
            // Get the preferred_cache domain for the given authority
            const authority = yield this.getDiscoveredAuthority({
                requestAuthority: request.authority,
            });
            const baseAccount = buildAccountToCache(this.browserStorage, authority, homeAccountIdentifier, base64Decode, idTokenClaims, response.client_info, undefined, // environment
            idTokenClaims.tid, undefined, // auth code payload
            response.account.id, this.logger);
            // Ensure expires_in is in number format
            response.expires_in = Number(response.expires_in);
            // generate authenticationResult
            const result = yield this.generateAuthenticationResult(response, request, idTokenClaims, baseAccount, authority.canonicalAuthority, reqTimestamp);
            // cache accounts and tokens in the appropriate storage
            yield this.cacheAccount(baseAccount);
            yield this.cacheNativeTokens(response, request, homeAccountIdentifier, idTokenClaims, response.access_token, result.tenantId, reqTimestamp);
            return result;
        });
    }
    /**
     * creates an homeAccountIdentifier for the account
     * @param response
     * @param idTokenObj
     * @returns
     */
    createHomeAccountIdentifier(response, idTokenClaims) {
        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenClaims);
        return homeAccountIdentifier;
    }
    /**
     * Helper to generate scopes
     * @param response
     * @param request
     * @returns
     */
    generateScopes(response, request) {
        return response.scope
            ? ScopeSet.fromString(response.scope)
            : ScopeSet.fromString(request.scope);
    }
    /**
     * If PoP token is requesred, records the PoP token if returned from the WAM, else generates one in the browser
     * @param request
     * @param response
     */
    generatePopAccessToken(response, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.tokenType === AuthenticationScheme.POP &&
                request.signPopToken) {
                /**
                 * This code prioritizes SHR returned from the native layer. In case of error/SHR not calculated from WAM and the AT
                 * is still received, SHR is calculated locally
                 */
                // Check if native layer returned an SHR token
                if (response.shr) {
                    this.logger.trace("handleNativeServerResponse: SHR is enabled in native layer");
                    return response.shr;
                }
                // Generate SHR in msal js if WAM does not compute it when POP is enabled
                const popTokenGenerator = new PopTokenGenerator(this.browserCrypto);
                const shrParameters = {
                    resourceRequestMethod: request.resourceRequestMethod,
                    resourceRequestUri: request.resourceRequestUri,
                    shrClaims: request.shrClaims,
                    shrNonce: request.shrNonce,
                };
                /**
                 * KeyID must be present in the native request from when the PoP key was generated in order for
                 * PopTokenGenerator to query the full key for signing
                 */
                if (!request.keyId) {
                    throw createClientAuthError(ClientAuthErrorCodes.keyIdMissing);
                }
                return popTokenGenerator.signPopToken(response.access_token, request.keyId, shrParameters);
            }
            else {
                return response.access_token;
            }
        });
    }
    /**
     * Generates authentication result
     * @param response
     * @param request
     * @param idTokenObj
     * @param accountEntity
     * @param authority
     * @param reqTimestamp
     * @returns
     */
    generateAuthenticationResult(response, request, idTokenClaims, accountEntity, authority, reqTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add Native Broker fields to Telemetry
            const mats = this.addTelemetryFromNativeResponse(response);
            // If scopes not returned in server response, use request scopes
            const responseScopes = response.scope
                ? ScopeSet.fromString(response.scope)
                : ScopeSet.fromString(request.scope);
            const accountProperties = response.account.properties || {};
            const uid = accountProperties["UID"] ||
                idTokenClaims.oid ||
                idTokenClaims.sub ||
                Constants.EMPTY_STRING;
            const tid = accountProperties["TenantId"] ||
                idTokenClaims.tid ||
                Constants.EMPTY_STRING;
            const accountInfo = updateAccountTenantProfileData(accountEntity.getAccountInfo(), undefined, // tenantProfile optional
            idTokenClaims, response.id_token);
            /**
             * In pairwise broker flows, this check prevents the broker's native account id
             * from being returned over the embedded app's account id.
             */
            if (accountInfo.nativeAccountId !== response.account.id) {
                accountInfo.nativeAccountId = response.account.id;
            }
            // generate PoP token as needed
            const responseAccessToken = yield this.generatePopAccessToken(response, request);
            const tokenType = request.tokenType === AuthenticationScheme.POP
                ? AuthenticationScheme.POP
                : AuthenticationScheme.BEARER;
            const result = {
                authority: authority,
                uniqueId: uid,
                tenantId: tid,
                scopes: responseScopes.asArray(),
                account: accountInfo,
                idToken: response.id_token,
                idTokenClaims: idTokenClaims,
                accessToken: responseAccessToken,
                fromCache: mats ? this.isResponseFromCache(mats) : false,
                // Request timestamp and NativeResponse expires_in are in seconds, converting to Date for AuthenticationResult
                expiresOn: TimeUtils.toDateFromSeconds(reqTimestamp + response.expires_in),
                tokenType: tokenType,
                correlationId: this.correlationId,
                state: response.state,
                fromNativeBroker: true,
            };
            return result;
        });
    }
    /**
     * cache the account entity in browser storage
     * @param accountEntity
     */
    cacheAccount(accountEntity) {
        return __awaiter(this, void 0, void 0, function* () {
            // Store the account info and hence `nativeAccountId` in browser cache
            yield this.browserStorage.setAccount(accountEntity, this.correlationId);
            // Remove any existing cached tokens for this account in browser storage
            this.browserStorage.removeAccountContext(accountEntity).catch((e) => {
                this.logger.error(`Error occurred while removing account context from browser storage. ${e}`);
            });
        });
    }
    /**
     * Stores the access_token and id_token in inmemory storage
     * @param response
     * @param request
     * @param homeAccountIdentifier
     * @param idTokenObj
     * @param responseAccessToken
     * @param tenantId
     * @param reqTimestamp
     */
    cacheNativeTokens(response, request, homeAccountIdentifier, idTokenClaims, responseAccessToken, tenantId, reqTimestamp) {
        const cachedIdToken = CacheHelpers.createIdTokenEntity(homeAccountIdentifier, request.authority, response.id_token || "", request.clientId, idTokenClaims.tid || "");
        // cache accessToken in inmemory storage
        const expiresIn = request.tokenType === AuthenticationScheme.POP
            ? Constants.SHR_NONCE_VALIDITY
            : (typeof response.expires_in === "string"
                ? parseInt(response.expires_in, 10)
                : response.expires_in) || 0;
        const tokenExpirationSeconds = reqTimestamp + expiresIn;
        const responseScopes = this.generateScopes(response, request);
        const cachedAccessToken = CacheHelpers.createAccessTokenEntity(homeAccountIdentifier, request.authority, responseAccessToken, request.clientId, idTokenClaims.tid || tenantId, responseScopes.printScopes(), tokenExpirationSeconds, 0, base64Decode, undefined, request.tokenType, undefined, request.keyId);
        const nativeCacheRecord = {
            idToken: cachedIdToken,
            accessToken: cachedAccessToken,
        };
        return this.nativeStorageManager.saveCacheRecord(nativeCacheRecord, this.correlationId, request.storeInCache);
    }
    addTelemetryFromNativeResponse(response) {
        const mats = this.getMATSFromResponse(response);
        if (!mats) {
            return null;
        }
        this.performanceClient.addFields({
            extensionId: this.nativeMessageHandler.getExtensionId(),
            extensionVersion: this.nativeMessageHandler.getExtensionVersion(),
            matsBrokerVersion: mats.broker_version,
            matsAccountJoinOnStart: mats.account_join_on_start,
            matsAccountJoinOnEnd: mats.account_join_on_end,
            matsDeviceJoin: mats.device_join,
            matsPromptBehavior: mats.prompt_behavior,
            matsApiErrorCode: mats.api_error_code,
            matsUiVisible: mats.ui_visible,
            matsSilentCode: mats.silent_code,
            matsSilentBiSubCode: mats.silent_bi_sub_code,
            matsSilentMessage: mats.silent_message,
            matsSilentStatus: mats.silent_status,
            matsHttpStatus: mats.http_status,
            matsHttpEventCount: mats.http_event_count,
        }, this.correlationId);
        return mats;
    }
    /**
     * Validates native platform response before processing
     * @param response
     */
    validateNativeResponse(response) {
        if (response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scope") &&
            response.hasOwnProperty("expires_in")) {
            return response;
        }
        else {
            throw createAuthError(AuthErrorCodes.unexpectedError, "Response missing expected properties.");
        }
    }
    /**
     * Gets MATS telemetry from native response
     * @param response
     * @returns
     */
    getMATSFromResponse(response) {
        if (response.properties.MATS) {
            try {
                return JSON.parse(response.properties.MATS);
            }
            catch (e) {
                this.logger.error("NativeInteractionClient - Error parsing MATS telemetry, returning null instead");
            }
        }
        return null;
    }
    /**
     * Returns whether or not response came from native cache
     * @param response
     * @returns
     */
    isResponseFromCache(mats) {
        if (typeof mats.is_cached === "undefined") {
            this.logger.verbose("NativeInteractionClient - MATS telemetry does not contain field indicating if response was served from cache. Returning false.");
            return false;
        }
        return !!mats.is_cached;
    }
    /**
     * Translates developer provided request object into NativeRequest object
     * @param request
     */
    initializeNativeRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("NativeInteractionClient - initializeNativeRequest called");
            const requestAuthority = request.authority || this.config.auth.authority;
            if (request.account) {
                // validate authority
                yield this.getDiscoveredAuthority({
                    requestAuthority,
                    requestAzureCloudOptions: request.azureCloudOptions,
                    account: request.account,
                });
            }
            const canonicalAuthority = new UrlString(requestAuthority);
            canonicalAuthority.validateAsUri();
            // scopes are expected to be received by the native broker as "scope" and will be added to the request below. Other properties that should be dropped from the request to the native broker can be included in the object destructuring here.
            const { scopes } = request, remainingProperties = __rest(request, ["scopes"]);
            const scopeSet = new ScopeSet(scopes || []);
            scopeSet.appendScopes(OIDC_DEFAULT_SCOPES);
            const getPrompt = () => {
                // If request is silent, prompt is always none
                switch (this.apiId) {
                    case ApiId.ssoSilent:
                    case ApiId.acquireTokenSilent_silentFlow:
                        this.logger.trace("initializeNativeRequest: silent request sets prompt to none");
                        return PromptValue.NONE;
                    default:
                        break;
                }
                // Prompt not provided, request may proceed and native broker decides if it needs to prompt
                if (!request.prompt) {
                    this.logger.trace("initializeNativeRequest: prompt was not provided");
                    return undefined;
                }
                // If request is interactive, check if prompt provided is allowed to go directly to native broker
                switch (request.prompt) {
                    case PromptValue.NONE:
                    case PromptValue.CONSENT:
                    case PromptValue.LOGIN:
                        this.logger.trace("initializeNativeRequest: prompt is compatible with native flow");
                        return request.prompt;
                    default:
                        this.logger.trace(`initializeNativeRequest: prompt = ${request.prompt} is not compatible with native flow`);
                        throw createBrowserAuthError(BrowserAuthErrorCodes.nativePromptNotSupported);
                }
            };
            const validatedRequest = Object.assign(Object.assign({}, remainingProperties), { accountId: this.accountId, clientId: this.config.auth.clientId, authority: canonicalAuthority.urlString, scope: scopeSet.printScopes(), redirectUri: this.getRedirectUri(request.redirectUri), prompt: getPrompt(), correlationId: this.correlationId, tokenType: request.authenticationScheme, windowTitleSubstring: document.title, extraParameters: Object.assign(Object.assign({}, request.extraQueryParameters), request.tokenQueryParameters), extendedExpiryToken: false, keyId: request.popKid });
            // Check for PoP token requests: signPopToken should only be set to true if popKid is not set
            if (validatedRequest.signPopToken && !!request.popKid) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.invalidPopTokenRequest);
            }
            this.handleExtraBrokerParams(validatedRequest);
            validatedRequest.extraParameters =
                validatedRequest.extraParameters || {};
            validatedRequest.extraParameters.telemetry =
                NativeConstants.MATS_TELEMETRY;
            if (request.authenticationScheme === AuthenticationScheme.POP) {
                // add POP request type
                const shrParameters = {
                    resourceRequestUri: request.resourceRequestUri,
                    resourceRequestMethod: request.resourceRequestMethod,
                    shrClaims: request.shrClaims,
                    shrNonce: request.shrNonce,
                };
                const popTokenGenerator = new PopTokenGenerator(this.browserCrypto);
                // generate reqCnf if not provided in the request
                let reqCnfData;
                if (!validatedRequest.keyId) {
                    const generatedReqCnfData = yield invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents.PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(shrParameters, this.logger);
                    reqCnfData = generatedReqCnfData.reqCnfString;
                    validatedRequest.keyId = generatedReqCnfData.kid;
                    validatedRequest.signPopToken = true;
                }
                else {
                    reqCnfData = this.browserCrypto.base64UrlEncode(JSON.stringify({ kid: validatedRequest.keyId }));
                    validatedRequest.signPopToken = false;
                }
                // SPAs require whole string to be passed to broker
                validatedRequest.reqCnf = reqCnfData;
            }
            this.addRequestSKUs(validatedRequest);
            return validatedRequest;
        });
    }
    /**
     * Handles extra broker request parameters
     * @param request {NativeTokenRequest}
     * @private
     */
    handleExtraBrokerParams(request) {
        var _a;
        const hasExtraBrokerParams = request.extraParameters &&
            request.extraParameters.hasOwnProperty(AADServerParamKeys.BROKER_CLIENT_ID) &&
            request.extraParameters.hasOwnProperty(AADServerParamKeys.BROKER_REDIRECT_URI) &&
            request.extraParameters.hasOwnProperty(AADServerParamKeys.CLIENT_ID);
        if (!request.embeddedClientId && !hasExtraBrokerParams) {
            return;
        }
        let child_client_id = "";
        const child_redirect_uri = request.redirectUri;
        if (request.embeddedClientId) {
            request.redirectUri = this.config.auth.redirectUri;
            child_client_id = request.embeddedClientId;
        }
        else if (request.extraParameters) {
            request.redirectUri =
                request.extraParameters[AADServerParamKeys.BROKER_REDIRECT_URI];
            child_client_id =
                request.extraParameters[AADServerParamKeys.CLIENT_ID];
        }
        request.extraParameters = {
            child_client_id,
            child_redirect_uri,
        };
        (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addFields({
            embeddedClientId: child_client_id,
            embeddedRedirectUri: child_redirect_uri,
        }, request.correlationId);
    }
}
