/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { RequestParameterBuilder, UrlString, UrlUtils, } from "@azure/msal-common/node";
import { MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON, MANAGED_IDENTITY_MAX_RETRIES, MANAGED_IDENTITY_RETRY_DELAY, } from "../utils/Constants.js";
import { LinearRetryPolicy } from "../retry/LinearRetryPolicy.js";
export class ManagedIdentityRequestParameters {
    constructor(httpMethod, endpoint, retryPolicy) {
        this.httpMethod = httpMethod;
        this._baseEndpoint = endpoint;
        this.headers = {};
        this.bodyParameters = {};
        this.queryParameters = {};
        const defaultRetryPolicy = new LinearRetryPolicy(MANAGED_IDENTITY_MAX_RETRIES, MANAGED_IDENTITY_RETRY_DELAY, MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON);
        this.retryPolicy = retryPolicy || defaultRetryPolicy;
    }
    computeUri() {
        const parameters = new Map();
        if (this.queryParameters) {
            RequestParameterBuilder.addExtraQueryParameters(parameters, this.queryParameters);
        }
        const queryParametersString = UrlUtils.mapToQueryString(parameters);
        return UrlString.appendQueryString(this._baseEndpoint, queryParametersString);
    }
    computeParametersBodyString() {
        const parameters = new Map();
        if (this.bodyParameters) {
            RequestParameterBuilder.addExtraQueryParameters(parameters, this.bodyParameters);
        }
        return UrlUtils.mapToQueryString(parameters);
    }
}
