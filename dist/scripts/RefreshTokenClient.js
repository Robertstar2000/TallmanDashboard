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
import { isOidcProtocolMode, } from "../config/ClientConfiguration.js";
import { BaseClient } from "./BaseClient.js";
import * as RequestParameterBuilder from "../request/RequestParameterBuilder.js";
import * as UrlUtils from "../utils/UrlUtils.js";
import { GrantType, AuthenticationScheme, Errors, HeaderNames, } from "../utils/Constants.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { ResponseHandler } from "../response/ResponseHandler.js";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator.js";
import { StringUtils } from "../utils/StringUtils.js";
import { createClientConfigurationError, ClientConfigurationErrorCodes, } from "../error/ClientConfigurationError.js";
import { createClientAuthError, ClientAuthErrorCodes, } from "../error/ClientAuthError.js";
import { ServerError } from "../error/ServerError.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import { UrlString } from "../url/UrlString.js";
import { CcsCredentialType } from "../account/CcsCredential.js";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo.js";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorCodes, createInteractionRequiredAuthError, } from "../error/InteractionRequiredAuthError.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { invoke, invokeAsync } from "../utils/FunctionWrappers.js";
import { generateCredentialKey } from "../cache/utils/CacheHelpers.js";
import { getClientAssertion } from "../utils/ClientAssertionUtils.js";
import { getRequestThumbprint } from "../network/RequestThumbprint.js";
const DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS = 300; // 5 Minutes
/**
 * OAuth2.0 refresh token client
 * @internal
 */
