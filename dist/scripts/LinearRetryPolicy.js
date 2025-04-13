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
export class LinearRetryPolicy {
    constructor(maxRetries, retryDelay, httpStatusCodesToRetryOn) {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.httpStatusCodesToRetryOn = httpStatusCodesToRetryOn;
    }
    retryAfterMillisecondsToSleep(retryHeader) {
        if (!retryHeader) {
            return 0;
        }
        // retry-after header is in seconds
        let millisToSleep = Math.round(parseFloat(retryHeader) * 1000);
        /*
         * retry-after header is in HTTP Date format
         * <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
         */
        if (isNaN(millisToSleep)) {
            millisToSleep = Math.max(0, 
            // .valueOf() is needed to subtract dates in TypeScript
            new Date(retryHeader).valueOf() - new Date().valueOf());
        }
        return millisToSleep;
    }
    pauseForRetry(httpStatusCode, currentRetry, retryAfterHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.httpStatusCodesToRetryOn.includes(httpStatusCode) &&
                currentRetry < this.maxRetries) {
                const retryAfterDelay = this.retryAfterMillisecondsToSleep(retryAfterHeader);
                yield new Promise((resolve) => {
                    // retryAfterHeader value of 0 evaluates to false, and this.retryDelay will be used
                    return setTimeout(resolve, retryAfterDelay || this.retryDelay);
                });
                return true;
            }
            return false;
        });
    }
}
