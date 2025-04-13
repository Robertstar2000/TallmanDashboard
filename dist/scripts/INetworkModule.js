/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
export const StubbedNetworkModule = {
    sendGetRequestAsync: () => {
        return Promise.reject(createClientAuthError(ClientAuthErrorCodes.methodNotImplemented));
    },
    sendPostRequestAsync: () => {
        return Promise.reject(createClientAuthError(ClientAuthErrorCodes.methodNotImplemented));
    },
};
