/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ResponseMode, CLIENT_INFO, AuthenticationScheme, ClaimsRequestKeys, PasswordGrantConstants, OIDC_DEFAULT_SCOPES, ThrottlingConstants, HeaderNames, } from "../utils/Constants.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { ScopeSet } from "./ScopeSet.js";
import { createClientConfigurationError, ClientConfigurationErrorCodes, } from "../error/ClientConfigurationError.js";
export function instrumentBrokerParams(parameters, correlationId, performanceClient) {
    if (!correlationId) {
        return;
    }
    const clientId = parameters.get(AADServerParamKeys.CLIENT_ID);
    if (clientId && parameters.has(AADServerParamKeys.BROKER_CLIENT_ID)) {
        performanceClient === null || performanceClient === void 0 ? void 0 : performanceClient.addFields({
            embeddedClientId: clientId,
            embeddedRedirectUri: parameters.get(AADServerParamKeys.REDIRECT_URI),
        }, correlationId);
    }
}
/**
 * Add the given response_type
 * @param parameters
 * @param responseType
 */
export function addResponseType(parameters, responseType) {
    parameters.set(AADServerParamKeys.RESPONSE_TYPE, responseType);
}
/**
 * add response_mode. defaults to query.
 * @param responseMode
 */
export function addResponseMode(parameters, responseMode) {
    parameters.set(AADServerParamKeys.RESPONSE_MODE, responseMode ? responseMode : ResponseMode.QUERY);
}
/**
 * Add flag to indicate STS should attempt to use WAM if available
 */
export function addNativeBroker(parameters) {
    parameters.set(AADServerParamKeys.NATIVE_BROKER, "1");
}
/**
 * add scopes. set addOidcScopes to false to prevent default scopes in non-user scenarios
 * @param scopeSet
 * @param addOidcScopes
 */
export function addScopes(parameters, scopes, addOidcScopes = true, defaultScopes = OIDC_DEFAULT_SCOPES) {
    // Always add openid to the scopes when adding OIDC scopes
    if (addOidcScopes &&
        !defaultScopes.includes("openid") &&
        !scopes.includes("openid")) {
        defaultScopes.push("openid");
    }
    const requestScopes = addOidcScopes
        ? [...(scopes || []), ...defaultScopes]
        : scopes || [];
    const scopeSet = new ScopeSet(requestScopes);
    parameters.set(AADServerParamKeys.SCOPE, scopeSet.printScopes());
}
/**
 * add clientId
 * @param clientId
 */
export function addClientId(parameters, clientId) {
    parameters.set(AADServerParamKeys.CLIENT_ID, clientId);
}
/**
 * add redirect_uri
 * @param redirectUri
 */
export function addRedirectUri(parameters, redirectUri) {
    parameters.set(AADServerParamKeys.REDIRECT_URI, redirectUri);
}
/**
 * add post logout redirectUri
 * @param redirectUri
 */
export function addPostLogoutRedirectUri(parameters, redirectUri) {
    parameters.set(AADServerParamKeys.POST_LOGOUT_URI, redirectUri);
}
/**
 * add id_token_hint to logout request
 * @param idTokenHint
 */
export function addIdTokenHint(parameters, idTokenHint) {
    parameters.set(AADServerParamKeys.ID_TOKEN_HINT, idTokenHint);
}
/**
 * add domain_hint
 * @param domainHint
 */
export function addDomainHint(parameters, domainHint) {
    parameters.set(AADServerParamKeys.DOMAIN_HINT, domainHint);
}
/**
 * add login_hint
 * @param loginHint
 */
export function addLoginHint(parameters, loginHint) {
    parameters.set(AADServerParamKeys.LOGIN_HINT, loginHint);
}
/**
 * Adds the CCS (Cache Credential Service) query parameter for login_hint
 * @param loginHint
 */
export function addCcsUpn(parameters, loginHint) {
    parameters.set(HeaderNames.CCS_HEADER, `UPN:${loginHint}`);
}
/**
 * Adds the CCS (Cache Credential Service) query parameter for account object
 * @param loginHint
 */
export function addCcsOid(parameters, clientInfo) {
    parameters.set(HeaderNames.CCS_HEADER, `Oid:${clientInfo.uid}@${clientInfo.utid}`);
}
/**
 * add sid
 * @param sid
 */
export function addSid(parameters, sid) {
    parameters.set(AADServerParamKeys.SID, sid);
}
/**
 * add claims
 * @param claims
 */
export function addClaims(parameters, claims, clientCapabilities) {
    const mergedClaims = addClientCapabilitiesToClaims(claims, clientCapabilities);
    try {
        JSON.parse(mergedClaims);
    }
    catch (e) {
        throw createClientConfigurationError(ClientConfigurationErrorCodes.invalidClaims);
    }
    parameters.set(AADServerParamKeys.CLAIMS, mergedClaims);
}
/**
 * add correlationId
 * @param correlationId
 */
