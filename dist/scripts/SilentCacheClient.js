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
import { SilentFlowClient, PerformanceEvents, invokeAsync, } from "@azure/msal-common/browser";
import { ApiId } from "../utils/BrowserConstants.js";
import { BrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
export class SilentCacheClient extends StandardInteractionClient {
    /**
     * Returns unexpired tokens from the cache, if available
     * @param silentRequest
     */
    acquireToken(silentRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.SilentCacheClientAcquireToken, silentRequest.correlationId);
            // Telemetry manager only used to increment cacheHits here
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
            const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)({
                serverTelemetryManager,
                requestAuthority: silentRequest.authority,
                requestAzureCloudOptions: silentRequest.azureCloudOptions,
                account: silentRequest.account,
            });
            const silentAuthClient = new SilentFlowClient(clientConfig, this.performanceClient);
            this.logger.verbose("Silent auth client created");
            try {
                const response = yield invokeAsync(silentAuthClient.acquireCachedToken.bind(silentAuthClient), PerformanceEvents.SilentFlowClientAcquireCachedToken, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest);
                const authResponse = response[0];
                this.performanceClient.addFields({
                    fromCache: true,
                }, silentRequest.correlationId);
                return authResponse;
            }
            catch (error) {
                if (error instanceof BrowserAuthError &&
                    error.errorCode === BrowserAuthErrorCodes.cryptoKeyNotFound) {
                    this.logger.verbose("Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair.");
                }
                throw error;
            }
        });
    }
    /**
     * API to silenty clear the browser cache.
     * @param logoutRequest
     */
    logout(logoutRequest) {
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        return this.clearCacheOnLogout(validLogoutRequest === null || validLogoutRequest === void 0 ? void 0 : validLogoutRequest.account);
    }
}
