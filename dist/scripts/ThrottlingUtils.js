/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { HeaderNames, ThrottlingConstants, Constants, } from "../utils/Constants.js";
import { ServerError } from "../error/ServerError.js";
import { getRequestThumbprint, } from "./RequestThumbprint.js";
/** @internal */
export class ThrottlingUtils {
    /**
     * Prepares a RequestThumbprint to be stored as a key.
     * @param thumbprint
     */
    static generateThrottlingStorageKey(thumbprint) {
        return `${ThrottlingConstants.THROTTLING_PREFIX}.${JSON.stringify(thumbprint)}`;
    }
    /**
     * Performs necessary throttling checks before a network request.
     * @param cacheManager
     * @param thumbprint
     */
    static preProcess(cacheManager, thumbprint) {
        var _a;
        const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
        const value = cacheManager.getThrottlingCache(key);
        if (value) {
            if (value.throttleTime < Date.now()) {
                cacheManager.removeItem(key);
                return;
            }
            throw new ServerError(((_a = value.errorCodes) === null || _a === void 0 ? void 0 : _a.join(" ")) || Constants.EMPTY_STRING, value.errorMessage, value.subError);
        }
    }
    /**
     * Performs necessary throttling checks after a network request.
     * @param cacheManager
     * @param thumbprint
     * @param response
     */
    static postProcess(cacheManager, thumbprint, response) {
        if (ThrottlingUtils.checkResponseStatus(response) ||
            ThrottlingUtils.checkResponseForRetryAfter(response)) {
            const thumbprintValue = {
                throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames.RETRY_AFTER])),
                error: response.body.error,
                errorCodes: response.body.error_codes,
                errorMessage: response.body.error_description,
                subError: response.body.suberror,
            };
            cacheManager.setThrottlingCache(ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue);
        }
    }
    /**
     * Checks a NetworkResponse object's status codes against 429 or 5xx
     * @param response
     */
    static checkResponseStatus(response) {
        return (response.status === 429 ||
            (response.status >= 500 && response.status < 600));
    }
    /**
     * Checks a NetworkResponse object's RetryAfter header
     * @param response
     */
    static checkResponseForRetryAfter(response) {
        if (response.headers) {
            return (response.headers.hasOwnProperty(HeaderNames.RETRY_AFTER) &&
                (response.status < 200 || response.status >= 300));
        }
        return false;
    }
    /**
     * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
     * @param throttleTime
     */
    static calculateThrottleTime(throttleTime) {
        const time = throttleTime <= 0 ? 0 : throttleTime;
        const currentSeconds = Date.now() / 1000;
        return Math.floor(Math.min(currentSeconds +
            (time || ThrottlingConstants.DEFAULT_THROTTLE_TIME_SECONDS), currentSeconds +
            ThrottlingConstants.DEFAULT_MAX_THROTTLE_TIME_SECONDS) * 1000);
    }
    static removeThrottle(cacheManager, clientId, request, homeAccountIdentifier) {
        const thumbprint = getRequestThumbprint(clientId, request, homeAccountIdentifier);
        const key = this.generateThrottlingStorageKey(thumbprint);
        cacheManager.removeItem(key);
    }
}
