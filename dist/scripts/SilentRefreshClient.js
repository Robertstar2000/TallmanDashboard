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
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import { RefreshTokenClient, PerformanceEvents, invokeAsync, } from "@azure/msal-common/browser";
import { ApiId } from "../utils/BrowserConstants.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { initializeBaseRequest } from "../request/RequestHelpers.js";
export class SilentRefreshClient extends StandardInteractionClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request
     */
    acquireToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentRefreshClientAcquireToken, request.correlationId);
            const baseRequest = yield invokeAsync(initializeBaseRequest, PerformanceEvents.InitializeBaseRequest, this.logger, this.performanceClient, request.correlationId)(request, this.config, this.performanceClient, this.logger);
            const silentRequest = Object.assign(Object.assign({}, request), baseRequest);
            if (request.redirectUri) {
                // Make sure any passed redirectUri is converted to an absolute URL - redirectUri is not a required parameter for refresh token redemption so only include if explicitly provided
                silentRequest.redirectUri = this.getRedirectUri(request.redirectUri);
            }
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
            const refreshTokenClient = yield this.createRefreshTokenClient({
                serverTelemetryManager,
                authorityUrl: silentRequest.authority,
                azureCloudOptions: silentRequest.azureCloudOptions,
                account: silentRequest.account,
            });
            // Send request to renew token. Auth module will throw errors if token cannot be renewed.
            return invokeAsync(refreshTokenClient.acquireTokenByRefreshToken.bind(refreshTokenClient), PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken, this.logger, this.performanceClient, request.correlationId)(silentRequest).catch((e) => {
                e.setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
                throw e;
            });
        });
    }
    /**
     * Currently Unsupported
     */
    logout() {
        // Synchronous so we must reject
        return Promise.reject(createBrowserAuthError(BrowserAuthErrorCodes.silentLogoutUnsupported));
    }
    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param params {
     *         serverTelemetryManager: ServerTelemetryManager;
     *         authorityUrl?: string;
     *         azureCloudOptions?: AzureCloudOptions;
     *         extraQueryParams?: StringDict;
     *         account?: AccountInfo;
     *        }
     */
    createRefreshTokenClient(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create auth module.
            const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)({
                serverTelemetryManager: params.serverTelemetryManager,
                requestAuthority: params.authorityUrl,
                requestAzureCloudOptions: params.azureCloudOptions,
                requestExtraQueryParameters: params.extraQueryParameters,
                account: params.account,
            });
            return new RefreshTokenClient(clientConfig, this.performanceClient);
        });
    }
}
