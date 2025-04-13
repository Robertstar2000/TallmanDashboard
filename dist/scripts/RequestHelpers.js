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
import { AuthenticationScheme, ClientConfigurationErrorCodes, PerformanceEvents, StringUtils, createClientConfigurationError, invokeAsync, } from "@azure/msal-common/browser";
import { hashString } from "../crypto/BrowserCrypto.js";
/**
 * Initializer function for all request APIs
 * @param request
 */
export function initializeBaseRequest(request, config, performanceClient, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        performanceClient.addQueueMeasurement(PerformanceEvents.InitializeBaseRequest, request.correlationId);
        const authority = request.authority || config.auth.authority;
        const scopes = [...((request && request.scopes) || [])];
        const validatedRequest = Object.assign(Object.assign({}, request), { correlationId: request.correlationId, authority,
            scopes });
        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!validatedRequest.authenticationScheme) {
            validatedRequest.authenticationScheme = AuthenticationScheme.BEARER;
            logger.verbose('Authentication Scheme wasn\'t explicitly set in request, defaulting to "Bearer" request');
        }
        else {
            if (validatedRequest.authenticationScheme === AuthenticationScheme.SSH) {
                if (!request.sshJwk) {
                    throw createClientConfigurationError(ClientConfigurationErrorCodes.missingSshJwk);
                }
                if (!request.sshKid) {
                    throw createClientConfigurationError(ClientConfigurationErrorCodes.missingSshKid);
                }
            }
            logger.verbose(`Authentication Scheme set to "${validatedRequest.authenticationScheme}" as configured in Auth request`);
        }
        // Set requested claims hash if claims-based caching is enabled and claims were requested
        if (config.cache.claimsBasedCachingEnabled &&
            request.claims &&
            // Checks for empty stringified object "{}" which doesn't qualify as requested claims
            !StringUtils.isEmptyObj(request.claims)) {
            validatedRequest.requestedClaimsHash = yield hashString(request.claims);
        }
        return validatedRequest;
    });
}
export function initializeSilentRequest(request, account, config, performanceClient, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        performanceClient.addQueueMeasurement(PerformanceEvents.InitializeSilentRequest, request.correlationId);
        const baseRequest = yield invokeAsync(initializeBaseRequest, PerformanceEvents.InitializeBaseRequest, logger, performanceClient, request.correlationId)(request, config, performanceClient, logger);
        return Object.assign(Object.assign(Object.assign({}, request), baseRequest), { account: account, forceRefresh: request.forceRefresh || false });
    });
}
