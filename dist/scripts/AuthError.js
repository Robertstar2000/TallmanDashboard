/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Constants } from "../utils/Constants.js";
import * as AuthErrorCodes from "./AuthErrorCodes.js";
export { AuthErrorCodes };
export const AuthErrorMessages = {
    [AuthErrorCodes.unexpectedError]: "Unexpected error in authentication.",
    [AuthErrorCodes.postRequestFailed]: "Post request failed from the network, could be a 4xx/5xx or a network unavailability. Please check the exact error code for details.",
};
/**
 * AuthErrorMessage class containing string constants used by error codes and messages.
 * @deprecated Use AuthErrorCodes instead
 */
export const AuthErrorMessage = {
    unexpectedError: {
        code: AuthErrorCodes.unexpectedError,
        desc: AuthErrorMessages[AuthErrorCodes.unexpectedError],
    },
    postRequestFailed: {
        code: AuthErrorCodes.postRequestFailed,
        desc: AuthErrorMessages[AuthErrorCodes.postRequestFailed],
    },
};
/**
 * General error class thrown by the MSAL.js library.
 */
export class AuthError extends Error {
    constructor(errorCode, errorMessage, suberror) {
        const errorString = errorMessage
            ? `${errorCode}: ${errorMessage}`
            : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, AuthError.prototype);
        this.errorCode = errorCode || Constants.EMPTY_STRING;
        this.errorMessage = errorMessage || Constants.EMPTY_STRING;
        this.subError = suberror || Constants.EMPTY_STRING;
        this.name = "AuthError";
    }
    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
    }
}
export function createAuthError(code, additionalMessage) {
    return new AuthError(code, additionalMessage
        ? `${AuthErrorMessages[code]} ${additionalMessage}`
        : AuthErrorMessages[code]);
}
