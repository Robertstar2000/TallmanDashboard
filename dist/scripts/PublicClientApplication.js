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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { ApiId, Constants, LOOPBACK_SERVER_CONSTANTS, } from "../utils/Constants.js";
import { AuthError, ResponseMode, OIDC_DEFAULT_SCOPES, CodeChallengeMethodValues, Constants as CommonConstants, ServerError, AADServerParamKeys, ServerTelemetryManager, } from "@azure/msal-common/node";
import { ClientApplication } from "./ClientApplication.js";
import { NodeAuthError, NodeAuthErrorMessage } from "../error/NodeAuthError.js";
import { LoopbackClient } from "../network/LoopbackClient.js";
import { DeviceCodeClient } from "./DeviceCodeClient.js";
import { version } from "../packageMetadata.js";
/**
 * This class is to be used to acquire tokens for public client applications (desktop, mobile). Public client applications
 * are not trusted to safely store application secrets, and therefore can only request tokens in the name of an user.
 * @public
 */
export class PublicClientApplication extends ClientApplication {
    /**
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal.
     * - authority: the authority URL for your application.
     *
     * AAD authorities are of the form https://login.microsoftonline.com/\{Enter_the_Tenant_Info_Here\}.
     * - If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * - If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * - If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * - To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * Azure B2C authorities are of the form https://\{instance\}/\{tenant\}/\{policy\}. Each policy is considered
     * its own authority. You will have to set the all of the knownAuthorities at the time of the client application
     * construction.
     *
     * ADFS authorities are of the form https://\{instance\}/adfs.
     */
    constructor(configuration) {
        super(configuration);
        if (this.config.broker.nativeBrokerPlugin) {
            if (this.config.broker.nativeBrokerPlugin.isBrokerAvailable) {
                this.nativeBrokerPlugin = this.config.broker.nativeBrokerPlugin;
                this.nativeBrokerPlugin.setLogger(this.config.system.loggerOptions);
            }
            else {
                this.logger.warning("NativeBroker implementation was provided but the broker is unavailable.");
            }
        }
        this.skus = ServerTelemetryManager.makeExtraSkuString({
            libraryName: Constants.MSAL_SKU,
            libraryVersion: version,
        });
    }
    /**
     * Acquires a token from the authority using OAuth2.0 device code flow.
     * This flow is designed for devices that do not have access to a browser or have input constraints.
     * The authorization server issues a DeviceCode object with a verification code, an end-user code,
     * and the end-user verification URI. The DeviceCode object is provided through a callback, and the end-user should be
     * instructed to use another device to navigate to the verification URI to input credentials.
     * Since the client cannot receive incoming requests, it polls the authorization server repeatedly
     * until the end-user completes input of credentials.
     */
    acquireTokenByDeviceCode(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("acquireTokenByDeviceCode called", request.correlationId);
            const validRequest = Object.assign(request, yield this.initializeBaseRequest(request));
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByDeviceCode, validRequest.correlationId);
            try {
                const discoveredAuthority = yield this.createAuthority(validRequest.authority, validRequest.correlationId, undefined, request.azureCloudOptions);
                const deviceCodeConfig = yield this.buildOauthClientConfiguration(discoveredAuthority, validRequest.correlationId, "", serverTelemetryManager);
                const deviceCodeClient = new DeviceCodeClient(deviceCodeConfig);
                this.logger.verbose("Device code client created", validRequest.correlationId);
                return yield deviceCodeClient.acquireToken(validRequest);
            }
            catch (e) {
                if (e instanceof AuthError) {
                    e.setCorrelationId(validRequest.correlationId);
                }
                serverTelemetryManager.cacheFailedRequest(e);
                throw e;
            }
        });
    }
    /**
     * Acquires a token interactively via the browser by requesting an authorization code then exchanging it for a token.
     */
    acquireTokenInteractive(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
            this.logger.trace("acquireTokenInteractive called", correlationId);
            const { openBrowser, successTemplate, errorTemplate, windowHandle, loopbackClient: customLoopbackClient } = request, remainingProperties = __rest(request, ["openBrowser", "successTemplate", "errorTemplate", "windowHandle", "loopbackClient"]);
            if (this.nativeBrokerPlugin) {
                const brokerRequest = Object.assign(Object.assign({}, remainingProperties), { clientId: this.config.auth.clientId, scopes: request.scopes || OIDC_DEFAULT_SCOPES, redirectUri: `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}`, authority: request.authority || this.config.auth.authority, correlationId: correlationId, extraParameters: Object.assign(Object.assign(Object.assign({}, remainingProperties.extraQueryParameters), remainingProperties.tokenQueryParameters), { [AADServerParamKeys.X_CLIENT_EXTRA_SKU]: this.skus }), accountId: (_a = remainingProperties.account) === null || _a === void 0 ? void 0 : _a.nativeAccountId });
                return this.nativeBrokerPlugin.acquireTokenInteractive(brokerRequest, windowHandle);
            }
            const { verifier, challenge } = yield this.cryptoProvider.generatePkceCodes();
            const loopbackClient = customLoopbackClient || new LoopbackClient();
            let authCodeResponse = {};
            let authCodeListenerError = null;
            try {
                const authCodeListener = loopbackClient
                    .listenForAuthCode(successTemplate, errorTemplate)
                    .then((response) => {
                    authCodeResponse = response;
                })
                    .catch((e) => {
                    // Store the promise instead of throwing so we can control when its thrown
                    authCodeListenerError = e;
                });
                // Wait for server to be listening
                const redirectUri = yield this.waitForRedirectUri(loopbackClient);
                const validRequest = Object.assign(Object.assign({}, remainingProperties), { correlationId: correlationId, scopes: request.scopes || OIDC_DEFAULT_SCOPES, redirectUri: redirectUri, responseMode: ResponseMode.QUERY, codeChallenge: challenge, codeChallengeMethod: CodeChallengeMethodValues.S256 });
                const authCodeUrl = yield this.getAuthCodeUrl(validRequest);
                yield openBrowser(authCodeUrl);
                yield authCodeListener;
                if (authCodeListenerError) {
                    throw authCodeListenerError;
                }
                if (authCodeResponse.error) {
                    throw new ServerError(authCodeResponse.error, authCodeResponse.error_description, authCodeResponse.suberror);
                }
                else if (!authCodeResponse.code) {
                    throw NodeAuthError.createNoAuthCodeInResponseError();
                }
                const clientInfo = authCodeResponse.client_info;
                const tokenRequest = Object.assign({ code: authCodeResponse.code, codeVerifier: verifier, clientInfo: clientInfo || CommonConstants.EMPTY_STRING }, validRequest);
                return yield this.acquireTokenByCode(tokenRequest); // Await this so the server doesn't close prematurely
            }
            finally {
                loopbackClient.closeServer();
            }
        });
    }
    /**
     * Returns a token retrieved either from the cache or by exchanging the refresh token for a fresh access token. If brokering is enabled the token request will be serviced by the broker.
     * @param request - developer provided SilentFlowRequest
     * @returns
     */
    acquireTokenSilent(request) {
        const _super = Object.create(null, {
            acquireTokenSilent: { get: () => super.acquireTokenSilent }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const correlationId = request.correlationId || this.cryptoProvider.createNewGuid();
            this.logger.trace("acquireTokenSilent called", correlationId);
            if (this.nativeBrokerPlugin) {
                const brokerRequest = Object.assign(Object.assign({}, request), { clientId: this.config.auth.clientId, scopes: request.scopes || OIDC_DEFAULT_SCOPES, redirectUri: `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}`, authority: request.authority || this.config.auth.authority, correlationId: correlationId, extraParameters: Object.assign(Object.assign({}, request.tokenQueryParameters), { [AADServerParamKeys.X_CLIENT_EXTRA_SKU]: this.skus }), accountId: request.account.nativeAccountId, forceRefresh: request.forceRefresh || false });
                return this.nativeBrokerPlugin.acquireTokenSilent(brokerRequest);
            }
            return _super.acquireTokenSilent.call(this, request);
        });
    }
    /**
     * Removes cache artifacts associated with the given account
     * @param request - developer provided SignOutRequest
     * @returns
     */
    signOut(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nativeBrokerPlugin && request.account.nativeAccountId) {
                const signoutRequest = {
                    clientId: this.config.auth.clientId,
                    accountId: request.account.nativeAccountId,
                    correlationId: request.correlationId ||
                        this.cryptoProvider.createNewGuid(),
                };
                yield this.nativeBrokerPlugin.signOut(signoutRequest);
            }
            yield this.getTokenCache().removeAccount(request.account);
        });
    }
    /**
     * Returns all cached accounts for this application. If brokering is enabled this request will be serviced by the broker.
     * @returns
     */
    getAllAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nativeBrokerPlugin) {
                const correlationId = this.cryptoProvider.createNewGuid();
                return this.nativeBrokerPlugin.getAllAccounts(this.config.auth.clientId, correlationId);
            }
            return this.getTokenCache().getAllAccounts();
        });
    }
    /**
     * Attempts to retrieve the redirectUri from the loopback server. If the loopback server does not start listening for requests within the timeout this will throw.
     * @param loopbackClient - developer provided custom loopback server implementation
     * @returns
     */
    waitForRedirectUri(loopbackClient) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let ticks = 0;
                const id = setInterval(() => {
                    if (LOOPBACK_SERVER_CONSTANTS.TIMEOUT_MS /
                        LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS <
                        ticks) {
                        clearInterval(id);
                        reject(NodeAuthError.createLoopbackServerTimeoutError());
                        return;
                    }
                    try {
                        const r = loopbackClient.getRedirectUri();
                        clearInterval(id);
                        resolve(r);
                        return;
                    }
                    catch (e) {
                        if (e instanceof AuthError &&
                            e.errorCode ===
                                NodeAuthErrorMessage.noLoopbackServerExists.code) {
                            // Loopback server is not listening yet
                            ticks++;
                            return;
                        }
                        clearInterval(id);
                        reject(e);
                        return;
                    }
                }, LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS);
            });
        });
    }
}
