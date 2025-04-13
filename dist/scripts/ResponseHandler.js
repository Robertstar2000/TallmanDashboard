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
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
import { ServerError } from "../error/ServerError.js";
import { ScopeSet } from "../request/ScopeSet.js";
import { AccountEntity } from "../cache/entities/AccountEntity.js";
import { InteractionRequiredAuthError, isInteractionRequiredError, } from "../error/InteractionRequiredAuthError.js";
import { ProtocolUtils } from "../utils/ProtocolUtils.js";
import { AuthenticationScheme, Constants, THE_FAMILY_ID, HttpStatus, } from "../utils/Constants.js";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator.js";
import { TokenCacheContext } from "../cache/persistence/TokenCacheContext.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { checkMaxAge, extractTokenClaims } from "../account/AuthToken.js";
import { getTenantIdFromIdTokenClaims, } from "../account/TokenClaims.js";
import { buildTenantProfile, updateAccountTenantProfileData, } from "../account/AccountInfo.js";
import * as CacheHelpers from "../cache/utils/CacheHelpers.js";
import * as TimeUtils from "../utils/TimeUtils.js";
/**
 * Class that handles response parsing.
 * @internal
 */
export class ResponseHandler {
    constructor(clientId, cacheStorage, cryptoObj, logger, serializableCache, persistencePlugin, performanceClient) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
        this.serializableCache = serializableCache;
        this.persistencePlugin = persistencePlugin;
        this.performanceClient = performanceClient;
    }
    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     * @param refreshAccessToken
     */
    validateTokenResponse(serverResponse, refreshAccessToken) {
        var _a;
        // Check for error
        if (serverResponse.error ||
            serverResponse.error_description ||
            serverResponse.suberror) {
            const errString = `Error(s): ${serverResponse.error_codes || Constants.NOT_AVAILABLE} - Timestamp: ${serverResponse.timestamp || Constants.NOT_AVAILABLE} - Description: ${serverResponse.error_description || Constants.NOT_AVAILABLE} - Correlation ID: ${serverResponse.correlation_id || Constants.NOT_AVAILABLE} - Trace ID: ${serverResponse.trace_id || Constants.NOT_AVAILABLE}`;
            const serverErrorNo = ((_a = serverResponse.error_codes) === null || _a === void 0 ? void 0 : _a.length)
                ? serverResponse.error_codes[0]
                : undefined;
            const serverError = new ServerError(serverResponse.error, errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
            // check if 500 error
            if (refreshAccessToken &&
                serverResponse.status &&
                serverResponse.status >= HttpStatus.SERVER_ERROR_RANGE_START &&
                serverResponse.status <= HttpStatus.SERVER_ERROR_RANGE_END) {
                this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.\n${serverError}`);
                // don't throw an exception, but alert the user via a log that the token was unable to be refreshed
                return;
                // check if 400 error
            }
            else if (refreshAccessToken &&
                serverResponse.status &&
                serverResponse.status >= HttpStatus.CLIENT_ERROR_RANGE_START &&
                serverResponse.status <= HttpStatus.CLIENT_ERROR_RANGE_END) {
                this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.\n${serverError}`);
                // don't throw an exception, but alert the user via a log that the token was unable to be refreshed
                return;
            }
            if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
                throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || Constants.EMPTY_STRING, serverResponse.trace_id || Constants.EMPTY_STRING, serverResponse.correlation_id || Constants.EMPTY_STRING, serverResponse.claims || Constants.EMPTY_STRING, serverErrorNo);
            }
            throw serverError;
        }
    }
    /**
     * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
     * @param serverTokenResponse
     * @param authority
     */
    handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.performanceClient) === null || _a === void 0 ? void 0 : _a.addQueueMeasurement(PerformanceEvents.HandleServerTokenResponse, serverTokenResponse.correlation_id);
            // create an idToken object (not entity)
            let idTokenClaims;
            if (serverTokenResponse.id_token) {
                idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || Constants.EMPTY_STRING, this.cryptoObj.base64Decode);
                // token nonce check (TODO: Add a warning if no nonce is given?)
                if (authCodePayload && authCodePayload.nonce) {
                    if (idTokenClaims.nonce !== authCodePayload.nonce) {
                        throw createClientAuthError(ClientAuthErrorCodes.nonceMismatch);
                    }
                }
                // token max_age check
                if (request.maxAge || request.maxAge === 0) {
                    const authTime = idTokenClaims.auth_time;
                    if (!authTime) {
                        throw createClientAuthError(ClientAuthErrorCodes.authTimeNotFound);
                    }
                    checkMaxAge(authTime, request.maxAge);
                }
            }
            // generate homeAccountId
            this.homeAccountIdentifier = AccountEntity.generateHomeAccountId(serverTokenResponse.client_info || Constants.EMPTY_STRING, authority.authorityType, this.logger, this.cryptoObj, idTokenClaims);
            // save the response tokens
            let requestStateObj;
            if (!!authCodePayload && !!authCodePayload.state) {
                requestStateObj = ProtocolUtils.parseRequestState(this.cryptoObj, authCodePayload.state);
            }
            // Add keyId from request to serverTokenResponse if defined
            serverTokenResponse.key_id =
                serverTokenResponse.key_id || request.sshKid || undefined;
            const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload);
            let cacheContext;
            try {
                if (this.persistencePlugin && this.serializableCache) {
                    this.logger.verbose("Persistence enabled, calling beforeCacheAccess");
                    cacheContext = new TokenCacheContext(this.serializableCache, true);
                    yield this.persistencePlugin.beforeCacheAccess(cacheContext);
                }
                /*
                 * When saving a refreshed tokens to the cache, it is expected that the account that was used is present in the cache.
                 * If not present, we should return null, as it's the case that another application called removeAccount in between
                 * the calls to getAllAccounts and acquireTokenSilent. We should not overwrite that removal, unless explicitly flagged by
                 * the developer, as in the case of refresh token flow used in ADAL Node to MSAL Node migration.
                 */
                if (handlingRefreshTokenResponse &&
                    !forceCacheRefreshTokenResponse &&
                    cacheRecord.account) {
                    const key = cacheRecord.account.generateAccountKey();
                    const account = this.cacheStorage.getAccount(key);
                    if (!account) {
                        this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache");
                        return yield ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenClaims, requestStateObj, undefined, serverRequestId);
                    }
                }
                yield this.cacheStorage.saveCacheRecord(cacheRecord, request.correlationId, request.storeInCache);
            }
            finally {
                if (this.persistencePlugin &&
                    this.serializableCache &&
                    cacheContext) {
                    this.logger.verbose("Persistence enabled, calling afterCacheAccess");
                    yield this.persistencePlugin.afterCacheAccess(cacheContext);
                }
            }
            return ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenClaims, requestStateObj, serverTokenResponse, serverRequestId);
        });
    }
    /**
     * Generates CacheRecord
     * @param serverTokenResponse
     * @param idTokenObj
     * @param authority
     */
    generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload) {
        const env = authority.getPreferredCache();
        if (!env) {
            throw createClientAuthError(ClientAuthErrorCodes.invalidCacheEnvironment);
        }
        const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);
        // IdToken: non AAD scenarios can have empty realm
        let cachedIdToken;
        let cachedAccount;
        if (serverTokenResponse.id_token && !!idTokenClaims) {
            cachedIdToken = CacheHelpers.createIdTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.id_token, this.clientId, claimsTenantId || "");
            cachedAccount = buildAccountToCache(this.cacheStorage, authority, this.homeAccountIdentifier, this.cryptoObj.base64Decode, idTokenClaims, serverTokenResponse.client_info, env, claimsTenantId, authCodePayload, undefined, // nativeAccountId
            this.logger);
        }
        // AccessToken
        let cachedAccessToken = null;
        if (serverTokenResponse.access_token) {
            // If scopes not returned in server response, use request scopes
            const responseScopes = serverTokenResponse.scope
                ? ScopeSet.fromString(serverTokenResponse.scope)
                : new ScopeSet(request.scopes || []);
            /*
             * Use timestamp calculated before request
             * Server may return timestamps as strings, parse to numbers if so.
             */
            const expiresIn = (typeof serverTokenResponse.expires_in === "string"
                ? parseInt(serverTokenResponse.expires_in, 10)
                : serverTokenResponse.expires_in) || 0;
            const extExpiresIn = (typeof serverTokenResponse.ext_expires_in === "string"
                ? parseInt(serverTokenResponse.ext_expires_in, 10)
                : serverTokenResponse.ext_expires_in) || 0;
            const refreshIn = (typeof serverTokenResponse.refresh_in === "string"
                ? parseInt(serverTokenResponse.refresh_in, 10)
                : serverTokenResponse.refresh_in) || undefined;
            const tokenExpirationSeconds = reqTimestamp + expiresIn;
            const extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
            const refreshOnSeconds = refreshIn && refreshIn > 0
                ? reqTimestamp + refreshIn
                : undefined;
            // non AAD scenarios can have empty realm
            cachedAccessToken = CacheHelpers.createAccessTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id, request.claims, request.requestedClaimsHash);
        }
        // refreshToken
        let cachedRefreshToken = null;
        if (serverTokenResponse.refresh_token) {
            let rtExpiresOn;
            if (serverTokenResponse.refresh_token_expires_in) {
                const rtExpiresIn = typeof serverTokenResponse.refresh_token_expires_in ===
                    "string"
                    ? parseInt(serverTokenResponse.refresh_token_expires_in, 10)
                    : serverTokenResponse.refresh_token_expires_in;
                rtExpiresOn = reqTimestamp + rtExpiresIn;
            }
            cachedRefreshToken = CacheHelpers.createRefreshTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token, this.clientId, serverTokenResponse.foci, userAssertionHash, rtExpiresOn);
        }
        // appMetadata
        let cachedAppMetadata = null;
        if (serverTokenResponse.foci) {
            cachedAppMetadata = {
                clientId: this.clientId,
                environment: env,
                familyId: serverTokenResponse.foci,
            };
        }
        return {
            account: cachedAccount,
            idToken: cachedIdToken,
            accessToken: cachedAccessToken,
            refreshToken: cachedRefreshToken,
            appMetadata: cachedAppMetadata,
        };
    }
    /**
     * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
     *
     * Optionally takes a state string that is set as-is in the response.
     *
     * @param cacheRecord
     * @param idTokenObj
     * @param fromTokenCache
     * @param stateString
     */
    static generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, idTokenClaims, requestState, serverTokenResponse, requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            let accessToken = Constants.EMPTY_STRING;
            let responseScopes = [];
            let expiresOn = null;
            let extExpiresOn;
            let refreshOn;
            let familyId = Constants.EMPTY_STRING;
            if (cacheRecord.accessToken) {
                /*
                 * if the request object has `popKid` property, `signPopToken` will be set to false and
                 * the token will be returned unsigned
                 */
                if (cacheRecord.accessToken.tokenType ===
                    AuthenticationScheme.POP &&
                    !request.popKid) {
                    const popTokenGenerator = new PopTokenGenerator(cryptoObj);
                    const { secret, keyId } = cacheRecord.accessToken;
                    if (!keyId) {
                        throw createClientAuthError(ClientAuthErrorCodes.keyIdMissing);
                    }
                    accessToken = yield popTokenGenerator.signPopToken(secret, keyId, request);
                }
                else {
                    accessToken = cacheRecord.accessToken.secret;
                }
                responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
                // Access token expiresOn cached in seconds, converting to Date for AuthenticationResult
                expiresOn = TimeUtils.toDateFromSeconds(cacheRecord.accessToken.expiresOn);
                extExpiresOn = TimeUtils.toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn);
                if (cacheRecord.accessToken.refreshOn) {
                    refreshOn = TimeUtils.toDateFromSeconds(cacheRecord.accessToken.refreshOn);
                }
            }
            if (cacheRecord.appMetadata) {
                familyId =
                    cacheRecord.appMetadata.familyId === THE_FAMILY_ID
                        ? THE_FAMILY_ID
                        : "";
            }
            const uid = (idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.oid) || (idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.sub) || "";
            const tid = (idTokenClaims === null || idTokenClaims === void 0 ? void 0 : idTokenClaims.tid) || "";
            // for hybrid + native bridge enablement, send back the native account Id
            if ((serverTokenResponse === null || serverTokenResponse === void 0 ? void 0 : serverTokenResponse.spa_accountid) && !!cacheRecord.account) {
                cacheRecord.account.nativeAccountId =
                    serverTokenResponse === null || serverTokenResponse === void 0 ? void 0 : serverTokenResponse.spa_accountid;
            }
            const accountInfo = cacheRecord.account
                ? updateAccountTenantProfileData(cacheRecord.account.getAccountInfo(), undefined, // tenantProfile optional
                idTokenClaims, (_a = cacheRecord.idToken) === null || _a === void 0 ? void 0 : _a.secret)
                : null;
            return {
                authority: authority.canonicalAuthority,
                uniqueId: uid,
                tenantId: tid,
                scopes: responseScopes,
                account: accountInfo,
                idToken: ((_b = cacheRecord === null || cacheRecord === void 0 ? void 0 : cacheRecord.idToken) === null || _b === void 0 ? void 0 : _b.secret) || "",
                idTokenClaims: idTokenClaims || {},
                accessToken: accessToken,
                fromCache: fromTokenCache,
                expiresOn: expiresOn,
                extExpiresOn: extExpiresOn,
                refreshOn: refreshOn,
                correlationId: request.correlationId,
                requestId: requestId || Constants.EMPTY_STRING,
                familyId: familyId,
                tokenType: ((_c = cacheRecord.accessToken) === null || _c === void 0 ? void 0 : _c.tokenType) || Constants.EMPTY_STRING,
                state: requestState
                    ? requestState.userRequestState
                    : Constants.EMPTY_STRING,
                cloudGraphHostName: ((_d = cacheRecord.account) === null || _d === void 0 ? void 0 : _d.cloudGraphHostName) ||
                    Constants.EMPTY_STRING,
                msGraphHost: ((_e = cacheRecord.account) === null || _e === void 0 ? void 0 : _e.msGraphHost) || Constants.EMPTY_STRING,
                code: serverTokenResponse === null || serverTokenResponse === void 0 ? void 0 : serverTokenResponse.spa_code,
                fromNativeBroker: false,
            };
        });
    }
}
export function buildAccountToCache(cacheStorage, authority, homeAccountId, base64Decode, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger) {
    logger === null || logger === void 0 ? void 0 : logger.verbose("setCachedAccount called");
    // Check if base account is already cached
    const accountKeys = cacheStorage.getAccountKeys();
    const baseAccountKey = accountKeys.find((accountKey) => {
        return accountKey.startsWith(homeAccountId);
    });
    let cachedAccount = null;
    if (baseAccountKey) {
        cachedAccount = cacheStorage.getAccount(baseAccountKey);
    }
    const baseAccount = cachedAccount ||
        AccountEntity.createAccount({
            homeAccountId,
            idTokenClaims,
            clientInfo,
            environment,
            cloudGraphHostName: authCodePayload === null || authCodePayload === void 0 ? void 0 : authCodePayload.cloud_graph_host_name,
            msGraphHost: authCodePayload === null || authCodePayload === void 0 ? void 0 : authCodePayload.msgraph_host,
            nativeAccountId: nativeAccountId,
        }, authority, base64Decode);
    const tenantProfiles = baseAccount.tenantProfiles || [];
    const tenantId = claimsTenantId || baseAccount.realm;
    if (tenantId &&
        !tenantProfiles.find((tenantProfile) => {
            return tenantProfile.tenantId === tenantId;
        })) {
        const newTenantProfile = buildTenantProfile(homeAccountId, baseAccount.localAccountId, tenantId, idTokenClaims);
        tenantProfiles.push(newTenantProfile);
    }
    baseAccount.tenantProfiles = tenantProfiles;
    return baseAccount;
}
