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
import { DEFAULT_CRYPTO_IMPLEMENTATION } from "../crypto/ICrypto.js";
import { Logger, LogLevel } from "../logger/Logger.js";
import { Constants, DEFAULT_TOKEN_RENEWAL_OFFSET_SEC, } from "../utils/Constants.js";
import { version } from "../packageMetadata.js";
import { AzureCloudInstance } from "../authority/AuthorityOptions.js";
import { DefaultStorageClass } from "../cache/CacheManager.js";
import { ProtocolMode } from "../authority/ProtocolMode.js";
import { ClientAuthErrorCodes, createClientAuthError, } from "../error/ClientAuthError.js";
export const DEFAULT_SYSTEM_OPTIONS = {
    tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    preventCorsPreflight: false,
};
const DEFAULT_LOGGER_IMPLEMENTATION = {
    loggerCallback: () => {
        // allow users to not set loggerCallback
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info,
    correlationId: Constants.EMPTY_STRING,
};
const DEFAULT_CACHE_OPTIONS = {
    claimsBasedCachingEnabled: false,
};
const DEFAULT_NETWORK_IMPLEMENTATION = {
    sendGetRequestAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
    sendPostRequestAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
        });
    },
};
const DEFAULT_LIBRARY_INFO = {
    sku: Constants.SKU,
    version: version,
    cpu: Constants.EMPTY_STRING,
    os: Constants.EMPTY_STRING,
};
const DEFAULT_CLIENT_CREDENTIALS = {
    clientSecret: Constants.EMPTY_STRING,
    clientAssertion: undefined,
};
const DEFAULT_AZURE_CLOUD_OPTIONS = {
    azureCloudInstance: AzureCloudInstance.None,
    tenant: `${Constants.DEFAULT_COMMON_TENANT}`,
};
const DEFAULT_TELEMETRY_OPTIONS = {
    application: {
        appName: "",
        appVersion: "",
    },
};
/**
 * Function that sets the default options when not explicitly configured from app developer
 *
 * @param Configuration
 *
 * @returns Configuration
 */
export function buildClientConfiguration({ authOptions: userAuthOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, cacheOptions: userCacheOptions, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation, clientCredentials: clientCredentials, libraryInfo: libraryInfo, telemetry: telemetry, serverTelemetryManager: serverTelemetryManager, persistencePlugin: persistencePlugin, serializableCache: serializableCache, }) {
    const loggerOptions = Object.assign(Object.assign({}, DEFAULT_LOGGER_IMPLEMENTATION), userLoggerOption);
    return {
        authOptions: buildAuthOptions(userAuthOptions),
        systemOptions: Object.assign(Object.assign({}, DEFAULT_SYSTEM_OPTIONS), userSystemOptions),
        loggerOptions: loggerOptions,
        cacheOptions: Object.assign(Object.assign({}, DEFAULT_CACHE_OPTIONS), userCacheOptions),
        storageInterface: storageImplementation ||
            new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION, new Logger(loggerOptions)),
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
        clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
        libraryInfo: Object.assign(Object.assign({}, DEFAULT_LIBRARY_INFO), libraryInfo),
        telemetry: Object.assign(Object.assign({}, DEFAULT_TELEMETRY_OPTIONS), telemetry),
        serverTelemetryManager: serverTelemetryManager || null,
        persistencePlugin: persistencePlugin || null,
        serializableCache: serializableCache || null,
    };
}
/**
 * Construct authoptions from the client and platform passed values
 * @param authOptions
 */
function buildAuthOptions(authOptions) {
    return Object.assign({ clientCapabilities: [], azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS, skipAuthorityMetadataCache: false, instanceAware: false }, authOptions);
}
/**
 * Returns true if config has protocolMode set to ProtocolMode.OIDC, false otherwise
 * @param ClientConfiguration
 */
export function isOidcProtocolMode(config) {
    return (config.authOptions.authority.options.protocolMode === ProtocolMode.OIDC);
}
