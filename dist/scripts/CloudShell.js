/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource.js";
import { HttpMethod, METADATA_HEADER_NAME, ManagedIdentityEnvironmentVariableNames, ManagedIdentityIdType, ManagedIdentitySourceNames, RESOURCE_BODY_OR_QUERY_PARAMETER_NAME, } from "../../utils/Constants.js";
import { ManagedIdentityErrorCodes, createManagedIdentityError, } from "../../error/ManagedIdentityError.js";
/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/CloudShellManagedIdentitySource.cs
 */
export class CloudShell extends BaseManagedIdentitySource {
    constructor(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, msiEndpoint) {
        super(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries);
        this.msiEndpoint = msiEndpoint;
    }
    static getEnvironmentVariables() {
        const msiEndpoint = process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT];
        return [msiEndpoint];
    }
    static tryCreate(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, managedIdentityId) {
        const [msiEndpoint] = CloudShell.getEnvironmentVariables();
        // if the msi endpoint environment variable is undefined, this MSI provider is unavailable.
        if (!msiEndpoint) {
            logger.info(`[Managed Identity] ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity is unavailable because the '${ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT} environment variable is not defined.`);
            return null;
        }
        const validatedMsiEndpoint = CloudShell.getValidatedEnvVariableUrlString(ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT, msiEndpoint, ManagedIdentitySourceNames.CLOUD_SHELL, logger);
        logger.info(`[Managed Identity] Environment variable validation passed for ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity. Endpoint URI: ${validatedMsiEndpoint}. Creating ${ManagedIdentitySourceNames.CLOUD_SHELL} managed identity.`);
        if (managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED) {
            throw createManagedIdentityError(ManagedIdentityErrorCodes.unableToCreateCloudShell);
        }
        return new CloudShell(logger, nodeStorage, networkClient, cryptoProvider, disableInternalRetries, msiEndpoint);
    }
    createRequest(resource) {
        const request = new ManagedIdentityRequestParameters(HttpMethod.POST, this.msiEndpoint);
        request.headers[METADATA_HEADER_NAME] = "true";
        request.bodyParameters[RESOURCE_BODY_OR_QUERY_PARAMETER_NAME] =
            resource;
        return request;
    }
}
