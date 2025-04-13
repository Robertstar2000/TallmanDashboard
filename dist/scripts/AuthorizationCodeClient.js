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
import { BaseClient } from "./BaseClient.js";
import * as RequestParameterBuilder from "../request/RequestParameterBuilder.js";
import * as UrlUtils from "../utils/UrlUtils.js";
import { GrantType, AuthenticationScheme, Separators, HeaderNames, } from "../utils/Constants.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { isOidcProtocolMode, } from "../config/ClientConfiguration.js";
import { ResponseHandler } from "../response/ResponseHandler.js";
import { StringUtils } from "../utils/StringUtils.js";
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
import { UrlString } from "../url/UrlString.js";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import { buildClientInfoFromHomeAccountId, buildClientInfo, } from "../account/ClientInfo.js";
import { CcsCredentialType } from "../account/CcsCredential.js";
import { createClientConfigurationError, ClientConfigurationErrorCodes, } from "../error/ClientConfigurationError.js";
import { RequestValidator } from "../request/RequestValidator.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { invokeAsync } from "../utils/FunctionWrappers.js";
import { getClientAssertion } from "../utils/ClientAssertionUtils.js";
import { getRequestThumbprint } from "../network/RequestThumbprint.js";
/**
 * Oauth2.0 Authorization Code client
 * @internal
 */
