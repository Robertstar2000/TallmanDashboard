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
import { ThrottlingUtils, UrlString, AuthError, OIDC_DEFAULT_SCOPES, ProtocolUtils, PerformanceEvents, ProtocolMode, ServerResponseType, invokeAsync, invoke, } from "@azure/msal-common/browser";
import { StandardInteractionClient } from "./StandardInteractionClient.js";
import { EventType } from "../event/EventType.js";
import { InteractionType, ApiId, BrowserConstants, } from "../utils/BrowserConstants.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { NativeInteractionClient } from "./NativeInteractionClient.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler.js";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { InteractionHandler } from "../interaction_handler/InteractionHandler.js";
import * as ResponseHandler from "../response/ResponseHandler.js";
import { getAuthCodeRequestUrl } from "../protocol/Authorize.js";
import { generatePkceCodes } from "../crypto/PkceGenerator.js";
export class PopupClient extends StandardInteractionClient {
    constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeStorageImpl, nativeMessageHandler, correlationId) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        // Properly sets this reference for the unload event.
        this.unloadWindow = this.unloadWindow.bind(this);
        this.nativeStorage = nativeStorageImpl;
    }
    /**
     * Acquires tokens by opening a popup window to the /authorize endpoint of the authority
     * @param request
     * @param pkceCodes
     */
    acquireToken(request, pkceCodes) {
        var _a;
        try {
            const popupName = this.generatePopupName(request.scopes || OIDC_DEFAULT_SCOPES, request.authority || this.config.auth.authority);
            const popupParams = {
                popupName,
                popupWindowAttributes: request.popupWindowAttributes || {},
                popupWindowParent: (_a = request.popupWindowParent) !== null && _a !== void 0 ? _a : window,
            };
            this.performanceClient.addFields({ isAsyncPopup: this.config.system.asyncPopups }, this.correlationId);
            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true, acquiring token");
                // Passes on popup position and dimensions if in request
                return this.acquireTokenPopupAsync(request, popupParams, pkceCodes);
            }
            else {
                // asyncPopups flag is set to false. Opens popup before acquiring token.
                this.logger.verbose("asyncPopup set to false, opening popup before acquiring token");
                popupParams.popup = this.openSizedPopup("about:blank", popupParams);
                return this.acquireTokenPopupAsync(request, popupParams, pkceCodes);
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logout(logoutRequest) {
        var _a;
        try {
            this.logger.verbose("logoutPopup called");
            const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
            const popupParams = {
                popupName: this.generateLogoutPopupName(validLogoutRequest),
                popupWindowAttributes: (logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.popupWindowAttributes) || {},
                popupWindowParent: (_a = logoutRequest === null || logoutRequest === void 0 ? void 0 : logoutRequest.popupWindowParent) !== null && _a !== void 0 ? _a : window,
            };
            const authority = logoutRequest && logoutRequest.authority;
            const mainWindowRedirectUri = logoutRequest && logoutRequest.mainWindowRedirectUri;
            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true");
                // Passes on popup position and dimensions if in request
                return this.logoutPopupAsync(validLogoutRequest, popupParams, authority, mainWindowRedirectUri);
            }
            else {
                // asyncPopups flag is set to false. Opens popup before logging out.
                this.logger.verbose("asyncPopup set to false, opening popup");
                popupParams.popup = this.openSizedPopup("about:blank", popupParams);
                return this.logoutPopupAsync(validLogoutRequest, popupParams, authority, mainWindowRedirectUri);
            }
        }
        catch (e) {
            // Since this function is synchronous we need to reject
            return Promise.reject(e);
        }
    }
    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param request
     * @param popupParams
     * @param pkceCodes
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenPopupAsync(request, popupParams, pkceCodes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.logger.verbose("acquireTokenPopupAsync called");
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenPopup);
            const validRequest = yield invokeAsync(this.initializeAuthorizationRequest.bind(this), PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(request, InteractionType.Popup);
            const pkce = pkceCodes ||
                (yield invokeAsync(generatePkceCodes, PerformanceEvents.GeneratePkceCodes, this.logger, this.performanceClient, this.correlationId)(this.performanceClient, this.logger, this.correlationId));
            validRequest.codeChallenge = pkce.challenge;
            /*
             * Skip pre-connect for async popups to reduce time between user interaction and popup window creation to avoid
             * popup from being blocked by browsers with shorter popup timers
             */
            if (popupParams.popup) {
                BrowserUtils.preconnect(validRequest.authority);
            }
            try {
                // Initialize the client
                const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
                    serverTelemetryManager,
                    requestAuthority: validRequest.authority,
                    requestAzureCloudOptions: validRequest.azureCloudOptions,
                    requestExtraQueryParameters: validRequest.extraQueryParameters,
                    account: validRequest.account,
                });
                const isPlatformBroker = NativeMessageHandler.isPlatformBrokerAvailable(this.config, this.logger, this.nativeMessageHandler, request.authenticationScheme);
                // Start measurement for server calls with native brokering enabled
                let fetchNativeAccountIdMeasurement;
                if (isPlatformBroker) {
                    fetchNativeAccountIdMeasurement =
                        this.performanceClient.startMeasurement(PerformanceEvents.FetchAccountIdWithNativeBroker, request.correlationId);
                }
                // Create acquire token url.
                const navigateUrl = yield invokeAsync(getAuthCodeRequestUrl, PerformanceEvents.GetAuthCodeUrl, this.logger, this.performanceClient, validRequest.correlationId)(this.config, authClient.authority, Object.assign(Object.assign({}, validRequest), { platformBroker: isPlatformBroker }), this.logger, this.performanceClient);
                // Show the UI once the url has been created. Get the window handle for the popup.
                const popupWindow = this.initiateAuthRequest(navigateUrl, popupParams);
                this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, { popupWindow }, null);
                // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
                const responseString = yield this.monitorPopupForHash(popupWindow, popupParams.popupWindowParent);
                const serverParams = invoke(ResponseHandler.deserializeResponse, PerformanceEvents.DeserializeResponse, this.logger, this.performanceClient, this.correlationId)(responseString, this.config.auth.OIDCOptions.serverResponseType, this.logger);
                // Remove throttle if it exists
                ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, validRequest);
                if (serverParams.accountId) {
                    this.logger.verbose("Account id found in hash, calling WAM for token");
                    // end measurement for server call with native brokering enabled
                    if (fetchNativeAccountIdMeasurement) {
                        fetchNativeAccountIdMeasurement.end({
                            success: true,
                            isNativeBroker: true,
                        });
                    }
                    if (!this.nativeMessageHandler) {
                        throw createBrowserAuthError(BrowserAuthErrorCodes.nativeConnectionNotEstablished);
                    }
                    const nativeInteractionClient = new NativeInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenPopup, this.performanceClient, this.nativeMessageHandler, serverParams.accountId, this.nativeStorage, validRequest.correlationId);
                    const { userRequestState } = ProtocolUtils.parseRequestState(this.browserCrypto, validRequest.state);
                    return yield nativeInteractionClient.acquireToken(Object.assign(Object.assign({}, validRequest), { state: userRequestState, prompt: undefined }));
                }
                const authCodeRequest = Object.assign(Object.assign({}, validRequest), { code: serverParams.code || "", codeVerifier: pkce.verifier });
                // Create popup interaction handler.
                const interactionHandler = new InteractionHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.performanceClient);
                // Handle response from hash string.
                const result = yield interactionHandler.handleCodeResponse(serverParams, validRequest);
                return result;
            }
            catch (e) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                (_a = popupParams.popup) === null || _a === void 0 ? void 0 : _a.close();
                if (e instanceof AuthError) {
                    e.setCorrelationId(this.correlationId);
                    serverTelemetryManager.cacheFailedRequest(e);
                }
                throw e;
            }
        });
    }
    /**
     *
     * @param validRequest
     * @param popupName
     * @param requestAuthority
     * @param popup
     * @param mainWindowRedirectUri
     * @param popupWindowAttributes
     */
    logoutPopupAsync(validRequest, popupParams, requestAuthority, mainWindowRedirectUri) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            this.logger.verbose("logoutPopupAsync called");
            this.eventHandler.emitEvent(EventType.LOGOUT_START, InteractionType.Popup, validRequest);
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logoutPopup);
            try {
                // Clear cache on logout
                yield this.clearCacheOnLogout(validRequest.account);
                // Initialize the client
                const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), PerformanceEvents.StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
                    serverTelemetryManager,
                    requestAuthority: requestAuthority,
                    account: validRequest.account || undefined,
                });
                try {
                    authClient.authority.endSessionEndpoint;
                }
                catch (_e) {
                    if (((_a = validRequest.account) === null || _a === void 0 ? void 0 : _a.homeAccountId) &&
                        validRequest.postLogoutRedirectUri &&
                        authClient.authority.protocolMode === ProtocolMode.OIDC) {
                        void this.browserStorage.removeAccount((_b = validRequest.account) === null || _b === void 0 ? void 0 : _b.homeAccountId);
                        this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Popup, validRequest);
                        if (mainWindowRedirectUri) {
                            const navigationOptions = {
                                apiId: ApiId.logoutPopup,
                                timeout: this.config.system.redirectNavigationTimeout,
                                noHistory: false,
                            };
                            const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, BrowserUtils.getCurrentUri());
                            yield this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
                        }
                        (_c = popupParams.popup) === null || _c === void 0 ? void 0 : _c.close();
                        return;
                    }
                }
                // Create logout string and navigate user window to logout.
                const logoutUri = authClient.getLogoutUri(validRequest);
                this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Popup, validRequest);
                // Open the popup window to requestUrl.
                const popupWindow = this.openPopup(logoutUri, popupParams);
                this.eventHandler.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, { popupWindow }, null);
                yield this.monitorPopupForHash(popupWindow, popupParams.popupWindowParent).catch(() => {
                    // Swallow any errors related to monitoring the window. Server logout is best effort
                });
                if (mainWindowRedirectUri) {
                    const navigationOptions = {
                        apiId: ApiId.logoutPopup,
                        timeout: this.config.system.redirectNavigationTimeout,
                        noHistory: false,
                    };
                    const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, BrowserUtils.getCurrentUri());
                    this.logger.verbose("Redirecting main window to url specified in the request");
                    this.logger.verbosePii(`Redirecting main window to: ${absoluteUrl}`);
                    yield this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
                }
                else {
                    this.logger.verbose("No main window navigation requested");
                }
            }
            catch (e) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                (_d = popupParams.popup) === null || _d === void 0 ? void 0 : _d.close();
                if (e instanceof AuthError) {
                    e.setCorrelationId(this.correlationId);
                    serverTelemetryManager.cacheFailedRequest(e);
                }
                this.browserStorage.setInteractionInProgress(false);
                this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Popup, null, e);
                this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Popup);
                throw e;
            }
            this.eventHandler.emitEvent(EventType.LOGOUT_END, InteractionType.Popup);
        });
    }
    /**
     * Opens a popup window with given request Url.
     * @param requestUrl
     */
    initiateAuthRequest(requestUrl, params) {
        // Check that request url is not empty.
        if (requestUrl) {
            this.logger.infoPii(`Navigate to: ${requestUrl}`);
            // Open the popup window to requestUrl.
            return this.openPopup(requestUrl, params);
        }
        else {
            // Throw error if request URL is empty.
            this.logger.error("Navigate url is empty");
            throw createBrowserAuthError(BrowserAuthErrorCodes.emptyNavigateUri);
        }
    }
    /**
     * Monitors a window until it loads a url with the same origin.
     * @param popupWindow - window that is being monitored
     * @param timeout - timeout for processing hash once popup is redirected back to application
     */
    monitorPopupForHash(popupWindow, popupWindowParent) {
        return new Promise((resolve, reject) => {
            this.logger.verbose("PopupHandler.monitorPopupForHash - polling started");
            const intervalId = setInterval(() => {
                // Window is closed
                if (popupWindow.closed) {
                    this.logger.error("PopupHandler.monitorPopupForHash - window closed");
                    clearInterval(intervalId);
                    reject(createBrowserAuthError(BrowserAuthErrorCodes.userCancelled));
                    return;
                }
                let href = "";
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = popupWindow.location.href;
                }
                catch (e) { }
                // Don't process blank pages or cross domain
                if (!href || href === "about:blank") {
                    return;
                }
                clearInterval(intervalId);
                let responseString = "";
                const responseType = this.config.auth.OIDCOptions.serverResponseType;
                if (popupWindow) {
                    if (responseType === ServerResponseType.QUERY) {
                        responseString = popupWindow.location.search;
                    }
                    else {
                        responseString = popupWindow.location.hash;
                    }
                }
                this.logger.verbose("PopupHandler.monitorPopupForHash - popup window is on same origin as caller");
                resolve(responseString);
            }, this.config.system.pollIntervalMilliseconds);
        }).finally(() => {
            this.cleanPopup(popupWindow, popupWindowParent);
        });
    }
    /**
     * @hidden
     *
     * Configures popup window for login.
     *
     * @param urlNavigate
     * @param title
     * @param popUpWidth
     * @param popUpHeight
     * @param popupWindowAttributes
     * @ignore
     * @hidden
     */
    openPopup(urlNavigate, popupParams) {
        try {
            let popupWindow;
            // Popup window passed in, setting url to navigate to
            if (popupParams.popup) {
                popupWindow = popupParams.popup;
                this.logger.verbosePii(`Navigating popup window to: ${urlNavigate}`);
                popupWindow.location.assign(urlNavigate);
            }
            else if (typeof popupParams.popup === "undefined") {
                // Popup will be undefined if it was not passed in
                this.logger.verbosePii(`Opening popup window to: ${urlNavigate}`);
                popupWindow = this.openSizedPopup(urlNavigate, popupParams);
            }
            // Popup will be null if popups are blocked
            if (!popupWindow) {
                throw createBrowserAuthError(BrowserAuthErrorCodes.emptyWindowError);
            }
            if (popupWindow.focus) {
                popupWindow.focus();
            }
            this.currentWindow = popupWindow;
            popupParams.popupWindowParent.addEventListener("beforeunload", this.unloadWindow);
            return popupWindow;
        }
        catch (e) {
            this.logger.error("error opening popup " + e.message);
            this.browserStorage.setInteractionInProgress(false);
            throw createBrowserAuthError(BrowserAuthErrorCodes.popupWindowError);
        }
    }
    /**
     * Helper function to set popup window dimensions and position
     * @param urlNavigate
     * @param popupName
     * @param popupWindowAttributes
     * @returns
     */
    openSizedPopup(urlNavigate, { popupName, popupWindowAttributes, popupWindowParent }) {
        var _a, _b, _c, _d;
        /**
         * adding winLeft and winTop to account for dual monitor
         * using screenLeft and screenTop for IE8 and earlier
         */
        const winLeft = popupWindowParent.screenLeft
            ? popupWindowParent.screenLeft
            : popupWindowParent.screenX;
        const winTop = popupWindowParent.screenTop
            ? popupWindowParent.screenTop
            : popupWindowParent.screenY;
        /**
         * window.innerWidth displays browser window"s height and width excluding toolbars
         * using document.documentElement.clientWidth for IE8 and earlier
         */
        const winWidth = popupWindowParent.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        const winHeight = popupWindowParent.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;
        let width = (_a = popupWindowAttributes.popupSize) === null || _a === void 0 ? void 0 : _a.width;
        let height = (_b = popupWindowAttributes.popupSize) === null || _b === void 0 ? void 0 : _b.height;
        let top = (_c = popupWindowAttributes.popupPosition) === null || _c === void 0 ? void 0 : _c.top;
        let left = (_d = popupWindowAttributes.popupPosition) === null || _d === void 0 ? void 0 : _d.left;
        if (!width || width < 0 || width > winWidth) {
            this.logger.verbose("Default popup window width used. Window width not configured or invalid.");
            width = BrowserConstants.POPUP_WIDTH;
        }
        if (!height || height < 0 || height > winHeight) {
            this.logger.verbose("Default popup window height used. Window height not configured or invalid.");
            height = BrowserConstants.POPUP_HEIGHT;
        }
        if (!top || top < 0 || top > winHeight) {
            this.logger.verbose("Default popup window top position used. Window top not configured or invalid.");
            top = Math.max(0, winHeight / 2 - BrowserConstants.POPUP_HEIGHT / 2 + winTop);
        }
        if (!left || left < 0 || left > winWidth) {
            this.logger.verbose("Default popup window left position used. Window left not configured or invalid.");
            left = Math.max(0, winWidth / 2 - BrowserConstants.POPUP_WIDTH / 2 + winLeft);
        }
        return popupWindowParent.open(urlNavigate, popupName, `width=${width}, height=${height}, top=${top}, left=${left}, scrollbars=yes`);
    }
    /**
     * Event callback to unload main window.
     */
    unloadWindow(e) {
        this.browserStorage.cleanRequestByInteractionType(InteractionType.Popup);
        if (this.currentWindow) {
            this.currentWindow.close();
        }
        // Guarantees browser unload will happen, so no other errors will be thrown.
        e.preventDefault();
    }
    /**
     * Closes popup, removes any state vars created during popup calls.
     * @param popupWindow
     */
    cleanPopup(popupWindow, popupWindowParent) {
        // Close window.
        popupWindow.close();
        // Remove window unload function
        popupWindowParent.removeEventListener("beforeunload", this.unloadWindow);
        // Interaction is completed - remove interaction status.
        this.browserStorage.setInteractionInProgress(false);
    }
    /**
     * Generates the name for the popup based on the client id and request
     * @param clientId
     * @param request
     */
    generatePopupName(scopes, authority) {
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${this.config.auth.clientId}.${scopes.join("-")}.${authority}.${this.correlationId}`;
    }
    /**
     * Generates the name for the popup based on the client id and request for logouts
     * @param clientId
     * @param request
     */
    generateLogoutPopupName(request) {
        const homeAccountId = request.account && request.account.homeAccountId;
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${this.config.auth.clientId}.${homeAccountId}.${this.correlationId}`;
    }
}
