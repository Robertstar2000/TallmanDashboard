var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { deferred } from "./deferred.ts";
export function abortable(p, signal) {
    if (p instanceof Promise) {
        return abortablePromise(p, signal);
    }
    else {
        return abortableAsyncIterable(p, signal);
    }
}
/**
 * Make Promise abortable with the given signal.
 *
 * @example
 * ```typescript
 * import { abortablePromise } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 *
 * const request = fetch("https://example.com");
 *
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * const p = abortablePromise(request, c.signal);
 *
 * // The below throws if the request didn't resolve in 100ms
 * await p;
 * ```
 */
export function abortablePromise(p, signal) {
    if (signal.aborted) {
        return Promise.reject(createAbortError(signal.reason));
    }
    const waiter = deferred();
    const abort = () => waiter.reject(createAbortError(signal.reason));
    signal.addEventListener("abort", abort, { once: true });
    return Promise.race([
        waiter,
        p.finally(() => {
            signal.removeEventListener("abort", abort);
        }),
    ]);
}
/**
 * Make AsyncIterable abortable with the given signal.
 *
 * @example
 * ```typescript
 * import { abortableAsyncIterable } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 * import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 *
 * const p = async function* () {
 *   yield "Hello";
 *   await delay(1000);
 *   yield "World";
 * };
 * const c = new AbortController();
 * setTimeout(() => c.abort(), 100);
 *
 * // Below throws `DOMException` after 100 ms
 * // and items become `["Hello"]`
 * const items: string[] = [];
 * for await (const item of abortableAsyncIterable(p(), c.signal)) {
 *   items.push(item);
 * }
 * ```
 */
export function abortableAsyncIterable(p, signal) {
    return __asyncGenerator(this, arguments, function* abortableAsyncIterable_1() {
        if (signal.aborted) {
            throw createAbortError(signal.reason);
        }
        const waiter = deferred();
        const abort = () => waiter.reject(createAbortError(signal.reason));
        signal.addEventListener("abort", abort, { once: true });
        const it = p[Symbol.asyncIterator]();
        while (true) {
            const { done, value } = yield __await(Promise.race([waiter, it.next()]));
            if (done) {
                signal.removeEventListener("abort", abort);
                return yield __await(void 0);
            }
            yield yield __await(value);
        }
    });
}
// This `reason` comes from `AbortSignal` thus must be `any`.
// deno-lint-ignore no-explicit-any
function createAbortError(reason) {
    return new DOMException(reason ? `Aborted: ${reason}` : "Aborted", "AbortError");
}