export function addCorrelationId(parameters, correlationId) {
    parameters.set(AADServerParamKeys.CLIENT_REQUEST_ID, correlationId);
}
/**
 * add library info query params
 * @param libraryInfo
 */
export function addLibraryInfo(parameters, libraryInfo) {
    // Telemetry Info
    parameters.set(AADServerParamKeys.X_CLIENT_SKU, libraryInfo.sku);
    parameters.set(AADServerParamKeys.X_CLIENT_VER, libraryInfo.version);
    if (libraryInfo.os) {
        parameters.set(AADServerParamKeys.X_CLIENT_OS, libraryInfo.os);
    }
    if (libraryInfo.cpu) {
        parameters.set(AADServerParamKeys.X_CLIENT_CPU, libraryInfo.cpu);
    }
}
/**
 * Add client telemetry parameters
 * @param appTelemetry
 */
export function addApplicationTelemetry(parameters, appTelemetry) {
    if (appTelemetry === null || appTelemetry === void 0 ? void 0 : appTelemetry.appName) {
        parameters.set(AADServerParamKeys.X_APP_NAME, appTelemetry.appName);
    }
    if (appTelemetry === null || appTelemetry === void 0 ? void 0 : appTelemetry.appVersion) {
        parameters.set(AADServerParamKeys.X_APP_VER, appTelemetry.appVersion);
    }
}
/**
 * add prompt
 * @param prompt
 */
export function addPrompt(parameters, prompt) {
    parameters.set(AADServerParamKeys.PROMPT, prompt);
}
/**
 * add state
 * @param state
 */
export function addState(parameters, state) {
    if (state) {
        parameters.set(AADServerParamKeys.STATE, state);
    }
}
/**
 * add nonce
 * @param nonce
 */
export function addNonce(parameters, nonce) {
    parameters.set(AADServerParamKeys.NONCE, nonce);
}
/**
 * add code_challenge and code_challenge_method
 * - throw if either of them are not passed
 * @param codeChallenge
 * @param codeChallengeMethod
 */
export function addCodeChallengeParams(parameters, codeChallenge, codeChallengeMethod) {
    if (codeChallenge && codeChallengeMethod) {
        parameters.set(AADServerParamKeys.CODE_CHALLENGE, codeChallenge);
        parameters.set(AADServerParamKeys.CODE_CHALLENGE_METHOD, codeChallengeMethod);
    }
    else {
        throw createClientConfigurationError(ClientConfigurationErrorCodes.pkceParamsMissing);
    }
}
/**
 * add the `authorization_code` passed by the user to exchange for a token
 * @param code
 */
export function addAuthorizationCode(parameters, code) {
    parameters.set(AADServerParamKeys.CODE, code);
}
/**
 * add the `authorization_code` passed by the user to exchange for a token
 * @param code
 */
export function addDeviceCode(parameters, code) {
    parameters.set(AADServerParamKeys.DEVICE_CODE, code);
}
/**
 * add the `refreshToken` passed by the user
 * @param refreshToken
 */
export function addRefreshToken(parameters, refreshToken) {
    parameters.set(AADServerParamKeys.REFRESH_TOKEN, refreshToken);
}
/**
 * add the `code_verifier` passed by the user to exchange for a token
 * @param codeVerifier
 */
export function addCodeVerifier(parameters, codeVerifier) {
    parameters.set(AADServerParamKeys.CODE_VERIFIER, codeVerifier);
}
/**
 * add client_secret
 * @param clientSecret
 */
export function addClientSecret(parameters, clientSecret) {
    parameters.set(AADServerParamKeys.CLIENT_SECRET, clientSecret);
}
/**
 * add clientAssertion for confidential client flows
 * @param clientAssertion
 */
export function addClientAssertion(parameters, clientAssertion) {
    if (clientAssertion) {
        parameters.set(AADServerParamKeys.CLIENT_ASSERTION, clientAssertion);
    }
}
/**
 * add clientAssertionType for confidential client flows
 * @param clientAssertionType
 */
export function addClientAssertionType(parameters, clientAssertionType) {
    if (clientAssertionType) {
        parameters.set(AADServerParamKeys.CLIENT_ASSERTION_TYPE, clientAssertionType);
    }
}
/**
 * add OBO assertion for confidential client flows
 * @param clientAssertion
 */
export function addOboAssertion(parameters, oboAssertion) {
    parameters.set(AADServerParamKeys.OBO_ASSERTION, oboAssertion);
}
/**
 * add grant type
 * @param grantType
 */
