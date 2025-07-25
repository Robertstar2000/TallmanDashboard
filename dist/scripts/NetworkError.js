/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError } from "./AuthError.js";
/**
 * Represents network related errors
 */
export class NetworkError extends AuthError {
    constructor(error, httpStatus, responseHeaders) {
        super(error.errorCode, error.errorMessage, error.subError);
        Object.setPrototypeOf(this, NetworkError.prototype);
        this.name = "NetworkError";
        this.error = error;
        this.httpStatus = httpStatus;
        this.responseHeaders = responseHeaders;
    }
}
/**
 * Creates NetworkError object for a failed network request
 * @param error - Error to be thrown back to the caller
 * @param httpStatus - Status code of the network request
 * @param responseHeaders - Response headers of the network request, when available
 * @returns NetworkError object
 */
export function createNetworkError(error, httpStatus, responseHeaders) {
    return new NetworkError(error, httpStatus, responseHeaders);
}
