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
import { AuthError, PerformanceEvents, invokeAsync, } from "@azure/msal-common/browser";
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { InteractionType } from "../utils/BrowserConstants.js";
import { HybridSpaAuthorizationCodeClient } from "./HybridSpaAuthorizationCodeClient.js";
import { InteractionHandler } from "../interaction_handler/InteractionHandler.js";
export class SilentAuthCodeClient extends StandardInteractionClient {
    constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, nativeMessageHandler, correlationId) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.apiId = apiId;
    }
    /**
     * Acquires a token silently by redeeming an authorization code against the /token endpoint
     * @param request
     */
    acquireToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Auth code payload is required
            if (!request.code) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.authCodeRequired);
            }
            // Create silent request
            const silentRequest = yield invokeAsync(this.initializeAuthorizationRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, request.correlationId)(request, InteractionType.Silent);
            const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);
            try {
                // Create auth code request (PKCE not needed)
                const authCodeRequest = Object.assign(Object.assign({}, silentRequest), { code: request.code });
                // Initialize the client
                const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, request.correlationId)({
                    serverTelemetryManager,
                    requestAuthority: silentRequest.authority,
                    requestAzureCloudOptions: silentRequest.azureCloudOptions,
                    requestExtraQueryParameters: silentRequest.extraQueryParameters,
                    account: silentRequest.account,
                });
                const authClient = new HybridSpaAuthorizationCodeClient(clientConfig);
                this.logger.verbose("Auth code client created");
                // Create silent handler
                const interactionHandler = new InteractionHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.performanceClient);
                // Handle auth code parameters from request
                return yield invokeAsync(interactionHandler.handleCodeResponseFromServer.bind(interactionHandler), PerformanceEvents.HandleCodeResponseFromServer, this.logger, this.performanceClient, request.correlationId)({
                    code: request.code,
                    msgraph_host: request.msGraphHost,
                    cloud_graph_host_name: request.cloudGraphHostName,
                    cloud_instance_host_name: request.cloudInstanceHostName,
                }, silentRequest, false);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(this.correlationId);
                    serverTelemetryManager.cacheFailedRequest(e);
                }
                throw e;
            }
        });
    }
    /**
     * Currently Unsupported
     */
    logout() {
        // Synchronous so we must reject
        return Promise.reject(createBrowserAuthError(BrowserAuthErrorCodes.silentLogoutUnsupported));
    }
}
