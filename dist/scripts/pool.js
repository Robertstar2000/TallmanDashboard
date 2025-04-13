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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
export const ERROR_WHILE_MAPPING_MESSAGE = "Threw while mapping.";
/**
 * pooledMap transforms values from an (async) iterable into another async
 * iterable. The transforms are done concurrently, with a max concurrency
 * defined by the poolLimit.
 *
 * If an error is thrown from `iterableFn`, no new transformations will begin.
 * All currently executing transformations are allowed to finish and still
 * yielded on success. After that, the rejections among them are gathered and
 * thrown by the iterator in an `AggregateError`.
 *
 * @example
 * ```typescript
 * import { pooledMap } from "https://deno.land/std@$STD_VERSION/async/pool.ts";
 *
 * const results = pooledMap(
 *   2,
 *   [1, 2, 3],
 *   (i) => new Promise((r) => setTimeout(() => r(i), 1000)),
 * );
 *
 * for await (const value of results) {
 *   // ...
 * }
 * ```
 *
 * @param poolLimit The maximum count of items being processed concurrently.
 * @param array The input array for mapping.
 * @param iteratorFn The function to call for every item of the array.
 */
export function pooledMap(poolLimit, array, iteratorFn) {
    // Create the async iterable that is returned from this function.
    const res = new TransformStream({
        transform(p, controller) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const s = yield p;
                    controller.enqueue(s);
                }
                catch (e) {
                    if (e instanceof AggregateError &&
                        e.message == ERROR_WHILE_MAPPING_MESSAGE) {
                        controller.error(e);
                    }
                }
            });
        },
    });
    // Start processing items from the iterator
    (() => __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const writer = res.writable.getWriter();
        const executing = [];
        try {
            try {
                for (var _d = true, array_1 = __asyncValues(array), array_1_1; array_1_1 = yield array_1.next(), _a = array_1_1.done, !_a; _d = true) {
                    _c = array_1_1.value;
                    _d = false;
                    const item = _c;
                    const p = Promise.resolve().then(() => iteratorFn(item));
                    // Only write on success. If we `writer.write()` a rejected promise,
                    // that will end the iteration. We don't want that yet. Instead let it
                    // fail the race, taking us to the catch block where all currently
                    // executing jobs are allowed to finish and all rejections among them
                    // can be reported together.
                    writer.write(p);
                    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                    executing.push(e);
                    if (executing.length >= poolLimit) {
                        yield Promise.race(executing);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = array_1.return)) yield _b.call(array_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Wait until all ongoing events have processed, then close the writer.
            yield Promise.all(executing);
            writer.close();
        }
        catch (_e) {
            const errors = [];
            for (const result of yield Promise.allSettled(executing)) {
                if (result.status == "rejected") {
                    errors.push(result.reason);
                }
            }
            writer.write(Promise.reject(new AggregateError(errors, ERROR_WHILE_MAPPING_MESSAGE))).catch(() => { });
        }
    }))();
    return res.readable[Symbol.asyncIterator]();
}
