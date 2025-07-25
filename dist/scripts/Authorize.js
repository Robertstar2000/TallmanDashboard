/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthorizeProtocol, OAuthResponseType, ProtocolMode, RequestParameterBuilder, } from "@azure/msal-common/node";
import { Constants as NodeConstants } from "../utils/Constants.js";
import { version } from "../packageMetadata.js";
/**
 * Constructs the full /authorize URL with request parameters
 * @param config
 * @param authority
 * @param request
 * @param logger
 * @returns
 */
export function getAuthCodeRequestUrl(config, authority, request, logger) {
    const parameters = AuthorizeProtocol.getStandardAuthorizeRequestParameters(Object.assign(Object.assign({}, config.auth), { authority: authority, redirectUri: request.redirectUri || "" }), request, logger);
    RequestParameterBuilder.addLibraryInfo(parameters, {
        sku: NodeConstants.MSAL_SKU,
        version: version,
        cpu: process.arch || "",
        os: process.platform || "",
    });
    if (config.auth.protocolMode !== ProtocolMode.OIDC) {
        RequestParameterBuilder.addApplicationTelemetry(parameters, config.telemetry.application);
    }
    RequestParameterBuilder.addResponseType(parameters, OAuthResponseType.CODE);
    if (request.codeChallenge && request.codeChallengeMethod) {
        RequestParameterBuilder.addCodeChallengeParams(parameters, request.codeChallenge, request.codeChallengeMethod);
    }
    RequestParameterBuilder.addExtraQueryParameters(parameters, request.extraQueryParameters || {});
    return AuthorizeProtocol.getAuthorizeUrl(authority, parameters);
}
