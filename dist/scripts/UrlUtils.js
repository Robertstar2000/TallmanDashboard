/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
/**
 * Parses hash string from given string. Returns empty string if no hash symbol is found.
 * @param hashString
 */
export function stripLeadingHashOrQuery(responseString) {
    if (responseString.startsWith("#/")) {
        return responseString.substring(2);
    }
    else if (responseString.startsWith("#") ||
        responseString.startsWith("?")) {
        return responseString.substring(1);
    }
    return responseString;
}
/**
 * Returns URL hash as server auth code response object.
 */
export function getDeserializedResponse(responseString) {
    // Check if given hash is empty
    if (!responseString || responseString.indexOf("=") < 0) {
        return null;
    }
    try {
        // Strip the # or ? symbol if present
        const normalizedResponse = stripLeadingHashOrQuery(responseString);
        // If # symbol was not present, above will return empty string, so give original hash value
        const deserializedHash = Object.fromEntries(new URLSearchParams(normalizedResponse));
        // Check for known response properties
        if (deserializedHash.code ||
            deserializedHash.ear_jwe ||
            deserializedHash.error ||
            deserializedHash.error_description ||
            deserializedHash.state) {
            return deserializedHash;
        }
    }
    catch (e) {
        throw createClientAuthError(ClientAuthErrorCodes.hashNotDeserialized);
    }
    return null;
}
/**
 * Utility to create a URL from the params map
 */
export function mapToQueryString(parameters) {
    const queryParameterArray = new Array();
    parameters.forEach((value, key) => {
        queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
    });
    return queryParameterArray.join("&");
}
