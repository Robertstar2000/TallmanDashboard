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
export class UnknownOperatingContext extends BaseOperatingContext {
    /**
     * Returns the unique identifier for this operating context
     * @returns string
     */
    getId() {
        return UnknownOperatingContext.ID;
    }
    /**
     * Return the module name.  Intended for use with import() to enable dynamic import
     * of the implementation associated with this operating context
     * @returns
     */
    getModuleName() {
        return UnknownOperatingContext.MODULE_NAME;
    }
    /**
     * Checks whether the operating context is available.
     * Confirms that the code is running a browser rather.  This is required.
     * @returns Promise<boolean> indicating whether this operating context is currently available.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * This operating context is in use when we have not checked for what the operating context is.
             * The context is unknown until we check it.
             */
            return true;
        });
    }
}
/*
 * TODO: Once we have determine the bundling code return here to specify the name of the bundle
 * containing the implementation for this operating context
 */
UnknownOperatingContext.MODULE_NAME = "";
/**
 * Unique identifier for the operating context
 */
UnknownOperatingContext.ID = "UnknownOperatingContext";
