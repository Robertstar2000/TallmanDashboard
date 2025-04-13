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
import { ServerError, PerformanceEvents, invokeAsync, CcsCredentialType, AuthorizeProtocol, } from "@azure/msal-common/browser";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export class InteractionHandler {
    constructor(authCodeModule, storageImpl, authCodeRequest, logger, performanceClient) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }
    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    handleCodeResponse(response, request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.HandleCodeResponse, request.correlationId);
            let authCodeResponse;
            try {
                authCodeResponse = AuthorizeProtocol.getAuthorizationCodePayload(response, request.state);
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
            return invokeAsync(this.handleCodeResponseFromServer.bind(this), PerformanceEvents.HandleCodeResponseFromServer, this.logger, this.performanceClient, request.correlationId)(authCodeResponse, request);
        });
    }
    /**
     * Process auth code response from AAD
     * @param authCodeResponse
     * @param state
     * @param authority
     * @param networkModule
     * @returns
     */
    handleCodeResponseFromServer(authCodeResponse_1, request_1) {
        return __awaiter(this, arguments, void 0, function* (authCodeResponse, request, validateNonce = true) {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.HandleCodeResponseFromServer, request.correlationId);
            this.logger.trace("InteractionHandler.handleCodeResponseFromServer called");
            // Assign code to request
            this.authCodeRequest.code = authCodeResponse.code;
            // Check for new cloud instance
            if (authCodeResponse.cloud_instance_host_name) {
                yield invokeAsync(this.authModule.updateAuthority.bind(this.authModule), PerformanceEvents.UpdateTokenEndpointAuthority, this.logger, this.performanceClient, request.correlationId)(authCodeResponse.cloud_instance_host_name, request.correlationId);
            }
            // Nonce validation not needed when redirect not involved (e.g. hybrid spa, renewing token via rt)
            if (validateNonce) {
                // TODO: Assigning "response nonce" to "request nonce" is confusing. Refactor the function doing validation to accept request nonce directly
                authCodeResponse.nonce = request.nonce || undefined;
            }
            authCodeResponse.state = request.state;
            // Add CCS parameters if available
            if (authCodeResponse.client_info) {
                this.authCodeRequest.clientInfo = authCodeResponse.client_info;
            }
            else {
                const ccsCred = this.createCcsCredentials(request);
                if (ccsCred) {
                    this.authCodeRequest.ccsCredential = ccsCred;
                }
            }
            // Acquire token with retrieved code.
            const tokenResponse = (yield invokeAsync(this.authModule.acquireToken.bind(this.authModule), PerformanceEvents.AuthClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(this.authCodeRequest, authCodeResponse));
            return tokenResponse;
        });
    }
    /**
     * Build ccs creds if available
     */
    createCcsCredentials(request) {
        if (request.account) {
            return {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            };
        }
        else if (request.loginHint) {
            return {
                credential: request.loginHint,
                type: CcsCredentialType.UPN,
            };
        }
        return null;
    }
}
