/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export function isBridgeRequestEnvelope(obj) {
    return (obj.messageType !== undefined &&
        obj.messageType === "NestedAppAuthRequest" &&
        obj.method !== undefined &&
        obj.requestId !== undefined);
}
