// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Resolve a Promise after a given amount of milliseconds.
 *
 * @example
 *
 * ```typescript
 * import { delay } from "https://deno.land/std@$STD_VERSION/async/delay.ts";
 *
 * // ...
 * const delayedPromise = delay(100);
 * const result = await delayedPromise;
 * // ...
 * ```
 *
 * To allow the process to continue to run as long as the timer exists. Requires
 * `--unstable` flag.
 *
 * ```typescript
 * import { delay } from "https://deno.land/std@$STD_VERSION/async/delay.ts";
 *
 * // ...
 * await delay(100, { persistent: false });
 * // ...
 * ```
 */
export function delay(ms, options = {}) {
    const { signal, persistent } = options;
    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(i);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = () => {
            signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", abort, { once: true });
        if (persistent === false) {
            try {
                // @ts-ignore For browser compatibility
                Deno.unrefTimer(i);
            }
            catch (error) {
                if (!(error instanceof ReferenceError)) {
                    throw error;
                }
                console.error("`persistent` option is only available in Deno");
            }
        }
    });
}
