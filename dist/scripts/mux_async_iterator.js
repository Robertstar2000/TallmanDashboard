// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
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
var _MuxAsyncIterator_instances, _MuxAsyncIterator_iteratorCount, _MuxAsyncIterator_yields, _MuxAsyncIterator_throws, _MuxAsyncIterator_signal, _MuxAsyncIterator_callIteratorNext;
import { deferred } from "./deferred.ts";
/**
 * The MuxAsyncIterator class multiplexes multiple async iterators into a single
 * stream. It currently makes an assumption that the final result (the value
 * returned and not yielded from the iterator) does not matter; if there is any
 * result, it is discarded.
 *
 * @example
 * ```typescript
 * import { MuxAsyncIterator } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 *
 * async function* gen123(): AsyncIterableIterator<number> {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * }
 *
 * async function* gen456(): AsyncIterableIterator<number> {
 *   yield 4;
 *   yield 5;
 *   yield 6;
 * }
 *
 * const mux = new MuxAsyncIterator<number>();
 * mux.add(gen123());
 * mux.add(gen456());
 * for await (const value of mux) {
 *   // ...
 * }
 * // ..
 * ```
 */
export class MuxAsyncIterator {
    constructor() {
        _MuxAsyncIterator_instances.add(this);
        _MuxAsyncIterator_iteratorCount.set(this, 0);
        _MuxAsyncIterator_yields.set(this, []);
        // deno-lint-ignore no-explicit-any
        _MuxAsyncIterator_throws.set(this, []);
        _MuxAsyncIterator_signal.set(this, deferred());
    }
    add(iterable) {
        var _a;
        __classPrivateFieldSet(this, _MuxAsyncIterator_iteratorCount, (_a = __classPrivateFieldGet(this, _MuxAsyncIterator_iteratorCount, "f"), ++_a), "f");
        __classPrivateFieldGet(this, _MuxAsyncIterator_instances, "m", _MuxAsyncIterator_callIteratorNext).call(this, iterable[Symbol.asyncIterator]());
    }
    iterate() {
        return __asyncGenerator(this, arguments, function* iterate_1() {
            while (__classPrivateFieldGet(this, _MuxAsyncIterator_iteratorCount, "f") > 0) {
                // Sleep until any of the wrapped iterators yields.
                yield __await(__classPrivateFieldGet(this, _MuxAsyncIterator_signal, "f"));
                // Note that while we're looping over `yields`, new items may be added.
                for (let i = 0; i < __classPrivateFieldGet(this, _MuxAsyncIterator_yields, "f").length; i++) {
                    const { iterator, value } = __classPrivateFieldGet(this, _MuxAsyncIterator_yields, "f")[i];
                    yield yield __await(value);
                    __classPrivateFieldGet(this, _MuxAsyncIterator_instances, "m", _MuxAsyncIterator_callIteratorNext).call(this, iterator);
                }
                if (__classPrivateFieldGet(this, _MuxAsyncIterator_throws, "f").length) {
                    for (const e of __classPrivateFieldGet(this, _MuxAsyncIterator_throws, "f")) {
                        throw e;
                    }
                    __classPrivateFieldGet(this, _MuxAsyncIterator_throws, "f").length = 0;
                }
                // Clear the `yields` list and reset the `signal` promise.
                __classPrivateFieldGet(this, _MuxAsyncIterator_yields, "f").length = 0;
                __classPrivateFieldSet(this, _MuxAsyncIterator_signal, deferred(), "f");
            }
        });
    }
    [(_MuxAsyncIterator_iteratorCount = new WeakMap(), _MuxAsyncIterator_yields = new WeakMap(), _MuxAsyncIterator_throws = new WeakMap(), _MuxAsyncIterator_signal = new WeakMap(), _MuxAsyncIterator_instances = new WeakSet(), _MuxAsyncIterator_callIteratorNext = async function _MuxAsyncIterator_callIteratorNext(iterator) {
        var _a;
        try {
            const { value, done } = await iterator.next();
            if (done) {
                __classPrivateFieldSet(this, _MuxAsyncIterator_iteratorCount, (_a = __classPrivateFieldGet(this, _MuxAsyncIterator_iteratorCount, "f"), --_a), "f");
            }
            else {
                __classPrivateFieldGet(this, _MuxAsyncIterator_yields, "f").push({ iterator, value });
            }
        }
        catch (e) {
            __classPrivateFieldGet(this, _MuxAsyncIterator_throws, "f").push(e);
        }
        __classPrivateFieldGet(this, _MuxAsyncIterator_signal, "f").resolve();
    }, Symbol.asyncIterator)]() {
        return this.iterate();
    }
}
