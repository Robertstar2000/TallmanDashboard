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
import { AccountEntity, } from "@azure/msal-common/node";
/**
 * Cache plugin that serializes data to the cache and deserializes data from the cache
 * @public
 */
export class DistributedCachePlugin {
    constructor(client, partitionManager) {
        this.client = client;
        this.partitionManager = partitionManager;
    }
    /**
     * Deserializes the cache before accessing it
     * @param cacheContext - TokenCacheContext
     */
    beforeCacheAccess(cacheContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const partitionKey = yield this.partitionManager.getKey();
            const cacheData = yield this.client.get(partitionKey);
            cacheContext.tokenCache.deserialize(cacheData);
        });
    }
    /**
     * Serializes the cache after accessing it
     * @param cacheContext - TokenCacheContext
     */
    afterCacheAccess(cacheContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cacheContext.cacheHasChanged) {
                const kvStore = cacheContext.tokenCache.getKVStore();
                const accountEntities = Object.values(kvStore).filter((value) => AccountEntity.isAccountEntity(value));
                let partitionKey;
                if (accountEntities.length > 0) {
                    const accountEntity = accountEntities[0];
                    partitionKey = yield this.partitionManager.extractKey(accountEntity);
                }
                else {
                    partitionKey = yield this.partitionManager.getKey();
                }
                yield this.client.set(partitionKey, cacheContext.tokenCache.serialize());
            }
        });
    }
}