export function addRequestTokenUse(parameters, tokenUse) {
    parameters.set(AADServerParamKeys.REQUESTED_TOKEN_USE, tokenUse);
}
/**
 * add grant type
 * @param grantType
 */
export function addGrantType(parameters, grantType) {
    parameters.set(AADServerParamKeys.GRANT_TYPE, grantType);
}
/**
 * add client info
 *
 */
export function addClientInfo(parameters) {
    parameters.set(CLIENT_INFO, "1");
}
export function addInstanceAware(parameters) {
    if (!parameters.has(AADServerParamKeys.INSTANCE_AWARE)) {
        parameters.set(AADServerParamKeys.INSTANCE_AWARE, "true");
    }
}
/**
 * add extraQueryParams
 * @param eQParams
 */
export function addExtraQueryParameters(parameters, eQParams) {
    Object.entries(eQParams).forEach(([key, value]) => {
        if (!parameters.has(key) && value) {
            parameters.set(key, value);
        }
    });
}
export function addClientCapabilitiesToClaims(claims, clientCapabilities) {
    let mergedClaims;
    // Parse provided claims into JSON object or initialize empty object
    if (!claims) {
        mergedClaims = {};
    }
    else {
        try {
            mergedClaims = JSON.parse(claims);
        }
        catch (e) {
            throw createClientConfigurationError(ClientConfigurationErrorCodes.invalidClaims);
        }
    }
    if (clientCapabilities && clientCapabilities.length > 0) {
        if (!mergedClaims.hasOwnProperty(ClaimsRequestKeys.ACCESS_TOKEN)) {
            // Add access_token key to claims object
            mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
        }
        // Add xms_cc claim with provided clientCapabilities to access_token key
        mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][ClaimsRequestKeys.XMS_CC] =
            {
                values: clientCapabilities,
            };
    }
    return JSON.stringify(mergedClaims);
}
/**
 * adds `username` for Password Grant flow
 * @param username
 */
export function addUsername(parameters, username) {
    parameters.set(PasswordGrantConstants.username, username);
}
/**
 * adds `password` for Password Grant flow
 * @param password
 */
export function addPassword(parameters, password) {
    parameters.set(PasswordGrantConstants.password, password);
}
/**
 * add pop_jwk to query params
 * @param cnfString
 */
export function addPopToken(parameters, cnfString) {
    if (cnfString) {
        parameters.set(AADServerParamKeys.TOKEN_TYPE, AuthenticationScheme.POP);
        parameters.set(AADServerParamKeys.REQ_CNF, cnfString);
    }
}
/**
 * add SSH JWK and key ID to query params
 */
export function addSshJwk(parameters, sshJwkString) {
    if (sshJwkString) {
        parameters.set(AADServerParamKeys.TOKEN_TYPE, AuthenticationScheme.SSH);
        parameters.set(AADServerParamKeys.REQ_CNF, sshJwkString);
    }
}
/**
 * add server telemetry fields
 * @param serverTelemetryManager
 */
export function addServerTelemetry(parameters, serverTelemetryManager) {
    parameters.set(AADServerParamKeys.X_CLIENT_CURR_TELEM, serverTelemetryManager.generateCurrentRequestHeaderValue());
    parameters.set(AADServerParamKeys.X_CLIENT_LAST_TELEM, serverTelemetryManager.generateLastRequestHeaderValue());
}
/**
 * Adds parameter that indicates to the server that throttling is supported
 */
export function addThrottling(parameters) {
    parameters.set(AADServerParamKeys.X_MS_LIB_CAPABILITY, ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE);
}
/**
 * Adds logout_hint parameter for "silent" logout which prevent server account picker
 */
export function addLogoutHint(parameters, logoutHint) {
    parameters.set(AADServerParamKeys.LOGOUT_HINT, logoutHint);
}
export function addBrokerParameters(parameters, brokerClientId, brokerRedirectUri) {
    if (!parameters.has(AADServerParamKeys.BROKER_CLIENT_ID)) {
        parameters.set(AADServerParamKeys.BROKER_CLIENT_ID, brokerClientId);
    }
    if (!parameters.has(AADServerParamKeys.BROKER_REDIRECT_URI)) {
        parameters.set(AADServerParamKeys.BROKER_REDIRECT_URI, brokerRedirectUri);
    }
}
/**
 * Add EAR (Encrypted Authorize Response) request parameters
 * @param parameters
 * @param jwk
 */
export function addEARParameters(parameters, jwk) {
    parameters.set(AADServerParamKeys.EAR_JWK, encodeURIComponent(jwk));
    // ear_jwe_crypto will always have value: {"alg":"dir","enc":"A256GCM"} so we can hardcode this
    const jweCryptoB64Encoded = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0";
    parameters.set(AADServerParamKeys.EAR_JWE_CRYPTO, jweCryptoB64Encoded);
}
