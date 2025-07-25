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
import { NestedAppOperatingContext } from "../operatingcontext/NestedAppOperatingContext.js";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { StandardController } from "./StandardController.js";
import { NestedAppAuthController } from "./NestedAppAuthController.js";
export function createV3Controller(config, request) {
    return __awaiter(this, void 0, void 0, function* () {
        const standard = new StandardOperatingContext(config);
        yield standard.initialize();
        return StandardController.createController(standard, request);
    });
}
export function createController(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const standard = new StandardOperatingContext(config);
        const nestedApp = new NestedAppOperatingContext(config);
        const operatingContexts = [standard.initialize(), nestedApp.initialize()];
        yield Promise.all(operatingContexts);
        if (nestedApp.isAvailable() && config.auth.supportsNestedAppAuth) {
            return NestedAppAuthController.createController(nestedApp);
        }
        else if (standard.isAvailable()) {
            return StandardController.createController(standard);
        }
        else {
            // Since neither of the actual operating contexts are available keep the UnknownOperatingContextController
            return null;
        }
    });
}