export class RefreshTokenClient extends BaseClient {
    constructor(configuration, performanceClient) {
        super(configuration, performanceClient);
    }
    acquireToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireToken, request.correlationId);
            const reqTimestamp = TimeUtils.nowSeconds();
            const response = yield invokeAsync(this.executeTokenRequest.bind(this), PerformanceEvents.RefreshTokenClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(request, this.authority);
            // Retrieve requestId from response headers
            const requestId = (_b = response.headers) === null || _b === void 0 ? void 0 : _b[HeaderNames.X_MS_REQUEST_ID];
            const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin);
            responseHandler.validateTokenResponse(response.body);
            return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), PerformanceEvents.HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, undefined, undefined, true, request.forceCache, requestId);
        });
    }
    /**
     * Gets cached refresh token and attaches to request, then calls acquireToken API
     * @param request
     */
    acquireTokenByRefreshToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Cannot renew token if no request object is given.
            if (!request) {
                throw createClientConfigurationError(ClientConfigurationErrorCodes.tokenRequestEmpty);
            }
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken, request.correlationId);
            // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
            if (!request.account) {
                throw createClientAuthError(ClientAuthErrorCodes.noAccountInSilentRequest);
            }
            // try checking if FOCI is enabled for the given application
            const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment);
            // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
            if (isFOCI) {
                try {
                    return yield invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, true);
                }
                catch (e) {
                    const noFamilyRTInCache = e instanceof InteractionRequiredAuthError &&
                        e.errorCode ===
                            InteractionRequiredAuthErrorCodes.noTokensFound;
                    const clientMismatchErrorWithFamilyRT = e instanceof ServerError &&
                        e.errorCode === Errors.INVALID_GRANT_ERROR &&
                        e.subError === Errors.CLIENT_MISMATCH_ERROR;
                    // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                    if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                        return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false);
                        // throw in all other cases
                    }
                    else {
                        throw e;
                    }
                }
            }
            // fall back to application refresh token acquisition
            return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false);
        });
    }
    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    acquireTokenWithCachedRefreshToken(request, foci) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
            // fetches family RT or application RT based on FOCI value
            const refreshToken = invoke(this.cacheManager.getRefreshToken.bind(this.cacheManager), PerformanceEvents.CacheManagerGetRefreshToken, this.logger, this.performanceClient, request.correlationId)(request.account, foci, undefined, this.performanceClient, request.correlationId);
            if (!refreshToken) {
                throw createInteractionRequiredAuthError(InteractionRequiredAuthErrorCodes.noTokensFound);
            }
            if (refreshToken.expiresOn &&
                TimeUtils.isTokenExpired(refreshToken.expiresOn, request.refreshTokenExpirationOffsetSeconds ||
                    DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS)) {
                (_b = this.performanceClient) === null || _b === void 0 ? void 0 : _b.addFields({ rtExpiresOnMs: Number(refreshToken.expiresOn) }, request.correlationId);
                throw createInteractionRequiredAuthError(InteractionRequiredAuthErrorCodes.refreshTokenExpired);
            }
            // attach cached RT size to the current measurement
            const refreshTokenRequest = Object.assign(Object.assign({}, request), { refreshToken: refreshToken.secret, authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER, ccsCredential: {
                    credential: request.account.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                } });
            try {
                return yield invokeAsync(this.acquireToken.bind(this), PerformanceEvents.RefreshTokenClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(refreshTokenRequest);
            }
            catch (e) {
                if (e instanceof InteractionRequiredAuthError) {
                    (_c = this.performanceClient) === null || _c === void 0 ? void 0 : _c.addFields({ rtExpiresOnMs: Number(refreshToken.expiresOn) }, request.correlationId);
                    if (e.subError === InteractionRequiredAuthErrorCodes.badToken) {
                        // Remove bad refresh token from cache
                        this.logger.verbose("acquireTokenWithRefreshToken: bad refresh token, removing from cache");
                        const badRefreshTokenKey = generateCredentialKey(refreshToken);
                        this.cacheManager.removeRefreshToken(badRefreshTokenKey);
                    }
                }
                throw e;
            }
        });
    }
    /**
     * Constructs the network message and makes a NW call to the underlying secure token service
     * @param request
     * @param authority
     */
    executeTokenRequest(request, authority) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RefreshTokenClientExecuteTokenRequest, request.correlationId);
            const queryParametersString = this.createTokenQueryParameters(request);
            const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
            const requestBody = yield invokeAsync(this.createTokenRequestBody.bind(this), PerformanceEvents.RefreshTokenClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
            const headers = this.createTokenRequestHeaders(request.ccsCredential);
            const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
            return invokeAsync(this.executePostToTokenEndpoint.bind(this), PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint);
        });
    }
    /**
     * Helper function to create the token request body
     * @param request
     */
    createTokenRequestBody(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.RefreshTokenClientCreateTokenRequestBody, request.correlationId);
            const parameters = new Map();
            RequestParameterBuilder.addClientId(parameters, request.embeddedClientId ||
                ((_b = request.tokenBodyParameters) === null || _b === void 0 ? void 0 : _b[AADServerParamKeys.CLIENT_ID]) ||
                this.config.authOptions.clientId);
            if (request.redirectUri) {
                RequestParameterBuilder.addRedirectUri(parameters, request.redirectUri);
            }
            RequestParameterBuilder.addScopes(parameters, request.scopes, true, (_c = this.config.authOptions.authority.options.OIDCOptions) === null || _c === void 0 ? void 0 : _c.defaultScopes);
            RequestParameterBuilder.addGrantType(parameters, GrantType.REFRESH_TOKEN_GRANT);
            RequestParameterBuilder.addClientInfo(parameters);
            RequestParameterBuilder.addLibraryInfo(parameters, this.config.libraryInfo);
            RequestParameterBuilder.addApplicationTelemetry(parameters, this.config.telemetry.application);
            RequestParameterBuilder.addThrottling(parameters);
            if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
                RequestParameterBuilder.addServerTelemetry(parameters, this.serverTelemetryManager);
            }
            RequestParameterBuilder.addRefreshToken(parameters, request.refreshToken);
            if (this.config.clientCredentials.clientSecret) {
                RequestParameterBuilder.addClientSecret(parameters, this.config.clientCredentials.clientSecret);
            }
            if (this.config.clientCredentials.clientAssertion) {
                const clientAssertion = this.config.clientCredentials.clientAssertion;
                RequestParameterBuilder.addClientAssertion(parameters, yield getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
                RequestParameterBuilder.addClientAssertionType(parameters, clientAssertion.assertionType);
            }
            if (request.authenticationScheme === AuthenticationScheme.POP) {
                const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
                let reqCnfData;
                if (!request.popKid) {
                    const generatedReqCnfData = yield invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents.PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger);
                    reqCnfData = generatedReqCnfData.reqCnfString;
                }
                else {
                    reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
                }
                // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
                RequestParameterBuilder.addPopToken(parameters, reqCnfData);
            }
            else if (request.authenticationScheme === AuthenticationScheme.SSH) {
                if (request.sshJwk) {
                    RequestParameterBuilder.addSshJwk(parameters, request.sshJwk);
                }
                else {
                    throw createClientConfigurationError(ClientConfigurationErrorCodes.missingSshJwk);
                }
            }
            if (!StringUtils.isEmptyObj(request.claims) ||
                (this.config.authOptions.clientCapabilities &&
                    this.config.authOptions.clientCapabilities.length > 0)) {
                RequestParameterBuilder.addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities);
            }
            if (this.config.systemOptions.preventCorsPreflight &&
                request.ccsCredential) {
                switch (request.ccsCredential.type) {
                    case CcsCredentialType.HOME_ACCOUNT_ID:
                        try {
                            const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
                            RequestParameterBuilder.addCcsOid(parameters, clientInfo);
                        }
                        catch (e) {
                            this.logger.verbose("Could not parse home account ID for CCS Header: " +
                                e);
                        }
                        break;
                    case CcsCredentialType.UPN:
                        RequestParameterBuilder.addCcsUpn(parameters, request.ccsCredential.credential);
                        break;
                }
            }
            if (request.embeddedClientId) {
                RequestParameterBuilder.addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
            }
            if (request.tokenBodyParameters) {
                RequestParameterBuilder.addExtraQueryParameters(parameters, request.tokenBodyParameters);
            }
            RequestParameterBuilder.instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
            return UrlUtils.mapToQueryString(parameters);
        });
    }
}
