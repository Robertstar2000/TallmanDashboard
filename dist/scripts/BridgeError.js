/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export function isBridgeError(error) {
    return error.status !== undefined;
}
