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
import { BaseOperatingContext } from "./BaseOperatingContext.js";
import { BridgeProxy } from "../naa/BridgeProxy.js";
export class NestedAppOperatingContext extends BaseOperatingContext {
    constructor() {
        super(...arguments);
        this.bridgeProxy = undefined;
        this.accountContext = null;
    }
    /**
     * Return the module name.  Intended for use with import() to enable dynamic import
     * of the implementation associated with this operating context
     * @returns
     */
    getModuleName() {
        return NestedAppOperatingContext.MODULE_NAME;
    }
    /**
     * Returns the unique identifier for this operating context
     * @returns string
     */
    getId() {
        return NestedAppOperatingContext.ID;
    }
    /**
     * Returns the current BridgeProxy
     * @returns IBridgeProxy | undefined
     */
    getBridgeProxy() {
        return this.bridgeProxy;
    }
    /**
     * Checks whether the operating context is available.
     * Confirms that the code is running a browser rather.  This is required.
     * @returns Promise<boolean> indicating whether this operating context is currently available.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (typeof window !== "undefined") {
                    if (typeof window.__initializeNestedAppAuth === "function") {
                        yield window.__initializeNestedAppAuth();
                    }
                    const bridgeProxy = yield BridgeProxy.create();
                    /*
                     * Because we want single sign on we expect the host app to provide the account context
                     * with a min set of params that can be used to identify the account
                     * this.account = nestedApp.getAccountByFilter(bridgeProxy.getAccountContext());
                     */
                    this.accountContext = bridgeProxy.getAccountContext();
                    this.bridgeProxy = bridgeProxy;
                    this.available = bridgeProxy !== undefined;
                }
            }
            catch (ex) {
                this.logger.infoPii(`Could not initialize Nested App Auth bridge (${ex})`);
            }
            this.logger.info(`Nested App Auth Bridge available: ${this.available}`);
            return this.available;
        });
    }
}
/*
 * TODO: Once we have determine the bundling code return here to specify the name of the bundle
 * containing the implementation for this operating context
 */
NestedAppOperatingContext.MODULE_NAME = "";
/**
 * Unique identifier for the operating context
 */
NestedAppOperatingContext.ID = "NestedAppOperatingContext";
