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
import { createNetworkError, } from "@azure/msal-common/browser";
import { createBrowserAuthError, BrowserAuthErrorCodes, } from "../error/BrowserAuthError.js";
import { HTTP_REQUEST_TYPE } from "../utils/BrowserConstants.js";
/**
 * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export class FetchClient {
    /**
     * Fetch Client for REST endpoints - Get request
     * @param url
     * @param headers
     * @param body
     */
    sendGetRequestAsync(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            let responseHeaders = {};
            let responseStatus = 0;
            const reqHeaders = getFetchHeaders(options);
            try {
                response = yield fetch(url, {
                    method: HTTP_REQUEST_TYPE.GET,
                    headers: reqHeaders,
                });
            }
            catch (e) {
                throw createBrowserAuthError(window.navigator.onLine
                    ? BrowserAuthErrorCodes.getRequestFailed
                    : BrowserAuthErrorCodes.noNetworkConnectivity);
            }
            responseHeaders = getHeaderDict(response.headers);
            try {
                responseStatus = response.status;
                return {
                    headers: responseHeaders,
                    body: (yield response.json()),
                    status: responseStatus,
                };
            }
            catch (e) {
                throw createNetworkError(createBrowserAuthError(BrowserAuthErrorCodes.failedToParseResponse), responseStatus, responseHeaders);
            }
        });
    }
    /**
     * Fetch Client for REST endpoints - Post request
     * @param url
     * @param headers
     * @param body
     */
    sendPostRequestAsync(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqBody = (options && options.body) || "";
            const reqHeaders = getFetchHeaders(options);
            let response;
            let responseStatus = 0;
            let responseHeaders = {};
            try {
                response = yield fetch(url, {
                    method: HTTP_REQUEST_TYPE.POST,
                    headers: reqHeaders,
                    body: reqBody,
                });
            }
            catch (e) {
                throw createBrowserAuthError(window.navigator.onLine
                    ? BrowserAuthErrorCodes.postRequestFailed
                    : BrowserAuthErrorCodes.noNetworkConnectivity);
            }
            responseHeaders = getHeaderDict(response.headers);
            try {
                responseStatus = response.status;
                return {
                    headers: responseHeaders,
                    body: (yield response.json()),
                    status: responseStatus,
                };
            }
            catch (e) {
                throw createNetworkError(createBrowserAuthError(BrowserAuthErrorCodes.failedToParseResponse), responseStatus, responseHeaders);
            }
        });
    }
}
/**
 * Get Fetch API Headers object from string map
 * @param inputHeaders
 */
function getFetchHeaders(options) {
    try {
        const headers = new Headers();
        if (!(options && options.headers)) {
            return headers;
        }
        const optionsHeaders = options.headers;
        Object.entries(optionsHeaders).forEach(([key, value]) => {
            headers.append(key, value);
        });
        return headers;
    }
    catch (e) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.failedToBuildHeaders);
    }
}
/**
 * Returns object representing response headers
 * @param headers
 * @returns
 */
function getHeaderDict(headers) {
    try {
        const headerDict = {};
        headers.forEach((value, key) => {
            headerDict[key] = value;
        });
        return headerDict;
    }
    catch (e) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.failedToParseHeaders);
    }
}
