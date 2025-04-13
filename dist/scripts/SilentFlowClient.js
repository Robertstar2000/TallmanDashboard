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
import * as TimeUtils from "../utils/TimeUtils.js";
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
import { ResponseHandler } from "../response/ResponseHandler.js";
import { CacheOutcome } from "../utils/Constants.js";
import { StringUtils } from "../utils/StringUtils.js";
import { checkMaxAge, extractTokenClaims } from "../account/AuthToken.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { invokeAsync } from "../utils/FunctionWrappers.js";
import { getTenantFromAuthorityString } from "../authority/Authority.js";
/** @internal */
export class SilentFlowClient extends BaseClient {
    constructor(configuration, performanceClient) {
        super(configuration, performanceClient);
    }
    /**
     * Retrieves token from cache or throws an error if it must be refreshed.
     * @param request
     */
    acquireCachedToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.SilentFlowClientAcquireCachedToken, request.correlationId);
            let lastCacheOutcome = CacheOutcome.NOT_APPLICABLE;
            if (request.forceRefresh ||
                (!this.config.cacheOptions.claimsBasedCachingEnabled &&
                    !StringUtils.isEmptyObj(request.claims))) {
                // Must refresh due to present force_refresh flag.
                this.setCacheOutcome(CacheOutcome.FORCE_REFRESH_OR_CLAIMS, request.correlationId);
                throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
            }
            // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
            if (!request.account) {
                throw createClientAuthError(ClientAuthErrorCodes.noAccountInSilentRequest);
            }
            const requestTenantId = request.account.tenantId ||
                getTenantFromAuthorityString(request.authority);
            const tokenKeys = this.cacheManager.getTokenKeys();
            const cachedAccessToken = this.cacheManager.getAccessToken(request.account, request, tokenKeys, requestTenantId, this.performanceClient, request.correlationId);
            if (!cachedAccessToken) {
                // must refresh due to non-existent access_token
                this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
                throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
            }
            else if (TimeUtils.wasClockTurnedBack(cachedAccessToken.cachedAt) ||
                TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
                // must refresh due to the expires_in value
                this.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED, request.correlationId);
                throw createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired);
            }
            else if (cachedAccessToken.refreshOn &&
                TimeUtils.isTokenExpired(cachedAccessToken.refreshOn, 0)) {
                // must refresh (in the background) due to the refresh_in value
                lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
                // don't throw ClientAuthError.createRefreshRequiredError(), return cached token instead
            }
            const environment = request.authority || this.authority.getPreferredCache();
            const cacheRecord = {
                account: this.cacheManager.readAccountFromCache(request.account),
                accessToken: cachedAccessToken,
                idToken: this.cacheManager.getIdToken(request.account, tokenKeys, requestTenantId, this.performanceClient, request.correlationId),
                refreshToken: null,
                appMetadata: this.cacheManager.readAppMetadataFromCache(environment),
            };
            this.setCacheOutcome(lastCacheOutcome, request.correlationId);
            if (this.config.serverTelemetryManager) {
                this.config.serverTelemetryManager.incrementCacheHits();
            }
            return [
                yield invokeAsync(this.generateResultFromCacheRecord.bind(this), PerformanceEvents.SilentFlowClientGenerateResultFromCacheRecord, this.logger, this.performanceClient, request.correlationId)(cacheRecord, request),
                lastCacheOutcome,
            ];
        });
    }
    setCacheOutcome(cacheOutcome, correlationId) {
        var _a, _b;
        (_a = this.serverTelemetryManager) === null || _a === void 0 ? void 0 : _a.setCacheOutcome(cacheOutcome);
        (_b = this.performanceClient) === null || _b === void 0 ? void 0 : _b.addFields({
            cacheOutcome: cacheOutcome,
        }, correlationId);
        if (cacheOutcome !== CacheOutcome.NOT_APPLICABLE) {
            this.logger.info(`Token refresh is required due to cache outcome: ${cacheOutcome}`);
        }
    }
    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    generateResultFromCacheRecord(cacheRecord, request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.SilentFlowClientGenerateResultFromCacheRecord, request.correlationId);
            let idTokenClaims;
            if (cacheRecord.idToken) {
                idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode);
            }
            // token max_age check
            if (request.maxAge || request.maxAge === 0) {
                const authTime = idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.auth_time;
                if (!authTime) {
                    throw createClientAuthError(ClientAuthErrorCodes.authTimeNotFound);
                }
                checkMaxAge(authTime, request.maxAge);
            }
            return ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, true, request, idTokenClaims);
        });
    }
}
