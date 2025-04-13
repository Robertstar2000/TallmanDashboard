// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Creates a Promise with the `reject` and `resolve` functions placed as methods
 * on the promise object itself.
 *
 * @example
 * ```typescript
 * import { deferred } from "https://deno.land/std@$STD_VERSION/async/deferred.ts";
 *
 * const p = deferred<number>();
 * // ...
 * p.resolve(42);
 * ```
 */
export function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject) => {
        methods = {
            resolve(value) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield value;
                    state = "fulfilled";
                    resolve(value);
                });
            },
            // deno-lint-ignore no-explicit-any
            reject(reason) {
                state = "rejected";
                reject(reason);
            },
        };
    });
    Object.defineProperty(promise, "state", { get: () => state });
    return Object.assign(promise, methods);
}
