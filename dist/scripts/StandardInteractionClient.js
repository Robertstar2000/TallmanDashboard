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
import { Constants, AuthorizationCodeClient, UrlString, ProtocolUtils, PerformanceEvents, invokeAsync, } from "@azure/msal-common/browser";
import { BaseInteractionClient } from "./BaseInteractionClient.js";
import { BrowserConstants, } from "../utils/BrowserConstants.js";
import { version } from "../packageMetadata.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { initializeBaseRequest } from "../request/RequestHelpers.js";
/**
 * Defines the class structure and helper functions used by the "standard", non-brokered auth flows (popup, redirect, silent (RT), silent (iframe))
 */
export class StandardInteractionClient extends BaseInteractionClient {
    /**
     * Initializer for the logout request.
     * @param logoutRequest
     */
    initializeLogoutRequest(logoutRequest) {
        this.logger.verbose("initializeLogoutRequest called", logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.correlationId);
        const validLogoutRequest = Object.assign({ correlationId: this.correlationId || createNewGuid() }, logoutRequest);
        /**
         * Set logout_hint to be login_hint from ID Token Claims if present
         * and logoutHint attribute wasn't manually set in logout request
         */
        if (logoutRequest) {
            // If logoutHint isn't set and an account was passed in, try to extract logoutHint from ID Token Claims
            if (!logoutRequest.logoutHint) {
                if (logoutRequest.account) {
                    const logoutHint = this.getLogoutHintFromIdTokenClaims(logoutRequest.account);
                    if (logoutHint) {
                        this.logger.verbose("Setting logoutHint to login_hint ID Token Claim value for the account provided");
                        validLogoutRequest.logoutHint = logoutHint;
                    }
                }
                else {
                    this.logger.verbose("logoutHint was not set and account was not passed into logout request, logoutHint will not be set");
                }
            }
            else {
                this.logger.verbose("logoutHint has already been set in logoutRequest");
            }
        }
        else {
            this.logger.verbose("logoutHint will not be set since no logout request was configured");
        }
        /*
         * Only set redirect uri if logout request isn't provided or the set uri isn't null.
         * Otherwise, use passed uri, config, or current page.
         */
        if (!logoutRequest || logoutRequest.postLogoutRedirectUri !== null) {
            if (logoutRequest && logoutRequest.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to uri set on logout request", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(logoutRequest.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            }
            else if (this.config.auth.postLogoutRedirectUri === null) {
                this.logger.verbose("postLogoutRedirectUri configured as null and no uri set on request, not passing post logout redirect", validLogoutRequest.correlationId);
            }
            else if (this.config.auth.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to configured uri", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(this.config.auth.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            }
            else {
                this.logger.verbose("Setting postLogoutRedirectUri to current page", validLogoutRequest.correlationId);
                validLogoutRequest.postLogoutRedirectUri =
                    UrlString.getAbsoluteUrl(BrowserUtils.getCurrentUri(), BrowserUtils.getCurrentUri());
            }
        }
        else {
            this.logger.verbose("postLogoutRedirectUri passed as null, not setting post logout redirect uri", validLogoutRequest.correlationId);
        }
        return validLogoutRequest;
    }
    /**
     * Parses login_hint ID Token Claim out of AccountInfo object to be used as
     * logout_hint in end session request.
     * @param account
     */
    getLogoutHintFromIdTokenClaims(account) {
        const idTokenClaims = account.idTokenClaims;
        if (idTokenClaims) {
            if (idTokenClaims.login_hint) {
                return idTokenClaims.login_hint;
            }
            else {
                this.logger.verbose("The ID Token Claims tied to the provided account do not contain a login_hint claim, logoutHint will not be added to logout request");
            }
        }
        else {
            this.logger.verbose("The provided account does not contain ID Token Claims, logoutHint will not be added to logout request");
        }
        return null;
    }
    /**
     * Creates an Authorization Code Client with the given authority, or the default authority.
     * @param params {
     *         serverTelemetryManager: ServerTelemetryManager;
     *         authorityUrl?: string;
     *         requestAzureCloudOptions?: AzureCloudOptions;
     *         requestExtraQueryParameters?: StringDict;
     *         account?: AccountInfo;
     *        }
     */
    createAuthCodeClient(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.correlationId);
            // Create auth module.
            const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)(params);
            return new AuthorizationCodeClient(clientConfig, this.performanceClient);
        });
    }
    /**
     * Creates a Client Configuration object with the given request authority, or the default authority.
     * @param params {
     *         serverTelemetryManager: ServerTelemetryManager;
     *         requestAuthority?: string;
     *         requestAzureCloudOptions?: AzureCloudOptions;
     *         requestExtraQueryParameters?: boolean;
     *         account?: AccountInfo;
     *        }
     */
    getClientConfiguration(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { serverTelemetryManager, requestAuthority, requestAzureCloudOptions, requestExtraQueryParameters, account, } = params;
            this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientGetClientConfiguration, this.correlationId);
            const discoveredAuthority = yield invokeAsync(this.getDiscoveredAuthority.bind(this), PerformanceEvents.StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, this.correlationId)({
                requestAuthority,
                requestAzureCloudOptions,
                requestExtraQueryParameters,
                account,
            });
            const logger = this.config.system.loggerOptions;
            return {
                authOptions: {
                    clientId: this.config.auth.clientId,
                    authority: discoveredAuthority,
                    clientCapabilities: this.config.auth.clientCapabilities,
                    redirectUri: this.config.auth.redirectUri,
                },
                systemOptions: {
                    tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                    preventCorsPreflight: true,
                },
                loggerOptions: {
                    loggerCallback: logger.loggerCallback,
                    piiLoggingEnabled: logger.piiLoggingEnabled,
                    logLevel: logger.logLevel,
                    correlationId: this.correlationId,
                },
                cacheOptions: {
                    claimsBasedCachingEnabled: this.config.cache.claimsBasedCachingEnabled,
                },
                cryptoInterface: this.browserCrypto,
                networkInterface: this.networkClient,
                storageInterface: this.browserStorage,
                serverTelemetryManager: serverTelemetryManager,
                libraryInfo: {
                    sku: BrowserConstants.MSAL_SKU,
                    version: version,
                    cpu: Constants.EMPTY_STRING,
                    os: Constants.EMPTY_STRING,
                },
                telemetry: this.config.telemetry,
            };
        });
    }
    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     * @param interactionType
     */
    initializeAuthorizationRequest(request, interactionType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.performanceClient.addQueueMeasurement(PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.correlationId);
            const redirectUri = this.getRedirectUri(request.redirectUri);
            const browserState = {
                interactionType: interactionType,
            };
            const state = ProtocolUtils.setRequestState(this.browserCrypto, (request && request.state) || Constants.EMPTY_STRING, browserState);
            const baseRequest = yield invokeAsync(initializeBaseRequest, PerformanceEvents.InitializeBaseRequest, this.logger, this.performanceClient, this.correlationId)(Object.assign(Object.assign({}, request), { correlationId: this.correlationId }), this.config, this.performanceClient, this.logger);
            const validatedRequest = Object.assign(Object.assign({}, baseRequest), { redirectUri: redirectUri, state: state, nonce: request.nonce || createNewGuid(), responseMode: this.config.auth.OIDCOptions
                    .serverResponseType });
            // Skip active account lookup if either login hint or session id is set
            if (request.loginHint || request.sid) {
                return validatedRequest;
            }
            const account = request.account || this.browserStorage.getActiveAccount();
            if (account) {
                this.logger.verbose("Setting validated request account", this.correlationId);
                this.logger.verbosePii(`Setting validated request account: ${account.homeAccountId}`, this.correlationId);
                validatedRequest.account = account;
            }
            return validatedRequest;
        });
    }
}
