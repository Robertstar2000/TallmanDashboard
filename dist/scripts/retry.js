// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class RetryError extends Error {
    constructor(cause, count) {
        super(`Exceeded max retry count (${count})`);
        this.name = "RetryError";
        this.cause = cause;
    }
}
const defaultRetryOptions = {
    multiplier: 2,
    maxTimeout: 60000,
    maxAttempts: 5,
    minTimeout: 1000,
};
/**
 * Creates a retry promise which resolves to the value of the input using exponential backoff.
 * If the input promise throws, it will be retried `maxAttempts` number of times.
 * It will retry the input every certain amount of milliseconds, starting at `minTimeout` and multiplying by the `multiplier` until it reaches the `maxTimeout`
 *
 * @example
 * ```typescript
 * import { retry } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 * const req = async () => {
 *  // some function that throws sometimes
 * };
 *
 * // Below resolves to the first non-error result of `req`
 * const retryPromise = await retry(req, {
 *  multiplier: 2,
 *  maxTimeout: 60000,
 *  maxAttempts: 5,
 *  minTimeout: 100,
 * });
```
 */
export function retry(fn, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = Object.assign(Object.assign({}, defaultRetryOptions), opts);
        if (options.maxTimeout >= 0 && options.minTimeout > options.maxTimeout) {
            throw new RangeError("minTimeout is greater than maxTimeout");
        }
        let timeout = options.minTimeout;
        let error;
        for (let i = 0; i < options.maxAttempts; i++) {
            try {
                return yield fn();
            }
            catch (err) {
                yield new Promise((r) => setTimeout(r, timeout));
                timeout *= options.multiplier;
                timeout = Math.max(timeout, options.minTimeout);
                if (options.maxTimeout >= 0) {
                    timeout = Math.min(timeout, options.maxTimeout);
                }
                error = err;
            }
        }
        throw new RetryError(error, options.maxAttempts);
    });
}
