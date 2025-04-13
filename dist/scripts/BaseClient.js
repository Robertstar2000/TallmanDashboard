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
import { buildClientConfiguration, } from "../config/ClientConfiguration.js";
import { Logger } from "../logger/Logger.js";
import { Constants, HeaderNames } from "../utils/Constants.js";
import { version, name } from "../packageMetadata.js";
import { CcsCredentialType } from "../account/CcsCredential.js";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo.js";
import * as RequestParameterBuilder from "../request/RequestParameterBuilder.js";
import * as UrlUtils from "../utils/UrlUtils.js";
import { createDiscoveredInstance } from "../authority/AuthorityFactory.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { ThrottlingUtils } from "../network/ThrottlingUtils.js";
import { AuthError } from "../error/AuthError.js";
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
import { NetworkError } from "../error/NetworkError.js";
import { invokeAsync } from "../utils/FunctionWrappers.js";
/**
 * Base application class which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * @internal
 */
export class BaseClient {
    constructor(configuration, performanceClient) {
        // Set the configuration
        this.config = buildClientConfiguration(configuration);
        // Initialize the logger
        this.logger = new Logger(this.config.loggerOptions, name, version);
        // Initialize crypto
        this.cryptoUtils = this.config.cryptoInterface;
        // Initialize storage interface
        this.cacheManager = this.config.storageInterface;
        // Set the network interface
        this.networkClient = this.config.networkInterface;
        // Set TelemetryManager
        this.serverTelemetryManager = this.config.serverTelemetryManager;
        // set Authority
        this.authority = this.config.authOptions.authority;
        // set performance telemetry client
        this.performanceClient = performanceClient;
    }
    /**
     * Creates default headers for requests to token endpoint
     */
    createTokenRequestHeaders(ccsCred) {
        const headers = {};
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
        if (!this.config.systemOptions.preventCorsPreflight && ccsCred) {
            switch (ccsCred.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                        headers[HeaderNames.CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
                    }
                    catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " +
                            e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    headers[HeaderNames.CCS_HEADER] = `UPN: ${ccsCred.credential}`;
                    break;
            }
        }
        return headers;
    }
    /**
     * Http post to token endpoint
     * @param tokenEndpoint
     * @param queryString
     * @param headers
     * @param thumbprint
     */
    executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, queuedEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (queuedEvent) {
                (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(queuedEvent, correlationId);
            }
            const response = yield this.sendPostRequest(thumbprint, tokenEndpoint, { body: queryString, headers: headers }, correlationId);
            if (this.config.serverTelemetryManager &&
                response.status < 500 &&
                response.status !== 429) {
                // Telemetry data successfully logged by server, clear Telemetry cache
                this.config.serverTelemetryManager.clearTelemetryCache();
            }
            return response;
        });
    }
    /**
     * Wraps sendPostRequestAsync with necessary preflight and postflight logic
     * @param thumbprint - Request thumbprint for throttling
     * @param tokenEndpoint - Endpoint to make the POST to
     * @param options - Body and Headers to include on the POST request
     * @param correlationId - CorrelationId for telemetry
     */
    sendPostRequest(thumbprint, tokenEndpoint, options, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            ThrottlingUtils.preProcess(this.cacheManager, thumbprint);
            let response;
            try {
                response = yield invokeAsync((this.networkClient.sendPostRequestAsync.bind(this.networkClient)), PerformanceEvents.NetworkClientSendPostRequestAsync, this.logger, this.performanceClient, correlationId)(tokenEndpoint, options);
                const responseHeaders = response.headers || {};
                (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addFields({
                    refreshTokenSize: ((_b = response.body.refresh_token) === null || _b === void 0 ? void 0 : _b.length) || 0,
                    httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
                    requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] || "",
                }, correlationId);
            }
            catch (e) {
                if (e instanceof NetworkError) {
                    const responseHeaders = e.responseHeaders;
                    if (responseHeaders) {
                        (_c = this.performanceClient) === null || _c === void 0 ? void 0 : _c.addFields({
                            httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
                            requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] ||
                                "",
                            contentTypeHeader: responseHeaders[HeaderNames.CONTENT_TYPE] ||
                                undefined,
                            contentLengthHeader: responseHeaders[HeaderNames.CONTENT_LENGTH] ||
                                undefined,
                            httpStatus: e.httpStatus,
                        }, correlationId);
                    }
                    throw e.error;
                }
                if (e instanceof AuthError) {
                    throw e;
                }
                else {
                    throw createClientAuthError(ClientAuthErrorCodes.networkError);
                }
            }
            ThrottlingUtils.postProcess(this.cacheManager, thumbprint, response);
            return response;
        });
    }
    /**
     * Updates the authority object of the client. Endpoint discovery must be completed.
     * @param updatedAuthority
     */
    updateAuthority(cloudInstanceHostname, correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.UpdateTokenEndpointAuthority, correlationId);
            const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${this.authority.tenant}/`;
            const cloudInstanceAuthority = yield createDiscoveredInstance(cloudInstanceAuthorityUri, this.networkClient, this.cacheManager, this.authority.options, this.logger, correlationId, this.performanceClient);
            this.authority = cloudInstanceAuthority;
        });
    }
    /**
     * Creates query string for the /token request
     * @param request
     */
    createTokenQueryParameters(request) {
        const parameters = new Map();
        if (request.embeddedClientId) {
            RequestParameterBuilder.addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
        }
        if (request.tokenQueryParameters) {
            RequestParameterBuilder.addExtraQueryParameters(parameters, request.tokenQueryParameters);
        }
        RequestParameterBuilder.addCorrelationId(parameters, request.correlationId);
        RequestParameterBuilder.instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
        return UrlUtils.mapToQueryString(parameters);
    }
}
