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
import { AuthError, ClientAuthErrorCodes, Constants, HeaderNames, ResponseHandler, TimeUtils, createClientAuthError, UrlString, } from "@azure/msal-common/node";
import { HttpMethod, ManagedIdentityIdType } from "../../utils/Constants.js";
import { ManagedIdentityErrorCodes, createManagedIdentityError, } from "../../error/ManagedIdentityError.js";
import { isIso8601 } from "../../utils/TimeUtils.js";
import { HttpClientWithRetries } from "../../network/HttpClientWithRetries.js";
/**
 * Managed Identity User Assigned Id Query Parameter Names
 */
export const ManagedIdentityUserAssignedIdQueryParameterNames = {
    MANAGED_IDENTITY_CLIENT_ID: "client_id",
    MANAGED_IDENTITY_OBJECT_ID: "object_id",
    MANAGED_IDENTITY_RESOURCE_ID_IMDS: "msi_res_id",
    MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS: "mi_res_id",
};
export class BaseManagedIdentitySource {
    constructor(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
        this.disableInternalRetries = disableInternalRetries;
    }
    getServerTokenResponseAsync(response, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkClient, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkRequest, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkRequestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getServerTokenResponse(response);
        });
    }
    getServerTokenResponse(response) {
        var _a, _b;
        let refreshIn, expiresIn;
        if (response.body.expires_on) {
            // if the expires_on field in the response body is a string and in ISO 8601 format, convert it to a Unix timestamp (seconds since epoch)
            if (isIso8601(response.body.expires_on)) {
                response.body.expires_on =
                    new Date(response.body.expires_on).getTime() / 1000;
            }
            expiresIn = response.body.expires_on - TimeUtils.nowSeconds();
            // compute refresh_in as 1/2 of expires_in, but only if expires_in > 2h
            if (expiresIn > 2 * 3600) {
                refreshIn = expiresIn / 2;
            }
        }
        const serverTokenResponse = {
            status: response.status,
            // success
            access_token: response.body.access_token,
            expires_in: expiresIn,
            scope: response.body.resource,
            token_type: response.body.token_type,
            refresh_in: refreshIn,
            // error
            correlation_id: response.body.correlation_id || response.body.correlationId,
            error: typeof response.body.error === "string"
                ? response.body.error
                : (_a = response.body.error) === null || _a === void 0 ? void 0 : _a.code,
            error_description: response.body.message ||
                (typeof response.body.error === "string"
                    ? response.body.error_description
                    : (_b = response.body.error) === null || _b === void 0 ? void 0 : _b.message),
            error_codes: response.body.error_codes,
            timestamp: response.body.timestamp,
            trace_id: response.body.trace_id,
        };
        return serverTokenResponse;
    }
    acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkRequest = this.createRequest(managedIdentityRequest.resource, managedIdentityId);
            const headers = networkRequest.headers;
            headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
            const networkRequestOptions = { headers };
            if (Object.keys(networkRequest.bodyParameters).length) {
                networkRequestOptions.body =
                    networkRequest.computeParametersBodyString();
            }
            /**
             * Initializes the network client helper based on the retry policy configuration.
             * If internal retries are disabled, it uses the provided network client directly.
             * Otherwise, it wraps the network client with an HTTP client that supports retries.
             */
            const networkClientHelper = this.disableInternalRetries
                ? this.networkClient
                : new HttpClientWithRetries(this.networkClient, networkRequest.retryPolicy);
            const reqTimestamp = TimeUtils.nowSeconds();
            let response;
            try {
                // Sources that send POST requests: Cloud Shell
                if (networkRequest.httpMethod === HttpMethod.POST) {
                    response =
                        yield networkClientHelper.sendPostRequestAsync(networkRequest.computeUri(), networkRequestOptions);
                    // Sources that send GET requests: App Service, Azure Arc, IMDS, Service Fabric
                }
                else {
                    response =
                        yield networkClientHelper.sendGetRequestAsync(networkRequest.computeUri(), networkRequestOptions);
                }
            }
            catch (error) {
                if (error instanceof AuthError) {
                    throw error;
                }
                else {
                    throw createClientAuthError(ClientAuthErrorCodes.networkError);
                }
            }
            const responseHandler = new ResponseHandler(managedIdentityId.id, this.nodeStorage, this.cryptoProvider, this.logger, null, null);
            const serverTokenResponse = yield this.getServerTokenResponseAsync(response, networkClientHelper, networkRequest, networkRequestOptions);
            responseHandler.validateTokenResponse(serverTokenResponse, refreshAccessToken);
            // caches the token
            return responseHandler.handleServerTokenResponse(serverTokenResponse, fakeAuthority, reqTimestamp, managedIdentityRequest);
        });
    }
    getManagedIdentityUserAssignedIdQueryParameterKey(managedIdentityIdType, imds) {
        switch (managedIdentityIdType) {
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info("[Managed Identity] Adding user assigned client id to the request.");
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;
            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info("[Managed Identity] Adding user assigned resource id to the request.");
                return imds
                    ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS
                    : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS;
            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info("[Managed Identity] Adding user assigned object id to the request.");
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
            default:
                throw createManagedIdentityError(ManagedIdentityErrorCodes.invalidManagedIdentityIdType);
        }
    }
}
BaseManagedIdentitySource.getValidatedEnvVariableUrlString = (envVariableStringName, envVariable, sourceName, logger) => {
    try {
        return new UrlString(envVariable).urlString;
    }
    catch (error) {
        logger.info(`[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`);
        throw createManagedIdentityError(ManagedIdentityErrorCodes
            .MsiEnvironmentVariableUrlMalformedErrorCodes[envVariableStringName]);
    }
};
