/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccountEntity, CacheManager, } from "@azure/msal-common/node";
/**
 * This class deserializes cache entities read from the file into in-memory object types defined internally
 * @internal
 */
export class Deserializer {
    /**
     * Parse the JSON blob in memory and deserialize the content
     * @param cachedJson - JSON blob cache
     */
    static deserializeJSONBlob(jsonFile) {
        const deserializedCache = !jsonFile ? {} : JSON.parse(jsonFile);
        return deserializedCache;
    }
    /**
     * Deserializes accounts to AccountEntity objects
     * @param accounts - accounts of type SerializedAccountEntity
     */
    static deserializeAccounts(accounts) {
        const accountObjects = {};
        if (accounts) {
            Object.keys(accounts).map(function (key) {
                var _a;
                const serializedAcc = accounts[key];
                const mappedAcc = {
                    homeAccountId: serializedAcc.home_account_id,
                    environment: serializedAcc.environment,
                    realm: serializedAcc.realm,
                    localAccountId: serializedAcc.local_account_id,
                    username: serializedAcc.username,
                    authorityType: serializedAcc.authority_type,
                    name: serializedAcc.name,
                    clientInfo: serializedAcc.client_info,
                    lastModificationTime: serializedAcc.last_modification_time,
                    lastModificationApp: serializedAcc.last_modification_app,
                    tenantProfiles: (_a = serializedAcc.tenantProfiles) === null || _a === void 0 ? void 0 : _a.map((serializedTenantProfile) => {
                        return JSON.parse(serializedTenantProfile);
                    }),
                };
                const account = new AccountEntity();
                CacheManager.toObject(account, mappedAcc);
                accountObjects[key] = account;
            });
        }
        return accountObjects;
    }
    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens - credentials of type SerializedIdTokenEntity
     */
    static deserializeIdTokens(idTokens) {
        const idObjects = {};
        if (idTokens) {
            Object.keys(idTokens).map(function (key) {
                const serializedIdT = idTokens[key];
                const idToken = {
                    homeAccountId: serializedIdT.home_account_id,
                    environment: serializedIdT.environment,
                    credentialType: serializedIdT.credential_type,
                    clientId: serializedIdT.client_id,
                    secret: serializedIdT.secret,
                    realm: serializedIdT.realm,
                };
                idObjects[key] = idToken;
            });
        }
        return idObjects;
    }
    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens - access tokens of type SerializedAccessTokenEntity
     */
    static deserializeAccessTokens(accessTokens) {
        const atObjects = {};
        if (accessTokens) {
            Object.keys(accessTokens).map(function (key) {
                const serializedAT = accessTokens[key];
                const accessToken = {
                    homeAccountId: serializedAT.home_account_id,
                    environment: serializedAT.environment,
                    credentialType: serializedAT.credential_type,
                    clientId: serializedAT.client_id,
                    secret: serializedAT.secret,
                    realm: serializedAT.realm,
                    target: serializedAT.target,
                    cachedAt: serializedAT.cached_at,
                    expiresOn: serializedAT.expires_on,
                    extendedExpiresOn: serializedAT.extended_expires_on,
                    refreshOn: serializedAT.refresh_on,
                    keyId: serializedAT.key_id,
                    tokenType: serializedAT.token_type,
                    requestedClaims: serializedAT.requestedClaims,
                    requestedClaimsHash: serializedAT.requestedClaimsHash,
                    userAssertionHash: serializedAT.userAssertionHash,
                };
                atObjects[key] = accessToken;
            });
        }
        return atObjects;
    }
    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens - refresh tokens of type SerializedRefreshTokenEntity
     */
    static deserializeRefreshTokens(refreshTokens) {
        const rtObjects = {};
        if (refreshTokens) {
            Object.keys(refreshTokens).map(function (key) {
                const serializedRT = refreshTokens[key];
                const refreshToken = {
                    homeAccountId: serializedRT.home_account_id,
                    environment: serializedRT.environment,
                    credentialType: serializedRT.credential_type,
                    clientId: serializedRT.client_id,
                    secret: serializedRT.secret,
                    familyId: serializedRT.family_id,
                    target: serializedRT.target,
                    realm: serializedRT.realm,
                };
                rtObjects[key] = refreshToken;
            });
        }
        return rtObjects;
    }
    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata - app metadata of type SerializedAppMetadataEntity
     */
    static deserializeAppMetadata(appMetadata) {
        const appMetadataObjects = {};
        if (appMetadata) {
            Object.keys(appMetadata).map(function (key) {
                const serializedAmdt = appMetadata[key];
                appMetadataObjects[key] = {
                    clientId: serializedAmdt.client_id,
                    environment: serializedAmdt.environment,
                    familyId: serializedAmdt.family_id,
                };
            });
        }
        return appMetadataObjects;
    }
    /**
     * Deserialize an inMemory Cache
     * @param jsonCache - JSON blob cache
     */
    static deserializeAllCache(jsonCache) {
        return {
            accounts: jsonCache.Account
                ? this.deserializeAccounts(jsonCache.Account)
                : {},
            idTokens: jsonCache.IdToken
                ? this.deserializeIdTokens(jsonCache.IdToken)
                : {},
            accessTokens: jsonCache.AccessToken
                ? this.deserializeAccessTokens(jsonCache.AccessToken)
                : {},
            refreshTokens: jsonCache.RefreshToken
                ? this.deserializeRefreshTokens(jsonCache.RefreshToken)
                : {},
            appMetadata: jsonCache.AppMetadata
                ? this.deserializeAppMetadata(jsonCache.AppMetadata)
                : {},
        };
    }
}
