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
import { AuthorizationCodeClient, RefreshTokenClient, Authority, AuthorityFactory, SilentFlowClient, Logger, ServerTelemetryManager, AuthenticationScheme, ResponseMode, OIDC_DEFAULT_SCOPES, AuthError, Constants, StringUtils, createClientAuthError, ClientAuthErrorCodes, buildStaticAuthorityOptions, getClientAssertion, CacheOutcome, ClientAuthError, } from "@azure/msal-common/node";
import { buildAppConfiguration, } from "../config/Configuration.js";
import { CryptoProvider } from "../crypto/CryptoProvider.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { Constants as NodeConstants, ApiId } from "../utils/Constants.js";
import { TokenCache } from "../cache/TokenCache.js";
import { ClientAssertion } from "./ClientAssertion.js";
import { version, name } from "../packageMetadata.js";
import { NodeAuthError } from "../error/NodeAuthError.js";
import { UsernamePasswordClient } from "./UsernamePasswordClient.js";
import { getAuthCodeRequestUrl } from "../protocol/Authorize.js";
/**
 * Base abstract class for all ClientApplications - public and confidential
 * @public
 */
export class ClientApplication {
    /**
     * Constructor for the ClientApplication
     */
    constructor(configuration) {
        this.config = buildAppConfiguration(configuration);
        this.cryptoProvider = new CryptoProvider();
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
        this.storage = new NodeStorage(this.logger, this.config.auth.clientId, this.cryptoProvider, buildStaticAuthorityOptions(this.config.auth));
        this.tokenCache = new TokenCache(this.storage, this.logger, this.config.cache.cachePlugin);
    }
    /**
     * Creates the URL of the authorization request, letting the user input credentials and consent to the
     * application. The URL targets the /authorize endpoint of the authority configured in the
     * application object.
     *
     * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
     * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
     * `acquireTokenByCode(AuthorizationCodeRequest)`.
     */
    getAuthCodeUrl(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("getAuthCodeUrl called", request.correlationId);
            const validRequest = Object.assign(Object.assign(Object.assign({}, request), (yield this.initializeBaseRequest(request))), { responseMode: request.responseMode || ResponseMode.QUERY, authenticationScheme: AuthenticationScheme.BEARER, state: request.state || "", nonce: request.nonce || "" });
            const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
            return getAuthCodeRequestUrl(this.config, discoveredAuthority, validRequest, this.logger);
        });
    }
    /**
     * Acquires a token by exchanging the Authorization Code received from the first step of OAuth2.0
     * Authorization Code flow.
     *
     * `getAuthCodeUrl(AuthorizationCodeUrlRequest)` can be used to create the URL for the first step of OAuth2.0
     * Authorization Code flow. Ensure that values for redirectUri and scopes in AuthorizationCodeUrlRequest and
     * AuthorizationCodeRequest are the same.
     */
    acquireTokenByCode(request, authCodePayLoad) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("acquireTokenByCode called");
            if (request.state && authCodePayLoad) {
                this.logger.info("acquireTokenByCode - validating state");
                this.validateState(request.state, authCodePayLoad.state || "");
                // eslint-disable-next-line no-param-reassign
                authCodePayLoad = Object.assign(Object.assign({}, authCodePayLoad), { state: "" });
            }
            const validRequest = Object.assign(Object.assign(Object.assign({}, request), (yield this.initializeBaseRequest(request))), { authenticationScheme: AuthenticationScheme.BEARER });
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByCode, validRequest.correlationId);
            try {
                const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
                const authClientConfig = yield this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri, serverTelemetryManager);
                const authorizationCodeClient = new AuthorizationCodeClient(authClientConfig);
                this.logger.verbose("Auth code client created", validRequest.correlationId);
                return yield authorizationCodeClient.acquireToken(validRequest, authCodePayLoad);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(validRequest.correlationId);
                }
                serverTelemetryManager.cacheFailedRequest(e);
                throw e;
            }
        });
    }
    /**
     * Acquires a token by exchanging the refresh token provided for a new set of tokens.
     *
     * This API is provided only for scenarios where you would like to migrate from ADAL to MSAL. Otherwise, it is
     * recommended that you use `acquireTokenSilent()` for silent scenarios. When using `acquireTokenSilent()`, MSAL will
     * handle the caching and refreshing of tokens automatically.
     */
    acquireTokenByRefreshToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("acquireTokenByRefreshToken called", request.correlationId);
            const validRequest = Object.assign(Object.assign(Object.assign({}, request), (yield this.initializeBaseRequest(request))), { authenticationScheme: AuthenticationScheme.BEARER });
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByRefreshToken, validRequest.correlationId);
            try {
                const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
                const refreshTokenClientConfig = yield this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager);
                const refreshTokenClient = new RefreshTokenClient(refreshTokenClientConfig);
                this.logger.verbose("Refresh token client created", validRequest.correlationId);
                return yield refreshTokenClient.acquireToken(validRequest);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(validRequest.correlationId);
                }
                serverTelemetryManager.cacheFailedRequest(e);
                throw e;
            }
        });
    }
    /**
     * Acquires a token silently when a user specifies the account the token is requested for.
     *
     * This API expects the user to provide an account object and looks into the cache to retrieve the token if present.
     * There is also an optional "forceRefresh" boolean the user can send to bypass the cache for access_token and id_token.
     * In case the refresh_token is expired or not found, an error is thrown
     * and the guidance is for the user to call any interactive token acquisition API (eg: `acquireTokenByCode()`).
     */
    acquireTokenSilent(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const validRequest = Object.assign(Object.assign(Object.assign({}, request), (yield this.initializeBaseRequest(request))), { forceRefresh: request.forceRefresh || false });
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent, validRequest.correlationId, validRequest.forceRefresh);
            try {
                const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
                const clientConfiguration = yield this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, validRequest.redirectUri || "", serverTelemetryManager);
                const silentFlowClient = new SilentFlowClient(clientConfiguration);
                this.logger.verbose("Silent flow client created", validRequest.correlationId);
                try {
                    // always overwrite the in-memory cache with the persistence cache (if it exists) before a cache lookup
                    yield this.tokenCache.overwriteCache();
                    return yield this.acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration);
                }
                catch (error) {
                    if (error instanceof ClientAuthError &&
                        error.errorCode ===
                            ClientAuthErrorCodes.tokenRefreshRequired) {
                        const refreshTokenClient = new RefreshTokenClient(clientConfiguration);
                        return refreshTokenClient.acquireTokenByRefreshToken(validRequest);
                    }
                    throw error;
                }
            }
            catch (error) {
                if (error instanceof AuthError) {
                    error.setCorrelationId(validRequest.correlationId);
                }
                serverTelemetryManager.cacheFailedRequest(error);
                throw error;
            }
        });
    }
    acquireCachedTokenSilent(validRequest, silentFlowClient, clientConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [authResponse, cacheOutcome] = yield silentFlowClient.acquireCachedToken(Object.assign(Object.assign({}, validRequest), { scopes: ((_a = validRequest.scopes) === null || _a === void 0 ? void 0 : _a.length)
                    ? validRequest.scopes
                    : [...OIDC_DEFAULT_SCOPES] }));
            if (cacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                this.logger.info("ClientApplication:acquireCachedTokenSilent - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.");
                // refresh the access token in the background
                const refreshTokenClient = new RefreshTokenClient(clientConfiguration);
                try {
                    yield refreshTokenClient.acquireTokenByRefreshToken(validRequest);
                }
                catch (_b) {
                    // do nothing, this is running in the background and no action is to be taken upon success or failure
                }
            }
            // return the cached token
            return authResponse;
        });
    }
    /**
     * Acquires tokens with password grant by exchanging client applications username and password for credentials
     *
     * The latest OAuth 2.0 Security Best Current Practice disallows the password grant entirely.
     * More details on this recommendation at https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-3.4
     * Microsoft's documentation and recommendations are at:
     * https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows#usernamepassword
     *
     * @param request - UsenamePasswordRequest
     * @deprecated - Use a more secure flow instead
     */
    acquireTokenByUsernamePassword(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("acquireTokenByUsernamePassword called", request.correlationId);
            const validRequest = Object.assign(Object.assign({}, request), (yield this.initializeBaseRequest(request)));
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByUsernamePassword, validRequest.correlationId);
            try {
                const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
                const usernamePasswordClientConfig = yield this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager);
                const usernamePasswordClient = new UsernamePasswordClient(usernamePasswordClientConfig);
                this.logger.verbose("Username password client created", validRequest.correlationId);
                return yield usernamePasswordClient.acquireToken(validRequest);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(validRequest.correlationId);
                }
                serverTelemetryManager.cacheFailedRequest(e);
                throw e;
            }
        });
    }
    /**
     * Gets the token cache for the application.
     */
    getTokenCache() {
        this.logger.info("getTokenCache called");
        return this.tokenCache;
    }
    /**
     * Validates OIDC state by comparing the user cached state with the state received from the server.
     *
     * This API is provided for scenarios where you would use OAuth2.0 state parameter to mitigate against
     * CSRF attacks.
     * For more information about state, visit https://datatracker.ietf.org/doc/html/rfc6819#section-3.6.
     * @param state - Unique GUID generated by the user that is cached by the user and sent to the server during the first leg of the flow
     * @param cachedState - This string is sent back by the server with the authorization code
     */
    validateState(state, cachedState) {
        if (!state) {
            throw NodeAuthError.createStateNotFoundError();
        }
        if (state !== cachedState) {
            throw createClientAuthError(ClientAuthErrorCodes.stateMismatch);
        }
    }
    /**
     * Returns the logger instance
     */
    getLogger() {
        return this.logger;
    }
    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger - Logger instance
     */
    setLogger(logger) {
        this.logger = logger;
    }
    /**
     * Builds the common configuration to be passed to the common component based on the platform configurarion
     * @param authority - user passed authority in configuration
     * @param serverTelemetryManager - initializes servertelemetry if passed
     */
    buildOauthClientConfiguration(discoveredAuthority, requestCorrelationId, redirectUri, serverTelemetryManager) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("buildOauthClientConfiguration called", requestCorrelationId);
            this.logger.info(`Building oauth client configuration with the following authority: ${discoveredAuthority.tokenEndpoint}.`, requestCorrelationId);
            serverTelemetryManager === null || serverTelemetryManager === void 0 ? void 0 : serverTelemetryManager.updateRegionDiscoveryMetadata(discoveredAuthority.regionDiscoveryMetadata);
            const clientConfiguration = {
                authOptions: {
                    clientId: this.config.auth.clientId,
                    authority: discoveredAuthority,
                    clientCapabilities: this.config.auth.clientCapabilities,
                    redirectUri,
                },
                loggerOptions: {
                    logLevel: this.config.system.loggerOptions.logLevel,
                    loggerCallback: this.config.system.loggerOptions.loggerCallback,
                    piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
                    correlationId: requestCorrelationId,
                },
                cacheOptions: {
                    claimsBasedCachingEnabled: this.config.cache.claimsBasedCachingEnabled,
                },
                cryptoInterface: this.cryptoProvider,
                networkInterface: this.config.system.networkClient,
                storageInterface: this.storage,
                serverTelemetryManager: serverTelemetryManager,
                clientCredentials: {
                    clientSecret: this.clientSecret,
                    clientAssertion: yield this.getClientAssertion(discoveredAuthority),
                },
                libraryInfo: {
                    sku: NodeConstants.MSAL_SKU,
                    version: version,
                    cpu: process.arch || Constants.EMPTY_STRING,
                    os: process.platform || Constants.EMPTY_STRING,
                },
                telemetry: this.config.telemetry,
                persistencePlugin: this.config.cache.cachePlugin,
                serializableCache: this.tokenCache,
            };
            return clientConfiguration;
        });
    }
    getClientAssertion(authority) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.developerProvidedClientAssertion) {
                this.clientAssertion = ClientAssertion.fromAssertion(yield getClientAssertion(this.developerProvidedClientAssertion, this.config.auth.clientId, authority.tokenEndpoint));
            }
            return (this.clientAssertion && {
                assertion: this.clientAssertion.getJwt(this.cryptoProvider, this.config.auth.clientId, authority.tokenEndpoint),
                assertionType: NodeConstants.JWT_BEARER_ASSERTION_TYPE,
            });
        });
    }
    /**
     * Generates a request with the default scopes & generates a correlationId.
     * @param authRequest - BaseAuthRequest for initialization
     */
    initializeBaseRequest(authRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("initializeRequestScopes called", authRequest.correlationId);
            // Default authenticationScheme to Bearer, log that POP isn't supported yet
            if (authRequest.authenticationScheme &&
                authRequest.authenticationScheme === AuthenticationScheme.POP) {
                this.logger.verbose("Authentication Scheme 'pop' is not supported yet, setting Authentication Scheme to 'Bearer' for request", authRequest.correlationId);
            }
            authRequest.authenticationScheme = AuthenticationScheme.BEARER;
            // Set requested claims hash if claims-based caching is enabled and claims were requested
            if (this.config.cache.claimsBasedCachingEnabled &&
                authRequest.claims &&
                // Checks for empty stringified object "{}" which doesn't qualify as requested claims
                !StringUtils.isEmptyObj(authRequest.claims)) {
                authRequest.requestedClaimsHash =
                    yield this.cryptoProvider.hashString(authRequest.claims);
            }
            return Object.assign(Object.assign({}, authRequest), { scopes: [
                    ...((authRequest && authRequest.scopes) || []),
                    ...OIDC_DEFAULT_SCOPES,
                ], correlationId: (authRequest && authRequest.correlationId) ||
                    this.cryptoProvider.createNewGuid(), authority: authRequest.authority || this.config.auth.authority });
        });
    }
    /**
     * Initializes the server telemetry payload
     * @param apiId - Id for a specific request
     * @param correlationId - GUID
     * @param forceRefresh - boolean to indicate network call
     */
    initializeServerTelemetryManager(apiId, correlationId, forceRefresh) {
        const telemetryPayload = {
            clientId: this.config.auth.clientId,
            correlationId: correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false,
        };
        return new ServerTelemetryManager(telemetryPayload, this.storage);
    }
    /**
     * Create authority instance. If authority not passed in request, default to authority set on the application
     * object. If no authority set in application object, then default to common authority.
     * @param authorityString - authority from user configuration
     */
    createAuthority(authorityString, requestCorrelationId, azureRegionConfiguration, azureCloudOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.verbose("createAuthority called", requestCorrelationId);
            // build authority string based on auth params - azureCloudInstance is prioritized if provided
            const authorityUrl = Authority.generateAuthority(authorityString, azureCloudOptions || this.config.auth.azureCloudOptions);
            const authorityOptions = {
                protocolMode: this.config.auth.protocolMode,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                authorityMetadata: this.config.auth.authorityMetadata,
                azureRegionConfiguration,
                skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache,
            };
            return AuthorityFactory.createDiscoveredInstance(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions, this.logger, requestCorrelationId);
        });
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.storage.clear();
    }
}
