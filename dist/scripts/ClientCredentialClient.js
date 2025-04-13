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
import { AuthenticationScheme, BaseClient, CacheOutcome, ClientAuthErrorCodes, Constants, CredentialType, DEFAULT_TOKEN_RENEWAL_OFFSET_SEC, GrantType, RequestParameterBuilder, ResponseHandler, ScopeSet, StringUtils, TimeUtils, TokenCacheContext, UrlString, createClientAuthError, getClientAssertion, UrlUtils, } from "@azure/msal-common/node";
/**
 * OAuth2.0 client credential grant
 * @public
 */
export class ClientCredentialClient extends BaseClient {
    constructor(configuration, appTokenProvider) {
        super(configuration);
        this.appTokenProvider = appTokenProvider;
    }
    /**
     * Public API to acquire a token with ClientCredential Flow for Confidential clients
     * @param request - CommonClientCredentialRequest provided by the developer
     */
    acquireToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.skipCache || request.claims) {
                return this.executeTokenRequest(request, this.authority);
            }
            const [cachedAuthenticationResult, lastCacheOutcome] = yield this.getCachedAuthenticationResult(request, this.config, this.cryptoUtils, this.authority, this.cacheManager, this.serverTelemetryManager);
            if (cachedAuthenticationResult) {
                // if the token is not expired but must be refreshed; get a new one in the background
                if (lastCacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                    this.logger.info("ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.");
                    // refresh the access token in the background
                    const refreshAccessToken = true;
                    yield this.executeTokenRequest(request, this.authority, refreshAccessToken);
                }
                // return the cached token
                return cachedAuthenticationResult;
            }
            else {
                return this.executeTokenRequest(request, this.authority);
            }
        });
    }
    /**
     * looks up cache if the tokens are cached already
     */
    getCachedAuthenticationResult(request, config, cryptoUtils, authority, cacheManager, serverTelemetryManager) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const clientConfiguration = config;
            const managedIdentityConfiguration = config;
            let lastCacheOutcome = CacheOutcome.NOT_APPLICABLE;
            // read the user-supplied cache into memory, if applicable
            let cacheContext;
            if (clientConfiguration.serializableCache &&
                clientConfiguration.persistencePlugin) {
                cacheContext = new TokenCacheContext(clientConfiguration.serializableCache, false);
                yield clientConfiguration.persistencePlugin.beforeCacheAccess(cacheContext);
            }
            const cachedAccessToken = this.readAccessTokenFromCache(authority, ((_a = managedIdentityConfiguration.managedIdentityId) === null || _a === void 0 ? void 0 : _a.id) ||
                clientConfiguration.authOptions.clientId, new ScopeSet(request.scopes || []), cacheManager);
            if (clientConfiguration.serializableCache &&
                clientConfiguration.persistencePlugin &&
                cacheContext) {
                yield clientConfiguration.persistencePlugin.afterCacheAccess(cacheContext);
            }
            // must refresh due to non-existent access_token
            if (!cachedAccessToken) {
                serverTelemetryManager === null || serverTelemetryManager === void 0 ? void 0 : serverTelemetryManager.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN);
                return [null, CacheOutcome.NO_CACHED_ACCESS_TOKEN];
            }
            // must refresh due to the expires_in value
            if (TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, ((_b = clientConfiguration.systemOptions) === null || _b === void 0 ? void 0 : _b.tokenRenewalOffsetSeconds) ||
                DEFAULT_TOKEN_RENEWAL_OFFSET_SEC)) {
                serverTelemetryManager === null || serverTelemetryManager === void 0 ? void 0 : serverTelemetryManager.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED);
                return [null, CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED];
            }
            // must refresh (in the background) due to the refresh_in value
            if (cachedAccessToken.refreshOn &&
                TimeUtils.isTokenExpired(cachedAccessToken.refreshOn.toString(), 0)) {
                lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
                serverTelemetryManager === null || serverTelemetryManager === void 0 ? void 0 : serverTelemetryManager.setCacheOutcome(CacheOutcome.PROACTIVELY_REFRESHED);
            }
            return [
                yield ResponseHandler.generateAuthenticationResult(cryptoUtils, authority, {
                    account: null,
                    idToken: null,
                    accessToken: cachedAccessToken,
                    refreshToken: null,
                    appMetadata: null,
                }, true, request),
                lastCacheOutcome,
            ];
        });
    }
    /**
     * Reads access token from the cache
     */
    readAccessTokenFromCache(authority, id, scopeSet, cacheManager) {
        const accessTokenFilter = {
            homeAccountId: Constants.EMPTY_STRING,
            environment: authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: id,
            realm: authority.tenant,
            target: ScopeSet.createSearchScopes(scopeSet.asArray()),
        };
        const accessTokens = cacheManager.getAccessTokensByFilter(accessTokenFilter);
        if (accessTokens.length < 1) {
            return null;
        }
        else if (accessTokens.length > 1) {
            throw createClientAuthError(ClientAuthErrorCodes.multipleMatchingTokens);
        }
        return accessTokens[0];
    }
    /**
     * Makes a network call to request the token from the service
     * @param request - CommonClientCredentialRequest provided by the developer
     * @param authority - authority object
     */
    executeTokenRequest(request, authority, refreshAccessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            let serverTokenResponse;
            let reqTimestamp;
            if (this.appTokenProvider) {
                this.logger.info("Using appTokenProvider extensibility.");
                const appTokenPropviderParameters = {
                    correlationId: request.correlationId,
                    tenantId: this.config.authOptions.authority.tenant,
                    scopes: request.scopes,
                    claims: request.claims,
                };
                reqTimestamp = TimeUtils.nowSeconds();
                const appTokenProviderResult = yield this.appTokenProvider(appTokenPropviderParameters);
                serverTokenResponse = {
                    access_token: appTokenProviderResult.accessToken,
                    expires_in: appTokenProviderResult.expiresInSeconds,
                    refresh_in: appTokenProviderResult.refreshInSeconds,
                    token_type: AuthenticationScheme.BEARER,
                };
            }
            else {
                const queryParametersString = this.createTokenQueryParameters(request);
                const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
                const requestBody = yield this.createTokenRequestBody(request);
                const headers = this.createTokenRequestHeaders();
                const thumbprint = {
                    clientId: this.config.authOptions.clientId,
                    authority: request.authority,
                    scopes: request.scopes,
                    claims: request.claims,
                    authenticationScheme: request.authenticationScheme,
                    resourceRequestMethod: request.resourceRequestMethod,
                    resourceRequestUri: request.resourceRequestUri,
                    shrClaims: request.shrClaims,
                    sshKid: request.sshKid,
                };
                this.logger.info("Sending token request to endpoint: " + authority.tokenEndpoint);
                reqTimestamp = TimeUtils.nowSeconds();
                const response = yield this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint, request.correlationId);
                serverTokenResponse = response.body;
                serverTokenResponse.status = response.status;
            }
            const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
            responseHandler.validateTokenResponse(serverTokenResponse, refreshAccessToken);
            const tokenResponse = yield responseHandler.handleServerTokenResponse(serverTokenResponse, this.authority, reqTimestamp, request);
            return tokenResponse;
        });
    }
    /**
     * generate the request to the server in the acceptable format
     * @param request - CommonClientCredentialRequest provided by the developer
     */
    createTokenRequestBody(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const parameters = new Map();
            RequestParameterBuilder.addClientId(parameters, this.config.authOptions.clientId);
            RequestParameterBuilder.addScopes(parameters, request.scopes, false);
            RequestParameterBuilder.addGrantType(parameters, GrantType.CLIENT_CREDENTIALS_GRANT);
            RequestParameterBuilder.addLibraryInfo(parameters, this.config.libraryInfo);
            RequestParameterBuilder.addApplicationTelemetry(parameters, this.config.telemetry.application);
            RequestParameterBuilder.addThrottling(parameters);
            if (this.serverTelemetryManager) {
                RequestParameterBuilder.addServerTelemetry(parameters, this.serverTelemetryManager);
            }
            const correlationId = request.correlationId ||
                this.config.cryptoInterface.createNewGuid();
            RequestParameterBuilder.addCorrelationId(parameters, correlationId);
            if (this.config.clientCredentials.clientSecret) {
                RequestParameterBuilder.addClientSecret(parameters, this.config.clientCredentials.clientSecret);
            }
            // Use clientAssertion from request, fallback to client assertion in base configuration
            const clientAssertion = request.clientAssertion ||
                this.config.clientCredentials.clientAssertion;
            if (clientAssertion) {
                RequestParameterBuilder.addClientAssertion(parameters, yield getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
                RequestParameterBuilder.addClientAssertionType(parameters, clientAssertion.assertionType);
            }
            if (!StringUtils.isEmptyObj(request.claims) ||
                (this.config.authOptions.clientCapabilities &&
                    this.config.authOptions.clientCapabilities.length > 0)) {
                RequestParameterBuilder.addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities);
            }
            return UrlUtils.mapToQueryString(parameters);
        });
    }
}
