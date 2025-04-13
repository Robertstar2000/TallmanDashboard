/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ManagedIdentityErrorCodes, createManagedIdentityError, } from "../error/ManagedIdentityError.js";
import { DEFAULT_MANAGED_IDENTITY_ID, ManagedIdentityIdType, } from "../utils/Constants.js";
export class ManagedIdentityId {
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
    get idType() {
        return this._idType;
    }
    set idType(value) {
        this._idType = value;
    }
    constructor(managedIdentityIdParams) {
        const userAssignedClientId = managedIdentityIdParams === null || managedIdentityIdParams === void 0 ? void 0 : managedIdentityIdParams.userAssignedClientId;
        const userAssignedResourceId = managedIdentityIdParams === null || managedIdentityIdParams === void 0 ? void 0 : managedIdentityIdParams.userAssignedResourceId;
        const userAssignedObjectId = managedIdentityIdParams === null || managedIdentityIdParams === void 0 ? void 0 : managedIdentityIdParams.userAssignedObjectId;
        if (userAssignedClientId) {
            if (userAssignedResourceId || userAssignedObjectId) {
                throw createManagedIdentityError(ManagedIdentityErrorCodes.invalidManagedIdentityIdType);
            }
            this.id = userAssignedClientId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID;
        }
        else if (userAssignedResourceId) {
            if (userAssignedClientId || userAssignedObjectId) {
                throw createManagedIdentityError(ManagedIdentityErrorCodes.invalidManagedIdentityIdType);
            }
            this.id = userAssignedResourceId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID;
        }
        else if (userAssignedObjectId) {
            if (userAssignedClientId || userAssignedResourceId) {
                throw createManagedIdentityError(ManagedIdentityErrorCodes.invalidManagedIdentityIdType);
            }
            this.id = userAssignedObjectId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID;
        }
        else {
            this.id = DEFAULT_MANAGED_IDENTITY_ID;
            this.idType = ManagedIdentityIdType.SYSTEM_ASSIGNED;
        }
    }
}
