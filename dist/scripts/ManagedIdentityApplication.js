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
import { Authority, CacheOutcome, Constants, DEFAULT_CRYPTO_IMPLEMENTATION, Logger, ProtocolMode, createClientConfigurationError, ClientConfigurationErrorCodes, } from "@azure/msal-common/node";
import { buildManagedIdentityConfiguration, } from "../config/Configuration.js";
import { version, name } from "../packageMetadata.js";
import { CryptoProvider } from "../crypto/CryptoProvider.js";
import { ClientCredentialClient } from "./ClientCredentialClient.js";
import { ManagedIdentityClient } from "./ManagedIdentityClient.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY, } from "../utils/Constants.js";
/**
 * Class to initialize a managed identity and identify the service
 * @public
 */
export class ManagedIdentityApplication {
    constructor(configuration) {
        // undefined config means the managed identity is system-assigned
        this.config = buildManagedIdentityConfiguration(configuration || {});
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
        const fakeStatusAuthorityOptions = {
            canonicalAuthority: Constants.DEFAULT_AUTHORITY,
        };
        if (!ManagedIdentityApplication.nodeStorage) {
            ManagedIdentityApplication.nodeStorage = new NodeStorage(this.logger, this.config.managedIdentityId.id, DEFAULT_CRYPTO_IMPLEMENTATION, fakeStatusAuthorityOptions);
        }
        this.networkClient = this.config.system.networkClient;
        this.cryptoProvider = new CryptoProvider();
        const fakeAuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        this.fakeAuthority = new Authority(DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY, this.networkClient, ManagedIdentityApplication.nodeStorage, fakeAuthorityOptions, this.logger, this.cryptoProvider.createNewGuid(), // correlationID
        undefined, true);
        this.fakeClientCredentialClient = new ClientCredentialClient({
            authOptions: {
                clientId: this.config.managedIdentityId.id,
                authority: this.fakeAuthority,
            },
        });
        this.managedIdentityClient = new ManagedIdentityClient(this.logger, ManagedIdentityApplication.nodeStorage, this.networkClient, this.cryptoProvider, this.config.disableInternalRetries);
    }
    /**
     * Acquire an access token from the cache or the managed identity
     * @param managedIdentityRequest - the ManagedIdentityRequestParams object passed in by the developer
     * @returns the access token
     */
    acquireToken(managedIdentityRequestParams) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!managedIdentityRequestParams.resource) {
                throw createClientConfigurationError(ClientConfigurationErrorCodes.urlEmptyError);
            }
            const managedIdentityRequest = {
                forceRefresh: managedIdentityRequestParams.forceRefresh,
                resource: managedIdentityRequestParams.resource.replace("/.default", ""),
                scopes: [
                    managedIdentityRequestParams.resource.replace("/.default", ""),
                ],
                authority: this.fakeAuthority.canonicalAuthority,
                correlationId: this.cryptoProvider.createNewGuid(),
            };
            if (managedIdentityRequestParams.claims ||
                managedIdentityRequest.forceRefresh) {
                // make a network call to the managed identity source
                return this.managedIdentityClient.sendManagedIdentityTokenRequest(managedIdentityRequest, this.config.managedIdentityId, this.fakeAuthority);
            }
            const [cachedAuthenticationResult, lastCacheOutcome] = yield this.fakeClientCredentialClient.getCachedAuthenticationResult(managedIdentityRequest, this.config, this.cryptoProvider, this.fakeAuthority, ManagedIdentityApplication.nodeStorage);
            if (cachedAuthenticationResult) {
                // if the token is not expired but must be refreshed; get a new one in the background
                if (lastCacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                    this.logger.info("ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.");
                    // make a network call to the managed identity source; refresh the access token in the background
                    const refreshAccessToken = true;
                    yield this.managedIdentityClient.sendManagedIdentityTokenRequest(managedIdentityRequest, this.config.managedIdentityId, this.fakeAuthority, refreshAccessToken);
                }
                return cachedAuthenticationResult;
            }
            else {
                // make a network call to the managed identity source
                return this.managedIdentityClient.sendManagedIdentityTokenRequest(managedIdentityRequest, this.config.managedIdentityId, this.fakeAuthority);
            }
        });
    }
    /**
     * Determine the Managed Identity Source based on available environment variables. This API is consumed by Azure Identity SDK.
     * @returns ManagedIdentitySourceNames - The Managed Identity source's name
     */
    getManagedIdentitySource() {
        return (ManagedIdentityClient.sourceName ||
            this.managedIdentityClient.getManagedIdentitySource());
    }
}
