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
import { HeaderNames, } from "@azure/msal-common/node";
import { HttpMethod } from "../utils/Constants.js";
export class HttpClientWithRetries {
    constructor(httpClientNoRetries, retryPolicy) {
        this.httpClientNoRetries = httpClientNoRetries;
        this.retryPolicy = retryPolicy;
    }
    sendNetworkRequestAsyncHelper(httpMethod, url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (httpMethod === HttpMethod.GET) {
                return this.httpClientNoRetries.sendGetRequestAsync(url, options);
            }
            else {
                return this.httpClientNoRetries.sendPostRequestAsync(url, options);
            }
        });
    }
    sendNetworkRequestAsync(httpMethod, url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // the underlying network module (custom or HttpClient) will make the call
            let response = yield this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
            let currentRetry = 0;
            while (yield this.retryPolicy.pauseForRetry(response.status, currentRetry, response.headers[HeaderNames.RETRY_AFTER])) {
                response = yield this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
                currentRetry++;
            }
            return response;
        });
    }
    sendGetRequestAsync(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendNetworkRequestAsync(HttpMethod.GET, url, options);
        });
    }
    sendPostRequestAsync(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendNetworkRequestAsync(HttpMethod.POST, url, options);
        });
    }
}