export class AuthorizationCodeClient extends BaseClient {
    constructor(configuration, performanceClient) {
        var _a;
        super(configuration, performanceClient);
        // Flag to indicate if client is for hybrid spa auth code redemption
        this.includeRedirectUri = true;
        this.oidcDefaultScopes =
            (_a = this.config.authOptions.authority.options.OIDCOptions) === null || _a === void 0 ? void 0 : _a.defaultScopes;
    }
    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    acquireToken(request, authCodePayload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.AuthClientAcquireToken, request.correlationId);
            if (!request.code) {
                throw createClientAuthError(ClientAuthErrorCodes.requestCannotBeMade);
            }
            const reqTimestamp = TimeUtils.nowSeconds();
            const response = yield invokeAsync(this.executeTokenRequest.bind(this), PerformanceEvents.AuthClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(this.authority, request);
            // Retrieve requestId from response headers
            const requestId = (_b = response.headers) === null || _b === void 0 ? void 0 : _b[HeaderNames.X_MS_REQUEST_ID];
            const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.config.serializableCache, this.config.persistencePlugin, this.performanceClient);
            // Validate response. This function throws a server error if an error is returned by the server.
            responseHandler.validateTokenResponse(response.body);
            return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), PerformanceEvents.HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, authCodePayload, undefined, undefined, undefined, requestId);
        });
    }
    /**
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    getLogoutUri(logoutRequest) {
        // Throw error if logoutRequest is null/undefined
        if (!logoutRequest) {
            throw createClientConfigurationError(ClientConfigurationErrorCodes.logoutRequestEmpty);
        }
        const queryString = this.createLogoutUrlQueryString(logoutRequest);
        // Construct logout URI
        return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
    }
    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    executeTokenRequest(authority, request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.AuthClientExecuteTokenRequest, request.correlationId);
            const queryParametersString = this.createTokenQueryParameters(request);
            const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
            const requestBody = yield invokeAsync(this.createTokenRequestBody.bind(this), PerformanceEvents.AuthClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
            let ccsCredential = undefined;
            if (request.clientInfo) {
                try {
                    const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
                    ccsCredential = {
                        credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                        type: CcsCredentialType.HOME_ACCOUNT_ID,
                    };
                }
                catch (e) {
                    this.logger.verbose("Could not parse client info for CCS Header: " + e);
                }
            }
            const headers = this.createTokenRequestHeaders(ccsCredential || request.ccsCredential);
            const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
            return invokeAsync(this.executePostToTokenEndpoint.bind(this), PerformanceEvents.AuthorizationCodeClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, PerformanceEvents.AuthorizationCodeClientExecutePostToTokenEndpoint);
        });
    }
    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    createTokenRequestBody(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.AuthClientCreateTokenRequestBody, request.correlationId);
            const parameters = new Map();
            RequestParameterBuilder.addClientId(parameters, request.embeddedClientId ||
                ((_b = request.tokenBodyParameters) === null || _b === void 0 ? void 0 : _b[AADServerParamKeys.CLIENT_ID]) ||
                this.config.authOptions.clientId);
            /*
             * For hybrid spa flow, there will be a code but no verifier
             * In this scenario, don't include redirect uri as auth code will not be bound to redirect URI
             */
            if (!this.includeRedirectUri) {
                // Just validate
                RequestValidator.validateRedirectUri(request.redirectUri);
            }
            else {
                // Validate and include redirect uri
                RequestParameterBuilder.addRedirectUri(parameters, request.redirectUri);
            }
            // Add scope array, parameter builder will add default scopes and dedupe
            RequestParameterBuilder.addScopes(parameters, request.scopes, true, this.oidcDefaultScopes);
            // add code: user set, not validated
            RequestParameterBuilder.addAuthorizationCode(parameters, request.code);
            // Add library metadata
            RequestParameterBuilder.addLibraryInfo(parameters, this.config.libraryInfo);
            RequestParameterBuilder.addApplicationTelemetry(parameters, this.config.telemetry.application);
            RequestParameterBuilder.addThrottling(parameters);
            if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
                RequestParameterBuilder.addServerTelemetry(parameters, this.serverTelemetryManager);
            }
            // add code_verifier if passed
            if (request.codeVerifier) {
                RequestParameterBuilder.addCodeVerifier(parameters, request.codeVerifier);
            }
            if (this.config.clientCredentials.clientSecret) {
                RequestParameterBuilder.addClientSecret(parameters, this.config.clientCredentials.clientSecret);
            }
            if (this.config.clientCredentials.clientAssertion) {
                const clientAssertion = this.config.clientCredentials.clientAssertion;
                RequestParameterBuilder.addClientAssertion(parameters, yield getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
                RequestParameterBuilder.addClientAssertionType(parameters, clientAssertion.assertionType);
            }
            RequestParameterBuilder.addGrantType(parameters, GrantType.AUTHORIZATION_CODE_GRANT);
            RequestParameterBuilder.addClientInfo(parameters);
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
            let ccsCred = undefined;
            if (request.clientInfo) {
                try {
                    const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
                    ccsCred = {
                        credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                        type: CcsCredentialType.HOME_ACCOUNT_ID,
                    };
                }
                catch (e) {
                    this.logger.verbose("Could not parse client info for CCS Header: " + e);
                }
            }
            else {
                ccsCred = request.ccsCredential;
            }
            // Adds these as parameters in the request instead of headers to prevent CORS preflight request
            if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
                switch (ccsCred.type) {
                    case CcsCredentialType.HOME_ACCOUNT_ID:
                        try {
                            const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                            RequestParameterBuilder.addCcsOid(parameters, clientInfo);
                        }
                        catch (e) {
                            this.logger.verbose("Could not parse home account ID for CCS Header: " +
                                e);
                        }
                        break;
                    case CcsCredentialType.UPN:
                        RequestParameterBuilder.addCcsUpn(parameters, ccsCred.credential);
                        break;
                }
            }
            if (request.embeddedClientId) {
                RequestParameterBuilder.addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
            }
            if (request.tokenBodyParameters) {
                RequestParameterBuilder.addExtraQueryParameters(parameters, request.tokenBodyParameters);
            }
            // Add hybrid spa parameters if not already provided
            if (request.enableSpaAuthorizationCode &&
                (!request.tokenBodyParameters ||
                    !request.tokenBodyParameters[AADServerParamKeys.RETURN_SPA_CODE])) {
                RequestParameterBuilder.addExtraQueryParameters(parameters, {
                    [AADServerParamKeys.RETURN_SPA_CODE]: "1",
                });
            }
            RequestParameterBuilder.instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
            return UrlUtils.mapToQueryString(parameters);
        });
    }
    /**
     * This API validates the `EndSessionRequest` and creates a URL
     * @param request
     */
    createLogoutUrlQueryString(request) {
        const parameters = new Map();
        if (request.postLogoutRedirectUri) {
            RequestParameterBuilder.addPostLogoutRedirectUri(parameters, request.postLogoutRedirectUri);
        }
        if (request.correlationId) {
            RequestParameterBuilder.addCorrelationId(parameters, request.correlationId);
        }
        if (request.idTokenHint) {
            RequestParameterBuilder.addIdTokenHint(parameters, request.idTokenHint);
        }
        if (request.state) {
            RequestParameterBuilder.addState(parameters, request.state);
        }
        if (request.logoutHint) {
            RequestParameterBuilder.addLogoutHint(parameters, request.logoutHint);
        }
        if (request.extraQueryParameters) {
            RequestParameterBuilder.addExtraQueryParameters(parameters, request.extraQueryParameters);
        }
        if (this.config.authOptions.instanceAware) {
            RequestParameterBuilder.addInstanceAware(parameters);
        }
        return UrlUtils.mapToQueryString(parameters);
    }
}
