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
import { AppService } from "./ManagedIdentitySources/AppService.js";
import { AzureArc } from "./ManagedIdentitySources/AzureArc.js";
import { CloudShell } from "./ManagedIdentitySources/CloudShell.js";
import { Imds } from "./ManagedIdentitySources/Imds.js";
import { ServiceFabric } from "./ManagedIdentitySources/ServiceFabric.js";
import { ManagedIdentityErrorCodes, createManagedIdentityError, } from "../error/ManagedIdentityError.js";
import { ManagedIdentitySourceNames } from "../utils/Constants.js";
import { MachineLearning } from "./ManagedIdentitySources/MachineLearning.js";
/*
 * Class to initialize a managed identity and identify the service.
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ManagedIdentityClient.cs
 */
export class ManagedIdentityClient {
    constructor(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
        this.disableInternalRetries = disableInternalRetries;
    }
    sendManagedIdentityTokenRequest(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ManagedIdentityClient.identitySource) {
                ManagedIdentityClient.identitySource =
                    this.selectManagedIdentitySource(this.logger, this.nodeStorage, this.networkClient, this.cryptoProvider, this.disableInternalRetries, managedIdentityId);
            }
            return ManagedIdentityClient.identitySource.acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken);
        });
    }
    allEnvironmentVariablesAreDefined(environmentVariables) {
        return Object.values(environmentVariables).every((environmentVariable) => {
            return environmentVariable !== undefined;
        });
    }
    /**
     * Determine the Managed Identity Source based on available environment variables. This API is consumed by ManagedIdentityApplication's getManagedIdentitySource.
     * @returns ManagedIdentitySourceNames - The Managed Identity source's name
     */
    getManagedIdentitySource() {
        ManagedIdentityClient.sourceName =
            this.allEnvironmentVariablesAreDefined(ServiceFabric.getEnvironmentVariables())
                ? ManagedIdentitySourceNames.SERVICE_FABRIC
                : this.allEnvironmentVariablesAreDefined(AppService.getEnvironmentVariables())
                    ? ManagedIdentitySourceNames.APP_SERVICE
                    : this.allEnvironmentVariablesAreDefined(MachineLearning.getEnvironmentVariables())
                        ? ManagedIdentitySourceNames.MACHINE_LEARNING
                        : this.allEnvironmentVariablesAreDefined(CloudShell.getEnvironmentVariables())
                            ? ManagedIdentitySourceNames.CLOUD_SHELL
                            : this.allEnvironmentVariablesAreDefined(AzureArc.getEnvironmentVariables())
                                ? ManagedIdentitySourceNames.AZURE_ARC
                                : ManagedIdentitySourceNames.DEFAULT_TO_IMDS;
        return ManagedIdentityClient.sourceName;
    }
    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    selectManagedIdentitySource(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, managedIdentityId) {
        const source = ServiceFabric.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, managedIdentityId) ||
            AppService.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) ||
            MachineLearning.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) ||
            CloudShell.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, managedIdentityId) ||
            AzureArc.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, managedIdentityId) ||
            Imds.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries);
        if (!source) {
            throw createManagedIdentityError(ManagedIdentityErrorCodes.unableToCreateSource);
        }
        return source;
    }
}
